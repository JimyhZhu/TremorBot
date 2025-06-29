import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Paper, Typography, CircularProgress, Box, useTheme, useMediaQuery, FormControlLabel, Switch } from '@mui/material';

const plotFeatureKeys = [
  'centeredAngle', 'centeredBaseAngle', 'wfeDisp', 'env_tremor', 'centeredEnvelope', 'centeredTorque', 'tremor', 'envelope'
];

const labelOverrides = {
  centeredAngle: 'Centered Angle',
  centeredBaseAngle: 'Centered Base Base',
  wfeDisp: 'Displacement',
  env_tremor: 'Centered Tremor',
  centeredEnvelope: 'Centered Envelope',
  centeredTorque: 'Centered Torque',
  tremor: 'Centered Tremor (Raw)',
  envelope: 'Centered Envelope (Raw)'
};

const colorOverrides = {
  centeredAngle: '#1f77b4',
  centeredBaseAngle: '#ff7f0e',
  wfeDisp: '#8c564b',
  env_tremor: '#2ca02c',
  centeredEnvelope: '#d62728',
  centeredTorque: '#9467bd',
  tremor: '#bcbd22',
  envelope: '#ff9896'
};

const centeredToBaseSignal = {
  centeredAngle: 'rawAngle',
  centeredBaseAngle: 'baseAngle',
  wfeDisp: 'wfeDisp',
  env_tremor: 'tremor',
  centeredEnvelope: 'envelope',
  centeredTorque: 'torque',
  tremor: 'tremor',
  envelope: 'envelope'
};

const NormalizedCenteredValuePlot = ({ 
  fileData, 
  selectedFile, 
  visibleSignals, 
  signals, 
  onNormalizedData,
  useRobustNormalization,
  onUseRobustNormalizationChange
}) => {
  const [globalStats, setGlobalStats] = useState(null);
  const [globalRobustStats, setGlobalRobustStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [normalizedData, setNormalizedData] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Dynamic plot height based on screen size
  const plotHeight = isSmallScreen ? 300 : isMobile ? 350 : 500;

  // Robust normalization function using global robust statistics
  const robustNormalize = (arr, useGlobalStats = false, globalKey = null) => {
    if (!arr || arr.length === 0) return arr.map(() => 128);
    
    // Use Global Min/Max Method
    if (useGlobalStats) {
      if (globalStats && globalStats[globalKey]) {
        const min = globalStats[globalKey].min;
        const max = globalStats[globalKey].max;
        const absMax = Math.max(Math.abs(min), Math.abs(max));
        if (absMax === 0) {
          return arr.map(() => 128);
        }
        return arr.map(v => Math.round(128 + 127 * v / absMax));
      } else {
        console.warn(`Global min/max stats not found for key: ${globalKey}.`);
        return arr.map(() => 128); // Default value
      }
    }
    
    // Use Global Robust IQR Method
    if (globalRobustStats && globalRobustStats[globalKey]) {
      const stats = globalRobustStats[globalKey];
      const lowerBound = stats.lower_bound;
      const upperBound = stats.upper_bound;
      const robustRange = stats.robust_range;
      
      if (robustRange === 0) {
        return arr.map(() => 128);
      }
      
      // Normalize to 0-255 range using global robust bounds, with 128 as midpoint
      return arr.map(v => {
        const clipped = Math.max(lowerBound, Math.min(upperBound, v));
        const centerOfRange = (lowerBound + upperBound) / 2;
        const halfRange = robustRange / 2;
        if (halfRange === 0) return 128;
        const normalized = Math.round(128 + 127 * (clipped - centerOfRange) / halfRange);
        return Math.max(0, Math.min(255, normalized));
      });
    }

    console.warn(`Global robust stats not found for key: ${globalKey}.`);
    return arr.map(() => 128); // Default value
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/data/global_stats.json').then(res => res.json()),
      fetch('/data/global_robust_stats.json').then(res => res.json())
    ])
      .then(([stats, robustStats]) => {
        setGlobalStats(stats);
        setGlobalRobustStats(robustStats);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load global statistics files');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!globalStats || !globalRobustStats || !fileData || !fileData.time || fileData.time.length === 0) {
      setNormalizedData(null);
      if (onNormalizedData) onNormalizedData(null);
      return;
    }
    const norm = {};
    plotFeatureKeys.forEach(fileKey => {
      if (!fileData[fileKey]) return; // Normalize if data exists, regardless of visibility in other plots

      // Special case for centeredTorque: always use per-file normalization
      if (fileKey === 'centeredTorque') {
        const arr = fileData[fileKey];
        if (useRobustNormalization) {
          // Per-file robust normalization for torque
          const sorted = [...arr].sort((a, b) => a - b);
          const n = sorted.length;
          const q1Index = Math.floor(0.25 * n);
          const q3Index = Math.floor(0.75 * n);
          const q1 = sorted[q1Index];
          const q3 = sorted[q3Index];
          const iqr = q3 - q1;
          const iqrMultiplier = 3.0;
          const lowerBound = q1 - iqrMultiplier * iqr;
          const upperBound = q3 + iqrMultiplier * iqr;
          const robustRange = upperBound - lowerBound;
          if (robustRange === 0) {
            norm[fileKey] = arr.map(() => 128);
          } else {
            const centerOfRange = (lowerBound + upperBound) / 2;
            const halfRange = robustRange / 2;
            norm[fileKey] = arr.map(v => {
              const clipped = Math.max(lowerBound, Math.min(upperBound, v));
              if (halfRange === 0) return 128;
              const normalized = Math.round(128 + 127 * (clipped - centerOfRange) / halfRange);
              return Math.max(0, Math.min(255, normalized));
            });
          }
        } else {
          // Per-file min/max normalization for torque
          const min = Math.min(...arr);
          const max = Math.max(...arr);
          const absMax = Math.max(Math.abs(min), Math.abs(max));
          if (absMax === 0) {
            norm[fileKey] = arr.map(() => 128);
          } else {
            norm[fileKey] = arr.map(v => Math.round(128 + 127 * v / absMax));
          }
        }
        return;
      }
      
      // Map to global_stats key for all other signals
      let globalKey = fileKey;
      if (fileKey === 'centeredAngle') globalKey = 'angle';
      if (fileKey === 'centeredBaseAngle') globalKey = 'carrier';
      if (fileKey === 'wfeDisp') globalKey = 'disp';
      if (fileKey === 'env_tremor') globalKey = 'env_tremor';
      if (fileKey === 'tremor') globalKey = 'tremor';
      if (fileKey === 'envelope' || fileKey === 'centeredEnvelope') globalKey = 'envelope';
      
      // Use global normalization for all other signals
      norm[fileKey] = robustNormalize(fileData[fileKey], !useRobustNormalization, globalKey);
    });
    setNormalizedData(norm);
    if (onNormalizedData) onNormalizedData(norm);
  }, [globalStats, globalRobustStats, fileData, useRobustNormalization]);

  if (loading) {
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
  
  if (error) {
    return (
      <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%' }}>
        <Typography color="error" sx={{ textAlign: 'center' }}>{error}</Typography>
      </Paper>
    );
  }
  
  if (!normalizedData || !fileData.time) {
    return null;
  }

  const plotKeys = plotFeatureKeys.filter(fileKey => {
    const baseSignal = centeredToBaseSignal[fileKey];
    return visibleSignals[baseSignal] && normalizedData[fileKey];
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
        Normalized Centered Value Plot
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          mb: 1,
          fontSize: { xs: '0.75rem', sm: '0.875rem' },
          textAlign: { xs: 'center', sm: 'left' }
        }}
      >
        Showing all available normalized (0-255) centered features from the data file.
      </Typography>
      
      <Box sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Switch
              checked={useRobustNormalization}
              onChange={(e) => onUseRobustNormalizationChange(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {useRobustNormalization ? 'Robust Normalization (IQR-based)' : 'Global Min/Max Normalization'}
            </Typography>
          }
        />
      </Box>
      
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
              y: normalizedData[fileKey],
              type: 'scatter',
              mode: 'lines',
              name: labelOverrides[fileKey] || (signal ? signal.label : fileKey),
              line: { color: colorOverrides[fileKey] || (signal ? signal.color : undefined) }
            };
          })}
          layout={{
            title: {
              text: 'Normalized Centered Value Plot',
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
              title: 'Normalized Value (0-255)', 
              range: [0, 255],
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

export default NormalizedCenteredValuePlot; 