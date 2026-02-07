import path from 'path';
import { defineConfig } from 'vite';

// Content script 必须构建为 IIFE：Chrome 的 content_scripts 不以 type="module" 加载，不能含 import。
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/content.js'),
      output: {
        format: 'iife',
        entryFileNames: 'content.js',
        inlineDynamicImports: true,
      },
    },
  },
});
