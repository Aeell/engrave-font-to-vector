import { defineConfig } from 'vite';

export default defineConfig({
  root: 'web',
  base: '/engrave-font-to-vector/',
  build: {
    outDir: '../dist-web',
  },
});