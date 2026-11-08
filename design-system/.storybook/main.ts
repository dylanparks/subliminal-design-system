import type { StorybookConfig } from '@storybook/react-vite';
import type { InlineConfig } from 'vite';
import { createRequire } from 'node:module';
import path from 'node:path';

// react-flagpack's <Flag> renders <img src="/flags/{size}/{code}.svg">. Resolve the package
// through Node rather than assuming ../node_modules: npm workspaces hoist it to the
// monorepo root.
const flagpackFlagsDir = path.join(
  path.dirname(createRequire(import.meta.url).resolve('react-flagpack/package.json')),
  'dist/flags',
);

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-themes',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
    '@storybook/addon-vitest',
    '@storybook/addon-mcp',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Serve flagpack's flag images at /flags so Flag component can find them.
  staticDirs: [
    '../public',
    { from: flagpackFlagsDir, to: '/flags' },
  ],
  async viteFinal(config: InlineConfig) {
    return {
      ...config,
      optimizeDeps: {
        ...config.optimizeDeps,
        include: [...(config.optimizeDeps?.include ?? []), 'react-flagpack'],
      },
    };
  },
};

export default config;
