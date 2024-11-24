import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'), // 配置别名
      'src': path.resolve(__dirname, 'src') // 可选：兼容 src
    }
  }
});
