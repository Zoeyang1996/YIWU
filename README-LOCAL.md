本地运行与模型替换快速指南

前提
- Node.js >= 22.12.0
- 已在仓库根目录（C:\Users\Administrator\Documents\GitHub\YIWU）打开终端

安装依赖并生成模型清单、运行开发服务

```powershell
npm install
npm run dev
```

说明
- `npm run dev` 会先执行 `scripts/generate-model-manifest.js`，生成 `public/models/manifest.json`（若 `public/models` 有 glb/gltf 文件）。
- 在浏览器打开 Vite 输出的 URL（示例：`http://127.0.0.1:5173`）。

测试模型替换
1. 在 `public/models/` 中放入你的 `.glb` 文件，例如 `gateway_main.glb`。
2. 刷新页面；左侧 `模型槽` 会显示预设槽位（`gateway_main`、`stall_left` 等）。
3. 点击左侧某个槽位条目以高亮（表示选中目标替换槽）。
4. 在右上 `模型清单` 或右下 `开发面板` 使用一键替换：
   - 直接点击 `模型清单` 中的文件名会尝试加载到选中槽；
   - 或在开发面板填入 slot id（例如 `gateway_main`）与路径（例如 `/public/models/gateway_main.glb`）点击“替换模型”。

常见问题
- 如果页面控制台提示 `Failed to fetch /public/models/manifest.json`，请确保已运行 `npm run dev` 或手动执行 `node ./scripts/generate-model-manifest.js`。
- 加载失败时会打印详细错误到控制台并将对应 legend 条目标记为失败（降低透明度）。

下一步建议
- 把已验证的 GLB 按 `assets.ts` 中的条目命名并提交到仓库 `public/models/`，便于生产构建包含固定资源。
- 如需我把替换动作改为预先加载并缓存模型（减少交互时延），我可以接入并在场景中预热指定 assets。
