import "./style.css";

// Constants
const FOV = Math.PI * 0.5;
const COS_HALF_FOV = Math.cos(FOV * 0.5);
const EPSILON = 1e-6;
const PLAYER_SIZE = 0.5;
const PLAYER_SPEED = 2.5;
const SPRITE_SIZE = 0.3;
const FAR_CLIPPING_PLANE = 10.0;
const NEAR_CLIPPING_PLANE = PLAYER_SIZE * 0.375;
const GRID_SCALED_LINE_WIDTH = 0.05;

// If we use flexible dimensions, some resolutions will create an artifact that looks weird.
// This effect dissappears with an even/odd resolution (depending on the resolution)
// or by using a fixed width and height
const SCREEN_RESOLUTION = 0.2;
const CANVAS_WIDTH = 1600;//window.innerWidth;
const CANVAS_HEIGHT = 900;//window.innerHeight;
const SCREEN_WIDTH = Math.floor(CANVAS_WIDTH * SCREEN_RESOLUTION);
const SCREEN_HEIGHT = Math.floor(CANVAS_HEIGHT * SCREEN_RESOLUTION);

// Colors
const WALL_COLOR = "#303030";

// Classes
interface Pool<T> {
    items: T[];
    init: T;
    length: number;
}

function createPool<T>(init: T): Pool<T> {
    return {
        items: [] as T[],
        init,
        length: 0,
    };
}

function allocPool<T>(pool: Pool<T>): T {
    if (pool.length >= pool.items.length) {
        pool.items.push(Object.assign(Object.create(Object.getPrototypeOf(pool.init)), pool.init));
    }
    return pool.items[pool.length++];
}

function resetPool<T>(pool: Pool<T>) {
    pool.length = 0;
}

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
        return new Color(0.1, 0.1, 0.1, 1);
    }

    static light_grey(): Color {
        return new Color(0.15, 0.15, 0.15, 1);
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
class Vector2 {
    x: number;
    y: number;

    constructor(x: number = 0, y: number = 0) {
        this.x = x;
        this.y = y;
    }

    static zero(): Vector2 {
        return new Vector2(0, 0);
    }

    static angle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }

    static fromScalar(scalar: number): Vector2 {
        return new Vector2(scalar, scalar);
    }

    array(): [number, number] {
        return [this.x, this.y];
    }

    clone(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    copy(that: Vector2): this {
        this.x = that.x;
        this.y = that.y;
        return this;
    }

    setScalar(scalar: number): this {
        this.x = scalar;
        this.y = scalar;
        return this;
    }

    add(that: Vector2): this {
        this.x += that.x;
        this.y += that.y;
        return this;
    }

    sub(that: Vector2): this {
        this.x -= that.x;
        this.y -= that.y;
        return this;
    }

    mul(that: Vector2): this {
        this.x *= that.x;
        this.y *= that.y;
        return this;
    }

    div(that: Vector2): this {
        this.x /= that.x;
        this.y /= that.y;
        return this;
    }

    sqrMag(): number {
        return this.x * this.x + this.y * this.y;
    }

    mag(): number {
        return Math.sqrt(this.sqrMag());
    }

    scale(scalar: number): this {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    rotate90(): this {
        const oldX = this.x;
        this.x = -this.y;
        this.y = oldX;
        return this;
    }

    norm(): this {
        const l = this.mag();
        return l === 0 ? this : this.scale(1 / l);
    }

    roundDown(): this {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this;
    }

    map(callback: (n: number) => number): this {
        this.x = callback(this.x);
        this.y = callback(this.y);
        return this;
    }

    dot(that: Vector2): number {
        return this.x * that.x + this.y * that.y;
    }

    lerp(that: Vector2, t: number): this {
        this.x += (that.x - this.x) * t;
        this.y += (that.y - this.y) * t;
        return this;
    }

    sqrtDistanceTo(that: Vector2): number {
        const dx = that.x - this.x;
        const dy = that.y - this.y;
        return dx * dx + dy * dy;
    }

    distanceTo(that: Vector2): number {
        return Math.sqrt(this.sqrtDistanceTo(that));
    }
}

// Represents a block
type Block = Color | ImageData | null;

// Represents a scene
class Scene {
    walls: Block[];
    floor: Block;
    width: number;
    height: number;
    color1: Color;
    color2: Color;


    constructor(walls: Block[][], floor: Block) {
        this.color1 = Color.black();
        this.color2 = Color.dark_grey();
        this.height = walls.length;
        this.width = Number.MIN_VALUE;
        this.floor = floor;

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
        const fp = p.clone().roundDown();
        return this.walls[fp.y * this.width + fp.x];
    }

    getTiles(p: Vector2, ceiling = false, textures = false): Block | undefined {
        if (!textures) {
            const t = p.clone().roundDown();
            if ((t.x + t.y) % 2 === 0) {
                if (ceiling) return this.color1;
                return this.color1;
            } else {
                if (ceiling) return this.color2;
                return this.color2;
            }
        }
        return this.floor;
    }

    isWall(p: Vector2): boolean {
        return this.getWall(p) !== null && this.getWall(p) !== undefined;
    }

    validPosition(newPosition: Vector2): boolean {
        // TODO: try a circle instead of a square
        const corner = newPosition.clone().sub(Vector2.fromScalar(PLAYER_SIZE * 0.5));
        for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 2; dy++) {
                if (this.isWall(corner.clone().add(new Vector2(dx, dy).scale(PLAYER_SIZE)))) {
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
        const p = this.position.clone().add(Vector2.angle(this.direction).scale(NEAR_CLIPPING_PLANE));
        const p1 = p.clone().sub(p.clone().sub(this.position).rotate90().norm().scale(l));
        const p2 = p.clone().add(p.clone().sub(this.position).rotate90().norm().scale(l));

        return [p1, p2];
    }
}

// Load an image as a HTMLImageElement
function loadImage(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;

    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
}

async function loadImageData(url: string): Promise<ImageData> {
    // Load the image
    const image = await loadImage(url);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;

    if (!ctx) {
        throw new Error("Could not get 2D context from offscren canvas");
    }

    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height);
}

// Snap to grid
function snapToGrid(x: number, dx: number): number {
    if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPSILON);
    if (dx < 0) return Math.floor(x + Math.sign(dx) * EPSILON);
    return x;
}

function clamp(min: number, max: number, x: number): number {
    if (x < min) return min;
    if (x > max) return max;
    return x;
}

const poolV2: Pool<Vector2> = createPool(new Vector2());
const poolV3: Pool<Vector2> = createPool(new Vector2());

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
    const d = p2.clone().sub(p1);
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

// Hitting wall
const hittingWall = (p1: Vector2, p2: Vector2): Vector2 => {
    const d = p2.clone().sub(p1);
    return new Vector2(Math.floor(p2.x + Math.sign(d.x) * EPSILON), Math.floor(p2.y + Math.sign(d.y) * EPSILON));
};

// Render the minimap
const renderMinimap = (ctx: CanvasRenderingContext2D, player: Player, position: Vector2, size: Vector2, scene: Scene, sprites: Sprite[]): Vector2 | void => {
    // Clear the context
    ctx.save();

    // Grid size
    const gridSize = scene.size();

    // Scale and translate the canvas
    ctx.translate(...position.array());
    ctx.scale(...size.clone().div(gridSize).array());
    ctx.lineWidth = GRID_SCALED_LINE_WIDTH;

    // Fill the minimap
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, ...gridSize.array());

    // Draw the walls
    for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
            const wall = scene.getWall(new Vector2(x, y));
            if (wall instanceof Color) {
                ctx.fillStyle = wall.toStyle();
                ctx.fillRect(x, y, 1, 1);
            } else if (wall instanceof ImageData) {
                // TODO: Render the image data
                ctx.fillStyle = "cyan";
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
    filledRect(ctx, player.position.clone(), PLAYER_SIZE, "magenta", true);

    // Draw the FAR projection of the FOV
    //const [far1, far2] = player.fov(FAR_CLIPPING_PLANE);
    //strokeLine(ctx, far1, far2, 'cyan');
    //strokeLine(ctx, player.position, far1, 'cyan');
    //strokeLine(ctx, player.position, far2, 'cyan');

    // Draw the NEAR projection of the FOV
    const [p1, p2] = player.fov();
    strokeLine(ctx, p1, p2, "yellow");
    strokeLine(ctx, player.position, p1, "yellow");
    strokeLine(ctx, player.position, p2, "yellow");

    if (1) {
        const sp = new Vector2();
        const dir = Vector2.angle(player.direction);

        // Draw the direction of the player
        //strokeLine(ctx, player.position, player.position.clone().add(dir), "red");

        // Draw the sprites
        for (let sprite of sprites) {
            ctx.fillRect(sprite.position.x - SPRITE_SIZE * 0.5, sprite.position.y - SPRITE_SIZE * 0.5, SPRITE_SIZE, SPRITE_SIZE);

            sp.copy(sprite.position).sub(player.position);

            //strokeLine(ctx, player.position, player.position.clone().add(sp), "yellow");

            const spl = sp.mag();
            if (spl === 0) continue;

            const dot = sp.dot(dir) / spl;
            if (!(dot >= COS_HALF_FOV && dot <= 1)) continue;

            const distance = NEAR_CLIPPING_PLANE / dot;
            sp.norm().scale(distance).add(player.position);

            // t is the distance from the player to the sprite
            const t = p1.distanceTo(sp) / p1.distanceTo(p2);

            if (!(0 <= t && t <= 1.0)) continue;

            //ctx.fillStyle = "blue";
            //ctx.fillRect(sp.x - SPRITE_SIZE * 0.5, sp.y - SPRITE_SIZE * 0.5, SPRITE_SIZE, SPRITE_SIZE);
            //ctx.font = "0.025em monospace";
            //ctx.fillText(`${t}`, sp.x, sp.y);
        }
    }

    // Restore the context
    ctx.restore();
};

// Render the walls
const renderWalls = (display: Display, scene: Scene, player: Player) => {
    const [r1, r2] = player.fov();

    for (let x = 0; x < display.imageData.width; x++) {
        const point = castRay(scene, player.position, r1.clone().lerp(r2, x / display.imageData.width));
        const c = hittingWall(player.position, point);
        const wall = scene.getWall(c);
        const position = point.clone().sub(player.position);
        const distance = Vector2.angle(player.direction);

        display.zBuffer[x] = position.dot(distance);
        const stripHeight = display.imageData.height / display.zBuffer[x];

        if (wall instanceof Color) {
            const brightness = 1 / display.zBuffer[x];
            const color = wall.brightness(brightness);
            const colorr = Math.floor(color.r * 255);
            const colorg = Math.floor(color.g * 255);
            const colorb = Math.floor(color.b * 255);

            for (let dy = 0; dy < Math.ceil(stripHeight); dy++) {
                const y = Math.floor((display.imageData.height - stripHeight) * 0.5) + dy;
                const yw = (y * display.imageData.width + x) * 4;
                display.imageData.data[yw + 0] = colorr;
                display.imageData.data[yw + 1] = colorg;
                display.imageData.data[yw + 2] = colorb;
            }
        } else if (wall instanceof ImageData) {
            const t = point.clone().sub(c);
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
                const y = Math.floor((display.imageData.height - stripHeight) * 0.5) + dy;
                const yw = (y * display.imageData.width + x) * 4;
                const tyx = (ty * wall.width + tx) * 4;
                display.imageData.data[yw + 0] = wall.data[tyx + 0] / position.dot(distance);
                display.imageData.data[yw + 1] = wall.data[tyx + 1] / position.dot(distance);
                display.imageData.data[yw + 2] = wall.data[tyx + 2] / position.dot(distance);
            }
        }
    }
};

// Render the floor/ceiling
const renderSurface = (display: Display, scene: Scene, player: Player, ceiling = false) => {
    const vmid = display.imageData.height / 2;
    const [p1, p2] = player.fov();
    const distance = p1.clone().sub(player.position).mag();

    for (let y = display.imageData.height / 2; y < display.imageData.height; ++y) {
        const row = display.imageData.height - y - 1;
        const viewpoint = vmid - row;
        const b = ((distance / viewpoint) * vmid) / NEAR_CLIPPING_PLANE;
        const t1 = player.position.clone().add(p1.clone().sub(player.position).norm().scale(b));
        const t2 = player.position.clone().add(p2.clone().sub(player.position).norm().scale(b));

        for (let x = 0; x < display.imageData.width; ++x) {
            const t = t1.clone().lerp(t2, x / display.imageData.width);
            let tile;

            if (ceiling) {
                tile = scene.getTiles(t);
            } else {
                tile = scene.getTiles(t, true, false);
            }

            if (tile instanceof Color) {
                const color = tile.brightness(1 / Math.sqrt(player.position.sqrtDistanceTo(t)));
                let surface;

                if (ceiling) {
                    surface = y;
                } else {
                    surface = row;
                }

                const c = (surface * display.imageData.width + x) * 4;

                display.imageData.data[c + 0] = Math.floor(color.r * 255);
                display.imageData.data[c + 1] = Math.floor(color.g * 255);
                display.imageData.data[c + 2] = Math.floor(color.b * 255);
                display.imageData.data[c + 3] = Math.floor(color.a * 255);
            }
        }
    }
};

// Render the game
interface Display {
    ctx: CanvasRenderingContext2D;
    offScreenCtx: OffscreenCanvasRenderingContext2D;
    imageData: ImageData;
    zBuffer: number[];
}

interface Sprite {
    imageData: ImageData;
    position: Vector2;
    z: number;
    scale: number;
    pdist: number;
    t: number;
}

const renderSprites = (display: Display, player: Player, sprites: Sprite[]) => {
    // TODO: z-sort the sprites
    const sp = new Vector2();
    const dir = Vector2.angle(player.direction);
    const [p1, p2] = player.fov();

    for (const sprite of sprites) {
        sp.copy(sprite.position).sub(player.position);

        const spl = sp.mag();
        if (spl <= NEAR_CLIPPING_PLANE) continue;

        const dot = sp.dot(dir) / spl;
        if (!(dot >= COS_HALF_FOV && dot <= 1)) continue;

        const distance = NEAR_CLIPPING_PLANE / dot;
        sp.norm().scale(distance).add(player.position);

        const t = p1.distanceTo(sp) / p1.distanceTo(p2);
        const cx = Math.floor(display.imageData.width * t);
        const cy = Math.floor(display.imageData.height * 0.5);

        const pdist = sprite.position.clone().sub(player.position).dot(dir);
        const spriteSize = Math.floor(display.imageData.height / pdist) * sprite.scale;

        const x1 = clamp(0, display.imageData.width - 1, Math.floor(cx - spriteSize * 0.5));
        const x2 = clamp(0, display.imageData.width - 1, Math.floor(cx + spriteSize * 0.5));
        const y1 = clamp(0, display.imageData.height - 1, Math.floor(cy - spriteSize * 0.5));
        const y2 = clamp(0, display.imageData.height - 1, Math.floor(cy + spriteSize * 0.5));

        for (let x = x1; x <= x2; ++x) {
            if (!(pdist < display.zBuffer[x])) continue;
            for (let y = y1; y < y2; ++y) {
                const tx = Math.floor(((x - x1) / spriteSize) * sprite.imageData.width);
                const ty = Math.floor(((y - y1) / spriteSize) * sprite.imageData.height);

                const sourceP = (ty * sprite.imageData.width + tx) * 4;
                const destinationP = (y * display.imageData.width + x) * 4;
                const alpha = sprite.imageData.data[sourceP + 3] / 255;

                for (let c = 0; c < 3; ++c) {
                    display.imageData.data[destinationP + c] =
                        sprite.imageData.data[sourceP + c] * alpha + display.imageData.data[destinationP + c] * (1 - alpha);
                }
            }
        }
    }
};

const renderGame = (display: Display, deltaTime: number, scene: Scene, player: Player, sprites: Sprite[]) => {
    const minimapPosition = new Vector2(10, 10);
    const scale = display.ctx.canvas.width * 0.01;
    const minimapSize = scene.size().scale(scale);

    // Refill the background in each frame
    display.imageData.data.fill(0);

    // Render Floor
    renderSurface(display, scene, player, true);

    // Render Ceiling
    renderSurface(display, scene, player, false);

    // Render Walls
    renderWalls(display, scene, player);

    // Render Sprites
    renderSprites(display, player, sprites);

    // Draw the image to the canvas
    display.offScreenCtx.putImageData(display.imageData, 0, 0);
    display.ctx.drawImage(display.offScreenCtx.canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Render Minimap
    renderMinimap(display.ctx, player, minimapPosition, minimapSize, scene, sprites);

    // Render FPS counter
    display.ctx.fillStyle = "white";
    display.ctx.textAlign = "right";
    display.ctx.font = "10px monospace";
    display.ctx.fillText(`FPS: ${Math.round(1 / deltaTime)}`, display.ctx.canvas.width - 10, 20);
};

// Start the app
(async () => {
    const canvas = document.getElementById("app") as HTMLCanvasElement;

    if (!canvas) {
        throw new Error("Could not get canvas element");
    }

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    if (!ctx) {
        throw new Error("Could not get 2D context from canvas");
    }

    ctx.imageSmoothingEnabled = false;

    const imageData = new ImageData(SCREEN_WIDTH, SCREEN_HEIGHT);
    const offScreenCanvas = new OffscreenCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
    const offScreenCtx = offScreenCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D;
    const display: Display = { ctx, offScreenCtx, imageData, zBuffer: Array(SCREEN_WIDTH).fill(0) };

    if (!offScreenCtx) {
        throw new Error("Could not get 2D context from offscren canvas");
    }

    offScreenCtx.imageSmoothingEnabled = false;

    const [wall, floor, face, water] = await Promise.all([
        loadImageData("./assets/images/wall.png"),
        loadImageData("./assets/images/planks.png"),
        loadImageData("./assets/images/pacho.png"),
        loadImageData("./assets/images/Water__05.png"),
    ]);

    // Create the scene
    const scene: Scene = new Scene(
        [
            [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
            [null, null, null, null, null, null, null, null, null, null, null, wall],
            [wall, null, wall, wall, null, wall, wall, wall, wall, null, null, wall],
            [wall, null, null, wall, null, null, null, null, wall, null, null, wall],
            [wall, null, null, wall, null, null, null, null, wall, null, null, wall],
            [wall, null, null, null, null, null, null, wall, wall, null, null, wall],
            [wall, null, null, null, null, null, null, null, null, null, null, wall],
            [wall, null, null, null, null, face, null, null, null, null, null, wall],
            [wall, null, null, null, null, null, null, null, null, null, null, wall],
            [wall, null, null, null, null, null, null, null, null, null, null, wall],
            [wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall, wall],
        ],
        floor
    );

    // Create the sprites
    const KEY_SCALE = 0.5;
    const KEY_Z = KEY_SCALE;

    const sprites: Sprite[] = [
        {
            imageData: water,
            position: new Vector2(2.5, 1.5),
            z: KEY_Z,
            scale: KEY_SCALE,
            pdist: 0,
            t: 0,
        },
    ];

    // Create the player
    const coordinates = [5, 5];
    const playerCenter = new Vector2(PLAYER_SIZE * 0.5, PLAYER_SIZE * 0.5);
    const intialPosition = new Vector2(...coordinates).add(playerCenter);
    const player = new Player(intialPosition, Math.PI * 1.25, Vector2.zero());

    // Draw the game
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
            player.velocity = player.velocity.clone().add(Vector2.angle(player.direction).scale(PLAYER_SPEED));
        }

        if (movingBackward) {
            player.velocity = player.velocity.clone().sub(Vector2.angle(player.direction).scale(PLAYER_SPEED));
        }

        if (movingLeft) {
            player.velocity = player.velocity.clone().add(Vector2.angle(player.direction - Math.PI * 0.5).scale(PLAYER_SPEED));
        }

        if (movingRight) {
            player.velocity = player.velocity.clone().add(Vector2.angle(player.direction + Math.PI * 0.5).scale(PLAYER_SPEED));
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

        renderGame(display, deltaTime, scene, player, sprites);
        window.requestAnimationFrame(frame);
    };

    window.requestAnimationFrame((timestamp: number) => {
        prevTimestamp = timestamp;
        window.requestAnimationFrame(frame);
    });

    // Handle input
    window.addEventListener("keydown", e => {
        switch (e.code) {
            case "KeyW":
                movingForward = true;
                break;
            case "KeyS":
                movingBackward = true;
                break;
            case "KeyA":
                movingLeft = true;
                break;
            case "KeyD":
                movingRight = true;
                break;
            case "ArrowLeft":
                rotatingLeft = true;
                break;
            case "ArrowRight":
                rotatingRight = true;
                break;
        }
    });

    // Handle input
    window.addEventListener("keyup", e => {
        switch (e.code) {
            case "KeyW":
                movingForward = false;
                break;
            case "KeyS":
                movingBackward = false;
                break;
            case "KeyA":
                movingLeft = false;
                break;
            case "KeyD":
                movingRight = false;
                break;
            case "ArrowLeft":
                rotatingLeft = false;
                break;
            case "ArrowRight":
                rotatingRight = false;
                break;
        }
    });

    // Experimental Mouse controls
    // window.addEventListener('mousemove', e => {
    //   const canvasRect = canvas.getBoundingClientRect();
    //   const halfWidth = canvasRect.width / 2;
    // });
})();
