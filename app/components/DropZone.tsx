'use client';

import { useRef, useState, useEffect, DragEvent } from 'react';

interface DropZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  maxDurationSeconds?: number;
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

function isVideoFile(file: File) {
  return file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(file.name);
}

function matchesAccept(file: File, accept: string): boolean {
  return accept.split(',').some((pattern) => {
    const p = pattern.trim();
    if (p.startsWith('.')) return file.name.toLowerCase().endsWith(p.toLowerCase());
    if (p.endsWith('/*')) return file.type.startsWith(p.slice(0, -1));
    return file.type === p;
  });
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    video.preload = 'metadata';
    video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(0); };
    video.src = url;
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

interface PreviewItem {
  url: string;
  isVideo: boolean;
}

export default function DropZone({ accept, multiple, maxFiles, maxSizeMB, maxDurationSeconds, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const urlsRef = useRef<string[]>([]);

  const isImageDrop = accept?.includes('image');

  useEffect(() => {
    return () => { urlsRef.current.forEach((u) => u && URL.revokeObjectURL(u)); };
  }, []);

  const handleFiles = async (incoming: FileList | null) => {
    if (!incoming) return;
    setErrors([]);
    let arr = Array.from(incoming);

    // Extension / MIME validation (catches drag-and-drop of wrong file types)
    if (accept) {
      const rejected = arr.filter((f) => !matchesAccept(f, accept));
      if (rejected.length) {
        setErrors((e) => [...e, `${rejected.map((f) => f.name).join(', ')}: file type not allowed`]);
      }
      arr = arr.filter((f) => matchesAccept(f, accept));
    }

    // Size validation
    if (maxSizeMB) {
      const tooLarge = arr.filter((f) => f.size > maxSizeMB * 1024 * 1024);
      if (tooLarge.length) {
        setErrors((e) => [...e, ...tooLarge.map((f) => `${f.name}: exceeds ${maxSizeMB} MB limit`)]);
      }
      arr = arr.filter((f) => f.size <= maxSizeMB * 1024 * 1024);
    }

    // Duration validation for videos
    if (maxDurationSeconds) {
      const checks = await Promise.all(
        arr.map(async (f) => {
          if (!isVideoFile(f)) return { file: f, ok: true };
          const dur = await getVideoDuration(f);
          return { file: f, ok: dur <= maxDurationSeconds, dur };
        }),
      );
      const tooLong = checks.filter((c) => !c.ok);
      if (tooLong.length) {
        setErrors((e) => [
          ...e,
          ...tooLong.map((c) =>
            `${c.file.name}: video is ${formatDuration(c.dur ?? 0)}, max is ${formatDuration(maxDurationSeconds)}`,
          ),
        ]);
      }
      arr = checks.filter((c) => c.ok).map((c) => c.file);
    }

    // File count cap (after validation)
    const available = maxFiles != null ? maxFiles - files.length : Infinity;
    if (arr.length > available) {
      setErrors((e) => [...e, `Only ${available} more file${available !== 1 ? 's' : ''} allowed (max ${maxFiles})`]);
      arr = arr.slice(0, available);
    }
    if (arr.length === 0) return;

    // Show filenames immediately while HEIC conversion runs
    const initialItems: PreviewItem[] = arr.map((f) => ({
      url: isVideoFile(f) ? URL.createObjectURL(f) : (isHeicFile(f) ? '' : URL.createObjectURL(f)),
      isVideo: isVideoFile(f),
    }));
    urlsRef.current = [...urlsRef.current, ...initialItems.map((i) => i.url).filter(Boolean)];
    setPreviews((prev) => [...prev, ...initialItems]);
    setFiles((prev) => [...prev, ...arr]);

    // Convert HEIC → JPEG
    const converted = await Promise.all(
      arr.map(async (f, i) => {
        if (isVideoFile(f)) return { file: f, preview: initialItems[i].url, isVideo: true };
        if (!isHeicFile(f)) return { file: f, preview: initialItems[i].url, isVideo: false };
        try {
          const heic2any = (await import('heic2any')).default;
          const result = await heic2any({ blob: f, toType: 'image/jpeg', quality: 0.8 });
          const blob = Array.isArray(result) ? result[0] : result;
          const newName = f.name.replace(/\.(heic|heif)$/i, '.jpg');
          const jpegFile = new File([blob], newName, { type: 'image/jpeg' });
          const preview = URL.createObjectURL(blob);
          return { file: jpegFile, preview, isVideo: false };
        } catch {
          return { file: f, preview: '', isVideo: false };
        }
      }),
    );

    const convertedFiles = converted.map((c) => c.file);
    const convertedPreviews = converted.map((c) => ({ url: c.preview, isVideo: c.isVideo }));

    setFiles((prev) => {
      const base = prev.slice(0, prev.length - arr.length);
      return [...base, ...convertedFiles];
    });
    setPreviews((prev) => {
      const base = prev.slice(0, prev.length - arr.length);
      return [...base, ...convertedPreviews];
    });

    const allFiles = [...files, ...convertedFiles];
    onFiles?.(allFiles);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = previews[idx]?.url;
    if (url) URL.revokeObjectURL(url);
    const updatedFiles = files.filter((_, i) => i !== idx);
    const updatedPreviews = previews.filter((_, i) => i !== idx);
    urlsRef.current = updatedPreviews.map((p) => p.url).filter(Boolean);
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    onFiles?.(updatedFiles);
  };

  const canAddMore = maxFiles == null || files.length < maxFiles;

  return (
    <div>
      <div className={`dropzone${isDragOver ? ' dropzone-over' : ''}`}>
        {previews.length > 0 ? (
          <div className="dropzone-previews" onClick={(e) => e.stopPropagation()}>
            {previews.map((item, idx) => (
              <div key={idx} className="dropzone-preview-item">
                {item.isVideo ? (
                  item.url ? (
                    <video src={item.url} className="dropzone-preview-img" muted playsInline />
                  ) : (
                    <div className="dropzone-preview-placeholder">🎥 {files[idx]?.name}</div>
                  )
                ) : item.url ? (
                  <img src={item.url} alt={files[idx]?.name} className="dropzone-preview-img" />
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
            {canAddMore && (
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

      {errors.length > 0 && (
        <div className="dropzone-errors">
          {errors.map((err, i) => (
            <p key={i} className="dropzone-error">{err}</p>
          ))}
        </div>
      )}
    </div>
  );
}
