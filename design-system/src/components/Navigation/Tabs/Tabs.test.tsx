import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Tabs, TabList, Tab, TabPanel } from './Tabs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function BasicTabs({ defaultValue = 'a', value, onChange }: {
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <Tabs defaultValue={defaultValue} value={value} onChange={onChange}>
      <TabList aria-label="Test tabs">
        <Tab value="a">Alpha</Tab>
        <Tab value="b">Beta</Tab>
        <Tab value="c" disabled>Gamma</Tab>
        <Tab value="d">Delta</Tab>
      </TabList>
      <TabPanel value="a">Panel A</TabPanel>
      <TabPanel value="b">Panel B</TabPanel>
      <TabPanel value="c">Panel C</TabPanel>
      <TabPanel value="d">Panel D</TabPanel>
    </Tabs>
  );
}

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('Tabs — rendering', () => {
  it('renders tablist and all tabs', () => {
    render(<BasicTabs />);
    expect(screen.getByRole('tablist', { name: 'Test tabs' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('marks the default tab as selected', () => {
    render(<BasicTabs defaultValue="b" />);
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows the active panel and hides others', () => {
    render(<BasicTabs defaultValue="a" />);
    expect(screen.getByText('Panel A')).toBeVisible();
    expect(screen.getByText('Panel B').closest('[role="tabpanel"]')).toHaveAttribute('hidden');
  });

  it('associates tabs with panels via aria-controls / aria-labelledby', () => {
    render(<BasicTabs defaultValue="a" />);
    const tab = screen.getByRole('tab', { name: 'Alpha' });
    const panelId = tab.getAttribute('aria-controls')!;
    expect(document.getElementById(panelId)).toBeInTheDocument();
    expect(document.getElementById(panelId)).toHaveAttribute('aria-labelledby', tab.id);
  });
});

// ─── Interaction ──────────────────────────────────────────────────────────────

describe('Tabs — interaction', () => {
  it('activates a tab on click', async () => {
    render(<BasicTabs />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('Panel B')).toBeVisible();
  });

  it('does not activate a disabled tab', async () => {
    render(<BasicTabs />);
    await userEvent.click(screen.getByRole('tab', { name: 'Gamma' }));
    expect(screen.getByRole('tab', { name: 'Gamma' })).toHaveAttribute('aria-selected', 'false');
  });

  it('calls onChange when tab changes', async () => {
    const onChange = vi.fn();
    render(<BasicTabs onChange={onChange} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });
});

// ─── Keyboard navigation ──────────────────────────────────────────────────────

describe('Tabs — keyboard navigation', () => {
  it('ArrowRight moves focus to the next enabled tab', async () => {
    render(<BasicTabs defaultValue="a" />);
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveFocus();
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('ArrowRight skips disabled tabs', async () => {
    render(<BasicTabs defaultValue="b" />);
    screen.getByRole('tab', { name: 'Beta' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    // Gamma (c) is disabled, so it should jump to Delta (d)
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus();
  });

  it('ArrowLeft moves focus to the previous enabled tab', async () => {
    render(<BasicTabs defaultValue="b" />);
    screen.getByRole('tab', { name: 'Beta' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('Home moves focus to the first tab', async () => {
    render(<BasicTabs defaultValue="d" />);
    screen.getByRole('tab', { name: 'Delta' }).focus();
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });

  it('End moves focus to the last enabled tab', async () => {
    render(<BasicTabs defaultValue="a" />);
    screen.getByRole('tab', { name: 'Alpha' }).focus();
    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Delta' })).toHaveFocus();
  });

  it('wraps from last to first with ArrowRight', async () => {
    render(<BasicTabs defaultValue="d" />);
    screen.getByRole('tab', { name: 'Delta' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveFocus();
  });
});

// ─── Controlled mode ──────────────────────────────────────────────────────────

describe('Tabs — controlled mode', () => {
  it('renders the controlled active tab', () => {
    render(<BasicTabs value="b" onChange={() => {}} />);
    expect(screen.getByRole('tab', { name: 'Beta' })).toHaveAttribute('aria-selected', 'true');
  });

  it('does not update internally when controlled', async () => {
    render(<BasicTabs value="a" onChange={() => {}} />);
    await userEvent.click(screen.getByRole('tab', { name: 'Beta' }));
    // External state not updated → still shows Alpha as active
    expect(screen.getByRole('tab', { name: 'Alpha' })).toHaveAttribute('aria-selected', 'true');
  });
});
