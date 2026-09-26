# 网页正式素材

此目录仅放应用实际引用且允许使用的素材。当前尚无正式素材。

已建立以下目录。实验截图、参考图、原始建模工程与原始大文件不放在这里。

| 目录 | 内容 |
| --- | --- |
| `models/architecture/` | 牌楼、建筑、屋顶 |
| `models/roads/` | 道路、台阶、街道模块 |
| `models/stalls/` | 摊位骨架、柜台、棚布、招牌 |
| `models/characters/player/` | 主角及动作 |
| `models/characters/npcs/` | 摊主及动作 |
| `models/products/` | 商品环绕模型 |
| `models/props/` | 灯笼、桌凳等陈设 |
| `textures/` | 独立纹理，按模型 ID 细分 |
| `images/products/`、`images/ui/` | 商品图与界面图 |
| `audio/ambience/`、`audio/sfx/`、`audio/music/` | 环境音、音效、配乐 |

## 放入素材的方法

1. 优先导出 `.glb`，文件名采用稳定英文 ID。源工程放仓库外或已忽略的 `art-source/`。
2. 本轮原型约定 1 单位为 1 米、Y 轴向上、模型正面朝 +Z，原点放地面中心；这是可调整的接入约定。
3. 共享模型只保存一份；只有确实存在不同时段版本时，才建立 `noon/`、`night/`、`morning/` 子目录。
4. 更新素材清单，记录来源、权限、尺寸、纹理和动画；以 `gateway_main` 为例，文件可放 `models/architecture/gateway_main.glb`。
5. 代码中的 URL 对应 `/assets/models/architecture/gateway_main.glb`，不含 `public`。当前尚未接入模型加载器，放入文件不会自动显示；下一轮需替换场景里的占位体块。

添加资产时同步更新 `docs/素材清单.md`。替换占位模型前检查比例、朝向、材质、动画及文件大小。不要用仅含正面的展示模型冒充支持完整环绕的商品。
