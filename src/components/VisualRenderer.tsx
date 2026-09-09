/**
 * Visual renderer component that handles both diagrams and images
 */

'use client';

import React from 'react';
import { Visual } from '@/types/visual';
import { DiagramRenderer, useMermaidScript } from './DiagramRenderer';
import { ImageRenderer } from './ImageRenderer';
import { validateVisual } from '@/lib/visual-validation';

interface VisualRendererProps {
  visual: Visual;
  darkMode?: boolean;
  className?: string;
}

/**
 * Main visual renderer component
 */
export const VisualRenderer: React.FC<VisualRendererProps> = ({
  visual,
  darkMode = false,
  className = '',
}) => {
  // Load Mermaid script for all diagram renderers
  useMermaidScript();
  
  // Validate visual before rendering
  const validationError = validateVisual(visual);
  if (validationError) {
    return (
      <div
        className="p-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg"
        role="alert"
      >
        <p className="text-red-800 dark:text-red-200 text-xs font-mono">
          Invalid visual: {validationError.errors.join(', ')}
        </p>
      </div>
    );
  }
  
  const containerClasses = `animate-fade-in ${className}`;
  
  return (
    <div className={containerClasses}>
      {/* Purpose and description */}
      <div className="mb-md">
        {visual.title && (
          <h3 className="text-lg font-semibold text-soma-900 dark:text-soma-50 mb-1">
            {visual.title}
          </h3>
        )}
        <p className="text-sm text-soma-700 dark:text-soma-300">{visual.purpose}</p>
        {visual.description && (
          <p className="text-xs text-soma-600 dark:text-soma-400 mt-1">
            {visual.description}
          </p>
        )}
      </div>
      
      {/* Render diagram or image */}
      {visual.format === 'diagram' && visual.diagram && (
        <DiagramRenderer
          diagram={visual.diagram}
          title={visual.title}
          darkMode={darkMode}
          ariaLabel={visual.ariaLabel}
        />
      )}
      
      {visual.format === 'image' && visual.image && (
        <ImageRenderer
          image={visual.image}
          title={visual.title}
          expandable={visual.expandable}
        />
      )}
      
      {/* Confidence and evidence basis */}
      <div className="mt-md text-xs text-soma-600 dark:text-soma-400">
        <p className="mb-1">
          <span className="font-semibold">Confidence:</span> {visual.confidence}
          {visual.inferred && ' (inferred)'}
        </p>
        {visual.evidenceBasis.length > 0 && (
          <p className="text-soma-500 dark:text-soma-500">
            <span className="font-semibold">Based on:</span> {visual.evidenceBasis.join(', ')}
          </p>
        )}
      </div>
    </div>
  );
};
