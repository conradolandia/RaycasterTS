import { NEAR_CLIPPING_PLANE, FOV } from './constants';

export type Scene = Array<
  Array<string | CanvasPattern | CanvasGradient | null>
>;

export class Vector2 {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  static fromAngle(angle: number): Vector2 {
    return new Vector2(Math.cos(angle), Math.sin(angle));
  }

  array(): [number, number] {
    return [this.x, this.y];
  }

  add(that: Vector2): Vector2 {
    return new Vector2(this.x + that.x, this.y + that.y);
  }

  sub(that: Vector2): Vector2 {
    return new Vector2(this.x - that.x, this.y - that.y);
  }

  mul(that: Vector2): Vector2 {
    return new Vector2(this.x * that.x, this.y * that.y);
  }

  div(that: Vector2): Vector2 {
    return new Vector2(this.x / that.x, this.y / that.y);
  }

  mag(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  sqrMag(): number {
    return this.x * this.x + this.y * this.y;
  }

  scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  rotate90(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  rotate180(): Vector2 {
    return new Vector2(-this.x, -this.y);
  }

  rotate270(): Vector2 {
    return new Vector2(this.y, -this.x);
  }

  rotate(angle: number): Vector2 {
    return new Vector2(
      this.x * Math.cos(angle) - this.y * Math.sin(angle),
      this.x * Math.sin(angle) + this.y * Math.cos(angle)
    );
  }

  norm(): Vector2 {
    const magnitude = this.mag();
    if (magnitude === 0) return new Vector2(0, 0);
    return new Vector2(this.x / magnitude, this.y / magnitude);
  }

  dot(that: Vector2): number {
    return this.x * that.x + this.y * that.y;
  }

  lerp(that: Vector2, t: number): Vector2 {
    return this.add(that.sub(this).scale(t));
  }

  sqrtDistanceTo(that: Vector2): number {
    return that.sub(this).sqrMag();
  }
}

export class Player {
  position: Vector2;
  direction: number;
  constructor(position: Vector2, direction: number) {
    this.position = position;
    this.direction = direction;
  }

  fov(): [Vector2, Vector2] {
    const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
    const p = this.position.add(
      Vector2.fromAngle(this.direction).scale(NEAR_CLIPPING_PLANE)
    );
    const p1 = p.sub(p.sub(this.position).rotate90().norm().scale(l));
    const p2 = p.add(p.sub(this.position).rotate90().norm().scale(l));

    return [p1, p2];
  }
}
