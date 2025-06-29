import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';

const ResponsiveLayout = ({ 
  children, 
  direction = 'row',
  spacing = 2,
  alignItems = 'center',
  justifyContent = 'flex-start',
  flexWrap = 'wrap',
  sx = {},
  ...props 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Responsive spacing
  const responsiveSpacing = isSmallScreen ? spacing * 0.5 : isMobile ? spacing * 0.75 : spacing;

  // Responsive direction
  const responsiveDirection = isSmallScreen ? 'column' : direction;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: responsiveDirection,
        gap: responsiveSpacing,
        alignItems: isSmallScreen ? 'stretch' : alignItems,
        justifyContent: isSmallScreen ? 'center' : justifyContent,
        flexWrap: isSmallScreen ? 'nowrap' : flexWrap,
        width: '100%',
        ...sx,
      }}
      {...props}
    >
      {children}
    </Box>
  );
};

export default ResponsiveLayout; 