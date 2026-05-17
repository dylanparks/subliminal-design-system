import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Divider } from './Divider';

describe('Divider', () => {
  it('renders a separator element', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('defaults to horizontal aria-orientation', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'horizontal');
  });

  it('sets aria-orientation to vertical', () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });

  it('applies the vertical modifier class', () => {
    render(<Divider orientation="vertical" />);
    expect(screen.getByRole('separator')).toHaveClass('sds-divider--vertical');
  });

  it('does not apply the vertical class when horizontal', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).not.toHaveClass('sds-divider--vertical');
  });

  it('applies the static modifier class when propStatic is true', () => {
    render(<Divider propStatic />);
    expect(screen.getByRole('separator')).toHaveClass('sds-divider--static');
  });

  it('does not apply the static class by default', () => {
    render(<Divider />);
    expect(screen.getByRole('separator')).not.toHaveClass('sds-divider--static');
  });

  it('forwards a custom className', () => {
    render(<Divider className="my-divider" />);
    expect(screen.getByRole('separator')).toHaveClass('my-divider');
  });
});
