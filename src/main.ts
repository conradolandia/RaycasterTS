import './style.css';

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { Player, Scene, Vector2, Color } from './types';
import { loadImageData } from './textures';
import { renderGame } from './utils';
import { controls } from './controls';

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
  const suelo = await loadImageData('./assets/images/planks.png').catch(() =>
    Color.black()
  );
  const ysangrim = await loadImageData('./assets/images/pacho.png').catch(() =>
    Color.cyan()
  );

  // Create the scene
  const scene: Scene = new Scene(
    [
      [null, null, wall1, wall2, null, null, null, null, null],
      [null, null, null, wall3, null, null, null, null, null],
      [null, wall4, wall1, wall2, null, Color.red(), ysangrim, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null, null],
      [null, ysangrim, null, null, null, suelo, null, null, null],
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
  controls(ctx, scene, player, renderGame);
})();
