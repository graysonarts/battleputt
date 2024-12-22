import RAPIER from "@dimforge/rapier2d";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./style.css";

type RenderContext = {
  scene: PIXI.Container;
  renderer: PIXI.Renderer;
  lines: PIXI.Graphics;
  bodies: Map<number, PIXI.Graphics>;
};

function render(
  world: RAPIER.World,
  { scene, lines, renderer }: RenderContext
) {
  const { vertices, colors } = world.debugRender();

  lines.clear();

  for (let i = 0; i < vertices.length / 4; i += 1) {
    let color = [colors[i * 8], colors[i * 8 + 1], colors[i * 8 + 2]];
    lines.moveTo(vertices[i * 4], vertices[i * 4 + 1]);
    lines.lineTo(vertices[i * 4 + 2], vertices[i * 4 + 3]);
    lines.stroke({ color: color, pixelLine: true });
  }

  renderer.render(scene);
}

export async function game() {
  const renderContext: RenderContext = {
    lines: new PIXI.Graphics(),
    scene: new PIXI.Container(),
    renderer: await PIXI.autoDetectRenderer({}),
    bodies: new Map(),
  };

  document.body.appendChild(renderContext.renderer.canvas);

  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,
    events: renderContext.renderer.events,
  });
  renderContext.scene.addChild(viewport);

  console.log("Simulation Initializing");
  const gravity = { x: 0.0, y: -90.81 };
  const world = new RAPIER.World(gravity);

  let ground = RAPIER.ColliderDesc.cuboid(1000.0, 0.1)
    .setRestitution(0.9)
    .setRestitutionCombineRule(RAPIER.CoefficientCombineRule.Max);
  world.createCollider(ground);

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    300.0,
    300.0
  );
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.ball(30.0).setDensity(3.0);
  let collider = world.createCollider(colliderDesc, rigidBody);
  let colliderGfx = new PIXI.Graphics().circle(0.0, 0.0, 30.0).fill(0xffff00);
  renderContext.bodies.set(collider.handle, colliderGfx);
  viewport.addChild(colliderGfx);

  viewport.addChild(renderContext.lines);
  console.log("Simulation Started");
  let gameLoop = () => {
    world.step();
    world.forEachCollider((collider) => {
      if (collider.handle === 0) {
        return;
      }
      let gfx = renderContext.bodies.get(collider.handle);
      if (gfx) {
        let translation = collider.translation();
        let rotation = collider.rotation();
        gfx.position.set(translation.x, translation.y);
        gfx.rotation = -rotation;
      } else {
        console.error("No gfx for collider", collider.handle);
      }
    });
    render(world, renderContext);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
}
