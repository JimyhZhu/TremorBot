import { useState, useEffect, useRef } from 'react';

export const useCaseStudiesWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Connecting to haptic device...');
  const [isStreaming, setIsStreaming] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const dataIndexRef = useRef(0);
  const currentCaseDataRef = useRef(null);
  
  // WebSocket connection URLs - same as Live Monitor
  const wsUrls = [
    'ws://esp32.local:81',  // Try mDNS first
    'ws://172.20.10.5:81',  // ESP32's actual IP address
    'ws://192.168.1.113:81'  // Fallback IP
  ];

  // WebSocket connection handling - robust implementation
  useEffect(() => {
    let reconnectAttempt = 0;
    const baseReconnectDelay = 500;
    let currentUrlIndex = 0;
    let connectionTimeout = null;
    let persistentReconnectInterval = null;

    const connectWebSocket = () => {
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
      
      console.log(`[Case Studies] Attempting WebSocket connection (attempt ${reconnectAttempt + 1}) to: ${wsUrl}`);
      setStatusMessage(`Connecting to ${wsUrl}...`);
      
      try {
        wsRef.current = new WebSocket(wsUrl);
        
        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
            console.log('[Case Studies] Connection timeout, trying next URL');
            wsRef.current.close();
          }
        }, 1500);

        wsRef.current.onopen = () => {
          console.log('[Case Studies] WebSocket connected successfully to:', wsUrl);
          if (connectionTimeout) {
            clearTimeout(connectionTimeout);
            connectionTimeout = null;
          }
          setIsConnected(true);
          setStatusMessage('Connected to haptic device');
          reconnectAttempt = 0; // Reset attempt counter on successful connection
          
          // Clear any persistent reconnection intervals
          if (persistentReconnectInterval) {
            clearInterval(persistentReconnectInterval);
            persistentReconnectInterval = null;
          }
          
          // Keep connection alive with minimal heartbeat
          const heartbeat = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'ping' }));
            }
          }, 60000);

          // Store the heartbeat interval for cleanup
          wsRef.current.heartbeat = heartbeat;
        };
        
        wsRef.current.onclose = (event) => {
          console.log('[Case Studies] WebSocket disconnected:', event.code, event.reason);
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
            if (streamingIntervalRef.current) {
              clearInterval(streamingIntervalRef.current);
              streamingIntervalRef.current = null;
            }
            setStatusMessage('Connection lost - streaming stopped');
          } else {
            setStatusMessage('Disconnected. Retrying...');
          }

          // Attempt to reconnect if it wasn't an intentional closure
          if (event.code !== 1000) {
            const delay = Math.min(baseReconnectDelay * Math.pow(1.2, reconnectAttempt), 3000);
            console.log(`[Case Studies] Scheduling reconnection attempt in ${delay}ms...`);
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempt++;
              connectWebSocket();
            }, delay);
          }
        };
        
        wsRef.current.onerror = (error) => {
          console.error('[Case Studies] WebSocket error:', error);
        };
        
        wsRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[Case Studies] Received WebSocket message:', data);
            
            if (data.type === 'status') {
              console.log('[Case Studies] Status message:', data.message);
            }
          } catch (error) {
            console.error('[Case Studies] Error parsing WebSocket message:', error, event.data);
          }
        };
      } catch (error) {
        console.error('[Case Studies] Error creating WebSocket connection:', error);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          connectionTimeout = null;
        }
        
        // Try next URL immediately if current one fails
        if (currentUrlIndex < wsUrls.length) {
          console.log('[Case Studies] Trying next URL immediately');
          connectWebSocket();
        } else {
          // If we've tried all URLs, wait before retrying
          const delay = Math.min(baseReconnectDelay * Math.pow(1.2, reconnectAttempt), 2000);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempt++;
            connectWebSocket();
          }, delay);
        }
      }
    };

    // Start initial connection
    connectWebSocket();

    // Set up persistent reconnection
    persistentReconnectInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('[Case Studies] Persistent reconnection: attempting to connect...');
        connectWebSocket();
      }
    }, 5000);

    // Cleanup on unmount
    return () => {
      console.log('[Case Studies] Cleaning up WebSocket connection');
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
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }
    };
  }, []);

  const sendTremorData = (caseId, timeData, featureData) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[Case Studies] WebSocket not connected, cannot start streaming');
      setStatusMessage('Haptic device not connected');
      return;
    }

    if (!timeData || !featureData || timeData.length === 0 || featureData.length === 0) {
      console.error('[Case Studies] Invalid data provided for streaming');
      setStatusMessage('Invalid data for streaming');
      return;
    }

    // Store current case data for streaming
    currentCaseDataRef.current = {
      caseId,
      timeData: Array.from(timeData),
      featureData: Array.from(featureData)
    };

    // Calculate sampling rate from time data
    const timeDiff = timeData[1] - timeData[0];
    const samplingRate = Math.round(1 / timeDiff);
    
    console.log(`[Case Studies] Starting tremor simulation for ${caseId}`);
    console.log(`[Case Studies] Data length: ${timeData.length}, Sampling rate: ${samplingRate}Hz`);

    // Send start streaming command to ESP32
    const startCommand = {
      command: 'startStreaming',
      case_id: caseId,
      samplingRate: samplingRate
    };
    wsRef.current.send(JSON.stringify(startCommand));

    // Reset streaming state
    dataIndexRef.current = 0;
    setIsStreaming(true);
    setStatusMessage(`Simulating: ${caseId}`);

    // Calculate streaming parameters
    const targetInterval = 50; // Target 50ms intervals (20Hz update rate)
    const pointsPerBatch = Math.max(1, Math.floor(samplingRate * targetInterval / 1000));
    const actualInterval = Math.max(16, Math.floor(1000 * pointsPerBatch / samplingRate));
    
    console.log(`[Case Studies] Streaming: ${samplingRate}Hz, ${pointsPerBatch} points per batch, ${actualInterval}ms interval`);

    // Start streaming data
    streamingIntervalRef.current = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.log('[Case Studies] WebSocket disconnected during streaming, stopping...');
        stopTremor();
        return;
      }

      // Send batch of data points
      for (let i = 0; i < pointsPerBatch; i++) {
        if (dataIndexRef.current >= currentCaseDataRef.current.timeData.length) {
          console.log('[Case Studies] Reached end of data, stopping streaming');
          stopTremor();
          return;
        }

        const data = {
          time: currentCaseDataRef.current.timeData[dataIndexRef.current],
          value: currentCaseDataRef.current.featureData[dataIndexRef.current]
        };

        try {
          wsRef.current.send(JSON.stringify(data));
        } catch (error) {
          console.error('[Case Studies] WebSocket send error:', error);
          stopTremor();
          return;
        }

        dataIndexRef.current++;
      }
    }, actualInterval);
  };

  const stopTremor = () => {
    console.log('[Case Studies] Stopping tremor simulation...');
    
    // Clear streaming interval IMMEDIATELY to stop data sending
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
      console.log('[Case Studies] Streaming interval cleared');
    }
    
    // Update UI state immediately
    setIsStreaming(false);
    dataIndexRef.current = 0;
    currentCaseDataRef.current = null;
    
    // Send stop command to ESP32 (non-blocking)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const stopCommand = {
        command: 'stopStreaming'
      };
      console.log('[Case Studies] Sending stop streaming command to ESP32:', stopCommand);
      
      // Send command asynchronously to avoid blocking
      try {
        wsRef.current.send(JSON.stringify(stopCommand));
      } catch (error) {
        console.error('[Case Studies] Error sending stop command:', error);
      }
    }
    
    // Update status immediately
    if (isConnected) {
      setStatusMessage('Ready');
    } else {
      setStatusMessage('Disconnected');
    }
    
    console.log('[Case Studies] Tremor simulation stopped');
  };

  const manualReconnect = () => {
    console.log('[Case Studies] Manual reconnection requested');
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    // Force a new connection attempt
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  return { 
    isConnected, 
    statusMessage, 
    isStreaming,
    currentCaseData: currentCaseDataRef.current,
    sendTremorData, 
    stopTremor,
    manualReconnect
  };
}; 