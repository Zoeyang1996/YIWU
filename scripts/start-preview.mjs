import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const candidates = [
  process.env.YIWU_NODE,
  process.execPath,
  path.join(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin', process.platform === 'win32' ? 'node.exe' : 'node'),
  ...(process.platform === 'darwin' ? ['/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node'] : []),
].filter(Boolean);
const runtime = [...new Set(candidates)].find(candidate => {
  if (!existsSync(candidate)) return false;
  const result = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
  const match = result.stdout?.trim().match(/^v(\d+)\.(\d+)\./);
  return result.status === 0 && match && (Number(match[1]) > 22 || (Number(match[1]) === 22 && Number(match[2]) >= 12));
});

if (!runtime) {
  console.error('无法启动：需要 Node.js 22.12 或更新版本。安装后重试，或用 YIWU_NODE 指定已有运行环境。');
  process.exit(1);
}
const vite = path.join(root, 'node_modules/vite/bin/vite.js');
if (!existsSync(vite)) {
  console.error('缺少项目依赖，请先在项目目录运行 npm ci，再启动预览。');
  process.exit(1);
}
const manifest = spawnSync(runtime, [path.join(root, 'scripts/generate-model-manifest.js')], { cwd: root, stdio: 'inherit' });
if (manifest.status !== 0) process.exit(manifest.status ?? 1);

console.log('义乌三时市集：http://127.0.0.1:5173/');
console.log('请保留此窗口；关闭窗口或按 Ctrl+C 会停止预览。');
const child = spawn(runtime, [vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort', '--configLoader', 'native'], { cwd: root, stdio: 'inherit' });
child.on('error', error => { console.error(`预览启动失败：${error.message}`); process.exitCode = 1; });
child.on('exit', (code, signal) => {
  if (code && code !== 0) console.error('预览未能启动。如果 5173 端口已被占用，请先打开上面的链接，或关闭重复的预览窗口后重试。');
  process.exitCode = code ?? (signal === 'SIGINT' || signal === 'SIGTERM' ? 0 : 1);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
