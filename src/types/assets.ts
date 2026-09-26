export type AssetCategory = 'architecture' | 'roads' | 'stalls' | 'characters' | 'products' | 'props';
export interface AssetRecord {
  id: string;
  name: string;
  category: AssetCategory;
  status: 'planned' | 'ready';
  /** 相对 public 的 URL；仅在文件实际存在并可使用后填写。 */
  url?: string;
  source?: string;
}
