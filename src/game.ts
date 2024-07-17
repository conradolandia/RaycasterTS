// Constants
export const FOV = Math.PI * 0.5;
export const EPSILON = 1e-6;
export const PLAYER_SIZE = 0.5;
export const PLAYER_SPEED = 2.5;
export const FAR_CLIPPING_PLANE = 10.0;
export const NEAR_CLIPPING_PLANE = 0.1;
export const GRID_SCALED_LINE_WIDTH = 0.05;

// If we use flexible dimensions, some resolutions
// will create an artifact that looks weird.
// This effect dissappears with a resolution of 0.3
// or by using a fixed width and height
export const SCREEN_RESOLUTION = 0.3;
export const CANVAS_WIDTH = window.innerWidth;
export const CANVAS_HEIGHT = window.innerHeight;
export const SCREEN_WIDTH = Math.floor(CANVAS_WIDTH * SCREEN_RESOLUTION);
export const SCREEN_HEIGHT = Math.floor(CANVAS_HEIGHT * SCREEN_RESOLUTION);


// Colors
export const WALL_COLOR = "#303030";


// Utility functions
// Snap to grid
const snapToGrid = (x: number, dx: number): number => {
    if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPSILON);
    if (dx < 0) return Math.floor(x + Math.sign(dx) * EPSILON);
    return x;
};

// Draw a line
const strokeLine = (ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2, color: string | CanvasGradient | CanvasPattern) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
    ctx.closePath();
};

// Draw a filled rectangle
const filledRect = (ctx: CanvasRenderingContext2D, position: Vector2, size: number, color: string | CanvasGradient | CanvasPattern, stroke = false) => {
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
        if (sceneGetWall(scene, c) !== undefined && sceneGetWall(scene, c) !== null) break;
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

// Hitting wall
const hittingWall = (p1: Vector2, p2: Vector2): Vector2 => {
    const d = p2.sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPSILON), Math.floor(p2.y + Math.sign(d.y) * EPSILON));
};

// Render the minimap
const renderMinimap = (ctx: CanvasRenderingContext2D, player: Player, position: Vector2, size: Vector2, scene: Scene): Vector2 | void => {
    // Clear the context
    ctx.save();

    // Grid size
    const gridSize = sceneSize(scene);

    // Scale and translate the canvas
    ctx.translate(...position.array());
    ctx.scale(...size.div(gridSize).array());
    ctx.lineWidth = GRID_SCALED_LINE_WIDTH;

    // Fill the minimap
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ...gridSize.array());

    // Draw the walls
    for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
            const wall = sceneGetWall(scene, new Vector2(x, y));
            if (wall instanceof Color) {
                ctx.fillStyle = wall.toStyle();
                ctx.fillRect(x, y, 1, 1);
            } else if (wall instanceof ImageData) {
                // TODO: Render the image data
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
    filledRect(ctx, player.position.sub(adjustmentPosition), PLAYER_SIZE, "magenta", true);

    // Draw the FAR projection of the FOV
    //const [far1, far2] = player.fov(FAR_CLIPPING_PLANE);
    //strokeLine(ctx, far1, far2, 'cyan');
    //strokeLine(ctx, player.position, far1, 'cyan');
    //strokeLine(ctx, player.position, far2, 'cyan');

    // Draw the NEAR projection of the FOV
    const [near1, near2] = playerFov(player);
    strokeLine(ctx, near1, near2, "yellow");
    strokeLine(ctx, player.position, near1, "yellow");
    strokeLine(ctx, player.position, near2, "yellow");

    // Restore the context
    ctx.restore();
};

// Render the walls
const renderWallsToImageData = (imageData: ImageData, scene: Scene, player: Player) => {
    const [r1, r2] = playerFov(player);

    for (let x = 0; x < SCREEN_WIDTH; x++) {
        const point = castRay(scene, player.position, r1.lerp(r2, x / SCREEN_WIDTH));
        const c = hittingWall(player.position, point);
        const wall = sceneGetWall(scene, c);
        const position = point.sub(player.position);
        const distance = Vector2.fromAngle(player.direction);
        const stripHeight = SCREEN_HEIGHT / position.dot(distance);

        if (wall instanceof Color) {
            const brightness = 1 / position.dot(distance);
            const color = wall.brightness(brightness);
            const colorr = Math.floor(color.r * 255);
            const colorg = Math.floor(color.g * 255);
            const colorb = Math.floor(color.b * 255);
            const colora = Math.floor(color.a * 255);

            for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
                const y = Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5) + dy;
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 0] = colorr;
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 1] = colorg;
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 2] = colorb;
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 3] = colora;
            }
        } else if (wall instanceof ImageData) {
            const t = point.sub(c);
            let u = 0;

            if ((Math.abs(t.x) < EPSILON || Math.abs(t.x - 1) < EPSILON) && t.y > 0) {
                u = t.y;
            } else {
                u = t.x;
            }

            for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
                const v = dy / Math.ceil(stripHeight);
                const tx = Math.floor(u * wall.width);
                const ty = Math.floor(v * wall.height);
                const y = Math.floor((SCREEN_HEIGHT - stripHeight) * 0.5) + dy;

                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 0] = wall.data[(ty * wall.width + tx) * 4 + 0] / position.dot(distance);
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 1] = wall.data[(ty * wall.width + tx) * 4 + 1] / position.dot(distance);
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 2] = wall.data[(ty * wall.width + tx) * 4 + 2] / position.dot(distance);
                imageData.data[(y * SCREEN_WIDTH + x) * 4 + 3] = wall.data[(ty * wall.width + tx) * 4 + 3];
            }
        }
    }

    return ImageData;
};

// Render the floor/ceiling
const renderSurfaceIntoImageData = (imageData: ImageData, scene: Scene, player: Player, ceiling = false) => {
    const pz = SCREEN_HEIGHT / 2;
    const [p1, p2] = playerFov(player);
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

            if (ceiling) {
                tile = sceneGetCeiling(t);
            } else {
                tile = sceneGetFloor(t);
            }

            if (tile instanceof Color) {
                const color = tile.brightness(1 / Math.sqrt(player.position.sqrtDistanceTo(t)));
                let surface;

                if (ceiling) {
                    surface = y;
                } else {
                    surface = sz;
                }

                imageData.data[(surface * SCREEN_WIDTH + x) * 4 + 0] = Math.floor(color.r * 255);
                imageData.data[(surface * SCREEN_WIDTH + x) * 4 + 1] = Math.floor(color.g * 255);
                imageData.data[(surface * SCREEN_WIDTH + x) * 4 + 2] = Math.floor(color.b * 255);
                imageData.data[(surface * SCREEN_WIDTH + x) * 4 + 3] = Math.floor(color.a * 255);
            }
        }
    }
};

// Render the game
export const renderGameIntoImageData = (
    ctx: CanvasRenderingContext2D,
    backCtx: OffscreenCanvasRenderingContext2D,
    backImageData: ImageData,
    deltaTime: number,
    scene: Scene,
    player: Player
) => {
    const minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.015));
    const wallSize = ctx.canvas.width * 0.02;
    const minimapSize = sceneSize(scene).scale(wallSize);

    // Refill the background in each frame
    backImageData.data.fill(255);

    // Floor
    renderSurfaceIntoImageData(backImageData, scene, player, true);

    // Ceiling
    renderSurfaceIntoImageData(backImageData, scene, player, false);

    // Walls
    renderWallsToImageData(backImageData, scene, player);

    // Minimap
    backCtx.putImageData(backImageData, 0, 0);
    ctx.drawImage(backCtx.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    renderMinimap(ctx, player, minimapPosition, minimapSize, scene);
    ctx.fillStyle = "white";
    ctx.fillText(`FPS: ${Math.round(1 / deltaTime)}`, 10, 20);
};


// Classes

// Represents a color
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
        return [Math.floor(this.r * 255), Math.floor(this.g * 255), Math.floor(this.b * 255), this.a];
    }

    toStyle(): string {
        return "rgba(" + `${Math.floor(this.r * 255)},` + `${Math.floor(this.g * 255)},` + `${Math.floor(this.b * 255)},` + `${this.a}` + ")";
    }
}

// Represents a 2D vector
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
        return new Vector2(this.x * Math.cos(angle) - this.y * Math.sin(angle), this.x * Math.sin(angle) + this.y * Math.cos(angle));
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
type Block = Color | ImageData | null;

// Represents a scene
export interface Scene {
    walls: Block[];
    floor: Block;
    width: number;
    height: number;
}

const SCENE_FLOOR1 = Color.dark_grey();
const SCENE_FLOOR2 = Color.light_grey();
const SCENE_CEILING1 = Color.red();
const SCENE_CEILING2 = Color.blue();

export const createScene = (walls: Block[][], floor: Block): Scene => {
    const scene: Scene = {
        height: walls.length,
        width: Number.MIN_VALUE,
        floor: floor,
        walls: [],
    }

    for (let row of walls) {
        scene.width = Math.max(scene.width, row.length);
    }

    for (let row of walls) {
        scene.walls = scene.walls.concat(row);
        for (let i = 0; i < scene.width - row.length; i++) {
            scene.walls.push(null);
        }
    }

    return scene;
}

export const sceneSize = (scene: Scene): Vector2 => {
    return new Vector2(scene.width, scene.height);
}

const sceneContains = (scene: Scene, p: Vector2): boolean => {
    return 0 <= p.x && p.x < scene.width && 0 <= p.y && p.y < scene.height;
}

const sceneGetWall = (scene: Scene, p: Vector2): Block | undefined => {
    if (!sceneContains(scene, p)) return undefined;
    const fp = p.roundDown();
    return scene.walls[fp.y * scene.width + fp.x];
}

const sceneGetFloor = (p: Vector2): Block | undefined => {
    if ((Math.floor(p.x) + Math.floor(p.y)) % 2 === 0) {
        return SCENE_FLOOR1;
    } else {
        return SCENE_FLOOR2;
    }
}

const sceneGetCeiling = (p: Vector2): Block | undefined => {
    if ((Math.floor(p.x) + Math.floor(p.y)) % 2 === 0) {
        return SCENE_CEILING1;
    } else {
        return SCENE_CEILING2;
    }
}

const sceneIsWall = (scene: Scene, p: Vector2): boolean => {
    return sceneGetWall(scene, p) !== null && sceneGetWall(scene, p) !== undefined;
}

export const sceneValidPosition = (scene: Scene, position: Vector2, size: Vector2): boolean => {
    const halfSize = size.scale(0.5);
    const topLeftCorner = position.sub(halfSize).roundDown();
    const bottomRightCorner = position.add(halfSize).roundDown();

    for (let x = topLeftCorner.x; x <= bottomRightCorner.x; x++) {
        for (let y = topLeftCorner.y; y <= bottomRightCorner.y; y++) {
            if (sceneGetWall(scene, new Vector2(x, y))) {
                return false;
            }
        }
    }

    return true;
}

export interface Player {
    position: Vector2;
    direction: number;
    velocity: Vector2;
}

export const createPlayer = (position: Vector2, direction: number, velocity: Vector2): Player => {
    return {
        position,
        direction,
        velocity,
    };
};

const playerFov = (player: Player): [Vector2, Vector2] => {
    const l = Math.tan(FOV * 0.5) * NEAR_CLIPPING_PLANE;
    const p = player.position.add(Vector2.fromAngle(player.direction).scale(NEAR_CLIPPING_PLANE));
    const p1 = p.sub(p.sub(player.position).rotate90().norm().scale(l));
    const p2 = p.add(p.sub(player.position).rotate90().norm().scale(l));

    return [p1, p2];
};

