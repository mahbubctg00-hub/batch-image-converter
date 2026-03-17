import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageUploaderProps {
  onImagesSelect: (files: { base64: string; mimeType: string; id: string }[]) => void;
}

export function ImageUploader({ onImagesSelect }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFiles = useCallback((fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const validFiles: File[] = [];
    let hasInvalidType = false;
    let hasInvalidSize = false;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        hasInvalidType = true;
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        hasInvalidSize = true;
        return;
      }
      validFiles.push(file);
    });

    if (hasInvalidType) {
      setError('Some files were skipped (must be image files).');
    } else if (hasInvalidSize) {
      setError('Some files were skipped (must be < 5MB).');
    } else {
      setError(null);
    }

    if (validFiles.length === 0) return;

    const processedFiles: { base64: string; mimeType: string; id: string }[] = [];
    let processedCount = 0;

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        processedFiles.push({
          base64: result,
          mimeType: file.type,
          id: crypto.randomUUID()
        });
        processedCount++;

        if (processedCount === validFiles.length) {
          onImagesSelect(processedFiles);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [onImagesSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  return (
    <div className="w-full">
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm"
          >
            <AlertCircle size={16} />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 ease-in-out cursor-pointer
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
          }
        `}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-medium text-slate-900">Drop images here</p>
            <p className="text-sm text-slate-500 mt-1">or click to browse</p>
          </div>
          <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP (Batch supported)</p>
        </div>
      </div>
    </div>
  );
}

