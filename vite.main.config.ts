import { defineConfig } from 'vite';
import copy from 'rollup-plugin-copy';
import sevenBin from '7zip-bin';
import path from 'path';


const relative7zPath = path.relative(__dirname, sevenBin.path7za).replace(/\\/g, '/');

const dest7zPath = relative7zPath.split('7zip-bin')[1].replace('/7za.exe', '');

// https://vitejs.dev/config
export default defineConfig({
  plugins: [copy({
    targets: [
      {
        src: path.relative(__dirname, sevenBin.path7za).replace(/\\/g, '/'), // 源文件路径
        dest: `.vite/build/${dest7zPath}`, // 输出目录
      },
    ],
  }),]
});
