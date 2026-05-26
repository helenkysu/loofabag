'use client';

import { useRef, useState, useEffect, DragEvent } from 'react';

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFiles?: (files: File[]) => void;
}

export default function DropZone({ accept, multiple, maxFiles, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const isImage = accept?.includes('image');

  useEffect(() => {
    if (!isImage || files.length === 0) return;
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
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
              <img src={url} alt={files[idx]?.name} className="dropzone-preview-img" />
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
