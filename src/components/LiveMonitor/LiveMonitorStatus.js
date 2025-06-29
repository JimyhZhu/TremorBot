import React from 'react';
import { Chip, Box, useTheme, useMediaQuery } from '@mui/material';

const LiveMonitorStatus = ({ isConnected, messageRate, samplingRate }) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ 
      display: 'flex', 
      gap: { xs: 0.5, sm: 1 }, 
      mb: 2,
      flexWrap: 'wrap',
      justifyContent: { xs: 'center', sm: 'flex-start' }
    }}>
      <Chip
        label={`MCU: ${isConnected ? 'Connected' : 'Disconnected'}`}
        color={isConnected ? 'success' : 'error'}
        size="small"
        sx={{ 
          minWidth: { xs: 100, sm: 120 },
          '& .MuiChip-label': { 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            px: { xs: 0.5, sm: 1 }
          }
        }}
      />
      <Chip
        label={`Sampling: ${samplingRate} Hz`}
        variant="outlined"
        size="small"
        sx={{ 
          minWidth: { xs: 80, sm: 100 },
          '& .MuiChip-label': { 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            px: { xs: 0.5, sm: 1 }
          }
        }}
      />
      <Chip
        label={`Rate: ${messageRate} Hz`}
        variant="outlined"
        size="small"
        sx={{ 
          minWidth: { xs: 80, sm: 100 },
          '& .MuiChip-label': { 
            fontSize: { xs: '0.7rem', sm: '0.75rem' },
            px: { xs: 0.5, sm: 1 }
          }
        }}
      />
    </Box>
  );
};

export default LiveMonitorStatus; 