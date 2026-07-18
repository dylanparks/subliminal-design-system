import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Accordion, AccordionItem, AccordionTrigger, AccordionPanel } from './Accordion';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BasicAccordion({
  multiple = false,
  defaultValue,
  value,
  onChange,
}: {
  multiple?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onChange?: (v: string[]) => void;
}) {
  return (
    <Accordion multiple={multiple} defaultValue={defaultValue} value={value} onChange={onChange}>
      <AccordionItem value="a">
        <AccordionTrigger>Alpha</AccordionTrigger>
        <AccordionPanel>Panel A</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Beta</AccordionTrigger>
        <AccordionPanel>Panel B</AccordionPanel>
      </AccordionItem>
      <AccordionItem value="c" disabled>
        <AccordionTrigger>Gamma</AccordionTrigger>
        <AccordionPanel>Panel C</AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Accordion — rendering', () => {
  it('renders all triggers', () => {
    render(<BasicAccordion />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('renders all panels (collapsed by default)', () => {
    render(<BasicAccordion />);
    expect(screen.getByRole('region', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Beta' })).toBeInTheDocument();
  });

  it('opens the defaultValue item on first render', () => {
    render(<BasicAccordion defaultValue="a" />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'false');
  });
});

// ─── Toggle behaviour ─────────────────────────────────────────────────────────

describe('Accordion — toggle', () => {
  it('opens an item on click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes an open item on second click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion defaultValue="a" />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the previous item when opening a new one (single mode)', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion defaultValue="a" />);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps multiple items open when multiple=true', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion multiple defaultValue="a" />);
    await user.click(screen.getByRole('button', { name: 'Beta' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onChange with updated open values', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BasicAccordion onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenCalledWith(['a']);
  });
});

// ─── Controlled ───────────────────────────────────────────────────────────────

describe('Accordion — controlled', () => {
  it('reflects the controlled value', () => {
    render(<BasicAccordion value="b" />);
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not change open state without external update', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion value="b" onChange={() => {}} />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'false');
  });
});

// ─── Disabled ─────────────────────────────────────────────────────────────────

describe('Accordion — disabled', () => {
  it('disables the trigger button', () => {
    render(<BasicAccordion />);
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeDisabled();
  });

  it('does not open a disabled item on click', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    await user.click(screen.getByRole('button', { name: 'Gamma' }));
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-expanded', 'false');
  });
});

// ─── Accessibility ────────────────────────────────────────────────────────────

describe('Accordion — accessibility', () => {
  it('connects trigger to panel via aria-controls', () => {
    render(<BasicAccordion />);
    const trigger = screen.getByRole('button', { name: 'Alpha' });
    const panelId = trigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId!)).toBeInTheDocument();
  });

  it('panel has role=region and is labelled by trigger', () => {
    render(<BasicAccordion />);
    const region = screen.getByRole('region', { name: 'Alpha' });
    expect(region).toBeInTheDocument();
  });

  it('trigger has aria-expanded=false when closed', () => {
    render(<BasicAccordion />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('trigger has aria-expanded=true when open', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    await user.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-expanded', 'true');
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('Accordion — keyboard', () => {
  it('ArrowDown moves focus to next trigger', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'Alpha' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveFocus();
  });

  it('ArrowUp moves focus to previous trigger', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'Beta' }).focus();
    await user.keyboard('{ArrowUp}');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
  });

  it('Home moves focus to first enabled trigger', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'Beta' }).focus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
  });

  it('End moves focus to last enabled trigger', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'Alpha' }).focus();
    await user.keyboard('{End}');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveFocus();
  });

  it('ArrowDown wraps from last to first', async () => {
    const user = userEvent.setup();
    render(<BasicAccordion />);
    screen.getByRole('button', { name: 'Beta' }).focus();
    await user.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveFocus();
  });
});

// ─── Size variants ────────────────────────────────────────────────────────────

describe('Accordion — sizes', () => {
  it('applies sds-accordion-item--small by default', () => {
    const { container } = render(<BasicAccordion />);
    expect(container.querySelector('.sds-accordion-item--small')).toBeInTheDocument();
  });

  it('applies sds-accordion-item--medium when size=large', () => {
    const { container } = render(
      <Accordion size="medium">
        <AccordionItem value="a">
          <AccordionTrigger>Alpha</AccordionTrigger>
          <AccordionPanel>Panel A</AccordionPanel>
        </AccordionItem>
      </Accordion>
    );
    expect(container.querySelector('.sds-accordion-item--medium')).toBeInTheDocument();
  });
});
