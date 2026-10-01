import { defineConfig } from 'vite';
// 将独立方案页一并放进本地生产预览，保持既有首页入口。
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        scroll: 'demos/silk-road-scroll.html',
        port: 'demos/silk-road-port.html',
        planet: 'demos/silk-road-planet.html',
      },
    },
  },
});
