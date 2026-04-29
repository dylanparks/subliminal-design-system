import { type ReactNode, useRef, useCallback, useState } from 'react';
import './FileUpload.css';
import type { FileRejection, FileError, FileErrorCode } from './FileUpload.types';
import { Button } from '../../Actions/Button/Button';
import { UploadIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadProps {
  /** Accepted MIME types or file extensions (e.g. `"image/*,.pdf"`) */
  accept?: string;
  /** Allow selecting more than one file */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Minimum file size in bytes */
  minSize?: number;
  /** Maximum number of files accepted */
  maxFiles?: number;
  /** Prevents interaction */
  disabled?: boolean;
  /** Error state — red border */
  error?: boolean;
  /** Error message shown below the drop zone */
  errorMessage?: string;
  /** Hint text shown below the drop zone */
  hint?: string;
  /** Called with files that passed all validation rules */
  onDropAccepted?: (files: File[]) => void;
  /** Called with files that failed validation, each paired with their errors */
  onDropRejected?: (rejections: FileRejection[]) => void;
  /** Drop zone content — defaults to built-in prompt if omitted */
  children?: ReactNode;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFile(
  file: File,
  accept: string | undefined,
  minSize: number | undefined,
  maxSize: number | undefined,
): FileError[] {
  const errors: FileError[] = [];

  if (accept) {
    const accepted = accept.split(',').map((s) => s.trim());
    const matched  = accepted.some((rule) => {
      if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule.toLowerCase());
      if (rule.endsWith('/*')) return file.type.startsWith(rule.slice(0, -1));
      return file.type === rule;
    });
    if (!matched) {
      errors.push({ code: 'file-invalid-type' as FileErrorCode, message: 'File type not accepted.' });
    }
  }

  if (maxSize !== undefined && file.size > maxSize) {
    errors.push({ code: 'file-too-large' as FileErrorCode, message: `File exceeds ${maxSize} bytes.` });
  }

  if (minSize !== undefined && file.size < minSize) {
    errors.push({ code: 'file-too-small' as FileErrorCode, message: `File is smaller than ${minSize} bytes.` });
  }

  return errors;
}

// ─── FileUpload ───────────────────────────────────────────────────────────────

export function FileUpload({
  accept,
  multiple  = false,
  maxSize,
  minSize,
  maxFiles,
  disabled  = false,
  error     = false,
  errorMessage,
  hint,
  onDropAccepted,
  onDropRejected,
  children,
}: FileUploadProps) {
  const inputRef   = useRef<HTMLInputElement>(null);
  // Drag counter reliably tracks nested dragenter/dragleave pairs.
  const dragCount  = useRef(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const processFiles = useCallback((rawFiles: File[]) => {
    const accepted:    File[]          = [];
    const rejections:  FileRejection[] = [];

    let files = rawFiles;
    if (maxFiles !== undefined && files.length > maxFiles) {
      const excess = files.slice(maxFiles);
      excess.forEach((f) => rejections.push({
        file:   f,
        errors: [{ code: 'too-many-files', message: `Exceeds maximum of ${maxFiles} file(s).` }],
      }));
      files = files.slice(0, maxFiles);
    }

    files.forEach((file) => {
      const errors = validateFile(file, accept, minSize, maxSize);
      if (errors.length) {
        rejections.push({ file, errors });
      } else {
        accepted.push(file);
      }
    });

    if (accepted.length)    onDropAccepted?.(accepted);
    if (rejections.length)  onDropRejected?.(rejections);
  }, [accept, minSize, maxSize, maxFiles, onDropAccepted, onDropRejected]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCount.current += 1;
    if (dragCount.current === 1) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCount.current -= 1;
    if (dragCount.current === 0) setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCount.current = 0;
    setIsDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, [disabled, processFiles]);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    processFiles(files);
    // Reset so the same file can be re-selected.
    e.target.value = '';
  }, [processFiles]);

  const zoneClasses = [
    'sds-file-upload__zone',
    isDragOver             && 'sds-file-upload__zone--drag-over',
    disabled               && 'sds-file-upload__zone--disabled',
    error                  && 'sds-file-upload__zone--error',
  ]
    .filter(Boolean)
    .join(' ');

  const showFooter = !!(hint || errorMessage);

  return (
    <div className={['sds-file-upload', disabled && 'sds-file-upload--disabled'].filter(Boolean).join(' ')}>
      <div
        className={zoneClasses}
        aria-disabled={disabled}
        data-drag-over={isDragOver || undefined}
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="sds-file-upload__input"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          tabIndex={-1}
          aria-hidden="true"
          onChange={handleInputChange}
        />

        {children ?? (
          <div className="sds-file-upload__prompt">
            <div className="sds-file-upload__prompt-upload-section">
              <UploadIcon size={36} className="sds-file-upload__prompt-icon" />
              <span className="sds-file-upload__prompt-title">Drag & Drop your file</span>
            </div>
            <Button
              variant="primary"
              fillStyle="filled"
              size="xsmall"
              label="Upload"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
            />
          </div>
        )}
      </div>

      {showFooter && (
        <div className="sds-file-upload__footer">
          {errorMessage && <span className="sds-file-upload__error-message">{errorMessage}</span>}
          {!errorMessage && hint && <span className="sds-file-upload__hint">{hint}</span>}
        </div>
      )}
    </div>
  );
}
