import React from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, FormGroup, FormControlLabel, Checkbox, Divider, Box, useTheme, useMediaQuery, Grid } from '@mui/material';

const FileDataPlot = ({ fileData, signals, visibleSignals, plotLayout, plotConfig, getTorqueEquation, handleSignalToggle }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dynamic plot height based on screen size
  const plotHeight = isSmallScreen ? 300 : isMobile ? 350 : 400;

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
        File Data
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 2, 
          fontFamily: 'monospace',
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        {getTorqueEquation()}
      </Typography>
      
      {/* Responsive checkbox layout */}
      <Grid container spacing={1} sx={{ mb: 2 }}>
        {[
          { key: 'rawAngle', label: 'Raw Angle', color: '#1f77b4' },
          { key: 'baseAngle', label: 'Base Angle', color: '#ff7f0e' },
          { key: 'tremor', label: 'Tremor', color: '#2ca02c' },
          { key: 'envelope', label: 'Envelope', color: '#d62728' },
          { key: 'centeredTorque', label: 'Torque', color: '#9467bd' },
          { key: 'wfeDisp', label: 'WFE Displacement', color: '#8c564b' },
          { key: 'hybridReplay', label: 'Hybrid Replay', color: '#e377c2' }
        ].map(signal => (
          <Grid item xs={6} sm={4} key={signal.key}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={visibleSignals[signal.key]}
                  onChange={(e) => handleSignalToggle(signal.key, e.target.checked)}
                  size="small"
                  sx={{
                    color: signal.color,
                    '&.Mui-checked': {
                      color: signal.color,
                    },
                  }}
                />
              }
              label={signal.label}
              sx={{ 
                '& .MuiFormControlLabel-label': { 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  ml: 0.5
                },
                mr: { xs: 0.5, sm: 1 },
                mb: { xs: 0.5, sm: 0 }
              }}
            />
          </Grid>
        ))}
      </Grid>
      
      <Divider sx={{ my: { xs: 1, sm: 2 } }} />
      
      <Box sx={{ 
        height: plotHeight,
        flex: 1,
        minHeight: 0
      }}>
        <Plot
          data={signals
            .filter(signal => visibleSignals[signal.name])
            .map(signal => ({
              x: fileData.time,
              y: fileData[signal.name],
              type: 'scatter',
              mode: 'lines',
              name: signal.label,
              line: { color: signal.color }
            }))}
          layout={{
            ...plotLayout,
            title: {
              text: 'File Data',
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
            legend: {
              x: isSmallScreen ? 0 : 1,
              xanchor: isSmallScreen ? 'left' : 'right',
              y: 1,
              font: { size: isSmallScreen ? 10 : 12 }
            }
          }}
          config={plotConfig}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </Box>
    </Paper>
  );
};

export default FileDataPlot; 