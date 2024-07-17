import "./style.css";


let game = await import("./game.js");
const isDev = window.location.hostname === "localhost";
if (isDev) {
    console.log("Dev mode");
    const ws = new WebSocket("ws://localhost:5174");

    ws.addEventListener("message", async (event) => {
        if (event.data === "reload") {
            console.log("Hot reload");
            game = await (import.meta.hot as any).hot(
                /* @vite-ignore */
                "./game.js?t=" + new Date().getTime()
            );
        }
    });
}


// Load an image as a HTMLImageElement
const loadImage = (url: string): Promise<HTMLImageElement> => {
    const image = new Image();
    image.src = url;

    return new Promise((resolve, reject) => {
        image.onload = () => resolve(image);
        image.onerror = reject;
    });
};

const loadImageData = async (url: string): Promise<ImageData> => {
    const image = await loadImage(url);
    const canvas = new OffscreenCanvas(image.width, image.height);
    const ctx = canvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;
    if (!ctx) {
        throw new Error("Could not get 2D context from offscren canvas");
    }
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height);
};

// Start the app
(async () => {
    const canvas = document.getElementById("app") as HTMLCanvasElement | null;

    if (!canvas) {
        throw new Error("Could not get canvas element");
    }

    canvas.width = game.CANVAS_WIDTH;
    canvas.height = game.CANVAS_HEIGHT;

    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;

    if (!ctx) {
        throw new Error("Could not get 2D context from canvas");
    }

    ctx.imageSmoothingEnabled = false;

    const backImageData = new ImageData(game.SCREEN_WIDTH, game.SCREEN_HEIGHT);
    const backCanvas = new OffscreenCanvas(game.SCREEN_WIDTH, game.SCREEN_HEIGHT);
    const backCtx = backCanvas.getContext("2d") as OffscreenCanvasRenderingContext2D | null;

    if (!backCtx) {
        throw new Error("Could not get 2D context from offscren canvas");
    }

    backCtx.imageSmoothingEnabled = false;

    // Load the images
    const [wall1, wall2, wall3, wall4, suelo, planks, ysangrim] = await Promise.all([
        loadImageData("./assets/images/wall1_color.png").catch(() => game.Color.purple()),
        loadImageData("./assets/images/wall2_color.png").catch(() => game.Color.purple()),
        loadImageData("./assets/images/wall3_color.png").catch(() => game.Color.purple()),
        loadImageData("./assets/images/wall4_color.png").catch(() => game.Color.purple()),
        loadImageData("./assets/images/wood.png").catch(() => game.Color.black()),
        loadImageData("./assets/images/planks.png").catch(() => game.Color.black()),
        loadImageData("./assets/images/pacho.png").catch(() => game.Color.cyan()),
    ]);


    // Create a scene
    const scene = game.createScene(
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
    const player = game.createPlayer(game.sceneSize(scene).mul(new game.Vector2(0.63, 0.63)), Math.PI * 1.25, game.Vector2.zero());

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
        let velocity = game.Vector2.zero();
        let angularVelocity = 0.0;
        const deltaTime = prevTimestamp ? (timestamp - prevTimestamp) / 1000 : 0;
        prevTimestamp = timestamp;

        // Move the player
        if (movingForward) {
            velocity = velocity.add(game.Vector2.fromAngle(player.direction).scale(game.PLAYER_SPEED));
        }

        if (movingBackward) {
            velocity = velocity.sub(game.Vector2.fromAngle(player.direction).scale(game.PLAYER_SPEED));
        }

        if (movingLeft) {
            velocity = velocity.add(game.Vector2.fromAngle(player.direction - Math.PI * 0.5).scale(game.PLAYER_SPEED));
        }

        if (movingRight) {
            velocity = velocity.sub(game.Vector2.fromAngle(player.direction - Math.PI * 0.5).scale(game.PLAYER_SPEED));
        }

        if (rotatingLeft) {
            angularVelocity -= Math.PI / game.PLAYER_SPEED;
        }

        if (rotatingRight) {
            angularVelocity += Math.PI / game.PLAYER_SPEED;
        }

        player.direction += angularVelocity * deltaTime;

        const nx = player.position.x + velocity.x * deltaTime;
        if (game.sceneValidPosition(scene, new game.Vector2(nx, player.position.y), game.Vector2.fromScalar(game.PLAYER_SIZE))) {
            player.position.x = nx;
        }

        const ny = player.position.y + velocity.y * deltaTime;
        if (game.sceneValidPosition(scene, new game.Vector2(player.position.x, ny), game.Vector2.fromScalar(game.PLAYER_SIZE))) {
            player.position.y = ny;
        }

        game.renderGameIntoImageData(ctx, backCtx, backImageData, deltaTime, scene, player);
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
})();
