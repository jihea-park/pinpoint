import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts', // root entry
  ],
  splitting: true,
  dts: true,
  format: ['esm'],
  external: [
    '@pinpoint-fe/atoms',
    '@pinpoint-fe/hooks',
    'react',
    'react-dom',
    'react-router-dom',
    'jotai',
    'i18next',
    'react-i18next',
    'tailwindcss',
    'tailwindcss-animate',
    'tailwind-scrollbar-hide',
  ],
  outDir: 'dist',
});
