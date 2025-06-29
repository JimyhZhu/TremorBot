import React, { useState, useEffect, useRef } from 'react';
import Plot from 'react-plotly.js';
import { Box, Paper, Typography, Button, Stack, TextField, FormGroup, FormControlLabel, Checkbox, Radio, Select, MenuItem, InputLabel, FormControl, Divider, Chip, Grid, Accordion, AccordionSummary, AccordionDetails, IconButton, Slider } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Switch } from '@mui/material';
import FileDataPlot from './LiveMonitor/FileDataPlot';
import LiveDataPlot from './LiveMonitor/LiveDataPlot';
import useWebSocketStream from './LiveMonitor/useWebSocketStream';
import useDebugStream from './LiveMonitor/useDebugStream';
import LiveMonitorControls from './LiveMonitor/LiveMonitorControls';
import LiveMonitorStatus from './LiveMonitor/LiveMonitorStatus';
import CenteredValuePlot from './LiveMonitor/CenteredValuePlot';
import NormalizedCenteredValuePlot from './LiveMonitor/NormalizedCenteredValuePlot';
import ParameterControls from './ParameterControls';
import SignalVisualizer from './SignalVisualizer';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SettingsIcon from '@mui/icons-material/Settings';

const MAX_POINTS = 500; // 5 seconds at 100Hz

const LiveMonitor = ({ parameters, setParameters }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  const [files, setFiles] = useState([]);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [fs, setFs] = useState(100);
  const [visibleSignals, setVisibleSignals] = useState({
    rawAngle: true,
    baseAngle: true,
    tremor: true,
    envelope: true,
    torque: true,
    wfeDisp: true,
    centeredTremor: true,
    centeredEnvelope: true,
    centeredTorque: true,
    hybridReplay: true
  });
  const [liveData, setLiveData] = useState({
    time: [],
    centeredAngle: [],
    centeredBaseAngle: [],
    centeredTremor: [],
    centeredEnvelope: [],
    centeredTorque: [],
    wfeDisp: [],
    env_tremor: []
  });
  const [fileData, setFileData] = useState({
    time: [],
    rawAngle: [],
    baseAngle: [],
    tremor: [],
    envelope: [],
    torque: [],
    wfeDisp: [],
    hybridReplay: []
  });
  const [recordedData, setRecordedData] = useState([]);
  const [hasRecordedData, setHasRecordedData] = useState(false);
  const [recordAllSignals, setRecordAllSignals] = useState(false); // New state for recording all signals
  const eventSourceRef = useRef(null);
  const plotRef = useRef(null);
  const [messageRate, setMessageRate] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [duration, setDuration] = useState(0);
  const [samplingRate, setSamplingRate] = useState(0);
  const lastMessageTimeRef = useRef(Date.now());
  const messageCountRef = useRef(0);
  const timerRef = useRef(null);
  const [isDebugMode, setIsDebugMode] = useState(false);
  const debugIntervalRef = useRef(null);
  const debugDataIndexRef = useRef(null);
  const [selectedStreamingSignal, setSelectedStreamingSignal] = useState('centeredAngle');
  const [totalDuration, setTotalDuration] = useState(0);
  const lastEndTimeRef = useRef(0);
  const [isLooping, setIsLooping] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [normalizedCenteredData, setNormalizedCenteredData] = useState(null);
  const stopCommandSentRef = useRef(false); // Track if stop command was already sent
  const [useRobustNormalization, setUseRobustNormalization] = useState(true);

  // Add new state for case studies configuration
  const [availableFiles, setAvailableFiles] = useState([]);
  const [caseStudiesConfig, setCaseStudiesConfig] = useState({
    normal: { file: '', feature: 'centeredTorque' },
    earlyPD: { file: '', feature: 'centeredTorque' },
    moderatePD: { file: '', feature: 'centeredTorque' },
    advancedPD: { file: '', feature: 'centeredTorque' }
  });

  // Add state for collapsible sections
  const [configExpanded, setConfigExpanded] = useState(true);
  const [monitoringExpanded, setMonitoringExpanded] = useState(true);
  const [parametersExpanded, setParametersExpanded] = useState(true);

  // Add state for manual control knob
  const [manualControlValue, setManualControlValue] = useState(128);
  const [isManualControlActive, setIsManualControlActive] = useState(false);
  const [manualControlExpanded, setManualControlExpanded] = useState(false);

  const signals = [
    { 
      name: 'rawAngle', 
      label: 'Raw Angle', 
      color: '#1f77b4',
      description: 'Raw angle measurement from sensor'
    },
    { 
      name: 'baseAngle', 
      label: 'Base Angle', 
      color: '#ff7f0e',
      description: 'Filtered base angle'
    },
    { 
      name: 'tremor', 
      label: 'Tremor (Envelope*Tremor)', 
      color: '#2ca02c',
      description: 'Envelope-modulated tremor (env_tremor)'
    },
    { 
      name: 'envelope', 
      label: 'Envelope', 
      color: '#d62728',
      description: 'Tremor envelope'
    },
    { 
      name: 'torque', 
      label: 'Torque', 
      color: '#9467bd',
      description: 'Calculated torque'
    },
    { 
      name: 'wfeDisp', 
      label: 'WFE Displacement', 
      color: '#8c564b',
      description: 'WFE displacement'
    },
    {
      name: 'hybridReplay',
      label: 'Hybrid Replay',
      color: '#e377c2',
      description: 'Hybrid replay trajectory: θ_base + α × A × T_raw'
    }
  ];

  useEffect(() => {
    if (fileData && fileData.time && fileData.time.length > 0) {
      setStartTime(fileData.time[0]);
      setEndTime(fileData.time[fileData.time.length - 1]);
    }
  }, [fileData]);

  // Fetch available files
  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/list-files`);
        const sortedFiles = response.data.files.sort(); // Sort files alphabetically
        setFiles(sortedFiles);
        if (sortedFiles.length > 0) {
          setSelectedFile(sortedFiles[0]);
        }
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    };
    fetchFiles();
  }, []);

  // Fetch file data when selected file changes
  useEffect(() => {
    const fetchFileData = async () => {
      if (!selectedFile) return;
      try {
        const response = await axios.post(`${API_BASE_URL}/api/process-signal`, {
          file_name: selectedFile,
          ...parameters
        });
        setFileData(response.data);
      } catch (error) {
        console.error('Error fetching file data:', error);
      }
    };
    fetchFileData();
  }, [selectedFile, parameters]);

  // Update sampling rate when file data or time range changes
  useEffect(() => {
    if (fileData && fileData.time.length > 1) {
      // Find the indices for start and end times
      const startIndex = fileData.time.findIndex(t => t >= startTime);
      const endIndex = fileData.time.findIndex(t => t >= endTime);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex && startIndex + 1 < endIndex) {
        // Calculate sampling rate using only the selected segment
        const timeDiff = fileData.time[startIndex + 1] - fileData.time[startIndex];
      const fs = Math.round(1 / timeDiff);
      setSamplingRate(fs);
        console.log(`[SAMPLING] Calculated rate: ${fs} Hz for segment ${startTime}s to ${endTime}s`);
    }
    }
  }, [fileData, startTime, endTime]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  // WebSocket connection handling
  useEffect(() => {
    let reconnectAttempt = 0;
    const maxReconnectAttempts = 10; // Increased from 5
    const baseReconnectDelay = 500; // Reduced from 2000ms to 500ms
    const wsUrls = [
      'ws://esp32.local:81',  // Try mDNS first
      'ws://172.20.10.7:81',  // ESP32's actual IP address
      'ws://192.168.1.113:81'  // Fallback IP
    ];
    let currentUrlIndex = 0;
    let connectionTimeout = null;
    let persistentReconnectInterval = null; // New: persistent reconnection

    const connectWebSocket = () => {
      // Don't limit reconnection attempts - keep trying indefinitely
      // if (reconnectAttempt >= maxReconnectAttempts) {
      //   console.error('Max reconnection attempts reached');
      //   return;
      // }

      // Clean up existing connection and timeouts
      if (wsRef.current) {
        console.log('Closing existing WebSocket connection');
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }

      // Try next URL in the list
      const wsUrl = wsUrls[currentUrlIndex];
      currentUrlIndex = (currentUrlIndex + 1) % wsUrls.length;
      
      console.log(`Attempting WebSocket connection (attempt ${reconnectAttempt + 1}) to: ${wsUrl}`);
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        // Set a shorter connection timeout for faster failover
        connectionTimeout = setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('Connection timeout, trying next URL');
            wsRef.current.close();
          }
        }, 1500); // Reduced from 3000ms to 1500ms

        wsRef.current.onopen = () => {
          console.log('WebSocket connected successfully to:', wsUrl);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          setIsConnected(true);
          reconnectAttempt = 0; // Reset attempt counter on successful connection
          
          // Clear any persistent reconnection intervals
          if (persistentReconnectInterval) {
            clearInterval(persistentReconnectInterval);
            persistentReconnectInterval = null;
          }
          
          // Keep connection alive with minimal heartbeat (only if needed)
          // Most modern WebSocket implementations don't need this
          const heartbeat = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              // Send a minimal ping to keep connection alive
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 60000); // Reduced from 30s to 60s - only if absolutely necessary

          // Store the heartbeat interval for cleanup
          wsRef.current.heartbeat = heartbeat;
        };
        
        wsRef.current.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          if (wsRef.current && wsRef.current.heartbeat) {
            clearInterval(wsRef.current.heartbeat);
          }
          setIsConnected(false);
          
          // Stop streaming if active
          if (isStreaming) {
            setIsStreaming(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }

          // Only attempt to reconnect if debug mode is off and it wasn't an intentional closure
          if (!isDebugMode && event.code !== 1000) {
            // Use exponential backoff but with much shorter delays
            const delay = Math.min(baseReconnectDelay * Math.pow(1.2, reconnectAttempt), 3000); // Max 3s delay
            console.log(`Scheduling reconnection attempt in ${delay}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempt++;
              connectWebSocket();
            }, delay);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't set isConnected to false here, let onclose handle it
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Received WebSocket message:', data);
            
            if (data.type === 'status') {
              console.log('Status message:', data.message);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error, event.data);
          }
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        // Only try next URL if debug mode is off
        if (!isDebugMode) {
        // Try next URL immediately if current one fails
        if (currentUrlIndex < wsUrls.length) {
          console.log('Trying next URL immediately');
          connectWebSocket();
        } else {
            // If we've tried all URLs, wait before retrying with shorter delay
            const delay = Math.min(baseReconnectDelay * Math.pow(1.2, reconnectAttempt), 2000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempt++;
            connectWebSocket();
          }, delay);
          }
        }
      }
    };

    // Only attempt initial connection if debug mode is off
    if (!isDebugMode) {
    connectWebSocket();

      // Set up persistent reconnection - if we haven't connected after initial attempts
      persistentReconnectInterval = setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
          console.log('Persistent reconnection: attempting to connect...');
          connectWebSocket();
        }
      }, 5000); // Try every 5 seconds if not connected
    }

    // Store connectWebSocket function for manual reconnection
    window.manualReconnect = connectWebSocket;

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      if (persistentReconnectInterval) {
        clearInterval(persistentReconnectInterval);
      }
      if (wsRef.current) {
        if (wsRef.current.heartbeat) {
          clearInterval(wsRef.current.heartbeat);
        }
        wsRef.current.close(1000, 'Component unmounting');
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      setIsStreaming(false);
      setIsConnected(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Clean up global function
      delete window.manualReconnect;
    };
  }, [isDebugMode]); // Added isDebugMode to dependency array

  // Manual reconnect function
  const handleManualReconnect = () => {
    console.log('Manual reconnect requested');
    if (window.manualReconnect) {
      window.manualReconnect();
    }
  };

  // Manual control functions
  const handleManualControlChange = (event, newValue) => {
    setManualControlValue(newValue);
    
    // Send the value to ESP32 if manual control is active
    if (isManualControlActive && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command: 'manualControl',
        value: newValue
      };
      wsRef.current.send(JSON.stringify(command));
    }
  };

  const toggleManualControl = () => {
    const newState = !isManualControlActive;
    setIsManualControlActive(newState);
    
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (newState) {
        // Start manual control - send current value
        const command = {
          command: 'startManualControl',
          value: manualControlValue
        };
        wsRef.current.send(JSON.stringify(command));
        console.log('Manual control started with value:', manualControlValue);
      } else {
        // Stop manual control - send stop command
        const command = {
          command: 'stopManualControl'
        };
        wsRef.current.send(JSON.stringify(command));
        console.log('Manual control stopped');
      }
    } else {
      console.warn('WebSocket not connected for manual control');
    }
  };

  const resetManualControl = () => {
    setManualControlValue(128); // Reset to center value
    if (isManualControlActive && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command: 'manualControl',
        value: 128
      };
      wsRef.current.send(JSON.stringify(command));
    }
  };

  // Handle parameter changes
  const handleParameterChange = (newParameters) => {
    setParameters(newParameters);
  };

  const handleStreamingSignalChange = (signalName) => {
    setSelectedStreamingSignal(signalName);
  };

  const updateLiveData = (data) => {
    console.log('updateLiveData called - isRecording:', isRecording, 'data:', data);
    // console.log('Updating live data:', data); // Debug log
    setLiveData(prev => {
      const newData = { ...prev };
      // Accumulate all keys from the incoming data (normalized signal names)
      Object.keys(data).forEach(key => {
        if (key !== 'time') { // Skip time, handle it separately
          if (!newData[key]) newData[key] = [];
          newData[key] = [...newData[key], data[key] !== undefined ? data[key] : null];
        }
      });
      // Always accumulate time
      if (!newData.time) newData.time = [];
      newData.time = [...newData.time, data.time !== undefined ? data.time : null];
      return newData;
    });

    if (isRecording) {
      console.log('Recording is active - adding data to recordedData:', data);
      
      let dataToRecord = data;
      
      // If recording all signals, get all available data from fileData
      if (recordAllSignals && fileData && fileData.time) {
        const currentTimeIndex = fileData.time.findIndex(t => t >= data.time);
        if (currentTimeIndex !== -1) {
          dataToRecord = {
            time: data.time,
            // Use normalized/centered data when available, fallback to original data
            rawAngle: normalizedCenteredData?.centeredAngle?.[currentTimeIndex] ?? fileData.rawAngle?.[currentTimeIndex],
            baseAngle: normalizedCenteredData?.centeredBaseAngle?.[currentTimeIndex] ?? fileData.baseAngle?.[currentTimeIndex],
            tremor: normalizedCenteredData?.centeredTremor?.[currentTimeIndex] ?? fileData.tremor?.[currentTimeIndex],
            envelope: normalizedCenteredData?.centeredEnvelope?.[currentTimeIndex] ?? fileData.envelope?.[currentTimeIndex],
            torque: normalizedCenteredData?.centeredTorque?.[currentTimeIndex] ?? fileData.torque?.[currentTimeIndex],
            wfeDisp: normalizedCenteredData?.wfeDisp?.[currentTimeIndex] ?? fileData.wfeDisp?.[currentTimeIndex], // WFE displacement is normalized
            // Also include the streaming signal (which is already centered/normalized)
            [selectedStreamingSignal]: data[selectedStreamingSignal]
          };
          console.log('Recording all signals (using normalized data):', dataToRecord);
        }
      }
      
      setRecordedData(prev => {
        const newRecorded = [...prev, dataToRecord];
        console.log('Updated recordedData length:', newRecorded.length, 'Previous length:', prev.length);
        // Set the flag to indicate we have recorded data
        if (newRecorded.length > 0) {
          setHasRecordedData(true);
          console.log('Set hasRecordedData to true');
        }
        return newRecorded;
            });
          } else {
      console.log('Recording is NOT active - skipping data recording');
    }
  };

  const stopStreaming = () => {
    console.log('=== STOP STREAMING CALLED ===');
    console.log('Current state:', {
      isStreaming,
      isDebugMode,
      stopCommandSent: stopCommandSentRef.current,
      wsConnected: wsRef.current && wsRef.current.readyState === WebSocket.OPEN
    });
    
    // Only send stop command if we haven't already sent it
    if (!stopCommandSentRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command: 'stopStreaming'
      };
      console.log('Sending stop streaming command:', command);
      wsRef.current.send(JSON.stringify(command));
      stopCommandSentRef.current = true; // Mark that we've sent the stop command
    } else {
      console.log('Stop command not sent because:', {
        alreadySent: stopCommandSentRef.current,
        wsExists: !!wsRef.current,
        wsOpen: wsRef.current ? wsRef.current.readyState === WebSocket.OPEN : false
      });
    }

    // Clear all intervals
    if (debugIntervalRef.current) {
      clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
      console.log('Cleared debug interval');
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('Cleared timer interval');
    }
    
    // Stop recording but preserve the recorded data
    if (isRecording) {
      console.log('Auto-stopping recording - preserving recorded data length:', recordedData.length);
      setIsRecording(false);
    }

    // Reset state
    setIsStreaming(false);
    setMessageRate(0);
    messageCountRef.current = 0;
    lastMessageTimeRef.current = Date.now();
    console.log('Streaming stopped - state reset, recorded data preserved. Final recorded data length:', recordedData.length);
    
    // Force a re-render to update the download button state
    setTimeout(() => {
      console.log('After stopStreaming timeout - recordedData length:', recordedData.length);
    }, 100);
  };

  const debugStream = useDebugStream({
    fileData,
    normalizedData: normalizedCenteredData,
    startTime,
    endTime,
    samplingRate,
    selectedStreamingSignal,
    isLooping,
    setIsStreaming,
    setRecordedData,
    setMessageRate,
    messageCountRef,
    lastMessageTimeRef,
    setDuration,
    setTotalDuration,
    timerRef,
    debugDataIndexRef,
    lastEndTimeRef,
    updateLiveData,
    stopStreaming,
    setHasRecordedData
  });
  const webSocketStream = useWebSocketStream({
    wsRef,
    fileData,
    normalizedData: normalizedCenteredData,
    startTime,
    endTime,
    samplingRate,
    selectedStreamingSignal,
    isLooping,
    setIsStreaming,
    setRecordedData,
    setMessageRate,
    messageCountRef,
    lastMessageTimeRef,
    setDuration,
    setTotalDuration,
    timerRef,
    debugDataIndexRef,
    lastEndTimeRef,
    updateLiveData,
    stopStreaming,
    setIsConnected
  });

  const resetStream = () => {
    console.log('Resetting stream...');
    
    // Clear all intervals first (don't call stopStreaming to avoid side effects)
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (debugIntervalRef.current) {
      clearInterval(debugIntervalRef.current);
      debugIntervalRef.current = null;
    }
    
    // Clear WebSocket intervals
    if (wsRef.current && wsRef.current._debugInterval) {
      clearInterval(wsRef.current._debugInterval);
      wsRef.current._debugInterval = null;
    }
    
    // Clear window debug interval
    if (window._debugInterval) {
      clearInterval(window._debugInterval);
      window._debugInterval = null;
    }
    
    // Clear event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Reset all streaming-related state
    debugDataIndexRef.current = null;
    setLiveData({
      time: [],
      centeredAngle: [],
      centeredBaseAngle: [],
      centeredTremor: [],
      centeredEnvelope: [],
      centeredTorque: [],
      wfeDisp: [],
      env_tremor: []
    });
    setDuration(0);
    setTotalDuration(0);
    setMessageRate(0);
    setRecordedData([]); // Clear recorded data
    setHasRecordedData(false); // Reset the flag
    lastEndTimeRef.current = 0;
    stopCommandSentRef.current = false; // Reset stop command flag
    
    // Reset streaming state
    setIsStreaming(false);
    setIsRecording(false); // Also stop recording
    
    // Don't disconnect WebSocket, just reset streaming state
    // setIsConnected(false); // Removed - keep connection alive
    
    console.log('Stream reset complete');
  };

  const toggleRecording = () => {
    console.log('=== TOGGLE RECORDING ===');
    console.log('Current recording state:', isRecording);
    console.log('Current recorded data length:', recordedData.length);
    
    if (!isRecording) {
      console.log('Starting recording - clearing previous data');
      setRecordedData([]); // Clear data only when starting a new recording session
      setHasRecordedData(false); // Reset the flag
    } else {
      console.log('Stopping recording - preserving data length:', recordedData.length);
      // Don't clear data when stopping - preserve it for download
    }
    setIsRecording(!isRecording);
  };

  const handleSignalToggle = (signalName, checked) => {
    setVisibleSignals(prev => ({
      ...prev,
      [signalName]: checked
    }));
  };

  const downloadRecordedData = async () => {
    console.log('=== SAVE RECORDED DATA ===');
    console.log('Recorded data length:', recordedData.length);
    console.log('Sample of recorded data:', recordedData.slice(0, 3));
    console.log('Record all signals mode:', recordAllSignals);
    
    if (recordedData.length === 0) {
      console.log('No recorded data to save');
      return;
    }

    // Check what keys are available in the recorded data
    const sampleData = recordedData[0];
    console.log('Available keys in recorded data:', Object.keys(sampleData || {}));

    // Create filename based on selected file and parameters
    const createFilename = () => {
      // Get base filename without extension
      const baseFileName = selectedFile ? selectedFile.replace(/\.[^/.]+$/, '') : 'unknown';
      
      // Create parameter string
      const paramString = `G${parameters.G.toFixed(1)}_Kp${parameters.Kp.toFixed(1)}_Kd${parameters.Kd.toFixed(1)}_alpha${parameters.alpha.toFixed(1)}`;
      
      // Add normalization method
      const normalizationMethod = useRobustNormalization ? 'RobustIQR' : 'GlobalMinMax';

      // Add recording mode
      const recordingMode = recordAllSignals ? 'all_signals' : 'single_signal';
      
      // Add timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      
      return `${baseFileName}_${paramString}_${normalizationMethod}_${recordingMode}_${timestamp}.csv`;
    };

    const filename = createFilename();
    console.log('Generated filename:', filename);
    
    try {
      // Send data to backend to save in processed folder
      const response = await axios.post(`${API_BASE_URL}/api/save-recorded-data`, {
        recordedData: recordedData,
        filename: filename,
        parameters: parameters
      });
      
      console.log('Data saved successfully:', response.data);
      alert(`Data saved successfully to: ${response.data.file_path}`);
      
    } catch (error) {
      console.error('Error saving recorded data:', error);
      alert('Error saving data: ' + (error.response?.data?.error || error.message));
    }
  };

  const getPlotData = (data) => {
    return signals
      .filter(signal => visibleSignals[signal.name])
      .map(signal => ({
        x: data.time,
        y: data[signal.name],
        type: 'scatter',
        mode: 'lines',
        name: signal.label,
        line: { color: signal.color }
      }));
  };

  const getTorqueEquation = () => {
    return `τ = ${parameters.G.toFixed(1)} × (θ_base + ${parameters.alpha.toFixed(1)} × A × T_raw)`;
  };

  // Debug logging for recording state changes
  useEffect(() => {
    console.log('Recording state changed - isRecording:', isRecording);
  }, [isRecording]);

  // Debug logging for recordAllSignals state changes
  useEffect(() => {
    console.log('RecordAllSignals state changed - recordAllSignals:', recordAllSignals);
  }, [recordAllSignals]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
      }
    };
  }, []);

  const plotLayout = {
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: true,
    legend: {
      x: 1,
      xanchor: 'right',
      y: 1
    },
    xaxis: {
      title: 'Time (s)',
      showgrid: true,
      zeroline: true
    },
    yaxis: {
      title: 'Value',
      showgrid: true,
      zeroline: true
    }
  };

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false
  };

  // Add a callback to receive normalized data from NormalizedCenteredValuePlot
  const handleNormalizedData = (data) => {
    setNormalizedCenteredData(data);
  };

  // Add new useEffect to load available files and current configuration
  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        // Load available processed files
        const filesResponse = await axios.get('/api/list-processed-files');
        setAvailableFiles(filesResponse.data.files || []);
        
        // Load current case studies configuration
        const configResponse = await axios.get('/api/case-studies-config');
        const config = configResponse.data;
        
        // Handle both old and new config formats
        if (config && typeof config.normal === 'string') {
          // Old format - convert to new format
          setCaseStudiesConfig({
            normal: { file: config.normal || '', feature: 'centeredTorque' },
            earlyPD: { file: config.earlyPD || '', feature: 'centeredTorque' },
            moderatePD: { file: config.moderatePD || '', feature: 'centeredTorque' },
            advancedPD: { file: config.advancedPD || '', feature: 'centeredTorque' }
          });
        } else {
          // New format
          setCaseStudiesConfig(config || {
            normal: { file: '', feature: 'centeredTorque' },
            earlyPD: { file: '', feature: 'centeredTorque' },
            moderatePD: { file: '', feature: 'centeredTorque' },
            advancedPD: { file: '', feature: 'centeredTorque' }
          });
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
      }
    };
    
    loadConfiguration();
  }, []);

  const handleCaseStudyConfigChange = async (caseType, newValue) => {
    if (caseType === 'reset') {
      setCaseStudiesConfig(newValue);
      try {
        await axios.post('/api/case-studies-config', newValue);
      } catch (error) {
        console.error('Error saving configuration:', error);
      }
      return;
    }
    
    const newConfig = { ...caseStudiesConfig, [caseType]: newValue };
    setCaseStudiesConfig(newConfig);
    
    try {
      await axios.post('/api/case-studies-config', newConfig);
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return (
    <Box sx={{ p: 2, maxWidth: '100%' }}>
      {/* Case Studies Configuration Section - Collapsible */}
      <Accordion 
        expanded={configExpanded} 
        onChange={() => setConfigExpanded(!configExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ 
            backgroundColor: 'primary.light', 
            color: 'white',
            '&:hover': { backgroundColor: 'primary.main' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Case Studies Configuration
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure which processed data files and features to use for each case study. These settings will be used on the Case Studies page.
          </Typography>
          
          {/* Case 1: Normal Control */}
          <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="success.main">
              Case 1: Normal Control
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Data File</InputLabel>
                  <Select
                    value={caseStudiesConfig.normal?.file || ''}
                    onChange={(e) => handleCaseStudyConfigChange('normal', { 
                      ...caseStudiesConfig.normal, 
                      file: e.target.value 
                    })}
                    label="Data File"
                  >
                    <MenuItem value="">
                      <em>Select a file...</em>
                    </MenuItem>
                    {availableFiles
                      .filter(file => file.includes('N ') || file.includes('Normal'))
                      .map((file) => (
                        <MenuItem key={file} value={file}>
                          {file}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Feature</InputLabel>
                  <Select
                    value={caseStudiesConfig.normal?.feature || 'centeredTorque'}
                    onChange={(e) => handleCaseStudyConfigChange('normal', { 
                      ...caseStudiesConfig.normal, 
                      feature: e.target.value 
                    })}
                    label="Primary Feature"
                  >
                    <MenuItem value="centeredTorque">Centered Torque</MenuItem>
                    <MenuItem value="centeredTremor">Centered Tremor</MenuItem>
                    <MenuItem value="centeredEnvelope">Centered Envelope</MenuItem>
                    <MenuItem value="centeredAngle">Centered Angle</MenuItem>
                    <MenuItem value="Centered Low Frequency Carrier">Centered Low Frequency Carrier</MenuItem>
                    <MenuItem value="Normalized WFE Displacement">Normalized WFE Displacement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Case 2: Early-Stage PD */}
          <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="info.main">
              Case 2: Early-Stage Parkinson's
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Data File</InputLabel>
                  <Select
                    value={caseStudiesConfig.earlyPD?.file || ''}
                    onChange={(e) => handleCaseStudyConfigChange('earlyPD', { 
                      ...caseStudiesConfig.earlyPD, 
                      file: e.target.value 
                    })}
                    label="Data File"
                  >
                    <MenuItem value="">
                      <em>Select a file...</em>
                    </MenuItem>
                    {availableFiles
                      .filter(file => file.includes('PD 1'))
                      .map((file) => (
                        <MenuItem key={file} value={file}>
                          {file}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Feature</InputLabel>
                  <Select
                    value={caseStudiesConfig.earlyPD?.feature || 'centeredTorque'}
                    onChange={(e) => handleCaseStudyConfigChange('earlyPD', { 
                      ...caseStudiesConfig.earlyPD, 
                      feature: e.target.value 
                    })}
                    label="Primary Feature"
                  >
                    <MenuItem value="centeredTorque">Centered Torque</MenuItem>
                    <MenuItem value="centeredTremor">Centered Tremor</MenuItem>
                    <MenuItem value="centeredEnvelope">Centered Envelope</MenuItem>
                    <MenuItem value="centeredAngle">Centered Angle</MenuItem>
                    <MenuItem value="Centered Low Frequency Carrier">Centered Low Frequency Carrier</MenuItem>
                    <MenuItem value="Normalized WFE Displacement">Normalized WFE Displacement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Case 3: Moderate PD */}
          <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              Case 3: Moderate Progression
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Data File</InputLabel>
                  <Select
                    value={caseStudiesConfig.moderatePD?.file || ''}
                    onChange={(e) => handleCaseStudyConfigChange('moderatePD', { 
                      ...caseStudiesConfig.moderatePD, 
                      file: e.target.value 
                    })}
                    label="Data File"
                  >
                    <MenuItem value="">
                      <em>Select a file...</em>
                    </MenuItem>
                    {availableFiles
                      .filter(file => file.includes('PD 2'))
                      .map((file) => (
                        <MenuItem key={file} value={file}>
                          {file}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Feature</InputLabel>
                  <Select
                    value={caseStudiesConfig.moderatePD?.feature || 'centeredTorque'}
                    onChange={(e) => handleCaseStudyConfigChange('moderatePD', { 
                      ...caseStudiesConfig.moderatePD, 
                      feature: e.target.value 
                    })}
                    label="Primary Feature"
                  >
                    <MenuItem value="centeredTorque">Centered Torque</MenuItem>
                    <MenuItem value="centeredTremor">Centered Tremor</MenuItem>
                    <MenuItem value="centeredEnvelope">Centered Envelope</MenuItem>
                    <MenuItem value="centeredAngle">Centered Angle</MenuItem>
                    <MenuItem value="Centered Low Frequency Carrier">Centered Low Frequency Carrier</MenuItem>
                    <MenuItem value="Normalized WFE Displacement">Normalized WFE Displacement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>

          {/* Case 4: Advanced PD */}
          <Box sx={{ mb: 4, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom color="error.main">
              Case 4: Advanced Stage
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Data File</InputLabel>
                  <Select
                    value={caseStudiesConfig.advancedPD?.file || ''}
                    onChange={(e) => handleCaseStudyConfigChange('advancedPD', { 
                      ...caseStudiesConfig.advancedPD, 
                      file: e.target.value 
                    })}
                    label="Data File"
                  >
                    <MenuItem value="">
                      <em>Select a file...</em>
                    </MenuItem>
                    {availableFiles
                      .filter(file => file.includes('PD 3'))
                      .map((file) => (
                        <MenuItem key={file} value={file}>
                          {file}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Primary Feature</InputLabel>
                  <Select
                    value={caseStudiesConfig.advancedPD?.feature || 'centeredTorque'}
                    onChange={(e) => handleCaseStudyConfigChange('advancedPD', { 
                      ...caseStudiesConfig.advancedPD, 
                      feature: e.target.value 
                    })}
                    label="Primary Feature"
                  >
                    <MenuItem value="centeredTorque">Centered Torque</MenuItem>
                    <MenuItem value="centeredTremor">Centered Tremor</MenuItem>
                    <MenuItem value="centeredEnvelope">Centered Envelope</MenuItem>
                    <MenuItem value="centeredAngle">Centered Angle</MenuItem>
                    <MenuItem value="Centered Low Frequency Carrier">Centered Low Frequency Carrier</MenuItem>
                    <MenuItem value="Normalized WFE Displacement">Normalized WFE Displacement</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              onClick={() => window.location.href = '/case-studies'}
              disabled={!caseStudiesConfig.normal?.file || !caseStudiesConfig.earlyPD?.file || !caseStudiesConfig.moderatePD?.file || !caseStudiesConfig.advancedPD?.file}
            >
              View Case Studies
            </Button>
            <Button 
              variant="outlined"
              onClick={() => {
                const defaultConfig = {
                  normal: { file: '', feature: 'centeredTorque' },
                  earlyPD: { file: '', feature: 'centeredTorque' },
                  moderatePD: { file: '', feature: 'centeredTorque' },
                  advancedPD: { file: '', feature: 'centeredTorque' }
                };
                setCaseStudiesConfig(defaultConfig);
                handleCaseStudyConfigChange('reset', defaultConfig);
              }}
            >
              Reset Configuration
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>


      {/* Live Monitoring Section - Collapsible */}
      <Accordion 
        expanded={monitoringExpanded} 
        onChange={() => setMonitoringExpanded(!monitoringExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ 
            backgroundColor: 'secondary.light', 
            color: 'white',
            '&:hover': { backgroundColor: 'secondary.main' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Live Monitoring
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <LiveMonitorControls
            selectedFile={selectedFile}
            files={files}
            onFileChange={(e) => setSelectedFile(e.target.value)}
            isStreaming={isStreaming}
            isDebugMode={isDebugMode}
            onDebugModeChange={(e) => setIsDebugMode(e.target.checked)}
            startTime={startTime}
            endTime={endTime}
            onStartTimeChange={(e) => setStartTime(Number(e.target.value))}
            onEndTimeChange={(e) => setEndTime(Number(e.target.value))}
            isLooping={isLooping}
            onLoopingChange={(e) => setIsLooping(e.target.checked)}
            onStartStop={
              isStreaming
                ? (isDebugMode ? debugStream.stopDebugStreaming : webSocketStream.stopWebSocketStreaming)
                : () => {
                    stopCommandSentRef.current = false; // Reset stop command flag when starting
                    
                    console.log('=== START STREAMING HANDLER ===');
                    console.log('Current state before start:', { recordAllSignals, isRecording, isDebugMode });
                    
                    // Simple: if "Record All Signals" is checked, start recording immediately
                    if (recordAllSignals) {
                      console.log('Starting recording because "Record All Signals" is checked');
                      setIsRecording(true);
                      console.log('setIsRecording(true) called');
                    } else {
                      console.log('Record All Signals not checked - not starting recording');
                    }
                    
                    if (isDebugMode) {
                      console.log('Starting debug stream with recordAllSignals:', recordAllSignals);
                      debugStream.startDebugStreaming(recordAllSignals);
                    } else {
                      console.log('Starting WebSocket stream');
                      webSocketStream.startStreaming();
                    }
                  }
            }
            onReset={resetStream}
            isRecording={isRecording}
            onToggleRecording={toggleRecording}
            onDownload={downloadRecordedData}
            disableStart={!selectedFile || startTime >= endTime || (!isDebugMode && !isConnected)}
            disableReset={false}
            disableRecording={!isStreaming}
            disableDownload={!hasRecordedData}
            recordedDataLength={recordedData.length}
            isConnected={isConnected}
            onReconnect={handleManualReconnect}
            recordAllSignals={recordAllSignals}
            onRecordAllSignalsChange={(e) => {
              console.log('setRecordAllSignals called with:', e.target.checked);
              setRecordAllSignals(e.target.checked);
            }}
          />
          {/* Debug logging for recorded data state */}
          {console.log('LiveMonitor render - recordedData length:', recordedData.length, 'hasRecordedData:', hasRecordedData, 'disableDownload:', !hasRecordedData)}
          {console.log('LiveMonitor render - Current state:', { isStreaming, recordAllSignals, isRecording })}
          <LiveMonitorStatus isConnected={isConnected} messageRate={messageRate} samplingRate={samplingRate} />

          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: 1 }}>
            {/* Row 1: File Data Plot, Centered Value Plot */}
            <Grid item xs={12} lg={6}>
              <FileDataPlot
                fileData={fileData}
                signals={signals}
                visibleSignals={visibleSignals}
                plotLayout={plotLayout}
                plotConfig={plotConfig}
                getTorqueEquation={getTorqueEquation}
                handleSignalToggle={handleSignalToggle}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <CenteredValuePlot
                fileData={fileData}
                selectedFile={selectedFile}
                visibleSignals={visibleSignals}
                signals={signals}
              />
            </Grid>
            {/* Row 2: Normalized Centered Value Plot, Live Data Plot */}
            <Grid item xs={12} lg={6}>
              <NormalizedCenteredValuePlot
                fileData={fileData}
                selectedFile={selectedFile}
                visibleSignals={visibleSignals}
                signals={signals}
                onNormalizedData={handleNormalizedData}
                useRobustNormalization={useRobustNormalization}
                onUseRobustNormalizationChange={setUseRobustNormalization}
              />
            </Grid>
            <Grid item xs={12} lg={6}>
              <LiveDataPlot
                liveData={liveData}
                selectedStreamingSignal={selectedStreamingSignal}
                signals={signals}
                plotLayout={plotLayout}
                plotConfig={plotConfig}
                handleStreamingSignalChange={handleStreamingSignalChange}
                isStreaming={isStreaming}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

            {/* Control Parameters Section - Collapsible */}
            <Accordion 
        expanded={parametersExpanded} 
        onChange={() => setParametersExpanded(!parametersExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ 
            backgroundColor: 'info.light', 
            color: 'white',
            '&:hover': { backgroundColor: 'info.main' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Control Parameters
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <ParameterControls 
                parameters={parameters} 
                onParameterChange={handleParameterChange} 
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <SignalVisualizer 
                parameters={parameters} 
                fileName={selectedFile} 
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Manual Control Section - Collapsible */}
      <Accordion 
        expanded={manualControlExpanded} 
        onChange={() => setManualControlExpanded(!manualControlExpanded)}
        sx={{ mb: 2 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{ 
            backgroundColor: 'warning.light', 
            color: 'white',
            '&:hover': { backgroundColor: 'warning.main' }
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} />
            Manual Haptic Control
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Direct manual control of the haptic device. Use the slider to send values (0-255) directly to the ESP32 DAC output.
            This is useful for testing, calibration, and manual haptic feedback control.
          </Typography>
          
          <Box sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: 2, backgroundColor: 'grey.50' }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    DAC Output Value: {manualControlValue}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Range: 0 (minimum) to 255 (maximum) | Center: 128
                  </Typography>
                  
                  <Slider
                    value={manualControlValue}
                    onChange={handleManualControlChange}
                    min={0}
                    max={255}
                    step={1}
                    marks={[
                      { value: 0, label: '0' },
                      { value: 64, label: '64' },
                      { value: 128, label: '128' },
                      { value: 192, label: '192' },
                      { value: 255, label: '255' }
                    ]}
                    valueLabelDisplay="auto"
                    disabled={!isConnected}
                    sx={{
                      '& .MuiSlider-mark': {
                        backgroundColor: 'primary.main',
                      },
                      '& .MuiSlider-markLabel': {
                        color: 'text.secondary',
                      }
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant={isManualControlActive ? "contained" : "outlined"}
                    color={isManualControlActive ? "error" : "primary"}
                    onClick={toggleManualControl}
                    disabled={!isConnected}
                    startIcon={<SettingsIcon />}
                  >
                    {isManualControlActive ? 'Stop Manual Control' : 'Start Manual Control'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    onClick={resetManualControl}
                    disabled={!isConnected || !isManualControlActive}
                  >
                    Reset to Center (128)
                  </Button>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 2, backgroundColor: isConnected ? 'success.light' : 'error.light' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Connection Status
                  </Typography>
                  <Typography variant="body2">
                    {isConnected ? 'Connected to ESP32' : 'Not connected to ESP32'}
                  </Typography>
                  
                  {isManualControlActive && (
                    <Box sx={{ mt: 2, p: 1, backgroundColor: 'warning.light', borderRadius: 1 }}>
                      <Typography variant="body2" color="warning.dark">
                        ⚠️ Manual control active - sending value {manualControlValue} to ESP32
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Usage Instructions:
            </Typography>
            <Typography variant="body2" color="text.secondary" component="div">
              <ul>
                <li>Ensure the ESP32 is connected and the WebSocket connection is established</li>
                <li>Click "Start Manual Control" to enable direct control</li>
                <li>Use the slider to adjust the DAC output value (0-255)</li>
                <li>The value is sent immediately to the ESP32 when the slider changes</li>
                <li>Click "Stop Manual Control" to disable and return to normal operation</li>
                <li>Use "Reset to Center" to quickly return to the neutral position (128)</li>
              </ul>
            </Typography>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default LiveMonitor; 