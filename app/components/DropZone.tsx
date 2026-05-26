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

async function toPreviewUrl(file: File): Promise<string> {
  if (isHeicFile(file)) {
    try {
      const heic2any = (await import('heic2any')).default;
      const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
      const blob = Array.isArray(result) ? result[0] : result;
      return URL.createObjectURL(blob);
    } catch {
      return '';
    }
  }
  return URL.createObjectURL(file);
}

export default function DropZone({ accept, multiple, maxFiles, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const isImage = accept?.includes('image');

  useEffect(() => {
    if (!isImage || files.length === 0) {
      setPreviews([]);
      return;
    }

    let cancelled = false;
    const generated: string[] = [];

    Promise.all(files.map(toPreviewUrl)).then((urls) => {
      if (cancelled) {
        urls.forEach((u) => u && URL.revokeObjectURL(u));
        return;
      }
      generated.push(...urls);
      setPreviews(urls);
    });

    return () => {
      cancelled = true;
      generated.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [files, isImage]);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming).slice(0, maxFiles ?? Infinity);
    setFiles(arr);
    onFiles?.(arr);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = files.filter((_, i) => i !== idx);
    setFiles(updated);
    onFiles?.(updated);
  };

  return (
    <div className={`dropzone${isDragOver ? ' dropzone-over' : ''}`}>
      {previews.length > 0 && (
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
      )}

      {previews.length === 0 && (
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
