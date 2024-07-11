import { Scene, Player, Vector2, Color } from './classes';

import {
  EPSILON,
  FAR_CLIPPING_PLANE,
  NEAR_CLIPPING_PLANE,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
  WALL_COLOR,
  GRID_SCALED_LINE_WIDTH,
  PLAYER_SIZE,
} from './constants';

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

// Draw a filled rectangle
export const filledRect = (
  ctx: CanvasRenderingContext2D,
  position: Vector2,
  size: number,
  color: string | CanvasGradient | CanvasPattern,
  stroke = false
) => {
  const np = position.map(x => x - size / 2);
  ctx.beginPath();
  if (stroke) {
    ctx.strokeStyle = color;
    ctx.strokeRect(...position.array(), size, size);
  } else {
    ctx.fillStyle = color;
    ctx.fillRect(...np.array(), size, size);
  }
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

// Cast ray
export const castRay = (scene: Scene, p1: Vector2, p2: Vector2): Vector2 => {
  let start = p1;
  while (start.sqrtDistanceTo(p2) < FAR_CLIPPING_PLANE ** 2) {
    const c = hittingWall(p1, p2);
    if (scene.getWall(c) !== undefined && scene.getWall(c) !== null) break;
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

// hitting wall
export const hittingWall = (p1: Vector2, p2: Vector2): Vector2 => {
  const d = p2.sub(p1);
  return new Vector2(
    Math.floor(p2.x + Math.sign(d.x) * EPSILON),
    Math.floor(p2.y + Math.sign(d.y) * EPSILON)
  );
};

// distance point to line
export const distancePointToLine = (p1: Vector2, p2: Vector2, p0: Vector2) => {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  const d = p2.x * p1.y - p1.x * p2.y;
  if (dx === 0) return Math.abs(p0.y - p1.y);
  if (dy === 0) return Math.abs(p0.x - p1.x);
  return Math.abs(dy * p0.x - dx * p0.y + d) / Math.sqrt(dy * dy + dx * dx);
};

// Render
// Minimap
export const minimap = (
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
      const wall = scene.getWall(new Vector2(x, y));
      if (wall instanceof Color) {
        ctx.fillStyle = wall.toStyle();
        ctx.fillRect(x, y, 1, 1);
      } else if (wall instanceof HTMLImageElement) {
        ctx.drawImage(wall, x, y, 1, 1);
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

  // Adjust the player position to the minimap
  const adjustmentPosition = new Vector2(PLAYER_SIZE / 2, PLAYER_SIZE / 2);

  // Draw the player
  filledRect(
    ctx,
    player.position.sub(adjustmentPosition),
    PLAYER_SIZE,
    'magenta',
    true
  );

  // Draw the FAR projection of the FOV
  //const [far1, far2] = player.fov(FAR_CLIPPING_PLANE);
  //strokeLine(ctx, far1, far2, 'cyan');
  //strokeLine(ctx, player.position, far1, 'cyan');
  //strokeLine(ctx, player.position, far2, 'cyan');

  // Draw the NEAR projection of the FOV
  const [near1, near2] = player.fov();
  strokeLine(ctx, near1, near2, 'yellow');
  strokeLine(ctx, player.position, near1, 'yellow');
  strokeLine(ctx, player.position, near2, 'yellow');

  // Restore the context
  ctx.restore();
};

export const renderWalls = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player
) => {
  ctx.save();
  ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);

  const [r1, r2] = player.fov();

  for (let x = 0; x < SCREEN_WIDTH; x++) {
    const point = castRay(
      scene,
      player.position,
      r1.lerp(r2, x / SCREEN_WIDTH)
    );

    const c = hittingWall(player.position, point);
    const wall = scene.getWall(c);
    const position = point.sub(player.position);
    const distance = Vector2.fromAngle(player.direction);
    const stripHeight = SCREEN_HEIGHT / position.dot(distance);
    const brightness = 1 / position.dot(distance);

    const resOptions: [number, number, number, number] = [
      x,
      (SCREEN_HEIGHT - stripHeight) * 0.5,
      1,
      stripHeight,
    ];

    if (wall instanceof Color) {
      ctx.fillStyle = wall.brightness(brightness).toStyle();
      ctx.fillRect(...resOptions);
    } else if (wall instanceof HTMLImageElement) {
      const t = point.sub(c);
      let u = 0;

      if ((Math.abs(t.x) < EPSILON || Math.abs(t.x - 1) < EPSILON) && t.y > 0) {
        u = t.y;
      } else {
        u = t.x;
      }

      ctx.drawImage(
        wall,
        Math.floor(u * wall.width),
        0,
        1,
        wall.height,
        ...resOptions
      );

      ctx.fillStyle = new Color(0, 0, 0, 1 - brightness).toStyle();
      ctx.fillRect(...resOptions);
    }
  }

  ctx.restore();
};

export const renderCeiling = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  scene: Scene
) => {
  ctx.save();
  ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);

  const pz = SCREEN_HEIGHT / 2;
  const [p1, p2] = player.fov();
  const bp = p1.sub(player.position).mag();

  for (let y = SCREEN_HEIGHT/2; y < SCREEN_HEIGHT; ++y) {
    const sz = SCREEN_HEIGHT - y - 1;

    const ap = (pz - sz);
    const b = bp / ap * pz / NEAR_CLIPPING_PLANE;
    const t1 = player.position.add(p1.sub(player.position).norm().scale(b));
    const t2 = player.position.add(p2.sub(player.position).norm().scale(b));

    for (let x = 0; x < SCREEN_WIDTH; ++x) {
      const t = t1.lerp(t2, x / SCREEN_WIDTH);
      const tile = scene.getTiles(t, true, true);

      if (tile instanceof Color) {
        ctx.fillStyle = tile.toStyle();
        ctx.fillRect(x, sz, 1, 1);
      } else if (tile instanceof HTMLImageElement) {
        const c = t.map(x => x - Math.floor(x));
        ctx.drawImage(tile, Math.floor(c.x*tile.width), Math.floor(c.y * tile.height), 1, 1, x, y, 1, 1);
      }
    }
  }

  ctx.restore();
};

export const renderFloor = (
  ctx: CanvasRenderingContext2D,
  player: Player,
  scene: Scene
) => {
  ctx.save();
  ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);

  const pz = SCREEN_HEIGHT / 2;
  const [p1, p2] = player.fov();
  const bp = p1.sub(player.position).mag();

  for (let y = SCREEN_HEIGHT/2; y < SCREEN_HEIGHT; ++y) {
    const sz = SCREEN_HEIGHT - y - 1;

    const ap = (pz - sz);
    const b = bp / ap * pz / NEAR_CLIPPING_PLANE;
    const t1 = player.position.add(p1.sub(player.position).norm().scale(b));
    const t2 = player.position.add(p2.sub(player.position).norm().scale(b));

    for (let x = 0; x < SCREEN_WIDTH; ++x) {
      const t = t1.lerp(t2, x / SCREEN_WIDTH);
      const tile = scene.getTiles(t);

      if (tile instanceof Color) {
        ctx.fillStyle = tile.toStyle();
        ctx.fillRect(x, y, 1, 1);
      } else if (tile instanceof HTMLImageElement) {
        const c = t.map(x => x - Math.floor(x));
        ctx.drawImage(tile, Math.floor(c.x*tile.width), Math.floor(c.y * tile.height), 1, 1, x, y, 1, 1);
      }
    }
  }

  ctx.restore();
};

export const renderGame = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player,
  fillColor: string
) => {
  const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.015));
  const wallSize = ctx.canvas.width * 0.02;
  const minimapSize = scene.size().scale(wallSize);

  // Sky
  ctx.fillStyle = fillColor;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Floor
  ctx.fillStyle = '#202020';
  ctx.fillRect(
    0,
    ctx.canvas.height * 0.5,
    ctx.canvas.width,
    ctx.canvas.height * 0.5
  );
  renderFloor(ctx, player, scene);
  renderCeiling(ctx, player, scene);
  renderWalls(ctx, scene, player);
  minimap(ctx, player, minimapPosition, minimapSize, scene);
  //showInfo(ctx,player)
};

// Show the speed of the game on a string in the top right corener
export const showInfo = (ctx: CanvasRenderingContext2D, player: Player) => {
  ctx.textAlign = 'right';
  ctx.font = '12px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText(
    `Speed: ${player.velocity.mag()}`,
    ctx.canvas.width - 20,
    ctx.canvas.height - 35
  );
  ctx.fillText(
    `Direction: ${Math.round((player.direction * 180) / Math.PI)}`,
    ctx.canvas.width - 20,
    ctx.canvas.height - 20
  );
};
