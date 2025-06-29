import React from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, CircularProgress, Box, useTheme, useMediaQuery } from '@mui/material';

// Only centered features
const plotFeatureKeys = [
  'centeredAngle', 'centeredBaseAngle', 'wfeDisp', 'vel_err', 'env_tremor', 'centeredEnvelope', 'centeredTorque', 'position_error'
];

const labelOverrides = {
  centeredAngle: 'Centered Angle',
  centeredBaseAngle: 'Centered Base Angle',
  wfeDisp: 'Displacement',
  vel_err: 'Velocity Error',
  env_tremor: 'Centered Tremor',
  centeredEnvelope: 'Centered Envelope',
  centeredTorque: 'Centered Torque',
  position_error: 'Position Error (θ_base - θ)'
};

const colorOverrides = {
  centeredAngle: '#1f77b4',
  centeredBaseAngle: '#ff7f0e',
  wfeDisp: '#8c564b',
  vel_err: '#e377c2',
  env_tremor: '#2ca02c',
  centeredEnvelope: '#d62728',
  centeredTorque: '#9467bd',
  position_error: '#17becf'
};

// Map centered features to their base signal names
const centeredToBaseSignal = {
  centeredAngle: 'rawAngle',
  centeredBaseAngle: 'baseAngle',
  wfeDisp: 'wfeDisp',
  vel_err: 'vel_err',
  env_tremor: 'tremor',
  centeredEnvelope: 'envelope',
  centeredTorque: 'torque',
  position_error: 'position_error'
};

const CenteredValuePlot = ({ fileData, selectedFile, visibleSignals, signals }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dynamic plot height based on screen size
  const plotHeight = isSmallScreen ? 300 : isMobile ? 350 : 500;

  if (!fileData || !fileData.time || fileData.time.length === 0) {
    return (
      <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: plotHeight 
        }}>
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Only plot features that are visible and exist in fileData, and whose base signal is checked
  const plotKeys = plotFeatureKeys.filter(fileKey => {
    const baseSignal = centeredToBaseSignal[fileKey];
    return visibleSignals[baseSignal] && fileData[fileKey];
  });

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
        Centered Value Plot
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Showing centered values for each feature (not normalized). Visibility is controlled by the checkboxes in the File Data plot.
      </Typography>
      
      <Box sx={{ 
        height: plotHeight,
        flex: 1,
        minHeight: 0
      }}>
        <Plot
          data={plotKeys.map(fileKey => {
            const signal = signals.find(s => s.name === centeredToBaseSignal[fileKey]);
            return {
              x: fileData.time,
              y: fileData[fileKey],
              type: 'scatter',
              mode: 'lines',
              name: labelOverrides[fileKey] || (signal ? signal.label : fileKey),
              line: { color: colorOverrides[fileKey] || (signal ? signal.color : undefined) }
            };
          })}
          layout={{
            title: {
              text: 'Centered Value Plot',
              font: { size: isSmallScreen ? 14 : 16 }
            },
            height: plotHeight,
            width: null,
            autosize: true,
            showlegend: false,
            margin: { 
              l: isSmallScreen ? 40 : 50, 
              r: isSmallScreen ? 20 : 50, 
              t: isSmallScreen ? 40 : 50, 
              b: isSmallScreen ? 40 : 50 
            },
            font: { size: isSmallScreen ? 10 : 12 },
            xaxis: { 
              title: 'Time (s)',
              titlefont: { size: isSmallScreen ? 10 : 12 }
            },
            yaxis: { 
              title: 'Centered Value',
              titlefont: { size: isSmallScreen ? 10 : 12 }
            }
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false
          }}
          style={{ width: '100%', height: '100%' }}
          useResizeHandler={true}
        />
      </Box>
    </Paper>
  );
};

export default CenteredValuePlot; 