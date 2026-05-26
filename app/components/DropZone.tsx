'use client';

import { useRef, useState, useEffect, DragEvent } from 'react';

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFiles?: (files: File[]) => void;
}

function isHeicFile(file: File) {
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif')
  );
}

export default function DropZone({ accept, multiple, maxFiles, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const urlsRef = useRef<string[]>([]);

  const isImage = accept?.includes('image');

  // Revoke all object URLs on unmount
  useEffect(() => {
    return () => { urlsRef.current.forEach((u) => u && URL.revokeObjectURL(u)); };
  }, []);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).slice(0, maxFiles ?? Infinity);
    setFiles(arr);
    onFiles?.(arr);

    if (!isImage) return;

    // Revoke previous preview URLs
    urlsRef.current.forEach((u) => u && URL.revokeObjectURL(u));

    // Synchronous previews for standard image formats
    const urls: string[] = arr.map((f) => isHeicFile(f) ? '' : URL.createObjectURL(f));
    urlsRef.current = urls.filter(Boolean);
    setPreviews([...urls]);

    // Async conversion for HEIC files — updates individual slots
    arr.forEach(async (f, i) => {
      if (!isHeicFile(f)) return;
      try {
        const heic2any = (await import('heic2any')).default;
        const result = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.8 });
        const blob = Array.isArray(result) ? result[0] : result;
        const url = URL.createObjectURL(blob);
        urlsRef.current.push(url);
        setPreviews((prev) => { const next = [...prev]; next[i] = url; return next; });
      } catch {
        // leave slot as empty string — will render filename fallback
      }
    });
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = previews[idx];
    if (url) URL.revokeObjectURL(url);
    const updatedFiles = files.filter((_, i) => i !== idx);
    const updatedPreviews = previews.filter((_, i) => i !== idx);
    urlsRef.current = updatedPreviews.filter(Boolean);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onFiles?.(updatedFiles);
  };

  return (
    <div className={`dropzone${isDragOver ? ' dropzone-over' : ''}`}>
      {previews.length > 0 ? (
        <div className="dropzone-previews" onClick={(e) => e.stopPropagation()}>
          {previews.map((url, idx) => (
            <div key={idx} className="dropzone-preview-item">
              {url ? (
                <img src={url} alt={files[idx]?.name} className="dropzone-preview-img" />
              ) : (
                <div className="dropzone-preview-placeholder">{files[idx]?.name ?? '📷'}</div>
              )}
              <button
                type="button"
                className="dropzone-preview-remove"
                onClick={(e) => removeFile(idx, e)}
                aria-label="Remove"
              >×</button>
            </div>
          ))}
          {(maxFiles == null || files.length < maxFiles) && (
            <button
              type="button"
              className="dropzone-add-more"
              onClick={() => inputRef.current?.click()}
              aria-label="Add more"
            >+</button>
          )}
        </div>
      ) : (
        <div
          className="dropzone-empty"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {files.length > 0 ? (
            <>
              <span className="dropzone-plus dropzone-plus-done">✓</span>
              <span className="dropzone-hint dropzone-hint-done">
                {files.length === 1 ? files[0].name : `${files.length} files selected`}
              </span>
            </>
          ) : (
            <>
              <span className="dropzone-plus">+</span>
              <span className="dropzone-hint">drag files here</span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
