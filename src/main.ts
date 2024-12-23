import RAPIER from "@dimforge/rapier2d";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./style.css";
import {
  initGui,
  loadControls,
  onSpacebar,
  storeControls,
  Tunables,
} from "./controls";
import { initTracer, renderTracer, trace, Tracer } from "./tracer";
import { createWood, updateWoodParameters } from "./wood";
import { BodiesMap } from "./types";
import { BALL_SIZE, WOOD_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from "./consts";

// WORLD UNIT = 1 cm
type RenderContext = {
  scene: PIXI.Container;
  renderer: PIXI.Renderer;
  lines: PIXI.Graphics;
  bodies: BodiesMap;
};

function render(
  tunables: Tunables,
  world: RAPIER.World,
  { scene, lines, renderer }: RenderContext,
  tracer: Tracer
) {
  lines.clear();
  if (tunables.debugRender) {
    const { vertices, colors } = world.debugRender();

    for (let i = 0; i < vertices.length / 4; i += 1) {
      let color = [colors[i * 8], colors[i * 8 + 1], colors[i * 8 + 2]];
      lines.moveTo(vertices[i * 4], vertices[i * 4 + 1]);
      lines.lineTo(vertices[i * 4 + 2], vertices[i * 4 + 3]);
      lines.stroke({ color: color, pixelLine: true });
    }
  }

  renderTracer(tracer);

  renderer.render(scene);
}

export async function game() {
  const tunables = loadControls();
  const gui = initGui(tunables);

  const renderContext: RenderContext = {
    lines: new PIXI.Graphics(),
    scene: new PIXI.Container(),
    renderer: await PIXI.autoDetectRenderer({}),
    bodies: new Map(),
  };

  document.body.appendChild(renderContext.renderer.canvas);

  const viewport = new Viewport({
    // screenWidth: window.innerWidth,
    // screenHeight: window.innerHeight,
    worldWidth: 1000,
    worldHeight: 1000,
    events: renderContext.renderer.events,
  });
  renderContext.scene.addChild(viewport);

  console.log("Simulation Initializing");
  const gravity = { x: 0.0, y: -981.0 };
  const world = new RAPIER.World(gravity);
  world.integrationParameters.numSolverIterations = 8;

  let ground = createWood(
    tunables,
    world,
    renderContext.bodies,
    WORLD_WIDTH * 2,
    WOOD_WIDTH,
    0.0
  );
  let leftWall = createWood(
    tunables,
    world,
    renderContext.bodies,
    WOOD_WIDTH * 2,
    WORLD_HEIGHT * 2,
    0.0
  );
  leftWall.setTranslation({ x: 800.0, y: 0 });
  let rightWall = createWood(
    tunables,
    world,
    renderContext.bodies,
    WOOD_WIDTH * 2,
    WORLD_HEIGHT * 2,
    0.0
  );

  const platform = createWood(
    tunables,
    world,
    renderContext.bodies,
    WORLD_WIDTH / 16,
    WOOD_WIDTH,
    0.0
  );
  platform.setTranslation({ x: WORLD_WIDTH / 1.75, y: tunables.rampHeight });
  const ramp = createWood(
    tunables,
    world,
    renderContext.bodies,
    WORLD_WIDTH / 16,
    WOOD_WIDTH,
    tunables.rampAngle
  );
  ramp.setTranslation({ x: WORLD_WIDTH / 2, y: tunables.rampHeight + 6 });

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    700.0,
    500.0
  );
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.ball(BALL_SIZE)
    .setDensity(3.0)
    .setRestitution(tunables.ballRestitution)
    .setFriction(1.0)
    .setMass(5.0);
  let collider = world.createCollider(colliderDesc, rigidBody);
  let colliderGfx = new PIXI.Graphics()
    .circle(0.0, 0.0, BALL_SIZE)
    .fill(0xffff00);
  renderContext.bodies.set(collider.handle, colliderGfx);
  const initialBallPosition = () => ({
    x: 600.0,
    y: tunables.rampHeight + BALL_SIZE + WOOD_WIDTH,
  });
  rigidBody.setTranslation(initialBallPosition(), true);

  gui.onChange((obg) => {
    switch (obg.property) {
      case "woodDensity":
        updateWoodParameters({ density: obg.value });
        break;
      case "woodFriction":
        updateWoodParameters({ friction: obg.value });
        break;
      case "woodRestitution":
        updateWoodParameters({ restitution: obg.value });

        break;
      case "rampAngle":
        ramp.setRotation(obg.value);
        break;
      case "rampHeight":
        let px = platform.translation().x;
        let rx = ramp.translation().x;
        platform.setTranslation({ x: px, y: obg.value });
        ramp.setTranslation({ x: rx, y: obg.value });
        break;

      case "ballRestitution":
        collider.setRestitution(obg.value);
        break;
    }

    storeControls(obg.object as Tunables);
  });

  onSpacebar(
    () => {
      rigidBody.resetForces(false);
      rigidBody.resetTorques(false);
      rigidBody.setAngvel(0.0, false);
      rigidBody.setLinvel({ x: 0.0, y: 0.0 }, false);
      rigidBody.setTranslation(initialBallPosition(), false);
      tracer.points = [];
    },
    () => {
      rigidBody.applyImpulse({ x: -5000, y: 0.0 }, true);
    }
  );

  let tracer = initTracer(renderContext.scene);
  viewport.addChild(tracer.gfx);
  viewport.addChild(colliderGfx);

  viewport.addChild(renderContext.lines);
  console.log("Simulation Started");
  let gameLoop = () => {
    trace(tracer, [rigidBody.translation().x, rigidBody.translation().y]);
    world.step();
    world.forEachCollider((collider) => {
      let gfx = renderContext.bodies.get(collider.handle);
      if (gfx) {
        let translation = collider.translation();
        let rotation = collider.rotation();
        gfx.position.set(translation.x, translation.y);
        gfx.rotation = -rotation;
      }
    });
    render(tunables, world, renderContext, tracer);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
}
