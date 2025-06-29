import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Box, Typography, FormGroup, FormControlLabel, Checkbox, Paper, Divider, useTheme, useMediaQuery } from '@mui/material';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001';

const SignalVisualizer = ({ parameters, fileName }) => {
  const [signalData, setSignalData] = useState({
    time: [],
    rawAngle: [],
    baseAngle: [],
    tremor: [],
    envelope: [],
    torque: [],
    wfeDisp: []
  });

  const [visibleSignals, setVisibleSignals] = useState({
    centeredAngle: true,
    centeredBaseAngle: true,
    centeredTremor: true,
    centeredEnvelope: true,
    centeredTorque: true,
    hybridReplayCentered: true
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dynamic plot height based on screen size
  const plotHeight = isSmallScreen ? 350 : isMobile ? 400 : 500;

  useEffect(() => {
    if (!fileName) return;
    const fetchSignalData = async () => {
      try {
        console.log('SignalVisualizer: Fetching data with parameters:', parameters);
        const response = await axios.post(`${API_BASE_URL}/api/process-signal`, { ...parameters, file_name: fileName });
        console.log('SignalVisualizer: Received data, torque values:', response.data.torque?.slice(0, 5));
        setSignalData(response.data);
      } catch (error) {
        console.error('Error fetching signal data:', error);
      }
    };

    fetchSignalData();
  }, [parameters, fileName]);

  const handleSignalToggle = (signal) => (event) => {
    setVisibleSignals(prev => ({
      ...prev,
      [signal]: event.target.checked
    }));
  };

  const getPlotData = () => {
    console.log('SignalVisualizer: getPlotData called, signalData keys:', Object.keys(signalData));
    console.log('SignalVisualizer: torque data length:', signalData.torque?.length);
    console.log('SignalVisualizer: centeredTorque data length:', signalData.centeredTorque?.length);
    
    const signals = [
      {
        key: 'centeredAngle',
        name: 'Centered Angle',
        color: '#1f77b4'
      },
      {
        key: 'centeredBaseAngle',
        name: 'Centered Base Angle',
        color: '#2ca02c'
      },
      {
        key: 'centeredTremor',
        name: 'Centered Tremor',
        color: '#ff7f0e'
      },
      {
        key: 'centeredEnvelope',
        name: 'Centered Envelope',
        color: '#d62728'
      },
      {
        key: 'centeredTorque',
        name: 'Centered Torque',
        color: '#9467bd'
      },
      {
        key: 'hybridReplayCentered',
        name: 'Centered Hybrid Replay',
        color: '#e377c2'
      }
    ];

    return signals
      .filter(signal => visibleSignals[signal.key])
      .map(signal => ({
        x: signalData.time,
        y: signalData[signal.key],
        type: 'scatter',
        mode: 'lines',
        name: signal.name,
        line: { color: signal.color, width: 1.5 }
      }));
  };

  const getTorqueEquation = () => {
    return `τ = ${parameters.G.toFixed(1)} × (θ_base + ${parameters.alpha.toFixed(1)} × A × T_raw)`;
  };

  return (
    <Box>
      <Typography 
        variant="h6" 
        gutterBottom
        sx={{ 
          fontSize: { xs: '1.1rem', sm: '1.25rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Centered Signal Visualization
      </Typography>
      
      <Paper sx={{ p: { xs: 1, sm: 2 }, mb: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1, sm: 2 } }}>
          <FormGroup 
            row={!isSmallScreen}
            sx={{ 
              flexWrap: 'wrap',
              justifyContent: { xs: 'center', sm: 'flex-start' }
            }}
          >
            {[
              { key: 'centeredAngle', label: 'Centered Angle', color: '#1f77b4' },
              { key: 'centeredBaseAngle', label: 'Centered Base Angle', color: '#2ca02c' },
              { key: 'centeredTremor', label: 'Centered Tremor', color: '#ff7f0e' },
              { key: 'centeredEnvelope', label: 'Centered Envelope', color: '#d62728' },
              { key: 'centeredTorque', label: 'Centered Torque', color: '#9467bd' },
              { key: 'hybridReplayCentered', label: 'Centered Hybrid Replay', color: '#e377c2' }
            ].map(signal => (
              <FormControlLabel
                key={signal.key}
                control={
                  <Checkbox
                    checked={visibleSignals[signal.key]}
                    onChange={handleSignalToggle(signal.key)}
                    size="small"
                    sx={{
                      color: signal.color,
                      '&.Mui-checked': {
                        color: signal.color,
                      },
                    }}
                  />
                }
                label={
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5 
                  }}>
                    <Box
                      sx={{
                        width: { xs: 8, sm: 12 },
                        height: { xs: 8, sm: 12 },
                        backgroundColor: signal.color,
                        borderRadius: '2px'
                      }}
                    />
                    <Typography sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.875rem' }
                    }}>
                      {signal.label}
                    </Typography>
                  </Box>
                }
                sx={{ 
                  mr: { xs: 0.5, sm: 1 },
                  mb: { xs: 0.5, sm: 0 }
                }}
              />
            ))}
          </FormGroup>
          
          <Divider sx={{ my: { xs: 1, sm: 2 } }} />
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row' },
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Torque Equation:
            </Typography>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontFamily: 'monospace',
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {getTorqueEquation()}
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Plot
        key={`${parameters.alpha}-${parameters.G}`}
        data={getPlotData()}
        layout={{
          title: {
            text: 'Centered Signal Components',
            font: { size: isSmallScreen ? 14 : 16 }
          },
          xaxis: { 
            title: 'Time (s)',
            titlefont: { size: isSmallScreen ? 10 : 12 },
            gridcolor: '#f0f0f0'
          },
          yaxis: { 
            title: 'Amplitude (centered)',
            titlefont: { size: isSmallScreen ? 10 : 12 },
            gridcolor: '#f0f0f0'
          },
          height: plotHeight,
          showlegend: true,
          legend: {
            x: 0.02,
            y: 0.98,
            bgcolor: 'rgba(255,255,255,0.8)',
            bordercolor: '#ccc',
            borderwidth: 1
          },
          margin: { 
            l: isSmallScreen ? 50 : 60, 
            r: isSmallScreen ? 30 : 60, 
            t: isSmallScreen ? 50 : 60, 
            b: isSmallScreen ? 50 : 60 
          },
          font: { size: isSmallScreen ? 10 : 12 },
          plot_bgcolor: 'white',
          paper_bgcolor: 'white',
          hovermode: 'x unified'
        }}
        config={{
          responsive: true,
          displayModeBar: true,
          displaylogo: false,
          modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d']
        }}
        style={{ width: '100%' }}
        useResizeHandler={true}
      />
    </Box>
  );
};

export default SignalVisualizer; 