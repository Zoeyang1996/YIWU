import type { AssetRecord } from '../types/assets';

// “ready”表示当前原型可用，不表示正式美术已由用户验收。
export const assets: AssetRecord[] = [
  { id: 'gateway_main', name: '牌楼与青瓦建筑样板', category: 'architecture', status: 'ready', source: '程序化三维模型，参考图结构与配色' },
  { id: 'road_main', name: '有界石板主街', category: 'roads', status: 'ready', source: '程序化三维模型' },
  { id: 'stalls_four', name: '玩具、灯铺、书铺、茶食', category: 'stalls', status: 'ready', source: '程序化三维模型' },
  { id: 'reference_stall', name: '用户参考摊位', category: 'stalls', status: 'ready', url: '/assets/models/stalls/reference-stall.glb', source: '用户指定参考目录中的 Tripo GLB，本地原型接入' },
  { id: 'characters', name: '漫游主角与四摊摊主', category: 'characters', status: 'ready', source: '程序化角色样板，主角身份未定' },
  { id: 'products_six', name: '六件环绕商品样板', category: 'products', status: 'ready', source: '程序化完整体积模型，商品信息为演示' },
  { id: 'prop_lantern', name: '环境灯笼与道具', category: 'props', status: 'ready', source: '程序化三维模型' },
];
