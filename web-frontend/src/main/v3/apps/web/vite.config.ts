import path from 'path';
import { UserConfig, defineConfig } from 'vite';
import compression from 'vite-plugin-compression2';

const BASE_PATH = process.env.BASE_PATH || '';
const isDev = process.env.NODE_ENV === 'development';
const target = isDev ? 'http://localhost:8080' : 'http://localhost:8080';
const basePath = isDev ? '/' : BASE_PATH || '/';

export default defineConfig({
  server: {
    hmr: { overlay: false },
    port: 3000,
    proxy: {
      '/api/': {
        target,
        changeOrigin: true,
      },
      '/api/agent/activeThread': {
        target,
        secure: false,
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    compression(),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
      // deleteOriginalAssets: true,
    }),
  ] as unknown as UserConfig['plugins'],
  base: basePath,
});
