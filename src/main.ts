import './style.css';

import { Scene, Vector2 } from './types';

import {
  strokeLine,
  filledCircle,
  canvasSize,
  rayStep,
  hittingCell,
  scene,
  sceneSize,
} from './utils';

// Constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = CANVAS_WIDTH;

const FILL_COLOR = '#181818';
const WALL_COLOR = '#303030';
const GRID_SCALED_LINE_WIDTH = 0.02;

// Grid functions
const minimap = (
  ctx: CanvasRenderingContext2D,
  p2: Vector2 | undefined,
  position: Vector2,
  size: Vector2,
  scene: Scene
): Vector2 | void => {
  // Clear the canvas
  ctx.reset();

  // Fill the canvas
  ctx.fillStyle = FILL_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw lines
  ctx.strokeStyle = WALL_COLOR;
  ctx.lineWidth = GRID_SCALED_LINE_WIDTH;

  // Grid size
  const gridSize = sceneSize(scene);

  // Scale and translate the canvas
  ctx.scale(...size.div(gridSize).array());
  ctx.translate(...position.array());

  // Draw the walls
  for (let y = 0; y < gridSize.y; y++) {
    for (let x = 0; x < gridSize.x; x++) {
      if (scene[y][x] !== 0) {
        ctx.fillStyle = WALL_COLOR;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  // Draw the lines individually, for x...
  for (let x = 0; x <= gridSize.x; x++) {
    strokeLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y), WALL_COLOR);
  }

  // Draw the lines individually, for y...
  for (let y = 0; y <= gridSize.y; y++) {
    strokeLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y), WALL_COLOR);
  }

  // Draw the player
  let p1 = gridSize.mul(new Vector2(0.43, 0.54));
  filledCircle(ctx, p1, 0.2, 'magenta');

  // Draw the ray if we have a second point
  if (p2 !== undefined) {
    for (;;) {
      filledCircle(ctx, p2, 0.1, 'cyan');
      strokeLine(ctx, p1, p2, 'cyan');

      const c = hittingCell(p1, p2);

      if (
        c.x < 0 ||
        c.x >= gridSize.x ||
        c.y < 0 ||
        c.y >= gridSize.y ||
        scene[c.y][c.x] !== 0
      ) {
        break;
      }

      const p3 = rayStep(p1, p2);
      p1 = p2;
      p2 = p3;
    }
  }
};

// Start the app
(() => {
  const canvas = document.getElementById('app') as HTMLCanvasElement | null;

  if (!canvas) {
    throw new Error('Could not get canvas element');
  }

  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;

  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  let p2: Vector2 | undefined = undefined;

  canvas.addEventListener('mousemove', event => {
    p2 = new Vector2(event.offsetX, event.offsetY)
      .div(canvasSize(ctx))
      .mul(sceneSize(scene));
    minimap(ctx, p2, Vector2.zero(), canvasSize(ctx), scene);
  });

  minimap(ctx, p2, Vector2.zero(), canvasSize(ctx), scene);
})();
