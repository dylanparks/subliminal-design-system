// ─── FileUpload Types ─────────────────────────────────────────────────────────

export type FileStatus = 'idle' | 'uploading' | 'success' | 'error';

export type FileErrorCode =
  | 'file-too-large'
  | 'file-too-small'
  | 'too-many-files'
  | 'file-invalid-type';

export interface FileError {
  code:    FileErrorCode;
  message: string;
}

export interface FileRejection {
  file:   File;
  errors: FileError[];
}
