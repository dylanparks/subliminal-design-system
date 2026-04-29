import './FileUploadItem.css';
import type { FileStatus } from './FileUpload.types';
import { ProgressBar } from '../../DataDisplay/ProgressBar/ProgressBar';
import { Button } from '../../Actions/Button/Button';
import { CloseIcon, ErrorIcon } from '../../../icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FileUploadItemProps {
  /** The file being displayed */
  file: File;
  /** Upload progress 0–100. Renders ProgressBar when uploading. */
  progress?: number;
  /** @default 'idle' */
  status?: FileStatus;
  /** Error message shown below the file name when `status === 'error'` */
  errorMessage?: string;
  /** Called when the remove button is clicked */
  onRemove?: (file: File) => void;
  /** Show a Material Symbols Rounded icon representing the file MIME type */
  showFileTypeIcon?: boolean;
  /** Additional className forwarded to the root element */
  className?: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeToIcon(mimeType: string): string {
  if (mimeType.startsWith('image/'))  return 'image';
  if (mimeType.startsWith('video/'))  return 'video_file';
  if (mimeType.startsWith('audio/'))  return 'audio_file';
  if (mimeType === 'application/pdf') return 'picture_as_pdf';
  if (mimeType === 'application/zip' || mimeType === 'application/x-zip-compressed') return 'folder_zip';
  if (mimeType.startsWith('text/'))   return 'description';
  if (mimeType.includes('word'))      return 'article';
  if (mimeType.includes('sheet') || mimeType.includes('excel') || mimeType.includes('csv')) return 'table';
  return 'draft';
}

// ─── FileUploadItem ───────────────────────────────────────────────────────────

export function FileUploadItem({
  file,
  progress,
  status           = 'idle',
  errorMessage,
  onRemove,
  showFileTypeIcon = false,
  className,
}: FileUploadItemProps) {
  const isError   = status === 'error';
  const isSuccess = status === 'success';

  const rootClasses = [
    'sds-file-upload-item',
    isError   && 'sds-file-upload-item--error',
    isSuccess && 'sds-file-upload-item--success',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClasses}>
      {showFileTypeIcon && (
        <span
          className="material-symbols-rounded sds-file-upload-item__type-icon"
          aria-hidden="true"
        >
          {mimeToIcon(file.type)}
        </span>
      )}

      <div className="sds-file-upload-item__body">
        <div className="sds-file-upload-item__label-group">
          <span className="sds-file-upload-item__name" title={file.name}>{file.name}</span>
          <span className="sds-file-upload-item__size">{formatFileSize(file.size)}</span>
        </div>

        {progress !== undefined && !isError && !isSuccess && (
          <ProgressBar value={progress} aria-label={file.name} />
        )}

        {isError && errorMessage && (
          <div className="sds-file-upload-item__error-message">
            <ErrorIcon size={14} />
            <span className="sds-file-upload-item__error-text">{errorMessage}</span>
          </div>
        )}
      </div>

      {onRemove && (
        <Button
          variant="secondary"
          fillStyle="ghost"
          size="small"
          aria-label="Remove file"
          icon={<CloseIcon size={16} />}
          onClick={() => onRemove(file)}
        />
      )}
    </div>
  );
}
