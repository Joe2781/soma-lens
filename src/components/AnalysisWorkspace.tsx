'use client';

import React, { useState } from 'react';
import { Composer } from './Composer';
import { AnalysisReading } from './AnalysisReading';
import { FollowUpComposer } from './FollowUpComposer';
import { SomaAnalysisWithVisuals } from '@/types/analysis-visuals';
import { Lens } from '@/types/lens';

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface AnalysisWorkspaceProps {
  onDarkModeToggle?: (enabled: boolean) => void;
  darkMode?: boolean;
}

export const AnalysisWorkspace: React.FC<AnalysisWorkspaceProps> = ({
  onDarkModeToggle,
  darkMode = false,
}) => {
  const [analysis, setAnalysis] = useState<SomaAnalysisWithVisuals | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<SomaAnalysisWithVisuals[]>([]);
  
  const handleAnalysisSubmit = async (
    input: string,
    lens: Lens,
    attachments?: Attachment[],
  ) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare request
      const requestBody = {
        input,
        lens,
        // TODO: Handle attachments when backend supports them
      };
      
      // Call analysis API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success && data.analysis) {
        // Partial success - use fallback analysis
        setAnalysis(data.analysis);
        setError('Analysis completed with warnings. Some features may be unavailable.');
      } else if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setPreviousAnalyses((prev) => [data.analysis, ...prev].slice(0, 10));
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[SOMA] Analysis error:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFollowUp = async (question: string, lens: Lens) => {
    if (!analysis) return;
    
    // Create follow-up message
    const followUpInput = `Based on the previous analysis of: "${analysis.request.input.substring(0, 100)}..."

Follow-up: ${question}`;
    
    // Submit as new analysis
    await handleAnalysisSubmit(followUpInput, lens);
  };
  
  const handleCancel = () => {
    setIsLoading(false);
  };
  
  const handleNewAnalysis = () => {
    if (analysis) {
      setPreviousAnalyses((prev) => [analysis, ...prev]);
    }
    setAnalysis(null);
    setError(null);
  };
  
  return (
    <div className="flex flex-col h-screen bg-white dark:bg-soma-950 text-soma-900 dark:text-soma-50">
      {/* Header */}
      <header className="border-b border-soma-200 dark:border-soma-800 p-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-soma-900 dark:text-soma-50">
              Soma Lens
            </h1>
            <p className="text-sm text-soma-600 dark:text-soma-400 mt-1">
              Technical Intelligence Workspace
            </p>
          </div>
          
          {/* Top right controls */}
          <div className="flex items-center gap-md">
            {onDarkModeToggle && (
              <button
                onClick={() => onDarkModeToggle(!darkMode)}
                className="p-md text-soma-600 dark:text-soma-400 hover:text-soma-900 dark:hover:text-soma-50 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {analysis ? (
          // Analysis view
          <div className="max-w-4xl mx-auto p-lg md:p-xl">
            <button
              onClick={handleNewAnalysis}
              className="text-sm text-soma-600 dark:text-soma-400 hover:text-soma-900 dark:hover:text-soma-50 mb-xl"
            >
              ← New analysis
            </button>
            
            {/* Error state */}
            {error && (
              <div className="mb-xl p-lg bg-amber-50 dark:bg-amber-900 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">{error}</p>
              </div>
            )}
            
            {/* Analysis */}
            <AnalysisReading analysis={analysis} darkMode={darkMode} />
            
            {/* Follow-up */}
            <div className="mt-3xl pt-3xl border-t border-soma-200 dark:border-soma-800">
              <FollowUpComposer
                analysis={analysis}
                onSubmitFollowUp={handleFollowUp}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          // Home/Composer view
          <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center p-lg md:p-xl">
            <div className="w-full max-w-2xl">
              {/* Headline */}
              <div className="mb-2xl text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-soma-900 dark:text-soma-50 mb-md">
                  See what you're working with.
                </h2>
                <p className="text-lg text-soma-700 dark:text-soma-300">
                  Understand complexity. Find problems. Make better decisions.
                </p>
              </div>
              
              {/* Error state */}
              {error && (
                <div className="mb-xl p-lg bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}
              
              {/* Composer */}
              <div className="mb-2xl">
                <Composer
                  onSubmit={handleAnalysisSubmit}
                  isLoading={isLoading}
                  onCancel={handleCancel}
                />
              </div>
              
              {/* Help text */}
              <div className="text-center text-sm text-soma-600 dark:text-soma-400 space-y-md">
                <p>Paste code • Paste errors • Paste documentation • Ask technical questions</p>
                <p className="text-xs">All analysis happens securely. No data is stored by default.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
