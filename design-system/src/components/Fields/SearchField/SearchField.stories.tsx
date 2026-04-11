import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { SearchField } from './SearchField';

const meta: Meta<typeof SearchField> = {
  component: SearchField,
  title: 'Fields/SearchField',
  decorators: [(Story) => <div style={{ maxWidth: '38rem', width: '100%' }}><Story /></div>],
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
  'Alpaca',
  'Canary',
  'Cat',
  'Chicken',
  'Chinchilla',
  'Cockatiel',
  'Cockatoo',
  'Cow',
  'Degu',
  'Dog',
  'Donkey',
  'Duck',
  'Ferret',
  'Finch',
  'Gerbil',
  'Goat',
  'Goldfish',
  'Guinea Pig',
  'Hamster',
  'Hedgehog',
  'Horse',
  'Koi',
  'Llama',
  'Lovebird',
  'Macaw',
  'Miniature Pig',
  'Mule',
  'Parrot',
  'Parakeet',
  'Peacock',
  'Pigeon',
  'Rabbit',
  'Rat',
  'Sheep',
  'Snake',
  'Sugar Glider',
  'Tortoise',
  'Turkey',
  'Turtle',
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
  // Type 'c' to reveal suggestions (matches Cat, Chicken, Chinchilla, etc.)
  // The listbox is inline (not portaled) so within(canvasElement) scoping works.
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByRole('combobox'), 'c');
    await waitFor(() =>
      expect(canvas.getByRole('listbox')).toBeVisible()
    );
  },
  parameters: { chromatic: { delay: 200 } },
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
