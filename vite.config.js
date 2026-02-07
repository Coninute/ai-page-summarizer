import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 为了让构建后的资源在 Chrome 扩展中正常通过相对路径加载，使用相对 base
export default defineConfig({
  plugins: [react()],
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: 'index.html',
        content: path.resolve(__dirname, 'src/content.js')
      },
      output: {
        entryFileNames: (chunkInfo) => (chunkInfo.name === 'content' ? 'content.js' : '[name].js')
      }
    }
  }
});


