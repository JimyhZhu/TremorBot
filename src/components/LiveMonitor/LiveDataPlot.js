import React, { useRef, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, FormGroup, FormControlLabel, Radio, Box, useTheme, useMediaQuery } from '@mui/material';

// Mapping from normalized signal names to display names
const normalizedSignalMapping = {
  centeredAngle: 'Centered Angle',
  centeredBaseAngle: 'Centered Base Angle',
  wfeDisp: 'WFE Displacement',
  env_tremor: 'Centered Tremor',
  centeredEnvelope: 'Centered Envelope',
  centeredTorque: 'Centered Torque',
  tremor: 'Tremor',
  envelope: 'Envelope'
};

const normalizedSignalColors = {
  centeredAngle: '#1f77b4',
  centeredBaseAngle: '#ff7f0e',
  wfeDisp: '#8c564b',
  env_tremor: '#2ca02c',
  centeredEnvelope: '#d62728',
  centeredTorque: '#9467bd',
  tremor: '#bcbd22',
  envelope: '#ff9896'
};

const LiveDataPlot = ({ liveData, selectedStreamingSignal, signals, plotLayout, plotConfig, handleStreamingSignalChange, isStreaming }) => {
  const plotRef = useRef(null);
  const lastDataLengthRef = useRef(0);
  
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
    'tremor',
    'envelope'
  ];

  // Get available signals from liveData - check for any signal that has data
  const availableSignals = Object.keys(liveData || {}).filter(key => 
    key !== 'time' && Array.isArray(liveData[key]) && liveData[key].length > 0
  );

  // Handle live updates by re-rendering with only recent data
  useEffect(() => {
    if (!liveData?.time || liveData.time.length === 0) return;

    const currentLength = liveData.time.length;
    const lastLength = lastDataLengthRef.current;

    // Only update if we have new data
    if (currentLength > lastLength) {
      lastDataLengthRef.current = currentLength;
    }
  }, [liveData, selectedStreamingSignal]);

  // Reset the plot when streaming starts or signal changes
  useEffect(() => {
    lastDataLengthRef.current = 0;
  }, [selectedStreamingSignal]);

  // Debug logging
  console.log('LiveDataPlot Debug:', {
    selectedStreamingSignal,
    availableSignals,
    liveDataKeys: Object.keys(liveData || {}),
    liveDataTimeLength: liveData?.time?.length || 0,
    hasData: availableSignals.length > 0
  });

  // Show selection bar even if no data yet, but hide the plot
  if (!liveData || Object.keys(liveData).length === 0) {
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
          Live Data
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
          Select a signal to stream and start streaming to see live data.
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
                  onChange={() => handleStreamingSignalChange(signalName)}
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

  // Get data for display - show ALL streamed data points
  const displayTime = liveData.time || [];
  const displaySignal = liveData[selectedStreamingSignal] || [];

  // Calculate dynamic x-axis range based on all data
  const timeRange = displayTime.length > 0 ? 
    [0, displayTime[displayTime.length - 1]] : 
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
        Live Data
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
                onChange={() => handleStreamingSignalChange(signalName)}
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
      
      {availableSignals.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          Waiting for data to arrive...
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
                text: 'Live Data',
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
                range: [0, 255],
                title: 'Normalized Value (0-255)',
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

export default LiveDataPlot; 