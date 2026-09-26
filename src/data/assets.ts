import type { AssetRecord } from '../types/assets';

// 这是制作清单，不是已存在模型的加载列表。占位场景不请求这些资产。
export const assets: AssetRecord[] = [
  { id: 'gateway_main', name: '总览牌楼', category: 'architecture', status: 'planned', url: '/public/models/gateway_main.glb' },
  { id: 'road_main', name: '浅弯主街', category: 'roads', status: 'planned', url: '/public/models/road_main.glb' },
  { id: 'stall_sample', name: '首个摊位样板（待选）', category: 'stalls', status: 'planned', url: '/public/models/stall_sample.glb' },
  { id: 'character_player', name: '主角（身份待定）', category: 'characters', status: 'planned', url: '/public/models/character_player.glb' },
  { id: 'product_sample', name: '环绕商品样板（待选）', category: 'products', status: 'planned', url: '/public/models/product_sample.glb' },
  { id: 'prop_lantern', name: '环境灯笼', category: 'props', status: 'planned', url: '/public/models/prop_lantern.glb' },
];
