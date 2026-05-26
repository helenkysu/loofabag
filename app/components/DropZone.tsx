'use client';

import { useRef, useState, DragEvent } from 'react';

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onFiles?: (files: File[]) => void;
}

export default function DropZone({ accept, multiple, maxFiles, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

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

  return (
    <div
      className={`dropzone${isDragOver ? ' dropzone-over' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
        onChange={(e) => handleFiles(e.target.files)}
      />
      {files.length === 0 ? (
        <>
          <span className="dropzone-plus">+</span>
          <span className="dropzone-hint">drag files here</span>
        </>
      ) : (
        <>
          <span className="dropzone-plus dropzone-plus-done">✓</span>
          <span className="dropzone-hint dropzone-hint-done">
            {files.length === 1 ? files[0].name : `${files.length} files selected`}
          </span>
        </>
      )}
    </div>
  );
}
