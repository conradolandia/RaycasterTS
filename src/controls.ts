import { Scene, Player, Vector2 } from './types';
import { BG_COLOR, PLAYER_STEP_LENGTH } from './constants';

export const controls = (
  e: KeyboardEvent,
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  player: Player,
  callback: any
) => {
  switch (e.code) {
    case 'KeyW':
      {
        player.position = player.position.add(
          Vector2.fromAngle(player.direction).scale(PLAYER_STEP_LENGTH)
        );
        callback(ctx, scene, player, BG_COLOR);
      }
      break;
    case 'KeyS':
      {
        player.position = player.position.sub(
          Vector2.fromAngle(player.direction).scale(PLAYER_STEP_LENGTH)
        );
        callback(ctx, scene, player, BG_COLOR);
      }
      break;
    case 'KeyD':
      {
        player.direction += Math.PI * 0.025;
        callback(ctx, scene, player, BG_COLOR);
      }
      break;
    case 'KeyA':
      {
        player.direction -= Math.PI * 0.025;
        callback(ctx, scene, player, BG_COLOR);
      }
      break;
  }
};
