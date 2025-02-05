import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'ServerMap',
      formats: ['es', 'cjs'],
      fileName: (format) => {
        if (format === 'cjs') {
          return 'index.cjs';
        }
        return 'index.js';
      },
    },
    rollupOptions: {
      external: ['react'],
    },
  },
});
