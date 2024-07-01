import { Scene, Vector2 } from "./types";

const EPSILON = 1e-3;

// Map to screen
//const mapToScreen = (ctx: CanvasRenderingContext2D, p: Vector2): Vector2 => {
//  return new Vector2(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
//};

// Snap to grid
const snapToGrid = (x: number, dx: number): number => {
  if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPSILON);
  if (dx < 0) return Math.floor(x + Math.sign(dx) * EPSILON);
  return x;
};

// Draw a line
export const strokeLine = (
  ctx: CanvasRenderingContext2D,
  p1: Vector2,
  p2: Vector2,
  color: string | CanvasGradient | CanvasPattern
) => {
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.moveTo(...p1.array());
  ctx.lineTo(...p2.array());
  ctx.stroke();
  ctx.closePath();
};

// Draw a filled circle
export const filledCircle = (
  ctx: CanvasRenderingContext2D,
  center: Vector2,
  radius: number,
  color: string | CanvasGradient | CanvasPattern
) => {
  ctx.beginPath();
  ctx.arc(...center.array(), radius, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
};

// Ray step function
export const rayStep = (p1: Vector2, p2: Vector2): Vector2 => {
  let p3 = p2;
  const d = p2.sub(p1);
  if (d.x !== 0) {
    const k = d.y / d.x;
    const c = p1.y - k * p1.x;

    {
      const x3 = snapToGrid(p2.x, d.x);
      const y3 = k * x3 + c;
      p3 = new Vector2(x3, y3);
    }

    if (k !== 0) {
      const y3 = snapToGrid(p2.y, d.y);
      const x3 = (y3 - c) / k;
      let temp = new Vector2(x3, y3);

      if (p2.distanceTo(temp) < p2.distanceTo(p3)) {
        p3 = temp;
      }
    }
  } else {
    const y3 = snapToGrid(p2.y, d.y);
    p3 = new Vector2(p2.x, y3);
  }
  return p3;
};

// Canvas size
export const canvasSize = (ctx: CanvasRenderingContext2D): Vector2 => {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
};

// Scene size
export const sceneSize = (scene: Scene): Vector2 => {
  const y = scene.length;
  let x = Number.MIN_VALUE;
  for (let row of scene) {
    x = Math.max(x, row.length);
  }
  return new Vector2(x, y);
}


// hitting cell
export const hittingCell = (
  p1: Vector2,
  p2: Vector2,
): Vector2 => {
  const d = p2.sub(p1);
  return new Vector2(
    Math.floor(p2.x + Math.sign(d.x) * EPSILON),
    Math.floor(p2.y + Math.sign(d.y) * EPSILON)
  );
};

// Scene map
export let scene: Scene = [
  [0, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
];
