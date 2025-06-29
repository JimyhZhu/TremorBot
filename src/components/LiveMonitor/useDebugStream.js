import { useState } from 'react';

export default function useDebugStream({ fileData, normalizedData, startTime, endTime, samplingRate, selectedStreamingSignal, isLooping, setIsStreaming, setRecordedData, setMessageRate, messageCountRef, lastMessageTimeRef, setDuration, setTotalDuration, timerRef, debugDataIndexRef, lastEndTimeRef, updateLiveData, stopStreaming, setHasRecordedData }) {
  const [isStreaming, setStreaming] = useState(false);

  const startDebugStreaming = (shouldRecord = false) => {
    console.log('=== START DEBUG STREAMING ===', { shouldRecord });
    if (!fileData || fileData.time.length === 0) return;
    const startIndex = fileData.time.findIndex(t => t >= startTime);
    const endIndex = fileData.time.findIndex(t => t >= endTime);
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      console.error('Invalid time range');
      return;
    }
    console.log('Debug streaming starting with indices:', { startIndex, endIndex });
    setStreaming(true);
    setIsStreaming(true);
    // Don't clear recorded data here - preserve it from previous runs
    // setRecordedData([]);
    setMessageRate(0);
    messageCountRef.current = 0;
    lastMessageTimeRef.current = Date.now();
    debugDataIndexRef.current = startIndex;
    setDuration(0);
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
      setTotalDuration(prev => prev + 1);
    }, 1000);
    
    // Calculate interval and batch size for high sampling rates
    const targetInterval = 50; // Target 50ms intervals (20Hz update rate)
    const pointsPerBatch = Math.max(1, Math.floor(samplingRate * targetInterval / 1000));
    const actualInterval = Math.max(16, Math.floor(1000 * pointsPerBatch / samplingRate)); // Minimum 16ms for 60fps
    
    console.log(`Debug stream: ${samplingRate}Hz sampling rate, ${pointsPerBatch} points per batch, ${actualInterval}ms interval`);
    console.log(`Expected message rate: ${Math.round(1000 / actualInterval * pointsPerBatch)} Hz`);
    
    debugDataIndexRef.current = startIndex;
    
    // Add a small delay to ensure recording state is set before starting data flow
    setTimeout(() => {
      console.log('Starting debug data interval after delay, shouldRecord:', shouldRecord);
      window._debugInterval = setInterval(() => {
        const now = Date.now();
        messageCountRef.current += pointsPerBatch;
        if (now - lastMessageTimeRef.current >= 1000) {
          setMessageRate(messageCountRef.current);
          messageCountRef.current = 0;
          lastMessageTimeRef.current = now;
        }
        
        // Send multiple points per interval to maintain sampling rate
        for (let i = 0; i < pointsPerBatch; i++) {
          if (debugDataIndexRef.current >= endIndex) {
            if (isLooping) {
              debugDataIndexRef.current = startIndex;
              const runDuration = endTime - startTime;
              lastEndTimeRef.current += runDuration;
            } else {
              const runDuration = endTime - startTime;
              lastEndTimeRef.current += runDuration;
              stopDebugStreaming();
              return;
            }
          }
          
          const currentTime = fileData.time[debugDataIndexRef.current];
          
          // Create data object with only the selected signal
          const data = {
            time: lastEndTimeRef.current + (currentTime - startTime) // Continue from previous end time
          };
          
          // Debug logging to see what normalized data is available
          if (debugDataIndexRef.current === startIndex) {
            console.log('Normalized Data Available:', {
              normalizedDataKeys: Object.keys(normalizedData || {}),
              selectedSignal: selectedStreamingSignal,
              hasNormalizedData: normalizedData && normalizedData[selectedStreamingSignal] !== undefined
            });
          }
          
          // Add only the selected signal value - prioritize normalized data
          if (normalizedData && normalizedData[selectedStreamingSignal] !== undefined) {
            // Use normalized data for the selected signal
            data[selectedStreamingSignal] = normalizedData[selectedStreamingSignal][debugDataIndexRef.current];
          } else if (fileData[selectedStreamingSignal] !== undefined) {
            // Fallback to original file data if normalized data not available
            data[selectedStreamingSignal] = fileData[selectedStreamingSignal][debugDataIndexRef.current];
          }
          
          console.log('Debug stream sending data:', data, 'shouldRecord:', shouldRecord);
          
          // Create a wrapper function that passes the recording state directly
          const updateLiveDataWithRecording = (data) => {
            console.log('updateLiveDataWithRecording called - shouldRecord:', shouldRecord, 'data:', data);
            // Call the original updateLiveData but with the correct recording state
            if (shouldRecord) {
              console.log('Recording is active - adding data to recordedData:', data);
              
              let dataToRecord = data;
              
              // If recording all signals, get all available data from fileData
              if (fileData && fileData.time) {
                const currentTimeIndex = fileData.time.findIndex(t => t >= data.time);
                if (currentTimeIndex !== -1) {
                  dataToRecord = {
                    time: data.time,
                    // Use normalized/centered data when available, fallback to original data
                    rawAngle: normalizedData?.centeredAngle?.[currentTimeIndex] ?? fileData.rawAngle?.[currentTimeIndex],
                    baseAngle: normalizedData?.centeredBaseAngle?.[currentTimeIndex] ?? fileData.baseAngle?.[currentTimeIndex],
                    tremor: normalizedData?.centeredTremor?.[currentTimeIndex] ?? fileData.tremor?.[currentTimeIndex],
                    envelope: normalizedData?.centeredEnvelope?.[currentTimeIndex] ?? fileData.envelope?.[currentTimeIndex],
                    torque: normalizedData?.centeredTorque?.[currentTimeIndex] ?? fileData.torque?.[currentTimeIndex],
                    wfeDisp: normalizedData?.wfeDisp?.[currentTimeIndex] ?? fileData.wfeDisp?.[currentTimeIndex], // WFE displacement is normalized
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
            
            // Still call the original updateLiveData for live data updates
            updateLiveData(data);
          };
          
          updateLiveDataWithRecording(data);
          debugDataIndexRef.current++;
        }
      }, actualInterval);
    }, 200); // 200ms delay to ensure recording state is set
  };

  const stopDebugStreaming = () => {
    console.log('=== STOP DEBUG STREAMING ===');
    setStreaming(false);
    setIsStreaming(false);
    if (window._debugInterval) {
      clearInterval(window._debugInterval);
      window._debugInterval = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMessageRate(0);
    messageCountRef.current = 0;
    lastMessageTimeRef.current = Date.now();
    
    // Call the parent's stopStreaming function to handle recording properly
    stopStreaming();
  };

  return {
    isStreaming,
    startDebugStreaming,
    stopDebugStreaming
  };
} 