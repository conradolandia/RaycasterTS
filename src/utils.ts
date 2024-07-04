import { Scene, Player, Vector2 } from './types';

import { EPSILON, FAR_CLIPPING_PLANE, SCREEN_RESOLUTION } from './constants';

// Map to screen
export const mapToScreen = (ctx: CanvasRenderingContext2D, p: Vector2): Vector2 => {
  return new Vector2(p.x * ctx.canvas.width, p.y * ctx.canvas.height);
};

// Snap to grid
export const snapToGrid = (x: number, dx: number): number => {
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

      if (p2.sqrtDistanceTo(temp) < p2.sqrtDistanceTo(p3)) {
        p3 = temp;
      }
    }
  } else {
    const y3 = snapToGrid(p2.y, d.y);
    p3 = new Vector2(p2.x, y3);
  }
  return p3;
};

export const castRay = (scene: Scene, p1: Vector2, p2: Vector2): Vector2 => {
  let start = p1;
  while (start.sqrtDistanceTo(p2) < FAR_CLIPPING_PLANE ** 2) {
    const c = hittingCell(p1, p2);
    if (insideScene(scene, c) && scene[c.y][c.x] !== null) break;
    const p3 = rayStep(p1, p2);
    p1 = p2;
    p2 = p3;
  }
  return p2;
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
};

// hitting cell
export const hittingCell = (p1: Vector2, p2: Vector2): Vector2 => {
  const d = p2.sub(p1);
  return new Vector2(
    Math.floor(p2.x + Math.sign(d.x) * EPSILON),
    Math.floor(p2.y + Math.sign(d.y) * EPSILON)
  );
};

// Inside scene
export const insideScene = (scene: Scene, p: Vector2): boolean => {
  const size = sceneSize(scene);
  return p.x >= 0 && p.x < size.x && p.y >= 0 && p.y < size.y;
};

export const distancePointToLine = (p1: Vector2, p2: Vector2, p0: Vector2) => {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  const d = p2.x * p1.y - p1.x * p2.y;
  if (dx === 0) return Math.abs(p0.y - p1.y);
  if (dy === 0) return Math.abs(p0.x - p1.x);
  return Math.abs(dy * p0.x - dx * p0.y + d) / Math.sqrt(dy * dy + dx * dx);
};

// Render
export const renderWorld = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player
) => {
  const stripWidth = Math.ceil(ctx.canvas.width / SCREEN_RESOLUTION);
  const [r1, r2] = player.fov();

  for (let x = 0; x < SCREEN_RESOLUTION; x++) {
    const point = castRay(
      scene,
      player.position,
      r1.lerp(r2, x / SCREEN_RESOLUTION)
    );

    const cell = hittingCell(player.position, point);

    if (insideScene(scene, cell)) {
      const color = scene[cell.y][cell.x];
      if (color !== null) {
        const position = point.sub(player.position);
        const distance = Vector2.fromAngle(player.direction);
        const stripHeight = ctx.canvas.height / position.dot(distance);
        ctx.fillStyle = color.brightness(1/position.dot(distance)).toStyle();
        ctx.fillRect(
          x * stripWidth,
          (ctx.canvas.height - stripHeight) * 0.5,
          stripWidth,
          stripHeight
        );
      }
    }
  }
};

// Show the speed of the game on a string in the top right corener
export const showInfo = (ctx: CanvasRenderingContext2D, player: Player) => {
  ctx.textAlign = 'right';
  ctx.font = '12px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(`Speed: ${player.velocity.mag()}`, ctx.canvas.width - 20, ctx.canvas.height - 35);
  ctx.fillText(`Direction: ${Math.round(player.direction * 180 / Math.PI)}`, ctx.canvas.width - 20, ctx.canvas.height - 20);
};
