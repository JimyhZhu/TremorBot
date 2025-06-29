import { useState, useRef } from 'react';

export default function useWebSocketStream({ wsRef, fileData, normalizedData, startTime, endTime, samplingRate, selectedStreamingSignal, isLooping, setIsStreaming, setRecordedData, setMessageRate, messageCountRef, lastMessageTimeRef, setDuration, setTotalDuration, timerRef, debugDataIndexRef, lastEndTimeRef, updateLiveData, stopStreaming, setIsConnected }) {
  // Returns startStreaming, stopStreaming, isStreaming, etc.
  const [isStreaming, setStreaming] = useState(false);

  const startStreaming = () => {
    if (!fileData || !fileData.time || fileData.time.length === 0) return;
    // Find the indices for start and end times
    const startIndex = fileData.time.findIndex(t => t >= startTime);
    const endIndex = fileData.time.findIndex(t => t >= endTime);
    if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) {
      console.error('Invalid time range');
      return;
    }
    
    // Use the actual file sampling rate for haptic output
    const hapticSamplingRate = samplingRate; // Use inferred sampling rate from file
    
    // Send start streaming command to ESP32
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command: 'startStreaming',
        samplingRate: hapticSamplingRate
      };
      wsRef.current.send(JSON.stringify(command));
    } else {
      console.error('WebSocket not connected, cannot start streaming');
      return;
    }
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
    const pointsPerBatch = Math.max(1, Math.floor(hapticSamplingRate * targetInterval / 1000));
    const actualInterval = Math.max(16, Math.floor(1000 * pointsPerBatch / hapticSamplingRate)); // Minimum 16ms for 60fps
    
    console.log(`WebSocket stream: ${hapticSamplingRate}Hz sampling rate, ${pointsPerBatch} points per batch, ${actualInterval}ms interval`);
    console.log(`Expected message rate: ${Math.round(1000 / actualInterval * pointsPerBatch)} Hz`);
    
    let sendCount = 0;
    let lastSendTime = Date.now();
    
    wsRef.current._debugInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        stopWebSocketStreaming();
        return;
      }
      const now = Date.now();
      messageCountRef.current += pointsPerBatch;
      if (now - lastMessageTimeRef.current >= 1000) {
        setMessageRate(messageCountRef.current);
        messageCountRef.current = 0;
        lastMessageTimeRef.current = now;
      }
      
      // Send individual data points per interval to maintain sampling rate
      for (let i = 0; i < pointsPerBatch; i++) {
        if (debugDataIndexRef.current >= endIndex) {
          console.log('=== REACHED END OF DATA ===');
          console.log('Current index:', debugDataIndexRef.current, 'End index:', endIndex);
          console.log('Is looping:', isLooping);
          
          if (isLooping) {
            debugDataIndexRef.current = startIndex;
            const runDuration = endTime - startTime;
            lastEndTimeRef.current += runDuration;
            console.log('Looping - reset to start index:', startIndex);
          } else {
            const runDuration = endTime - startTime;
            lastEndTimeRef.current += runDuration;
            console.log('Not looping - calling stopWebSocketStreaming');
            stopWebSocketStreaming();
            return;
          }
        }
        
        const currentTime = fileData.time[debugDataIndexRef.current];
        
        // Get the selected signal value - prioritize normalized data
        let value;
        if (normalizedData && normalizedData[selectedStreamingSignal] !== undefined) {
          value = normalizedData[selectedStreamingSignal][debugDataIndexRef.current];
        } else if (fileData[selectedStreamingSignal] !== undefined) {
          value = fileData[selectedStreamingSignal][debugDataIndexRef.current];
        }
        
        const data = {
          time: lastEndTimeRef.current + (currentTime - startTime), // Continue from previous end time
          value: value
        };
        
        // Send individual data point
        try {
          wsRef.current.send(JSON.stringify(data));
          sendCount++;
          
          // Debug: Log sending rate every 1000 sends
          if (sendCount % 1000 === 0) {
            const currentTime = Date.now();
            const elapsed = currentTime - lastSendTime;
            const rate = 1000 / (elapsed / 1000);
            console.log(`[DEBUG] Sent ${sendCount} messages, rate: ${rate.toFixed(1)} Hz`);
            lastSendTime = currentTime;
          }
        } catch (error) {
          console.error('WebSocket send error:', error);
          stopWebSocketStreaming();
          return;
        }
        
        // Update live data for plotting
        updateLiveData({
          time: data.time,
          [selectedStreamingSignal]: data.value
        });
        
        debugDataIndexRef.current++;
      }
    }, actualInterval);
  };

  const stopWebSocketStreaming = () => {
    console.log('WebSocket streaming stopping...');
    
    // Send stop command to ESP32
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = {
        command: 'stopStreaming'
      };
      console.log('Sending stop streaming command to ESP32:', command);
      wsRef.current.send(JSON.stringify(command));
    }
    
    setStreaming(false);
    setIsStreaming(false);
    if (wsRef.current && wsRef.current._debugInterval) {
      clearInterval(wsRef.current._debugInterval);
      wsRef.current._debugInterval = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setMessageRate(0);
    messageCountRef.current = 0;
    lastMessageTimeRef.current = Date.now();
    
    console.log('WebSocket streaming stopped');
  };

  return {
    isStreaming,
    startStreaming,
    stopWebSocketStreaming
  };
} 