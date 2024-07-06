import './style.css';

import { Player, Scene, Vector2, Color } from './types';

// Constants
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WALL_COLOR,
  GRID_SCALED_LINE_WIDTH,
} from './constants';

// Utils
import {
  strokeLine,
  filledCircle,
  canvasSize,
  renderWorld,
} from './utils';

import { controls } from './controls';
import { loadImageData } from './textures';

// Minimap
const minimap = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  position: Vector2,
  size: Vector2,
  scene: Scene
): Vector2 | void => {
  // Clear the context
  ctx.save();

  // Grid size
  const gridSize = scene.size();

  // Scale and translate the canvas
  ctx.translate(...position.array());
  ctx.scale(...size.div(gridSize).array());
  ctx.lineWidth = GRID_SCALED_LINE_WIDTH;

  // Fill the minimap
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, ...gridSize.array());

  // Draw the walls
  for (let y = 0; y < gridSize.y; y++) {
    for (let x = 0; x < gridSize.x; x++) {
      const cell = scene.getCell(new Vector2(x, y));
      if (cell instanceof Color) {
        ctx.fillStyle = cell.toStyle();
        ctx.fillRect(x, y, 1, 1);
      } else if (cell instanceof HTMLImageElement) {
        ctx.drawImage(cell, x, y, 1, 1);
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

  // Draw the player and the POV
  filledCircle(ctx, player.position, 0.2, 'magenta');
  const [p1, p2] = player.fov();

  // Draw the camera
  strokeLine(ctx, p1, p2, 'yellow');
  strokeLine(ctx, player.position, p1, 'yellow');
  strokeLine(ctx, player.position, p2, 'yellow');

  // Restore the context
  ctx.restore();
};

const renderGame = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player,
  fillColor: string
) => {
  const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.015));
  const cellSize = ctx.canvas.width * 0.02;
  const minimapSize = scene.size().scale(cellSize);
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  renderWorld(ctx, scene, player);
  minimap(ctx, player, minimapPosition, minimapSize, scene);
  //showInfo(ctx,player);
};

// Start the app
(async () => {
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

  const ysangrim = await loadImageData('./assets/images/pacho.png').catch(() => Color.cyan());
  const wall1 = await loadImageData('./assets/images/wall1_color.png').catch(() => Color.purple());
  const wall2 = await loadImageData('./assets/images/wall2_color.png').catch(() => Color.purple());
  const wall3 = await loadImageData('./assets/images/wall3_color.png').catch(() => Color.purple());
  const wall4 = await loadImageData('./assets/images/wall4_color.png').catch(() => Color.purple());

  // Create the scene
  const scene: Scene = new Scene([
    [null, null, wall1, wall2, null, null, null, null, null],
    [null, null, null, wall3, null, null, null, null, null],
    [null, wall4, wall1, wall2, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, ysangrim, null, null, null],
    [null, null, null, null, null, null, null, null, null],
  ]);

  // Create the player
  const player = new Player(
    scene.size().mul(new Vector2(0.63, 0.63)),
    Math.PI * 1.25,
    Vector2.zero()
  );

  // Draw the game
  controls(ctx, scene, player, renderGame);

})();
