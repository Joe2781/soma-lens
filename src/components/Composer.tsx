'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Lens } from '@/types/lens';

const ROTATING_EXAMPLES = [
  'Why is this API returning 500?',
  'Explain this research paper',
  'Analyze this system architecture',
  'Find weaknesses in this design',
  'What does this code actually do?',
  'Explain this biological mechanism',
];

const LENS_OPTIONS: Array<{ id: Lens; label: string; description: string }> = [
  { id: 'automatic', label: 'Automatic', description: 'Choose the best approach' },
  { id: 'explain', label: 'Explain', description: 'Make it understandable' },
  { id: 'debug', label: 'Debug', description: 'Trace the problem' },
  { id: 'research', label: 'Research', description: 'Map evidence & methodology' },
  { id: 'architecture', label: 'Architecture', description: 'Understand systems' },
  { id: 'risk', label: 'Risk', description: 'Surface failure modes' },
  { id: 'summarize', label: 'Summarize', description: 'Compress & preserve signal' },
];

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  preview?: string;
}

interface ComposerProps {
  onSubmit: (input: string, lens: Lens, attachments?: Attachment[]) => void;
  isLoading?: boolean;
  onCancel?: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  onSubmit,
  isLoading = false,
  onCancel,
}) => {
  const [input, setInput] = useState('');
  const [selectedLens, setSelectedLens] = useState<Lens>('automatic');
  const [exampleIndex, setExampleIndex] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLensSelector, setShowLensSelector] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  // Rotate examples
  useEffect(() => {
    const interval = setInterval(() => {
      setExampleIndex((i) => (i + 1) % ROTATING_EXAMPLES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);
  
  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 400);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [input]);
  
  // Handle drag and drop
  useEffect(() => {
    const dropZone = dropZoneRef.current;
    if (!dropZone) return;
    
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('border-soma-600', 'bg-soma-50');
    };
    
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-soma-600', 'bg-soma-50');
    };
    
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('border-soma-600', 'bg-soma-50');
      
      const files = e.dataTransfer?.files;
      if (files) {
        handleFilesSelected(files);
      }
    };
    
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleDrop);
    
    return () => {
      dropZone.removeEventListener('dragover', handleDragOver);
      dropZone.removeEventListener('dragleave', handleDragLeave);
      dropZone.removeEventListener('drop', handleDrop);
    };
  }, []);
  
  const handleFilesSelected = (files: FileList) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['text/plain', 'text/code', 'image/jpeg', 'image/png', 'application/pdf'];
    
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) {
        console.warn(`File too large: ${file.name}`);
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.warn(`File type not supported: ${file.type}`);
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const attachment: Attachment = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          preview: e.target?.result as string,
        };
        setAttachments((prev) => [...prev, attachment]);
      };
      
      if (file.type.startsWith('text/')) {
        reader.readAsText(file);
      } else if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      }
    });
  };
  
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const files: File[] = [];
    Array.from(items).forEach((item) => {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    });
    
    if (files.length > 0) {
      e.preventDefault();
      handleFilesSelected({
        length: files.length,
        [Symbol.iterator]: () => files[Symbol.iterator](),
      } as any);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to submit
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        handleSubmit();
      }
    }
    // Shift + Enter for newline (default behavior)
  };
  
  const handleSubmit = useCallback(() => {
    if (input.trim() && !isLoading) {
      onSubmit(input, selectedLens, attachments.length > 0 ? attachments : undefined);
    }
  }, [input, selectedLens, attachments, isLoading, onSubmit]);
  
  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };
  
  return (
    <div className="w-full">
      {/* Lens selector - compact */}
      <div className="mb-lg" role="group" aria-label="Analysis lens">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-soma-700 dark:text-soma-300">
            Lens
          </label>
          <button
            onClick={() => setShowLensSelector(!showLensSelector)}
            className="text-xs text-soma-600 dark:text-soma-400 hover:text-soma-900 dark:hover:text-soma-50 transition-colors"
          >
            {showLensSelector ? 'Hide' : 'Show all'}
          </button>
        </div>
        
        {/* Compact selector - always show selected + compact options */}
        <div className="mt-md flex flex-wrap gap-md">
          {/* Show selected prominently */}
          <div
            className="px-lg py-md bg-soma-600 text-white rounded-md text-sm font-semibold"
            role="status"
            aria-live="polite"
          >
            {LENS_OPTIONS.find((l) => l.id === selectedLens)?.label}
          </div>
          
          {/* Show other options if expanded or as quick access */}
          {showLensSelector && (
            <div className="w-full grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-md">
              {LENS_OPTIONS.filter((l) => l.id !== selectedLens).map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  onClick={() => {
                    setSelectedLens(lens.id);
                    setShowLensSelector(false);
                  }}
                  className="px-md py-sm rounded-md text-xs font-medium transition-all bg-soma-100 text-soma-900 hover:bg-soma-200 dark:bg-soma-800 dark:text-soma-50 dark:hover:bg-soma-700 focus:outline-none focus:ring-2 focus:ring-soma-500"
                  aria-label={`Use ${lens.label} lens: ${lens.description}`}
                >
                  {lens.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main input area */}
      <div
        ref={dropZoneRef}
        className={`relative border-2 rounded-lg transition-all ${
          isFocused
            ? 'border-soma-600 bg-white dark:bg-soma-900'
            : 'border-soma-300 dark:border-soma-700 bg-soma-50 dark:bg-soma-900'
        }`}
        role="region"
        aria-label="Analysis input"
      >
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={ROTATING_EXAMPLES[exampleIndex]}
          className="w-full resize-none border-0 bg-transparent text-soma-900 dark:text-soma-50 placeholder-soma-500 dark:placeholder-soma-400 focus:outline-none p-lg font-normal leading-relaxed"
          rows={3}
          disabled={isLoading}
          aria-label="Technical content to analyze"
          aria-describedby="composer-help"
          spellCheck="true"
        />
        
        {/* Character count */}
        {input.length > 0 && (
          <div className="absolute bottom-lg right-lg text-xs text-soma-600 dark:text-soma-400 pointer-events-none">
            {input.length} chars
          </div>
        )}
      </div>
      
      {/* Help text */}
      <p
        id="composer-help"
        className="text-xs text-soma-600 dark:text-soma-400 mt-md"
      >
        Paste code, documentation, errors, or technical questions. Cmd/Ctrl+Enter to submit.
      </p>
      
      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mt-lg space-y-md">
          <p className="text-sm font-semibold text-soma-700 dark:text-soma-300">
            Attachments
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-start gap-md p-md bg-soma-50 dark:bg-soma-800 rounded-md border border-soma-200 dark:border-soma-700"
              >
                {/* Preview */}
                {attachment.type.startsWith('image/') && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.name}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-soma-200 dark:bg-soma-700 rounded flex items-center justify-center flex-shrink-0 text-xs font-bold text-soma-700 dark:text-soma-300">
                    {attachment.name.split('.').pop()?.slice(0, 3).toUpperCase()}
                  </div>
                )}
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-soma-900 dark:text-soma-50 truncate">
                    {attachment.name}
                  </p>
                  <p className="text-xs text-soma-600 dark:text-soma-400">
                    {formatFileSize(attachment.size)}
                  </p>
                </div>
                
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id)}
                  className="flex-shrink-0 text-soma-600 dark:text-soma-400 hover:text-soma-900 dark:hover:text-soma-50 transition-colors"
                  aria-label={`Remove ${attachment.name}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-md mt-lg flex-wrap">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading}
          className="button-primary flex items-center gap-sm"
          aria-label={isLoading ? 'Analyzing...' : 'Submit analysis'}
        >
          {isLoading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing
            </>
          ) : (
            <>
              Analyze
              <span className="text-xs">↑</span>
            </>
          )}
        </button>
        
        {isLoading && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="button-secondary"
            aria-label="Stop analysis"
          >
            Stop
          </button>
        )}
        
        {input.trim() && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setInput('');
              setAttachments([]);
            }}
            className="button-secondary"
            aria-label="Clear input"
          >
            Clear
          </button>
        )}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="button-secondary"
          disabled={isLoading}
          aria-label="Attach file"
        >
          Attach
        </button>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            if (e.target.files) {
              handleFilesSelected(e.target.files);
            }
          }}
          accept=".txt,.code,.jpg,.png,.pdf"
        />
      </div>
    </div>
  );
};
