import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { SearchField } from './SearchField';

const SUGGESTIONS = ['Hamster', 'Goldfish', 'Cat', 'Dog'];

describe('SearchField', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  it('renders with default props', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
  });

  it('renders the label', () => {
    render(<SearchField label="Find products" />);
    expect(screen.getByText('Find products')).toBeInTheDocument();
  });

  it('associates label with input via htmlFor/id', () => {
    render(<SearchField label="Find" />);
    const input = screen.getByRole('searchbox');
    const label = screen.getByText('Find');
    expect(label).toHaveAttribute('for', input.id);
  });

  it('renders a message when provided', () => {
    render(<SearchField message="Search by name or ID" />);
    expect(screen.getByText('Search by name or ID')).toBeInTheDocument();
  });

  it('does not render the message when disabled', () => {
    render(<SearchField message="Should not show" disabled />);
    expect(screen.queryByText('Should not show')).not.toBeInTheDocument();
  });

  it('renders the input as type="search" in standard mode', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search');
  });

  // ─── CSS classes ─────────────────────────────────────────────────────────────

  it('applies the base sds-search-field class', () => {
    const { container } = render(<SearchField />);
    expect(container.firstChild).toHaveClass('sds-search-field');
  });

  it('defaults to the large size class', () => {
    const { container } = render(<SearchField />);
    expect(container.firstChild).toHaveClass('sds-search-field--large');
  });

  it.each([
    ['large',  'sds-search-field--large'],
    ['medium', 'sds-search-field--medium'],
  ] as const)('applies %s size class', (size, expectedClass) => {
    const { container } = render(<SearchField size={size} />);
    expect(container.firstChild).toHaveClass(expectedClass);
  });

  it('adds sds-search-field--error when error prop is true', () => {
    const { container } = render(<SearchField error />);
    expect(container.firstChild).toHaveClass('sds-search-field--error');
  });

  it('adds sds-search-field--success when success prop is true', () => {
    const { container } = render(<SearchField success />);
    expect(container.firstChild).toHaveClass('sds-search-field--success');
  });

  it('adds sds-search-field--disabled when disabled prop is true', () => {
    const { container } = render(<SearchField disabled />);
    expect(container.firstChild).toHaveClass('sds-search-field--disabled');
  });

  it('adds sds-search-field--filled when value is provided', () => {
    const { container } = render(<SearchField value="hello" />);
    expect(container.firstChild).toHaveClass('sds-search-field--filled');
  });

  it('does not add sds-search-field--filled when value is empty', () => {
    const { container } = render(<SearchField value="" />);
    expect(container.firstChild).not.toHaveClass('sds-search-field--filled');
  });

  it('applies additional className', () => {
    const { container } = render(<SearchField className="my-search" />);
    expect(container.firstChild).toHaveClass('my-search');
  });

  // ─── Error / success priority ────────────────────────────────────────────────

  it('does not add success class when both error and success are true', () => {
    const { container } = render(<SearchField error success />);
    expect(container.firstChild).toHaveClass('sds-search-field--error');
    expect(container.firstChild).not.toHaveClass('sds-search-field--success');
  });

  it('does not add error or success class when disabled', () => {
    const { container } = render(<SearchField error success disabled />);
    expect(container.firstChild).not.toHaveClass('sds-search-field--error');
    expect(container.firstChild).not.toHaveClass('sds-search-field--success');
    expect(container.firstChild).toHaveClass('sds-search-field--disabled');
  });

  // ─── Disabled state ──────────────────────────────────────────────────────────

  it('disables the native input when disabled', () => {
    render(<SearchField disabled />);
    expect(screen.getByRole('searchbox')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox')).not.toBeDisabled();
  });

  // ─── Controlled value ────────────────────────────────────────────────────────

  it('renders a controlled value', () => {
    render(<SearchField value="hello world" onChange={() => {}} />);
    expect(screen.getByRole('searchbox')).toHaveValue('hello world');
  });

  // ─── Uncontrolled / onChange ─────────────────────────────────────────────────

  it('calls onChange when the user types', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchField onChange={handleChange} />);
    await user.type(screen.getByRole('searchbox'), 'abc');
    expect(handleChange).toHaveBeenCalledTimes(3);
    expect(handleChange).toHaveBeenLastCalledWith('abc');
  });

  it('does not call onChange when disabled', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchField onChange={handleChange} disabled />);
    await user.type(screen.getByRole('searchbox'), 'abc');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── onSearch (Enter key — standard mode) ────────────────────────────────────

  it('calls onSearch when Enter is pressed with a non-empty value', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    render(<SearchField defaultValue="react" onSearch={handleSearch} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Enter}');
    expect(handleSearch).toHaveBeenCalledWith('react');
  });

  it('does not call onSearch when Enter is pressed with an empty value', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    render(<SearchField onSearch={handleSearch} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Enter}');
    expect(handleSearch).not.toHaveBeenCalled();
  });

  it('does not call onSearch when Enter is pressed with only whitespace', async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    render(<SearchField defaultValue="   " onSearch={handleSearch} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Enter}');
    expect(handleSearch).not.toHaveBeenCalled();
  });

  // ─── Clear button ────────────────────────────────────────────────────────────

  it('renders the clear button', () => {
    render(<SearchField />);
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument();
  });

  it('does not render the clear button when disabled', () => {
    render(<SearchField disabled />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
  });

  it('clears the value when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchField defaultValue="some text" />);
    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string when clear is clicked', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchField value="existing" onChange={handleChange} />);
    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(handleChange).toHaveBeenCalledWith('');
  });

  // ─── Escape key clear (standard mode) ────────────────────────────────────────

  it('clears the value when Escape is pressed (uncontrolled)', async () => {
    const user = userEvent.setup();
    render(<SearchField defaultValue="some text" />);
    const input = screen.getByRole('searchbox');
    await user.click(input);
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
  });

  it('calls onChange with empty string when Escape is pressed (controlled)', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchField value="existing" onChange={handleChange} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Escape}');
    expect(handleChange).toHaveBeenCalledWith('');
  });

  it('does not call onChange on Escape when the field is already empty', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(<SearchField value="" onChange={handleChange} />);
    await user.click(screen.getByRole('searchbox'));
    await user.keyboard('{Escape}');
    expect(handleChange).not.toHaveBeenCalled();
  });

  // ─── Accessibility (standard mode) ────────────────────────────────────────────

  it('sets aria-invalid when error is true', () => {
    render(<SearchField error />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid when error is false', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox')).not.toHaveAttribute('aria-invalid');
  });

  it('uses aria-label when provided', () => {
    render(<SearchField aria-label="Site-wide search" />);
    expect(screen.getByRole('searchbox', { name: 'Site-wide search' })).toBeInTheDocument();
  });

  it('links input to message via aria-describedby', () => {
    render(<SearchField message="Search by name or ID" />);
    const input = screen.getByRole('searchbox');
    const messageId = input.getAttribute('aria-describedby');
    expect(messageId).toBeTruthy();
    expect(document.getElementById(messageId!)).toHaveTextContent('Search by name or ID');
  });

  it('does not set aria-describedby when there is no message', () => {
    render(<SearchField />);
    expect(screen.getByRole('searchbox')).not.toHaveAttribute('aria-describedby');
  });

  // ─── Prop forwarding ─────────────────────────────────────────────────────────

  it('forwards the name prop to the input', () => {
    render(<SearchField name="site-search" />);
    expect(screen.getByRole('searchbox')).toHaveAttribute('name', 'site-search');
  });

  // ─── Autocomplete mode — role and ARIA attributes ─────────────────────────────

  describe('autocomplete mode', () => {
    it('renders input with role="combobox" in autocomplete mode', () => {
      render(<SearchField type="autocomplete" suggestions={SUGGESTIONS} />);
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('uses type="text" in autocomplete mode', () => {
      render(<SearchField type="autocomplete" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('type', 'text');
    });

    it('sets autocomplete="off" in autocomplete mode', () => {
      render(<SearchField type="autocomplete" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('autocomplete', 'off');
    });

    it('renders listbox element in autocomplete mode', () => {
      render(<SearchField type="autocomplete" suggestions={SUGGESTIONS} />);
      expect(screen.getByRole('listbox', { hidden: true })).toBeInTheDocument();
    });

    it('does not render listbox in standard mode', () => {
      render(<SearchField type="standard" />);
      expect(screen.queryByRole('listbox', { hidden: true })).not.toBeInTheDocument();
    });

    it('renders live region in autocomplete mode', () => {
      const { container } = render(<SearchField type="autocomplete" />);
      expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    });

    it('does not render live region in standard mode', () => {
      const { container } = render(<SearchField type="standard" />);
      expect(container.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
    });

    // ─── Suggestion list visibility ───────────────────────────────────────────

    it('shows suggestions when focused and suggestions are provided', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="H" />
      );
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('listbox')).toBeInTheDocument();
    });

    it('hides listbox when suggestions array is empty', () => {
      render(<SearchField type="autocomplete" suggestions={[]} />);
      const listbox = screen.getByRole('listbox', { hidden: true });
      expect(listbox).toHaveAttribute('hidden');
    });

    it('renders each suggestion as a role="option"', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      const listbox = screen.getByRole('listbox');
      const options = within(listbox).getAllByRole('option');
      expect(options).toHaveLength(SUGGESTIONS.length);
      expect(options[0]).toHaveTextContent('Hamster');
    });

    // ─── aria-expanded ────────────────────────────────────────────────────────

    it('sets aria-expanded="false" when list is closed', () => {
      render(<SearchField type="autocomplete" suggestions={SUGGESTIONS} />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('sets aria-expanded="true" when list is open', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
    });

    // ─── Keyboard: ArrowDown / ArrowUp ────────────────────────────────────────

    it('opens the list and moves to the first option on ArrowDown', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'true');
      const firstOption = screen.getAllByRole('option')[0];
      expect(firstOption).toHaveAttribute('aria-selected', 'true');
    });

    it('opens the list and moves to the last option on ArrowUp', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowUp}');
      const options = screen.getAllByRole('option');
      expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');
    });

    it('wraps from last to first option on ArrowDown', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      // Navigate to last item then one more
      for (let i = 0; i <= SUGGESTIONS.length; i++) {
        await user.keyboard('{ArrowDown}');
      }
      const options = screen.getAllByRole('option');
      expect(options[0]).toHaveAttribute('aria-selected', 'true');
    });

    it('sets aria-activedescendant to the active option id', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      const activeId = input.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)).toHaveTextContent('Hamster');
    });

    it('clears aria-activedescendant when list closes', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Escape}');
      expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    // ─── Keyboard: Enter ──────────────────────────────────────────────────────

    it('selects the active suggestion on Enter', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <SearchField
          type="autocomplete"
          suggestions={SUGGESTIONS}
          defaultValue="a"
          onSuggestionSelect={handleSelect}
        />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(handleSelect).toHaveBeenCalledWith('Hamster');
    });

    it('calls onSearch on Enter when no suggestion is active', async () => {
      const user = userEvent.setup();
      const handleSearch = vi.fn();
      render(
        <SearchField
          type="autocomplete"
          suggestions={SUGGESTIONS}
          defaultValue="cat"
          onSearch={handleSearch}
        />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{Enter}');
      expect(handleSearch).toHaveBeenCalledWith('cat');
    });

    it('closes the list after selecting a suggestion', async () => {
      const user = userEvent.setup();
      render(
        <SearchField type="autocomplete" suggestions={SUGGESTIONS} defaultValue="a" />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('calls onChange with the selected suggestion value', async () => {
      const user = userEvent.setup();
      const handleChange = vi.fn();
      render(
        <SearchField
          type="autocomplete"
          suggestions={SUGGESTIONS}
          onChange={handleChange}
          defaultValue="a"
        />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
      expect(handleChange).toHaveBeenCalledWith('Hamster');
    });

    // ─── Keyboard: Escape ─────────────────────────────────────────────────────

    it('closes the list on Escape without selecting', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <SearchField
          type="autocomplete"
          suggestions={SUGGESTIONS}
          defaultValue="a"
          onSuggestionSelect={handleSelect}
        />
      );
      await user.click(screen.getByRole('combobox'));
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Escape}');
      expect(handleSelect).not.toHaveBeenCalled();
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-expanded', 'false');
    });

    it('clears the value on second Escape (list already closed)', async () => {
      const user = userEvent.setup();
      render(<SearchField type="autocomplete" defaultValue="cat" />);
      const input = screen.getByRole('combobox');
      await user.click(input);
      await user.keyboard('{Escape}'); // close list (already closed, clears value)
      expect(input).toHaveValue('');
    });

    // ─── Mouse click on suggestion ────────────────────────────────────────────

    it('selects a suggestion on click', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(
        <SearchField
          type="autocomplete"
          suggestions={SUGGESTIONS}
          defaultValue="a"
          onSuggestionSelect={handleSelect}
        />
      );
      await user.click(screen.getByRole('combobox'));
      await user.click(screen.getAllByRole('option')[1]); // Goldfish
      expect(handleSelect).toHaveBeenCalledWith('Goldfish');
    });

    // ─── Accessibility attributes ─────────────────────────────────────────────

    it('sets aria-controls on input pointing to the listbox', () => {
      render(<SearchField type="autocomplete" />);
      const input = screen.getByRole('combobox');
      const listboxId = input.getAttribute('aria-controls');
      expect(listboxId).toBeTruthy();
      expect(document.getElementById(listboxId!)).toHaveAttribute('role', 'listbox');
    });

    it('sets aria-autocomplete="list" on the combobox input', () => {
      render(<SearchField type="autocomplete" />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-autocomplete', 'list');
    });

    it('sets aria-invalid on the combobox when error is true', () => {
      render(<SearchField type="autocomplete" error />);
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('renders the live region with role="status"', () => {
      const { container } = render(<SearchField type="autocomplete" />);
      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });
  });
});
