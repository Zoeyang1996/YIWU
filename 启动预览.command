#!/bin/zsh
cd "${0:A:h}" || exit 1
YIWU_BOOTSTRAP_NODE="$(command -v node)"
if [[ -z "$YIWU_BOOTSTRAP_NODE" ]]; then
  YIWU_BOOTSTRAP_NODE="/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node"
fi
if [[ ! -x "$YIWU_BOOTSTRAP_NODE" ]]; then
  echo '未找到 Node.js，请安装 Node.js 22.12 或更新版本后重试。'
  read -r '?按回车关闭窗口'
  exit 1
fi
"$YIWU_BOOTSTRAP_NODE" scripts/start-preview.mjs
YIWU_PREVIEW_STATUS=$?
if [[ $YIWU_PREVIEW_STATUS -ne 0 ]]; then
  read -r '?启动失败，按回车关闭窗口'
fi
exit $YIWU_PREVIEW_STATUS
