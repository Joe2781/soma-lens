/**
 * React component for rendering images safely
 */

'use client';

import React, { useState } from 'react';
import { ImageReference } from '@/types/visual';

interface ImageRendererProps {
  image: ImageReference;
  title?: string;
  className?: string;
  expandable?: boolean;
}

/**
 * Image renderer component
 * Safely renders validated image references with attribution
 */
export const ImageRenderer: React.FC<ImageRendererProps> = ({
  image,
  title,
  className = '',
  expandable = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  if (imageError) {
    return (
      <div
        className="p-lg bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-lg"
        role="alert"
      >
        <p className="text-amber-800 dark:text-amber-200 text-sm">
          Image could not be loaded
        </p>
      </div>
    );
  }
  
  const containerClass = `bg-white dark:bg-soma-900 border border-soma-200 dark:border-soma-800 rounded-lg overflow-hidden ${
    className
  }`;
  
  return (
    <figure className={containerClass}>
      {title && (
        <figcaption className="text-sm font-semibold text-soma-900 dark:text-soma-50 p-lg pb-0">
          {title}
        </figcaption>
      )}
      
      <div className="relative overflow-hidden">
        {/* AI-generated indicator */}
        {image.type === 'ai_generated' && (
          <div className="absolute top-2 right-2 z-10 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            AI Generated
          </div>
        )}
        
        {/* Image */}
        <img
          src={image.url}
          alt={image.altText}
          className={`w-full h-auto ${
            expandable && 'cursor-pointer hover:opacity-90 transition-opacity'
          }`}
          onError={() => setImageError(true)}
          onClick={() => expandable && setIsExpanded(!isExpanded)}
          loading="lazy"
        />
      </div>
      
      {/* Caption and attribution */}
      {(image.caption || image.attribution || image.source) && (
        <figcaption className="p-lg text-xs text-soma-700 dark:text-soma-300 border-t border-soma-200 dark:border-soma-700">
          {image.caption && <p className="mb-1">{image.caption}</p>}
          {image.attribution && (
            <p className="text-soma-600 dark:text-soma-400">By: {image.attribution}</p>
          )}
          {image.source && (
            <p className="text-soma-600 dark:text-soma-400">
              <a
                href={image.source}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-soma-700 dark:hover:text-soma-300"
              >
                Source
              </a>
            </p>
          )}
        </figcaption>
      )}
    </figure>
  );
};
