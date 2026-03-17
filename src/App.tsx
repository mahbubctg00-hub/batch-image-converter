/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { convertImageToSquare } from './services/gemini';
import { Loader2, Download, Sparkles, RefreshCw, X, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ImageItem {
  id: string;
  original: string;
  mimeType: string;
  generated: string | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error: string | null;
}

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const handleImagesSelect = (newFiles: { base64: string; mimeType: string; id: string }[]) => {
    const newImages: ImageItem[] = newFiles.map(file => ({
      id: file.id,
      original: file.base64,
      mimeType: file.mimeType,
      generated: null,
      status: 'pending',
      error: null
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleRemoveImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const handleClearAll = () => {
    setImages([]);
  };

  const processImage = async (image: ImageItem) => {
    if (image.status === 'completed' || image.status === 'processing') return;

    setImages(prev => prev.map(img => 
      img.id === image.id ? { ...img, status: 'processing', error: null } : img
    ));

    try {
      const result = await convertImageToSquare(image.original, image.mimeType);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'completed', generated: result } : img
      ));
    } catch (err) {
      console.error(err);
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'error', error: 'Failed to convert' } : img
      ));
    }
  };

  const handleConvertAll = async () => {
    setIsProcessingBatch(true);
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'error');
    
    // Process in batches of 3 to avoid rate limits
    const BATCH_SIZE = 3;
    for (let i = 0; i < pendingImages.length; i += BATCH_SIZE) {
      const batch = pendingImages.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(img => processImage(img)));
    }
    
    setIsProcessingBatch(false);
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `square-image-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    images.forEach((img, index) => {
      if (img.generated) {
        // Stagger downloads slightly
        setTimeout(() => handleDownload(img.generated!, index), index * 200);
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <RefreshCw size={20} />
            </div>
            <h1 className="text-xl font-semibold tracking-tight">Image Ratio Converter</h1>
          </div>
          <div className="text-sm text-slate-500 font-medium">
            Powered by Gemini 2.5
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Batch Convert to <span className="text-indigo-600">1:1 Square</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload multiple photos and let AI intelligently resize, crop, or expand them to fit a perfect square ratio.
          </p>
        </div>

        <div className="max-w-2xl mx-auto mb-12">
          <ImageUploader onImagesSelect={handleImagesSelect} />
        </div>

        {images.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-20 z-20">
              <div className="flex items-center gap-4">
                <span className="font-medium text-slate-700">{images.length} images selected</span>
                {isProcessingBatch && (
                  <span className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    <Loader2 size={14} className="animate-spin" />
                    Processing batch...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClearAll}
                  disabled={isProcessingBatch}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Clear all"
                >
                  <Trash2 size={20} />
                </button>
                <button
                  onClick={handleDownloadAll}
                  disabled={!images.some(img => img.generated)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                >
                  <Download size={16} />
                  Download All
                </button>
                <button
                  onClick={handleConvertAll}
                  disabled={isProcessingBatch || !images.some(img => img.status === 'pending' || img.status === 'error')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium text-sm"
                >
                  {isProcessingBatch ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  Convert Pending
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {images.map((img) => (
                  <motion.div
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-square bg-slate-100 border-b border-slate-100">
                      {img.status === 'completed' && img.generated ? (
                        <img 
                          src={img.generated} 
                          alt="Generated" 
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <img 
                          src={img.original} 
                          alt="Original" 
                          className={`w-full h-full object-contain transition-opacity duration-300 ${img.status === 'processing' ? 'opacity-50 blur-sm' : ''}`}
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Status Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {img.status === 'processing' && (
                          <div className="bg-white/90 backdrop-blur p-3 rounded-full shadow-lg">
                            <Loader2 size={24} className="animate-spin text-indigo-600" />
                          </div>
                        )}
                        {img.status === 'error' && (
                          <div className="bg-red-50/90 backdrop-blur p-3 rounded-full shadow-lg text-red-600">
                            <AlertCircle size={24} />
                          </div>
                        )}
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => handleRemoveImage(img.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-full transition-colors border border-slate-200/50"
                      >
                        <X size={16} />
                      </button>

                      {/* Type Badge */}
                      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] uppercase font-bold rounded-md">
                        {img.status === 'completed' ? '1:1 Result' : 'Original'}
                      </div>
                    </div>

                    <div className="p-4 flex items-center justify-between bg-white">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          {img.status === 'pending' && 'Ready to convert'}
                          {img.status === 'processing' && 'Processing...'}
                          {img.status === 'completed' && 'Done'}
                          {img.status === 'error' && 'Failed'}
                        </span>
                        {img.error && <span className="text-xs text-red-500 mt-0.5">{img.error}</span>}
                      </div>

                      <div className="flex gap-2">
                         {img.status === 'completed' && img.generated && (
                          <button
                            onClick={() => handleDownload(img.generated!, 0)}
                            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Download"
                          >
                            <Download size={18} />
                          </button>
                        )}
                        {img.status !== 'processing' && img.status !== 'completed' && (
                          <button
                            onClick={() => processImage(img)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Convert this image"
                          >
                            <Sparkles size={18} />
                          </button>
                        )}
                        {img.status === 'completed' && (
                           <div className="p-2 text-emerald-600">
                             <CheckCircle2 size={18} />
                           </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


