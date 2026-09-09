'use client';

import { AnalysisWorkspace } from '@/components/AnalysisWorkspace';
import { useEffect, useState } from 'react';

export default function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);
  
  if (!mounted) return null;
  
  return (
    <div className={darkMode ? 'dark' : ''}>
      <AnalysisWorkspace
        darkMode={darkMode}
        onDarkModeToggle={setDarkMode}
      />
    </div>
  );
}
