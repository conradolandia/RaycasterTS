import './style.css';

// Constants
const FOV = Math.PI * 0.5;
const EPSILON = 1e-6;
const PLAYER_SIZE = 0.5;
const PLAYER_SPEED = 2.5;
const FAR_CLIPPING_PLANE = 10.0;
const NEAR_CLIPPING_PLANE = 0.1;
const GRID_SCALED_LINE_WIDTH = 0.05;

// If we use flexible dimensions, some resolutions
// will create an artifact that looks weird.
// This effect dissappears with a resolution of 0.3
// or by using a fixed width and height
const SCREEN_RESOLUTION = 0.3;
const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const SCREEN_WIDTH = Math.floor(CANVAS_WIDTH * SCREEN_RESOLUTION);
const SCREEN_HEIGHT = Math.floor(CANVAS_HEIGHT * SCREEN_RESOLUTION);

// Colors
const WALL_COLOR = '#303030';

// Classes

// Represents a color
class Color {
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

  static dark_grey(): Color {
    return new Color(0.2, 0.2, 0.2, 1);
  }

  static light_grey(): Color {
    return new Color(0.3, 0.3, 0.3, 1);
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

// Represents a 2D vector
class Vector2 {
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

  static fromScalar(scalar: number): Vector2 {
    return new Vector2(scalar, scalar);
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

  roundDown(): Vector2 {
    return new Vector2(Math.floor(this.x), Math.floor(this.y));
  }

  map(callback: (n: number) => number): Vector2 {
    return new Vector2(callback(this.x), callback(this.y));
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

// Represents a block
type Block = Color | HTMLImageElement | null;

// Represents a scene
class Scene {
  walls: Block[];
  floor: Block;
  width: number;
  height: number;
  gray1: Color;
  gray2: Color;
  color1: Color;
  color2: Color;

  constructor(walls: Block[][], floor: Block) {
    this.gray1 = Color.dark_grey();
    this.gray2 = Color.light_grey();
    this.color1 = Color.red();
    this.color2 = Color.blue();
    this.floor = floor;
    this.height = walls.length;
    this.width = Number.MIN_VALUE;

    for (let row of walls) {
      this.width = Math.max(this.width, row.length);
    }

    this.walls = [];

    for (let row of walls) {
      this.walls = this.walls.concat(row);
      for (let i = 0; i < this.width - row.length; i++) {
        this.walls.push(null);
      }
    }
  }

  size(): Vector2 {
    return new Vector2(this.width, this.height);
  }

  contains(p: Vector2): boolean {
    return 0 <= p.x && p.x < this.width && 0 <= p.y && p.y < this.height;
  }

  getWall(p: Vector2): Block | undefined {
    if (!this.contains(p)) return undefined;
    const fp = p.roundDown();
    return this.walls[fp.y * this.width + fp.x];
  }

  getTiles(p: Vector2, ceiling = false, textures = false): Block | undefined {
    if (!textures) {
      const t = p.roundDown();
      if ((t.x + t.y) % 2 === 0) {
        if (ceiling) {
          return this.color1;
        }
        return this.gray1;
      } else {
        if (ceiling) {
          return this.color2;
        }
        return this.gray2;
      }
    }
    return this.floor;
  }

  isWall(p: Vector2): boolean {
    return this.getWall(p) !== null && this.getWall(p) !== undefined;
  }

  validPosition(newPosition: Vector2): boolean {
    // TODO: try a circle instead of a square
    const corner = newPosition.sub(Vector2.fromScalar(PLAYER_SIZE * 0.5));
    for (let dx = 0; dx < 2; dx++) {
      for (let dy = 0; dy < 2; dy++) {
        if (this.isWall(corner.add(new Vector2(dx, dy).scale(PLAYER_SIZE)))) {
          return false;
        }
      }
    }

    return true;
  }
}

// Represents the player
class Player {
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

// Load an image as a HTMLImageElement
const loadImageData = (url: string): Promise<HTMLImageElement> => {
  const image = new Image();
  image.src = url;

  return new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = reject;
  });
};

// Snap to grid
const snapToGrid = (x: number, dx: number): number => {
  if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPSILON);
  if (dx < 0) return Math.floor(x + Math.sign(dx) * EPSILON);
  return x;
};

// Draw a line
const strokeLine = (
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
const filledCircle = (
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
const filledRect = (
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
const rayStep = (p1: Vector2, p2: Vector2): Vector2 => {
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
const castRay = (scene: Scene, p1: Vector2, p2: Vector2): Vector2 => {
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
const canvasSize = (ctx: CanvasRenderingContext2D): Vector2 => {
  return new Vector2(ctx.canvas.width, ctx.canvas.height);
};

// hitting wall
const hittingWall = (p1: Vector2, p2: Vector2): Vector2 => {
  const d = p2.sub(p1);
  return new Vector2(
    Math.floor(p2.x + Math.sign(d.x) * EPSILON),
    Math.floor(p2.y + Math.sign(d.y) * EPSILON)
  );
};

// distance point to line
const distancePointToLine = (p1: Vector2, p2: Vector2, p0: Vector2) => {
  const dy = p2.y - p1.y;
  const dx = p2.x - p1.x;
  const d = p2.x * p1.y - p1.x * p2.y;
  if (dx === 0) return Math.abs(p0.y - p1.y);
  if (dy === 0) return Math.abs(p0.x - p1.x);
  return Math.abs(dy * p0.x - dx * p0.y + d) / Math.sqrt(dy * dy + dx * dx);
};

//Render the minimap
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

// Render the walls
const renderWallsToImageData = (
  imageData: ImageData,
  scene: Scene,
  player: Player
) => {
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

    if (wall instanceof Color) {
      const color = wall.brightness(brightness);
      for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
        const y = Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5) + dy;
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 0] = Math.floor(
          color.r * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 1] = Math.floor(
          color.g * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 2] = Math.floor(
          color.b * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 3] = Math.floor(
          color.a * 255
        );
      }
    } else if (wall instanceof HTMLImageElement) {
      const color = Color.magenta().brightness(brightness);
      for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
        const y = Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5) + dy;
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 0] = Math.floor(
          color.r * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 1] = Math.floor(
          color.g * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 2] = Math.floor(
          color.b * 255
        );
        imageData.data[(y * SCREEN_WIDTH + x) * 4 + 3] = Math.floor(
          color.a * 255
        );
      }
      /*
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
        x,
        (SCREEN_HEIGHT - stripHeight) * 0.5,
        1,
        stripHeight,
      );

      ctx.fillStyle = new Color(0, 0, 0, 1 - brightness).toStyle();
      ctx.fillRect(...resOptions);
      */
    }
  }

  return ImageData;
};

const renderWalls = (
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
      Math.floor(x),
      Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5),
      1,
      Math.ceil(stripHeight),
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

// Render the floor/ceiling
const renderSurfaceIntoImageData = (
  imageData: ImageData,
  scene: Scene,
  player: Player,
  floor = true
) => {
  const pz = SCREEN_HEIGHT / 2;
  const [p1, p2] = player.fov();
  const bp = p1.sub(player.position).mag();

  for (let y = SCREEN_HEIGHT / 2; y < SCREEN_HEIGHT; ++y) {
    const sz = SCREEN_HEIGHT - y - 1;

    const ap = pz - sz;
    const b = (bp / ap) * pz / NEAR_CLIPPING_PLANE;
    const t1 = player.position.add(p1.sub(player.position).norm().scale(b));
    const t2 = player.position.add(p2.sub(player.position).norm().scale(b));

    for (let x = 0; x < SCREEN_WIDTH; ++x) {
      const t = t1.lerp(t2, x / SCREEN_WIDTH);
      let tile;

      if (floor) {
        tile = scene.getTiles(t);
      } else {
        tile = scene.getTiles(t, true, false);
      }

      if (tile instanceof Color) {
        const color = tile.brightness(1 / Math.sqrt(player.position.sqrtDistanceTo(t)));
        let surface;

        if (floor) {
          surface = y
        } else {
          surface = sz
        }

        imageData.data[(surface*SCREEN_WIDTH + x) * 4 + 0] = Math.floor(color.r * 255);
        imageData.data[(surface*SCREEN_WIDTH + x) * 4 + 1] = Math.floor(color.g * 255);
        imageData.data[(surface*SCREEN_WIDTH + x) * 4 + 2] = Math.floor(color.b * 255);
        imageData.data[(surface*SCREEN_WIDTH + x) * 4 + 3] = Math.floor(color.a * 255);
      }
    }
  }
};

const renderSurface = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player,
  floor = true
) => {
  ctx.save();
  ctx.scale(ctx.canvas.width / SCREEN_WIDTH, ctx.canvas.height / SCREEN_HEIGHT);

  const pz = SCREEN_HEIGHT / 2;
  const [p1, p2] = player.fov();
  const bp = p1.sub(player.position).mag();

  for (let y = SCREEN_HEIGHT / 2; y < SCREEN_HEIGHT; ++y) {
    const sz = SCREEN_HEIGHT - y - 1;
    const ap = pz - sz;
    const b = ((bp / ap) * pz) / NEAR_CLIPPING_PLANE;
    const t1 = player.position.add(p1.sub(player.position).norm().scale(b));
    const t2 = player.position.add(p2.sub(player.position).norm().scale(b));

    for (let x = 0; x < SCREEN_WIDTH; ++x) {
      const t = t1.lerp(t2, x / SCREEN_WIDTH);
      let tile;

      if (floor) {
        tile = scene.getTiles(t);
      } else {
        tile = scene.getTiles(t, true, false);
      }

      if (tile instanceof Color) {
        ctx.fillStyle = tile
          .brightness(1 / Math.sqrt(player.position.sqrtDistanceTo(t)))
          .toStyle();
        if (floor) {
          ctx.fillRect(x, y, 1, 1);
        } else {
          ctx.fillRect(x, sz, 1, 1);
        }
      } else if (tile instanceof HTMLImageElement) {
        const c = t.map(x => x - Math.floor(x));
        ctx.drawImage(
          tile,
          Math.floor(c.x * tile.width),
          Math.floor(c.y * tile.height),
          1,
          1,
          x,
          y,
          1,
          1
        );
      }
    }
  }

  ctx.restore();
};

// Render the game
const renderGameIntoImageData = (
  imageData: ImageData,
  scene: Scene,
  player: Player
) => {
  imageData.data.fill(255);
  // Floor
  renderSurfaceIntoImageData(imageData, scene, player, true);
  // Ceiling
  renderSurfaceIntoImageData(imageData, scene, player, false);
  // Walls
  renderWallsToImageData(imageData, scene, player);
};

const renderGame = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player
) => {
  const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.015));
  const wallSize = ctx.canvas.width * 0.02;
  const minimapSize = scene.size().scale(wallSize);

  // fake ceiling
  ctx.fillStyle = '#404040';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // fake Floor
  ctx.fillStyle = '#202020';
  ctx.fillRect(
    0,
    ctx.canvas.height * 0.5,
    ctx.canvas.width,
    ctx.canvas.height * 0.5
  );

  // Real floor and ceiling
  renderSurface(ctx, scene, player);
  renderSurface(ctx, scene, player, false);

  // Walls
  renderWalls(ctx, scene, player);

  // Minimap
  minimap(ctx, player, minimapPosition, minimapSize, scene);

  // Info
  //showInfo(ctx,player)
};

const testBackCanvas = (ctx: CanvasRenderingContext2D) => {
  const w = 16;
  const h = 9;

  const backImageData = new ImageData(w, h);
  const backCanvas = new OffscreenCanvas(w, h);
  const backCtx = backCanvas.getContext(
    '2d'
  ) as CanvasRenderingContext2D | null;

  if (!backCtx) {
    throw new Error('Could not get 2D context from offscren canvas');
  }

  backCtx.imageSmoothingEnabled = false;

  for (let y = 0; y < h; ++y) {
    for (let x = 0; x < w; ++x) {
      if ((x + y) % 2 === 0) {
        backImageData.data[(y * w + x) * 4 + 0] = 255;
        backImageData.data[(y * w + x) * 4 + 1] = 0;
        backImageData.data[(y * w + x) * 4 + 2] = 0;
        backImageData.data[(y * w + x) * 4 + 3] = 255;
      } else {
        backImageData.data[(y * w + x) * 4 + 0] = 255;
        backImageData.data[(y * w + x) * 4 + 1] = 255;
        backImageData.data[(y * w + x) * 4 + 2] = 255;
        backImageData.data[(y * w + x) * 4 + 3] = 255;
      }
    }
  }

  backCtx.putImageData(backImageData, 0, 0);
  ctx.drawImage(backCanvas, 0, 0, ctx.canvas.width, ctx.canvas.height);
  // ctx.putImageData(backImageData, 0, 0);
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

  ctx.imageSmoothingEnabled = false;

  const backImageData = new ImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
  const backCanvas = new OffscreenCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
  const backCtx = backCanvas.getContext(
    '2d'
  ) as CanvasRenderingContext2D | null;

  if (!backCtx) {
    throw new Error('Could not get 2D context from offscren canvas');
  }

  backCtx.imageSmoothingEnabled = false;

  //testBackCanvas(ctx);

  const wall1 = await loadImageData('./assets/images/wall1_color.png').catch(
    () => Color.purple()
  );
  const wall2 = await loadImageData('./assets/images/wall2_color.png').catch(
    () => Color.purple()
  );
  const wall3 = await loadImageData('./assets/images/wall3_color.png').catch(
    () => Color.purple()
  );
  const wall4 = await loadImageData('./assets/images/wall4_color.png').catch(
    () => Color.purple()
  );
  const suelo = await loadImageData('./assets/images/wood.png').catch(() =>
    Color.black()
  );
  const planks = await loadImageData('./assets/images/planks.png').catch(() =>
    Color.black()
  );
  const ysangrim = await loadImageData('./assets/images/pacho.png').catch(() =>
    Color.cyan()
  );

  // Create the scene
  const scene: Scene = new Scene(
    [
      [null, null, wall1, wall2, planks, planks, planks, planks, planks],
      [null, null, null, wall3, null, null, null, null, planks],
      [null, wall4, wall1, wall2, null, null, null, null, wall1],
      [null, null, null, null, null, null, null, planks, wall1],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, ysangrim, null, null, null],
      [null, null, null, null, null, null, null, null, null],
    ],
    suelo
  );

  // Create the player
  const player = new Player(
    scene.size().mul(new Vector2(0.63, 0.63)),
    Math.PI * 1.25,
    Vector2.zero()
  );

  // Draw the game
  // Controls
  let movingLeft = false;
  let movingRight = false;
  let rotatingLeft = false;
  let rotatingRight = false;
  let movingForward = false;
  let movingBackward = false;
  let prevTimestamp: number = 0;

  const frame = (timestamp: number) => {
    player.velocity = Vector2.zero();
    let angularVelocity = 0.0;
    const deltaTime = prevTimestamp ? (timestamp - prevTimestamp) / 1000 : 0;
    prevTimestamp = timestamp;

    // Move the player
    if (movingForward) {
      player.velocity = player.velocity.add(
        Vector2.fromAngle(player.direction).scale(PLAYER_SPEED)
      );
    }

    if (movingBackward) {
      player.velocity = player.velocity.sub(
        Vector2.fromAngle(player.direction).scale(PLAYER_SPEED)
      );
    }

    if (movingLeft) {
      player.velocity = player.velocity.add(
        Vector2.fromAngle(player.direction - Math.PI * 0.5).scale(PLAYER_SPEED)
      );
    }

    if (movingRight) {
      player.velocity = player.velocity.add(
        Vector2.fromAngle(player.direction + Math.PI * 0.5).scale(PLAYER_SPEED)
      );
    }

    if (rotatingLeft) {
      angularVelocity -= Math.PI / PLAYER_SPEED;
    }

    if (rotatingRight) {
      angularVelocity += Math.PI / PLAYER_SPEED;
    }

    player.direction += angularVelocity * deltaTime;

    const nx = player.position.x + player.velocity.x * deltaTime;
    if (scene.validPosition(new Vector2(nx, player.position.y))) {
      player.position.x = nx;
    }

    const ny = player.position.y + player.velocity.y * deltaTime;
    if (scene.validPosition(new Vector2(player.position.x, ny))) {
      player.position.y = ny;
    }

    renderGameIntoImageData(backImageData, scene, player);
    backCtx.putImageData(backImageData, 0, 0);
    ctx.drawImage(backCanvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillText(`FPS: ${Math.round(1 / deltaTime)}`, 10, 20);

    //renderGame(ctx, scene, player);

    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame((timestamp: number) => {
    prevTimestamp = timestamp;
    window.requestAnimationFrame(frame);
  });

  // Handle input
  window.addEventListener('keydown', e => {
    switch (e.code) {
      case 'ArrowUp':
        movingForward = true;
        break;
      case 'ArrowDown':
        movingBackward = true;
        break;
      case 'ArrowLeft':
        movingLeft = true;
        break;
      case 'ArrowRight':
        movingRight = true;
        break;
      case 'KeyD':
        rotatingRight = true;
        break;
      case 'KeyA':
        rotatingLeft = true;
        break;
    }
  });

  // Handle input
  window.addEventListener('keyup', e => {
    switch (e.code) {
      case 'ArrowUp':
        movingForward = false;
        break;
      case 'ArrowDown':
        movingBackward = false;
        break;
      case 'ArrowLeft':
        movingLeft = false;
        break;
      case 'ArrowRight':
        movingRight = false;
        break;
      case 'KeyD':
        rotatingRight = false;
        break;
      case 'KeyA':
        rotatingLeft = false;
        break;
    }
  });
})();
