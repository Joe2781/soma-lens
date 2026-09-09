/**
 * React component for rendering diagrams
 * Uses Mermaid for deterministic, accessible rendering
 */

'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StructuredDiagram } from '@/types/visual';
import { diagramToMermaid, estimateDiagramSize } from '@/lib/visual-renderer';

interface DiagramRendererProps {
  diagram: StructuredDiagram;
  title?: string;
  darkMode?: boolean;
  interactive?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Diagram renderer component
 * Renders structured diagrams as accessible SVGs
 */
export const DiagramRenderer: React.FC<DiagramRendererProps> = ({
  diagram,
  title,
  darkMode = false,
  interactive = true,
  className = '',
  ariaLabel,
}) => {
  const [mermaidLoaded, setMermaidLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const diagramRef = useRef<HTMLDivElement>(null);
  const estimatedSize = estimateDiagramSize(diagram);
  
  useEffect(() => {
    // Lazy load Mermaid
    const loadMermaid = async () => {
      try {
        // @ts-ignore - Mermaid is loaded from CDN
        if (window.mermaid) {
          window.mermaid.initialize({
            startOnLoad: true,
            theme: darkMode ? 'dark' : 'default',
            logLevel: 'error',
          });
          setMermaidLoaded(true);
        }
      } catch (err) {
        setError('Failed to render diagram');
        console.error('Mermaid loading error:', err);
      }
    };
    
    if (!mermaidLoaded) {
      loadMermaid();
    }
  }, [darkMode, mermaidLoaded]);
  
  if (error) {
    return (
      <div
        className="p-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg"
        role="alert"
      >
        <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
      </div>
    );
  }
  
  const mermaidSyntax = diagramToMermaid(diagram);
  
  return (
    <div
      className={`overflow-x-auto bg-white dark:bg-soma-900 border border-soma-200 dark:border-soma-800 rounded-lg p-lg ${
        className
      }`}
      role="img"
      aria-label={ariaLabel || title || 'Diagram'}
      ref={diagramRef}
      style={{
        minHeight: Math.max(estimatedSize.minHeight, 300),
      }}
    >
      {title && (
        <h3 className="text-sm font-semibold text-soma-900 dark:text-soma-50 mb-lg">
          {title}
        </h3>
      )}
      <div
        className="mermaid"
        data-theme={darkMode ? 'dark' : 'default'}
        dangerouslySetInnerHTML={{ __html: `\n${mermaidSyntax}\n` }}
      />
    </div>
  );
};

/**
 * Add Mermaid script loader
 */
export function useMermaidScript() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      // @ts-ignore
      if (window.mermaid) {
        // @ts-ignore
        window.mermaid.contentLoaded();
      }
    };
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);
}
