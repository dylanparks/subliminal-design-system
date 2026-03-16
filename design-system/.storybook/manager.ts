import { addons } from '@storybook/manager-api';
import { create } from '@storybook/theming/create';
import logo from './subliminal-logo.svg';

addons.setConfig({
  theme: create({
    base: 'light',
    brandTitle: 'Subliminal Design System',
    brandImage: logo,
    brandTarget: '_self',
  }),
});
