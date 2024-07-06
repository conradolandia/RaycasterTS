import { Scene, Player, Vector2 } from './types';
import { BG_COLOR, PLAYER_SPEED } from './constants';

let movingForward = false;
let movingBackward = false;
let movingLeft = false;
let movingRight = false;
let rotatingLeft = false;
let rotatingRight = false;

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
      angularVelocity -= Math.PI / PLAYER_SPEED * 0.5;
    }

    if (rotatingRight) {
      angularVelocity += Math.PI / PLAYER_SPEED * 0.5;
    }

    player.direction += angularVelocity * deltaTime;
    const newPosition = player.position.add(player.velocity.scale(deltaTime));
    const cell = scene.getCell(newPosition);

    if(cell === null || cell === undefined) {
      player.position = newPosition;
    }

    callback(ctx, scene, player, BG_COLOR);
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
