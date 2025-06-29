import { useState, useEffect } from 'react';

// Custom hook for responsive design utilities
export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call handler right away so state gets updated with initial window size
    handleResize();
    
    // Remove event listener on cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Breakpoint helpers
  const isMobile = windowSize.width < 600;
  const isTablet = windowSize.width >= 600 && windowSize.width < 960;
  const isDesktop = windowSize.width >= 960;
  const isLargeScreen = windowSize.width >= 1280;

  // Dynamic values based on screen size
  const getResponsiveValue = (mobile, tablet, desktop, large) => {
    if (isMobile) return mobile;
    if (isTablet) return tablet;
    if (isLargeScreen) return large;
    return desktop;
  };

  // Plot height calculator
  const getPlotHeight = () => {
    return getResponsiveValue(300, 350, 400, 450);
  };

  // Spacing calculator
  const getSpacing = () => {
    return getResponsiveValue(1, 2, 3, 3);
  };

  // Font size calculator
  const getFontSize = (baseSize) => {
    const multiplier = getResponsiveValue(0.8, 0.9, 1, 1.1);
    return baseSize * multiplier;
  };

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    getResponsiveValue,
    getPlotHeight,
    getSpacing,
    getFontSize,
  };
};

export default useResponsive; 