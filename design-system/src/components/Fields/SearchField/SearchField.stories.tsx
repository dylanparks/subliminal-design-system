import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SearchField } from './SearchField';

const meta: Meta<typeof SearchField> = {
  component: SearchField,
  title: 'Fields/SearchField',
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium'],
    },
    type: {
      control: 'select',
      options: ['standard', 'autocomplete'],
    },
    disabled:  { control: 'boolean' },
    error:     { control: 'boolean' },
    success:   { control: 'boolean' },
    showIcon:  { control: 'boolean' },
    suggestions:        { table: { disable: true } },
    onSuggestionSelect: { table: { disable: true } },
    onChange:           { table: { disable: true } },
    onSearch:           { table: { disable: true } },
  },
  args: {
    label:    'Search',
    size:     'large',
    type:     'standard',
    showIcon: true,
    disabled: false,
    error:    false,
    success:  false,
  },
};

export default meta;
type Story = StoryObj<typeof SearchField>;

const ALL_SUGGESTIONS = [
  'Hamster', 'Goldfish', 'Cat', 'Dog', 'Parrot',
  'Rabbit', 'Turtle', 'Lizard', 'Snake', 'Hedgehog',
];

export const Standard: Story = {};

export const Autocomplete: Story = {
  render: (args) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useState('');

    const suggestions = value.length > 0
      ? ALL_SUGGESTIONS.filter(s => s.toLowerCase().includes(value.toLowerCase()))
      : [];

    return (
      <div style={{ width: '360px' }}>
        <SearchField
          {...args}
          type="autocomplete"
          value={value}
          suggestions={suggestions}
          onChange={setValue}
          onSuggestionSelect={setValue}
        />
      </div>
    );
  },
};

export const Error: Story = {
  args: {
    value:   'Invalid query',
    message: 'No results found. Try a different term.',
    error:   true,
  },
};

export const Success: Story = {
  args: {
    value:   'Dylan',
    message: '3 results found.',
    success: true,
  },
};
