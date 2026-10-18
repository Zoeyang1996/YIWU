import type * as T from 'three';
import type { Kit } from '../toon/Kit';
import type { Palette } from './palette';

/** 一个时辰的微缩场景：自带动画，互不依赖。 */
export interface Diorama {
  group: T.Group;
  /** activity 为 1 表示正对着观众，0 表示转到画面外。 */
  tick(time: number, activity: number): void;
  dispose(): void;
}

export interface BuildContext {
  kit: Kit;
  palette: Palette;
  /** 灯笼光晕贴图。 */
  halo: T.Texture;
  /** 灶上蒸汽贴图。 */
  steam: T.Texture;
}

export type Build = (context: BuildContext) => Diorama;
