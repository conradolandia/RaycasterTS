import { NEAR_CLIPPING_PLANE, FOV } from './constants';

export type Scene = Array<
  Array<Color | null>
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
  velocity: Vector2;

  constructor(position: Vector2, direction: number, velocity: Vector2) {
    this.position = position;
    this.direction = direction;
    this.velocity = velocity;
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

export class Color {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static red(): Color {
    return new Color(1, 0, 0, 1);
  }

  static green(): Color {
    return new Color(0, 1, 0, 1);
  }

  static blue(): Color {
    return new Color(0, 0, 1, 1);
  }

  static yellow(): Color {
    return new Color(1, 1, 0, 1);
  }

  static magenta(): Color {
    return new Color(1, 0, 1, 1);
  }

  static cyan(): Color {
    return new Color(0, 1, 1, 1);
  }

  static purple(): Color {
    return new Color(1, 0, 1, 1);
  }

  static white(): Color {
    return new Color(1, 1, 1, 1);
  }

  static black(): Color {
    return new Color(0, 0, 0, 1);
  }

  brightness(factor: number): Color {
    return new Color(factor * this.r, factor * this.g, factor * this.b, this.a);
  }

  toArray(): [number, number, number, number] {
    return [
      Math.floor(this.r * 255),
      Math.floor(this.g * 255),
      Math.floor(this.b * 255),
      this.a,
    ];
  }

  toStyle(): string {
    return (
      'rgba(' +
      `${Math.floor(this.r * 255)},` +
      `${Math.floor(this.g * 255)},` +
      `${Math.floor(this.b * 255)},` +
      `${this.a}` +
      ')'
    );
  }
}
