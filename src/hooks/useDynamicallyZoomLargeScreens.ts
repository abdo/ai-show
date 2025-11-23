import { useState, useEffect } from "react";
import { BREAKPOINTS } from '../constants/breakpoints';

/**
 * Hook to apply dynamic zooming for large screens (>BREAKPOINTS.DESKTOP_LARGE).
 * It calculates a zoom value to maintain layout proportions.
 * 
 * @returns A style object to apply to the container
 */
export function useDynamicallyZoomLargeScreens() {
  const [scaleStyle, setScaleStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width > BREAKPOINTS.DESKTOP_LARGE) {
        const zoom = width / BREAKPOINTS.DESKTOP_LARGE;
        setScaleStyle({
          zoom: zoom
        });
      } else {
        setScaleStyle({});
      }
    };

    // Initial check
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return scaleStyle;
}
