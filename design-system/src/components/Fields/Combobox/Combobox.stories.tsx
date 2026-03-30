import type { Meta, StoryObj } from '@storybook/react-vite';
import { Combobox } from './Combobox';

const OPTIONS = [
  { value: 'acai',             label: 'Açaí'             },
  { value: 'apple',            label: 'Apple'            },
  { value: 'apricot',         label: 'Apricot'          },
  { value: 'avocado',         label: 'Avocado'          },
  { value: 'banana',          label: 'Banana'           },
  { value: 'blackberry',      label: 'Blackberry'       },
  { value: 'blackcurrant',    label: 'Blackcurrant'     },
  { value: 'blood-orange',    label: 'Blood Orange'     },
  { value: 'blueberry',       label: 'Blueberry'        },
  { value: 'boysenberry',     label: 'Boysenberry'      },
  { value: 'cantaloupe',      label: 'Cantaloupe'       },
  { value: 'cherry',          label: 'Cherry'           },
  { value: 'clementine',      label: 'Clementine'       },
  { value: 'coconut',         label: 'Coconut'          },
  { value: 'cranberry',       label: 'Cranberry'        },
  { value: 'date',            label: 'Date'             },
  { value: 'dragon-fruit',    label: 'Dragon Fruit'     },
  { value: 'durian',          label: 'Durian'           },
  { value: 'elderberry',      label: 'Elderberry'       },
  { value: 'feijoa',          label: 'Feijoa'           },
  { value: 'fig',             label: 'Fig'              },
  { value: 'gooseberry',      label: 'Gooseberry'       },
  { value: 'grape',           label: 'Grape'            },
  { value: 'grapefruit',      label: 'Grapefruit'       },
  { value: 'guava',           label: 'Guava'            },
  { value: 'honeydew',        label: 'Honeydew'         },
  { value: 'jackfruit',       label: 'Jackfruit'        },
  { value: 'kiwi',            label: 'Kiwi'             },
  { value: 'kumquat',         label: 'Kumquat'          },
  { value: 'lemon',           label: 'Lemon'            },
  { value: 'lime',            label: 'Lime'             },
  { value: 'lychee',          label: 'Lychee'           },
  { value: 'mandarin',        label: 'Mandarin'         },
  { value: 'mango',           label: 'Mango'            },
  { value: 'mangosteen',      label: 'Mangosteen'       },
  { value: 'mulberry',        label: 'Mulberry'         },
  { value: 'nectarine',       label: 'Nectarine'        },
  { value: 'orange',          label: 'Orange'           },
  { value: 'papaya',          label: 'Papaya'           },
  { value: 'passion-fruit',   label: 'Passion Fruit'    },
  { value: 'peach',           label: 'Peach'            },
  { value: 'pear',            label: 'Pear'             },
  { value: 'persimmon',       label: 'Persimmon'        },
  { value: 'pineapple',       label: 'Pineapple'        },
  { value: 'plum',            label: 'Plum'             },
  { value: 'pomegranate',     label: 'Pomegranate'      },
  { value: 'pomelo',          label: 'Pomelo'           },
  { value: 'quince',          label: 'Quince'           },
  { value: 'raspberry',       label: 'Raspberry'        },
  { value: 'redcurrant',      label: 'Redcurrant'       },
  { value: 'starfruit',       label: 'Starfruit'        },
  { value: 'strawberry',      label: 'Strawberry'       },
  { value: 'tamarind',        label: 'Tamarind'         },
  { value: 'tangerine',       label: 'Tangerine'        },
  { value: 'ugli-fruit',      label: 'Ugli Fruit'       },
  { value: 'watermelon',      label: 'Watermelon'       },
];

const meta: Meta<typeof Combobox> = {
  component: Combobox,
  title: 'Fields/Combobox',
  decorators: [(Story) => <div style={{ maxWidth: '38rem', width: '100%' }}><Story /></div>],
  parameters: {
    docs: {
      description: {
        component:
          'A searchable combobox. Implements the WAI-ARIA Combobox pattern with `role="combobox"` on the input, `role="listbox"` on the dropdown, and full keyboard navigation.\n\n' +
          '- Type to filter options\n' +
          '- `ArrowDown` / `ArrowUp` to highlight options\n' +
          '- `Enter` to commit a highlighted option\n' +
          '- `Escape` to close (or clear when already closed)\n' +
          '- `Tab` to close and accept the committed value',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['large', 'medium', 'small'],
    },
    disabled: { control: 'boolean' },
    error:    { control: 'boolean' },
    success:  { control: 'boolean' },
  },
  args: {
    label:       'Fruit',
    placeholder: 'Search…',
    size:        'large',
    disabled:    false,
    error:       false,
    success:     false,
    options:     OPTIONS,
  },
};

export default meta;
type Story = StoryObj<typeof Combobox>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    defaultValue: 'banana',
    error:        true,
    message:      'Please select a valid option.',
  },
};

export const Success: Story = {
  args: {
    defaultValue: 'cherry',
    success:      true,
    message:      'Selection confirmed.',
  },
};

export const LongList: Story = {
  args: {
    options: Array.from({ length: 20 }, (_, i) => ({
      value: `option-${i + 1}`,
      label: `Option ${i + 1}`,
    })),
  },
};
