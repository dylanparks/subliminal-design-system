import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressCircle } from './ProgressCircle';

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ProgressCircle — rendering', () => {
  it('renders a progressbar role', () => {
    render(<ProgressCircle aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('uses the provided aria-label', () => {
    render(<ProgressCircle aria-label="Uploading file" />);
    expect(screen.getByRole('progressbar', { name: 'Uploading file' })).toBeInTheDocument();
  });

  it('defaults aria-label to "Loading" in indeterminate state', () => {
    render(<ProgressCircle />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBeInTheDocument();
  });
});

// ─── Indeterminate ────────────────────────────────────────────────────────────

describe('ProgressCircle — indeterminate', () => {
  it('omits aria-valuenow when indeterminate', () => {
    render(<ProgressCircle />);
    const el = screen.getByRole('progressbar');
    expect(el).not.toHaveAttribute('aria-valuenow');
  });

  it('omits aria-valuemin and aria-valuemax when indeterminate', () => {
    render(<ProgressCircle />);
    const el = screen.getByRole('progressbar');
    expect(el).not.toHaveAttribute('aria-valuemin');
    expect(el).not.toHaveAttribute('aria-valuemax');
  });

  it('sets aria-valuetext to "Loading…" when indeterminate', () => {
    render(<ProgressCircle />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Loading…');
  });

  it('applies the indeterminate modifier class', () => {
    render(<ProgressCircle />);
    expect(screen.getByRole('progressbar')).toHaveClass('sds-progress-circle--indeterminate');
  });

  it('is indeterminate when value is null', () => {
    render(<ProgressCircle value={null} />);
    expect(screen.getByRole('progressbar')).toHaveClass('sds-progress-circle--indeterminate');
  });
});

// ─── Determinate ──────────────────────────────────────────────────────────────

describe('ProgressCircle — determinate', () => {
  it('exposes aria-valuenow when a value is provided', () => {
    render(<ProgressCircle value={50} aria-label="50%" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('exposes aria-valuemin and aria-valuemax', () => {
    render(<ProgressCircle value={50} aria-label="50%" />);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuemin', '0');
    expect(el).toHaveAttribute('aria-valuemax', '100');
  });

  it('sets aria-valuetext as a percentage string', () => {
    render(<ProgressCircle value={75} aria-label="75%" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '75%');
  });

  it('does not apply the indeterminate class when a value is given', () => {
    render(<ProgressCircle value={50} aria-label="50%" />);
    expect(screen.getByRole('progressbar')).not.toHaveClass('sds-progress-circle--indeterminate');
  });

  it('clamps values below min to min', () => {
    render(<ProgressCircle value={-10} aria-label="clamped" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('clamps values above max to max', () => {
    render(<ProgressCircle value={150} aria-label="clamped" />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('respects custom min/max range', () => {
    render(<ProgressCircle value={5} min={0} max={10} aria-label="50%" />);
    const el = screen.getByRole('progressbar');
    expect(el).toHaveAttribute('aria-valuenow', '5');
    expect(el).toHaveAttribute('aria-valuemin', '0');
    expect(el).toHaveAttribute('aria-valuemax', '10');
    expect(el).toHaveAttribute('aria-valuetext', '50%');
  });
});

// ─── Size + variant ───────────────────────────────────────────────────────────

describe('ProgressCircle — size and variant', () => {
  it('applies the correct size modifier class', () => {
    render(<ProgressCircle size="large" aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).toHaveClass('sds-progress-circle--large');
  });

  it('applies the static modifier class when propStatic is true', () => {
    render(<ProgressCircle propStatic aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).toHaveClass('sds-progress-circle--static');
  });

  it('does not apply the static class by default', () => {
    render(<ProgressCircle aria-label="Loading" />);
    expect(screen.getByRole('progressbar')).not.toHaveClass('sds-progress-circle--static');
  });
});
