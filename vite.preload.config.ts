import copy from 'rollup-plugin-copy';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  let outputDir = '.vite/build'; // 默认输出目录

  return {
    plugins: [
      copy({
        targets: [
          {
            src: 'src/assets/chi_sim.traineddata', // 源文件路径
            dest: `${outputDir}/assets`, // 输出目录
          },
        ],
        hook: 'closeBundle', // 确保在打包结束后执行
      }),
      {
        name: 'resolve-output-dir',
        configResolved(resolvedConfig) {
          outputDir = resolvedConfig.build.outDir; // 动态获取打包目录
        },
      },
    ],
  }
});
