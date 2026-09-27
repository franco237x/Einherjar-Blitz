'use client';

import { useEffect, useState } from 'react';

/** Web replacement for React Native's useWindowDimensions. */
export function useViewport() {
  const [size, setSize] = useState({ width: 1024, height: 768 });

  useEffect(() => {
    const update = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return size;
}
