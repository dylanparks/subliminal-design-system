import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { FileUploadItem } from './FileUploadItem';
import type { FileStatus } from './FileUpload.types';

const meta: Meta<typeof FileUpload> = {
  component: FileUpload,
  title: 'Fields/FileUpload',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Drop zone for file selection. Pair with `FileUploadItem` to show upload progress and file status. Supports click-to-browse, drag-and-drop, MIME type filtering, size limits, and multi-file selection.',
      },
    },
  },
  argTypes: {
    accept:       { control: 'text' },
    multiple:     { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    maxSize:      { control: 'number' },
    minSize:      { control: 'number' },
    maxFiles:     { control: 'number' },
    disabled:     { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    error:        { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    errorMessage: { control: 'text' },
    hint:         { control: 'text' },
    onDropAccepted: { table: { disable: true } },
    onDropRejected: { table: { disable: true } },
    children:       { table: { disable: true } },
  },
  args: {
    multiple: false,
    disabled: false,
    error:    false,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 480 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const DropZone: Story = {};

export const WithHint: Story = {
  args: { hint: 'Accepted formats: PNG, JPG, PDF — max 10 MB each' },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const ZoneError: Story = {
  args: {
    error:        true,
    errorMessage: 'File type not supported. Please upload a PNG or JPG.',
  },
};

// ─── Static FileUploadItem states ────────────────────────────────────────────

const mockFile = (name: string, size: number, type: string) =>
  new File(['x'.repeat(size)], name, { type });

export const FileList: Story = {
  render: () => {
    const items: Array<{
      file: File;
      progress?: number;
      status: FileStatus;
      errorMessage?: string;
    }> = [
      { file: mockFile('design-spec.pdf', 1_240_000, 'application/pdf'),   status: 'success' },
      { file: mockFile('hero-image.png',   3_500_000, 'image/png'),         status: 'uploading', progress: 62 },
      { file: mockFile('data-export.csv',    840_000, 'text/csv'),          status: 'error', errorMessage: 'Upload failed. File may be corrupted.' },
      { file: mockFile('presentation.pptx', 9_100_000, 'application/vnd.openxmlformats-officedocument.presentationml.presentation'), status: 'idle' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {items.map((item) => (
          <FileUploadItem
            key={item.file.name}
            file={item.file}
            progress={item.progress}
            status={item.status}
            errorMessage={item.errorMessage}
            showFileTypeIcon
          />
        ))}
      </div>
    );
  },
};

// ─── Live wired drop zone + file list ────────────────────────────────────────

interface ManagedFile {
  file:         File;
  status:       FileStatus;
  progress:     number;
  errorMessage?: string;
}

export const FullFlow: Story = {
  render: () => {
    const [files, setFiles] = useState<ManagedFile[]>([]);

    const handleDropAccepted = (accepted: File[]) => {
      const newEntries: ManagedFile[] = accepted.map((f) => ({
        file:     f,
        status:   'uploading',
        progress: 0,
      }));
      setFiles((prev) => [...prev, ...newEntries]);

      // Simulate upload progress for each file.
      newEntries.forEach(({ file }) => {
        let pct = 0;
        const tick = setInterval(() => {
          pct = Math.min(pct + Math.floor(Math.random() * 15) + 5, 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? { ...f, progress: pct, status: pct === 100 ? 'success' : 'uploading' }
                : f,
            ),
          );
          if (pct === 100) clearInterval(tick);
        }, 300);
      });
    };

    const handleDropRejected = (rejections: Parameters<NonNullable<typeof meta.args.onDropRejected>>[0]) => {
      const rejected: ManagedFile[] = rejections.map(({ file, errors }) => ({
        file,
        status:       'error',
        progress:     0,
        errorMessage: errors[0]?.message ?? 'Upload rejected.',
      }));
      setFiles((prev) => [...prev, ...rejected]);
    };

    const handleRemove = (file: File) => {
      setFiles((prev) => prev.filter((f) => f.file !== file));
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <FileUpload
          multiple
          hint="PNG, JPG, PDF — max 5 MB"
          maxSize={5 * 1024 * 1024}
          onDropAccepted={handleDropAccepted}
          onDropRejected={handleDropRejected}
        />
        {files.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {files.map((f) => (
              <FileUploadItem
                key={f.file.name + f.file.size}
                file={f.file}
                progress={f.status === 'uploading' ? f.progress : undefined}
                status={f.status}
                errorMessage={f.errorMessage}
                showFileTypeIcon
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </div>
    );
  },
};
