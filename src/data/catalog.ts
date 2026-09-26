export type Market = 'noon' | 'night' | 'morning';
export type ProductKind = 'drum' | 'frog' | 'lantern' | 'rabbit' | 'book' | 'tea';
export const markets: Market[] = ['noon', 'night', 'morning'];
export const marketInfo = {
  noon: { name: '午市', time: '日正 · 人间百货', title: '一日三时，\n一街好物。', description: '日光落在青瓦上，风车转过旧街巷。\n走进义乌，把寻常日子逛成一段奇遇。', phrase: '日光正好，百物相迎', color: '#a7553d' },
  night: { name: '夜市', time: '入夜 · 百物有灵', title: '灯火初上，\n百物有灵。', description: '青蛙货郎摇响拨浪鼓，灯笼精点亮归途。\n今夜，与可爱的山海来客做一回邻居。', phrase: '灯火可亲，奇遇正好', color: '#b66c46' },
  morning: { name: '早市', time: '清晨 · 茶食烟火', title: '晨光入巷，\n烟火初醒。', description: '一缕茶香，一笼热气，一声早安。\n带着昨夜的故事，慢慢逛进新的一天。', phrase: '一盏清茶，满街早安', color: '#537f72' },
};
export interface Product { id: string; name: string; price: number; kind: ProductKind; color: string; specs: string[]; story: string; detail: string }
export const products: Product[] = [
  { id: 'rattle-drum', name: '吉祥拨浪鼓', price: 28, kind: 'drum', color: '#ae5541', specs: ['朱砂红', '松石绿'], story: '轻轻一摇，旧时街巷就有了回声。货郎说，快乐不必很大，握在手心刚刚好。', detail: '木柄与双面鼓身 · 原创造型展示样品' },
  { id: 'clockwork-frog', name: '发条小青蛙', price: 36, kind: 'frog', color: '#739570', specs: ['荷叶绿', '嫩芽青'], story: '青蛙货郎最得意的小伙伴。替它拧上发条，让一点童心跳进今天。', detail: '复古发条玩具概念 · 原创造型展示样品' },
  { id: 'rabbit-lamp', name: '月白兔子灯', price: 68, kind: 'rabbit', color: '#d0a778', specs: ['月白', '暖杏'], story: '灯笼精捡来一小片月光，藏进兔子肚子里。天黑以后，它会陪你慢慢走。', detail: '桌面氛围灯概念 · 原创造型展示样品' },
  { id: 'round-lamp', name: '团圆小宫灯', price: 58, kind: 'lantern', color: '#bb674a', specs: ['柿子红', '蜜糖金'], story: '一盏暖光，就是一处小小的归宿。挂在窗边，也把市集的温柔带回家。', detail: '竹骨灯笼概念 · 原创造型展示样品' },
  { id: 'market-notebook', name: '百物手记', price: 32, kind: 'book', color: '#5c817d', specs: ['青山', '赤陶'], story: '猫先生留了几页空白，等你记下今天遇见的人、买到的好物，和没有说出口的心事。', detail: '线装手账概念 · 原创造型展示样品' },
  { id: 'tea-bowl', name: '青釉小茶盏', price: 45, kind: 'tea', color: '#739d91', specs: ['青釉', '米釉'], story: '晨间第一口茶，盛在掌心的一抹青里。卖茶的掌柜说，慢一点，好味道才赶得上。', detail: '日用茶器概念 · 原创造型展示样品' },
];
export interface Stall { id: string; x: number; color: string; products: string[]; names: Record<Market, string>; hosts: Record<Market, string>; lines: Record<Market, string>; kind: 'frog' | 'lantern' | 'cat' | 'food' }
export const stalls: Stall[] = [
  { id: 'toys', x: -8, color: '#b76347', kind: 'frog', products: ['rattle-drum', 'clockwork-frog', 'rabbit-lamp'], names: { noon: '童趣货郎', night: '蛙鸣玩具铺', morning: '早安杂货' }, hosts: { noon: '阿青 · 游方货郎', night: '阿蛙 · 青蛙货郎', morning: '阿青 · 早起的货郎' }, lines: { noon: '来摇一摇，听听小时候的声音。', night: '呱！本店的青蛙，比我还会蹦。', morning: '早呀！第一份快乐，已经摆好了。' } },
  { id: 'lights', x: -2.7, color: '#d3a65c', kind: 'lantern', products: ['rabbit-lamp', 'round-lamp', 'rattle-drum'], names: { noon: '竹影灯坊', night: '一盏月光', morning: '晨光灯坊' }, hosts: { noon: '阿灯 · 制灯人', night: '小灯 · 灯笼精', morning: '阿灯 · 收灯的掌柜' }, lines: { noon: '纸薄情长，给日子添一盏好光。', night: '别怕黑，我把月亮借给你。', morning: '灯歇了，故事还没讲完呢。' } },
  { id: 'books', x: 2.7, color: '#648d84', kind: 'cat', products: ['market-notebook', 'tea-bowl', 'round-lamp'], names: { noon: '青山书铺', night: '猫先生书铺', morning: '晨读小阁' }, hosts: { noon: '林先生 · 书铺主人', night: '猫先生 · 夜读书生', morning: '林先生 · 晨读书生' }, lines: { noon: '空白的一页，最适合装新故事。', night: '喵……我没睡，只是在想下一句。', morning: '读两行书，喝一口茶，正好。' } },
  { id: 'tea', x: 8, color: '#65848b', kind: 'food', products: ['tea-bowl', 'market-notebook', 'rabbit-lamp'], names: { noon: '歇脚茶摊', night: '饕餮茶食', morning: '人间早茶' }, hosts: { noon: '刘掌柜 · 茶摊主人', night: '小饕 · 爱吃的掌柜', morning: '刘掌柜 · 早茶师傅' }, lines: { noon: '逛累了？坐坐，喝盏茶。', night: '我尝过了，今晚的月色有点甜。', morning: '茶刚沏好，热气都在等你。' } },
];
export const productById = (id: string) => products.find(p => p.id === id);
export const stallById = (id: string) => stalls.find(s => s.id === id);
export function productArt(p: Product) {
  const motifs: Record<ProductKind, string> = {
    drum: '<path d="M98 108v64" stroke="#906441" stroke-width="12"/><circle cx="98" cy="78" r="40" fill="#ab5341"/><circle cx="98" cy="78" r="32" fill="#e7cda0"/><circle cx="98" cy="78" r="23" fill="none" stroke="#ab5341" stroke-width="2"/><path d="M57 75 35 95m102-20 24 20" stroke="#88644e" stroke-width="3"/><circle cx="34" cy="98" r="7" fill="#ab5341"/><circle cx="162" cy="98" r="7" fill="#ab5341"/><text x="98" y="89" text-anchor="middle" fill="#ab5341" font-size="31" font-family="serif">福</text>',
    frog: '<ellipse cx="100" cy="119" rx="57" ry="31" fill="#557c59"/><ellipse cx="100" cy="97" rx="45" ry="38" fill="#8ba674"/><circle cx="73" cy="62" r="18" fill="#8ba674"/><circle cx="127" cy="62" r="18" fill="#8ba674"/><circle cx="73" cy="61" r="10" fill="#f1e8ce"/><circle cx="127" cy="61" r="10" fill="#f1e8ce"/><circle cx="76" cy="62" r="5" fill="#354737"/><circle cx="124" cy="62" r="5" fill="#354737"/><path d="M81 101q19 17 38 0" fill="none" stroke="#354737" stroke-width="3"/>',
    rabbit: '<ellipse cx="100" cy="120" rx="41" ry="33" fill="#eee0bc"/><ellipse cx="98" cy="88" rx="31" ry="29" fill="#f9edce"/><ellipse cx="80" cy="49" rx="11" ry="32" fill="#f9edce" transform="rotate(-12 80 49)"/><ellipse cx="114" cy="46" rx="11" ry="33" fill="#f9edce" transform="rotate(12 114 46)"/><circle cx="88" cy="87" r="3" fill="#775945"/><circle cx="110" cy="87" r="3" fill="#775945"/><path d="m96 96 4 3 4-3" fill="none" stroke="#b87663" stroke-width="2"/>',
    lantern: '<path d="M100 24v21m0 106v26" stroke="#a17c46" stroke-width="4"/><rect x="77" y="39" width="46" height="10" rx="3" fill="#967347"/><ellipse cx="100" cy="96" rx="51" ry="49" fill="#be6346"/><ellipse cx="100" cy="96" rx="33" ry="49" fill="none" stroke="#e5ac62" stroke-width="3"/><ellipse cx="100" cy="96" rx="14" ry="49" fill="none" stroke="#e5ac62" stroke-width="2"/><rect x="80" y="144" width="40" height="8" fill="#967347"/>',
    book: '<path d="m51 52 84-15 21 110-85 16z" fill="#e5d8b6"/><path d="m46 47 84-15 21 110-85 16z" fill="#537e79"/><path d="m59 45 21 109" stroke="#d6be8d" stroke-width="3"/><path d="m91 54 25-4 8 48-25 4z" fill="#ecdfbd"/><text x="112" y="70" fill="#5c6a58" text-anchor="middle" font-size="13" font-family="serif">百</text><text x="115" y="88" fill="#5c6a58" text-anchor="middle" font-size="13" font-family="serif">物</text>',
    tea: '<ellipse cx="100" cy="147" rx="49" ry="10" fill="#adc0a8"/><path d="M49 89q4 58 51 58t51-58" fill="#81a295"/><ellipse cx="100" cy="89" rx="51" ry="18" fill="#baceb4"/><ellipse cx="100" cy="89" rx="43" ry="12" fill="#92784e"/><path d="M89 62q-17-17 0-34m25 38q-15-19 0-35" fill="none" stroke="#b6b7a1" stroke-width="3"/>',
  };
  return `<svg viewBox="0 0 200 190" role="img" aria-label="${p.name}"><ellipse cx="100" cy="168" rx="60" ry="8" fill="#6c664b" opacity=".09"/>${motifs[p.kind]}</svg>`;
}
