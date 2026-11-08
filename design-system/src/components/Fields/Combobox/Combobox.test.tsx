import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Combobox } from './Combobox';

const OPTIONS = [
  { value: 'hamster',  label: 'Hamster'  },
  { value: 'goldfish', label: 'Goldfish' },
  { value: 'cat',      label: 'Cat'      },
  { value: 'dog',      label: 'Dog'      },
];

function selectedOptions() {
  return screen
    .getAllByRole('option')
    .filter(o => o.getAttribute('aria-selected') === 'true');
}

describe('Combobox', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders a combobox labelled by its label', () => {
    render(<Combobox label="Pet" options={OPTIONS} />);
    expect(screen.getByRole('combobox', { name: 'Pet' })).toBeInTheDocument();
  });

  it('shows the committed option label as the input value', () => {
    render(<Combobox label="Pet" options={OPTIONS} defaultValue="cat" />);
    expect(screen.getByRole('combobox')).toHaveValue('Cat');
  });

  it('does not render the listbox while closed', () => {
    render(<Combobox label="Pet" options={OPTIONS} />);
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the listbox on click and links it via aria-controls', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    const listbox = screen.getByRole('listbox');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-controls', listbox.id);
    expect(within(listbox).getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  // ─── aria-selected follows the active descendant ───────────────────────────

  it('marks no option aria-selected when opened without keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} defaultValue="cat" />);
    await user.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-activedescendant');
    expect(selectedOptions()).toHaveLength(0);
  });

  it('opens and highlights the first option on ArrowDown', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}'); // close, keep focus on the input
    await user.keyboard('{ArrowDown}');
    const input   = screen.getByRole('combobox');
    const options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-expanded', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(selectedOptions()).toEqual([options[0]]);
  });

  it('opens and highlights the last option on ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{Escape}');
    await user.keyboard('{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-activedescendant', options[3].id);
    expect(selectedOptions()).toEqual([options[3]]);
  });

  it('moves aria-selected with the highlight on ArrowDown / ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}');
    let options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
    expect(selectedOptions()).toEqual([options[1]]);

    await user.keyboard('{ArrowUp}');
    options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(selectedOptions()).toEqual([options[0]]);
  });

  it('wraps from the first option to the last on ArrowUp', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}{ArrowUp}');
    const options = screen.getAllByRole('option');
    expect(selectedOptions()).toEqual([options[3]]);
  });

  it('highlights the first / last option on Home / End', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{End}');
    expect(selectedOptions()).toEqual([screen.getAllByRole('option')[3]]);
    await user.keyboard('{Home}');
    expect(selectedOptions()).toEqual([screen.getAllByRole('option')[0]]);
  });

  it('does not mark the committed value aria-selected while another option is active', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} defaultValue="cat" />);
    await user.click(screen.getByRole('combobox'));
    await user.keyboard('{ArrowDown}');
    const options = screen.getAllByRole('option');
    expect(options[2]).toHaveAttribute('aria-selected', 'false');
    expect(selectedOptions()).toEqual([options[0]]);
  });

  it('keeps the visual checkmark on the committed value (hidden from AT)', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} defaultValue="cat" />);
    await user.click(screen.getByRole('combobox'));
    const cat   = screen.getByRole('option', { name: 'Cat' });
    const check = cat.querySelector('.sds-menu-item__checkmark');
    expect(cat).toHaveClass('sds-menu-item--selected');
    expect(check).toHaveClass('sds-menu-item__checkmark--selected');
    expect(check).toHaveAttribute('aria-hidden', 'true');
  });

  // ─── Selection ──────────────────────────────────────────────────────────────

  it('commits the highlighted option on Enter', async () => {
    const user     = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Pet" options={OPTIONS} onChange={onChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('goldfish');
    expect(input).toHaveValue('Goldfish');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  it('commits an option on click', async () => {
    const user     = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Pet" options={OPTIONS} onChange={onChange} />);
    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'Dog' }));
    expect(onChange).toHaveBeenCalledWith('dog');
    expect(screen.getByRole('combobox')).toHaveValue('Dog');
  });

  it('closes on Escape without committing and restores the committed label', async () => {
    const user     = userEvent.setup();
    const onChange = vi.fn();
    render(<Combobox label="Pet" options={OPTIONS} defaultValue="cat" onChange={onChange} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}{Escape}');
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('Cat');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
  });

  // ─── Filtering ──────────────────────────────────────────────────────────────

  it('filters options as the user types and resets the highlight', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('{ArrowDown}');
    await user.keyboard('g');
    const options = screen.getAllByRole('option');
    expect(options.map(o => o.textContent)).toEqual(['Goldfish', 'Dog']);
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(selectedOptions()).toHaveLength(0);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);
    expect(selectedOptions()).toEqual([screen.getByRole('option', { name: 'Goldfish' })]);
  });

  it('shows a "No options found" message when nothing matches', async () => {
    const user = userEvent.setup();
    render(<Combobox label="Pet" options={OPTIONS} />);
    const input = screen.getByRole('combobox');
    await user.click(input);
    await user.keyboard('zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No options found')).toBeInTheDocument();
  });
});
