import * as T from 'three';

/** 拖拽环视：绕微缩模型转，松手后带阻尼回稳，空闲时慢慢自己转。 */
export class Orbit {
  azimuth = 0.32;
  polar = 1.14;
  private yawSpeed = 0;
  private pitchSpeed = 0;
  private dragging = false;
  private blocked = false;
  private readonly originalTouchAction: string;
  private lastX = 0;
  private lastY = 0;
  private idleFor = 0;
  private readonly position = new T.Vector3();

  constructor(private readonly camera: T.PerspectiveCamera, private readonly host: HTMLElement, private readonly target: T.Vector3) {
    this.originalTouchAction = host.style.touchAction;
    host.style.touchAction = 'none';
    host.style.cursor = 'grab';
    host.addEventListener('pointerdown', this.down);
    host.addEventListener('pointermove', this.move);
    host.addEventListener('pointerup', this.up);
    host.addEventListener('pointercancel', this.up);
    host.addEventListener('pointerleave', this.up);
  }

  private down = (event: PointerEvent) => {
    if (this.blocked) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.idleFor = 0;
    this.host.style.cursor = 'grabbing';
    this.host.setPointerCapture?.(event.pointerId);
  };

  private move = (event: PointerEvent) => {
    if (!this.dragging) return;
    const dx = event.clientX - this.lastX;
    const dy = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.yawSpeed = -dx * 0.0045;
    this.pitchSpeed = -dy * 0.0032;
    this.azimuth += this.yawSpeed;
    this.polar = T.MathUtils.clamp(this.polar + this.pitchSpeed, 0.62, 1.44);
    this.idleFor = 0;
  };

  private up = () => {
    if (!this.dragging) return;
    this.dragging = false;
    this.host.style.cursor = 'grab';
  };

  setBlocked(value: boolean) {
    this.blocked = value;
    if (value) { this.up(); this.yawSpeed = 0; this.pitchSpeed = 0; }
  }

  /** 每帧根据阻尼与空闲漂移更新相机位置。 */
  update(dt: number, distance: number) {
    if (!this.dragging) {
      this.azimuth += this.yawSpeed * 0.9;
      this.polar = T.MathUtils.clamp(this.polar + this.pitchSpeed * 0.9, 0.62, 1.44);
      const decay = Math.exp(-dt * 6);
      this.yawSpeed *= decay;
      this.pitchSpeed *= decay;
      this.idleFor += dt;
      if (this.idleFor > 2.4) {
        const drift = Math.min(1, (this.idleFor - 2.4) / 1.6);
        this.azimuth += dt * 0.075 * drift;
      }
    }
    const sin = Math.sin(this.polar);
    this.position.set(
      this.target.x + distance * sin * Math.sin(this.azimuth),
      this.target.y + distance * Math.cos(this.polar),
      this.target.z + distance * sin * Math.cos(this.azimuth),
    );
    this.camera.position.copy(this.position);
    this.camera.lookAt(this.target);
  }

  dispose() {
    this.host.removeEventListener('pointerdown', this.down);
    this.host.removeEventListener('pointermove', this.move);
    this.host.removeEventListener('pointerup', this.up);
    this.host.removeEventListener('pointercancel', this.up);
    this.host.removeEventListener('pointerleave', this.up);
    this.host.style.cursor = '';
    this.host.style.touchAction = this.originalTouchAction;
  }
}
