import { Scene, Player, Vector2 } from './types';
import { PLAYER_SPEED } from './constants';

let movingLeft = false;
let movingRight = false;
let rotatingLeft = false;
let rotatingRight = false;
let movingForward = false;
let movingBackward = false;

export const controls = (
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player,
  callback: any
) => {
  let prevTimestamp: number = 0;

  const frame = (timestamp: number) => {
    player.velocity = Vector2.zero();
    let angularVelocity = 0.0;
    const deltaTime = prevTimestamp ? (timestamp - prevTimestamp) / 1000 : 0;
    prevTimestamp = timestamp;

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

    callback(ctx, scene, player, 'hsla(220, 30%, 50%, 1.0)');
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
};
