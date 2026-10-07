'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Image as ImageIcon, X, Link as LinkIcon, Sparkles, Check, Camera } from 'lucide-react';

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  helperText?: string;
  allowPresets?: boolean;
}

const SAMPLE_CONSTRUCTION_PHOTOS = [
  { label: 'Architectural Blueprint', url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Site Layout Grid', url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Excavation & Footings', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Reinforcement & Rebar', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80' },
  { label: 'RCC Slab & Columns', url: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Plumbing & Drainage', url: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Electrical Conduits', url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1200&q=80' },
  { label: 'Facade Finishing', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80' },
];

export default function ImageUploader({
  value,
  onChange,
  label = 'Upload Image / Blueprint / Site Photo',
  helperText = 'Drag and drop an image file, browse from your computer, or paste a URL.',
  allowPresets = true,
}: ImageUploaderProps) {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, etc.)');
      return;
    }

    setProcessing(true);
    setFileName(file.name);

    try {
      const dataUrl = await fileToDataUrl(file, 1600);
      onChange(dataUrl);
    } catch (err) {
      console.error('Failed to read image file:', err);
      alert('Could not process the selected image.');
    } finally {
      setProcessing(false);
    }
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }

  function handleUrlSubmit() {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setFileName(null);
    }
  }

  function handleClear() {
    onChange('');
    setFileName(null);
    setUrlInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-signal-slate">{label}</label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              mode === 'upload'
                ? 'bg-signal-teal/15 text-signal-teal border border-signal-teal/40'
                : 'text-signal-slate hover:text-paper'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
              mode === 'url'
                ? 'bg-signal-teal/15 text-signal-teal border border-signal-teal/40'
                : 'text-signal-slate hover:text-paper'
            }`}
          >
            Image URL
          </button>
        </div>
      </div>

      {/* Preview Container if value is present */}
      {value ? (
        <div className="relative overflow-hidden rounded-md border border-signal-teal/50 bg-navy-950 p-2">
          <div className="relative aspect-video w-full overflow-hidden rounded bg-navy-900 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Selected Preview"
              className="h-full w-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?auto=format&fit=crop&w=1200&q=80';
              }}
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-2 rounded-full bg-navy-950/90 p-1.5 text-signal-slate hover:bg-signal-coral hover:text-white transition-colors shadow-lg"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-signal-slate">
            <span className="flex items-center gap-1 text-signal-teal font-medium">
              <Check size={12} /> Image Ready to Upload
            </span>
            {fileName && <span className="truncate max-w-[200px] text-paper font-mono">{fileName}</span>}
          </div>
        </div>
      ) : (
        <>
          {mode === 'upload' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group flex flex-col items-center justify-center rounded-md border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-signal-teal bg-signal-teal/10 scale-[1.01]'
                  : 'border-blueprint-line bg-navy-800/60 hover:border-signal-teal/60 hover:bg-navy-800'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="mb-2 rounded-full bg-navy-900 p-2.5 text-signal-teal shadow-inner group-hover:scale-110 transition-transform">
                {processing ? <Sparkles size={20} className="animate-spin" /> : <UploadCloud size={20} />}
              </div>
              <p className="text-xs font-semibold text-paper">
                {processing ? 'Processing Image…' : 'Click to Browse or Drag & Drop'}
              </p>
              <p className="mt-0.5 text-[11px] text-signal-slate">{helperText}</p>
              <span className="mt-2 rounded bg-navy-900 px-2 py-0.5 text-[10px] text-signal-slate font-mono border border-blueprint-line/40">
                Supports JPG, PNG, WEBP, SVG (Auto-compressed)
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 rounded-md border border-blueprint-line bg-navy-800 px-3 py-2 text-xs text-paper focus:border-signal-teal focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleUrlSubmit}
                  className="rounded-md bg-signal-teal px-3 py-2 text-xs font-semibold text-navy-950 hover:opacity-90"
                >
                  Set URL
                </button>
              </div>
            </div>
          )}

          {/* Quick Presets for instant testing */}
          {allowPresets && (
            <div className="pt-1">
              <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-signal-slate">
                ⚡ Quick Construction Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_CONSTRUCTION_PHOTOS.map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => onChange(preset.url)}
                    className="rounded border border-blueprint-line/60 bg-navy-900 px-2 py-1 text-[10px] text-signal-slate transition-colors hover:border-signal-teal hover:text-paper"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Utility to resize & compress image in browser to keep payload lightweight
 */
function fileToDataUrl(file: File, maxDimension = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
