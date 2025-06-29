import React, { useRef, useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, FormGroup, FormControlLabel, Radio, Box, useTheme, useMediaQuery } from '@mui/material';

// Mapping from normalized signal names to display names
const normalizedSignalMapping = {
  centeredAngle: 'Centered Angle',
  centeredBaseAngle: 'Centered Base Angle',
  wfeDisp: 'WFE Displacement',
  vel_err: 'Velocity Error',
  env_tremor: 'Centered Tremor',
  centeredEnvelope: 'Centered Envelope',
  centeredTorque: 'Centered Torque',
  position_error: 'Position Error',
  tremor: 'Tremor',
  envelope: 'Envelope'
};

const normalizedSignalColors = {
  centeredAngle: '#1f77b4',
  centeredBaseAngle: '#ff7f0e',
  wfeDisp: '#8c564b',
  vel_err: '#e377c2',
  env_tremor: '#2ca02c',
  centeredEnvelope: '#d62728',
  centeredTorque: '#9467bd',
  position_error: '#17becf',
  tremor: '#bcbd22',
  envelope: '#ff9896'
};

const CaseStudiesLivePlot = ({ 
  isStreaming, 
  currentCaseData, 
  selectedStreamingSignal = 'centeredTorque',
  onSignalChange,
  currentCaseName
}) => {
  const plotRef = useRef(null);
  const [liveData, setLiveData] = useState({ time: [], [selectedStreamingSignal]: [] });
  const [dataIndex, setDataIndex] = useState(0);
  const streamingIntervalRef = useRef(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dynamic plot height based on screen size
  const plotHeight = isSmallScreen ? 300 : isMobile ? 350 : 400;

  // Define all possible normalized signals that can be streamed
  const allStreamableSignals = [
    'centeredAngle',
    'centeredBaseAngle', 
    'centeredEnvelope',
    'centeredTorque',
    'wfeDisp',
    'env_tremor',
    'vel_err',
    'position_error',
    'tremor',
    'envelope'
  ];

  // Handle signal change
  const handleSignalChange = (signalName) => {
    if (onSignalChange) {
      onSignalChange(signalName);
    }
  };

  // Start live data simulation when streaming starts
  useEffect(() => {
    if (isStreaming && currentCaseData) {
      console.log('[CaseStudiesLivePlot] Starting live data simulation');
      
      // Reset data
      setLiveData({ time: [], [selectedStreamingSignal]: [] });
      setDataIndex(0);
      
      // Calculate streaming parameters
      const timeData = currentCaseData.timeData;
      const featureData = currentCaseData.featureData;
      
      if (!timeData || !featureData || timeData.length === 0) {
        console.warn('[CaseStudiesLivePlot] No valid data to stream');
        return;
      }

      const timeDiff = timeData[1] - timeData[0];
      const samplingRate = Math.round(1 / timeDiff);
      const targetInterval = 100; // 100ms intervals (10Hz update rate for visualization)
      const pointsPerBatch = Math.max(1, Math.floor(samplingRate * targetInterval / 1000));
      const actualInterval = Math.max(16, Math.floor(1000 * pointsPerBatch / samplingRate));
      
      console.log(`[CaseStudiesLivePlot] Simulating: ${samplingRate}Hz, ${pointsPerBatch} points per batch, ${actualInterval}ms interval`);

      // Start streaming simulation
      streamingIntervalRef.current = setInterval(() => {
        setDataIndex(prevIndex => {
          const newIndex = prevIndex + pointsPerBatch;
          
          if (newIndex >= timeData.length) {
            // Reset to beginning for continuous loop
            return 0;
          }
          
          // Update live data with new points
          setLiveData(prevData => {
            const newTimePoints = timeData.slice(prevIndex, newIndex);
            const newSignalPoints = featureData.slice(prevIndex, newIndex);
            
            // Limit data points to prevent performance issues (keep last 1000 points)
            const maxPoints = 1000;
            const combinedTime = [...prevData.time, ...newTimePoints];
            const combinedSignal = [...prevData[selectedStreamingSignal], ...newSignalPoints];
            
            if (combinedTime.length > maxPoints) {
              return {
                time: combinedTime.slice(-maxPoints),
                [selectedStreamingSignal]: combinedSignal.slice(-maxPoints)
              };
            }
            
            return {
              time: combinedTime,
              [selectedStreamingSignal]: combinedSignal
            };
          });
          
          return newIndex;
        });
      }, actualInterval);
    } else {
      // Stop streaming
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
      
      // Clear data when not streaming
      if (!isStreaming) {
        setLiveData({ time: [], [selectedStreamingSignal]: [] });
        setDataIndex(0);
      }
    }

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    };
  }, [isStreaming, currentCaseData, selectedStreamingSignal]);

  // Plot configuration
  const plotLayout = {
    autosize: true,
    margin: { l: 50, r: 50, t: 50, b: 50 },
    showlegend: false,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      gridcolor: 'rgba(128,128,128,0.2)',
      zeroline: false,
      showgrid: true
    },
    yaxis: {
      gridcolor: 'rgba(128,128,128,0.2)',
      zeroline: false,
      showgrid: true
    }
  };

  const plotConfig = {
    displayModeBar: false,
    responsive: true
  };

  // Show selection bar even if no data yet, but hide the plot
  if (!isStreaming) {
    return (
      <Paper sx={{ 
        p: { xs: 1, sm: 2 }, 
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1rem', sm: '1.25rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Live Streaming Data
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            mb: 2,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          Start a case study simulation to see live streaming data.
        </Typography>
        
        {/* Responsive radio button layout */}
        <FormGroup 
          row={!isSmallScreen} 
          sx={{ 
            mb: 2,
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-start' }
          }}
        >
          {allStreamableSignals.map(signalName => (
            <FormControlLabel
              key={signalName}
              control={
                <Radio
                  checked={selectedStreamingSignal === signalName}
                  onChange={() => handleSignalChange(signalName)}
                  disabled={isStreaming}
                  size="small"
                  sx={{
                    color: normalizedSignalColors[signalName] || '#666',
                    '&.Mui-checked': {
                      color: normalizedSignalColors[signalName] || '#666',
                    },
                  }}
                />
              }
              label={normalizedSignalMapping[signalName] || signalName}
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  ml: 0.5
                },
                mr: { xs: 0.5, sm: 1 },
                mb: { xs: 0.5, sm: 0 }
              }}
            />
          ))}
        </FormGroup>
      </Paper>
    );
  }

  // Get data for display
  const displayTime = liveData.time || [];
  const displaySignal = liveData[selectedStreamingSignal] || [];

  // Calculate dynamic x-axis range based on recent data (last 5 seconds or full range if less)
  const timeRange = displayTime.length > 0 ? 
    (() => {
      const lastTime = displayTime[displayTime.length - 1];
      const firstTime = displayTime[0];
      const timeSpan = lastTime - firstTime;
      
      if (timeSpan > 5) {
        // Show last 5 seconds
        return [Math.max(0, lastTime - 5), lastTime];
      } else {
        // Show full range with some padding
        return [Math.max(0, firstTime - 0.5), lastTime + 0.5];
      }
    })() : 
    [0, 10];

  return (
    <Paper sx={{ 
      p: { xs: 1, sm: 2 }, 
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1rem', sm: '1.25rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Live Streaming Data
      </Typography>
      
      {/* Responsive radio button layout */}
      <FormGroup 
        row={!isSmallScreen} 
        sx={{ 
          mb: 2,
          flexWrap: 'wrap',
          justifyContent: { xs: 'center', sm: 'flex-start' }
        }}
      >
        {allStreamableSignals.map(signalName => (
          <FormControlLabel
            key={signalName}
            control={
              <Radio
                checked={selectedStreamingSignal === signalName}
                onChange={() => handleSignalChange(signalName)}
                disabled={isStreaming}
                size="small"
                sx={{
                  color: normalizedSignalColors[signalName] || '#666',
                  '&.Mui-checked': {
                    color: normalizedSignalColors[signalName] || '#666',
                  },
                }}
              />
            }
            label={normalizedSignalMapping[signalName] || signalName}
            sx={{ 
              '& .MuiFormControlLabel-label': { 
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                ml: 0.5
              },
              mr: { xs: 0.5, sm: 1 },
              mb: { xs: 0.5, sm: 0 }
            }}
          />
        ))}
      </FormGroup>
      
      {displayTime.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Waiting for streaming data...
        </Typography>
      ) : (
        <Box sx={{ 
          height: plotHeight,
          flex: 1,
          minHeight: 0
        }}>
          <Plot
            ref={plotRef}
            data={[{
              x: displayTime,
              y: displaySignal,
              type: 'scatter',
              mode: 'lines',
              name: normalizedSignalMapping[selectedStreamingSignal] || selectedStreamingSignal,
              line: { color: normalizedSignalColors[selectedStreamingSignal] || '#666' }
            }]}
            layout={{
              ...plotLayout,
              title: {
                text: currentCaseName ? `Live Streaming Data - ${currentCaseName}` : 'Live Streaming Data',
                font: { size: isSmallScreen ? 14 : 16 }
              },
              height: plotHeight,
              width: null,
              autosize: true,
              margin: { 
                l: isSmallScreen ? 40 : 50, 
                r: isSmallScreen ? 20 : 50, 
                t: isSmallScreen ? 40 : 50, 
                b: isSmallScreen ? 40 : 50 
              },
              font: { size: isSmallScreen ? 10 : 12 },
              xaxis: {
                ...plotLayout.xaxis,
                range: timeRange,
                title: 'Time (s)',
                titlefont: { size: isSmallScreen ? 10 : 12 }
              },
              yaxis: {
                ...plotLayout.yaxis,
                title: 'Normalized Value',
                titlefont: { size: isSmallScreen ? 10 : 12 }
              }
            }}
            config={plotConfig}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </Box>
      )}
    </Paper>
  );
};

export default CaseStudiesLivePlot; 