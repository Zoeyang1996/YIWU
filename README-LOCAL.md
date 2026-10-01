# 本地预览与模型接入

双击项目根目录的 `启动预览.cmd`，打开终端中显示的地址。默认是 http://127.0.0.1:5173/ 。

如需开发，使用 README 中的 npm 命令。当前网页已替换早期模型槽调试面板，用户界面直接提供总览、逛摊、商品与行囊。

模型放在 `public/assets/models/`，网页访问路径为 `/assets/models/...`，不带 `public`。目前已接入 `stalls/reference-stall.glb`；加载失败会保留简化环境摊车。生成清单脚本采用 ES 模块，输出 `public/assets/models/manifest.json`。

新增模型仍需在 `src/scenes/createOverview.ts` 或商品查看模块里明确接入，放入文件并不会自动显示。替换前检查尺寸、朝向、材质与浏览构图。
