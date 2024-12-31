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
import { createPlatformRamp, createWood, updateWoodParameters } from "./wood";
import { BodiesMap } from "./types";
import {
  BALL_SIZE,
  RAMP_X_OFFSET,
  WOOD_WIDTH,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from "./consts";

// WORLD UNIT = 1 cm
// MASS UNITS = ??
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
    renderer: await PIXI.autoDetectRenderer({
      width: window.innerWidth,
      height: window.innerHeight,
    }),
    bodies: new Map(),
  };

  document.body.appendChild(renderContext.renderer.canvas);

  const viewport = new Viewport({
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    events: renderContext.renderer.events,
  });
  renderContext.scene.addChild(viewport);

  console.log("Simulation Initializing");
  const gravity = { x: 0.0, y: -98.1 };
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
    WOOD_WIDTH,
    WORLD_HEIGHT * 2,
    0.0
  );
  leftWall.setTranslation({ x: WORLD_WIDTH + WORLD_WIDTH * 0.32, y: 0 });
  let rightWall = createWood(
    tunables,
    world,
    renderContext.bodies,
    WOOD_WIDTH,
    WORLD_HEIGHT * 2,
    0.0
  );
  rightWall.setTranslation({ x: 0, y: 0 });

  const { platform, ramp } = createPlatformRamp(
    tunables,
    world,
    renderContext.bodies,
    tunables.rampAngle
  );
  platform.setTranslation({ x: tunables.rampLocation, y: tunables.rampHeight });
  ramp.setTranslation({
    x: tunables.rampLocation - RAMP_X_OFFSET,
    y: tunables.rampHeight + tunables.rampOffset,
  });

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    700.0,
    500.0
  );
  let ballBody = world.createRigidBody(rigidBodyDesc);

  let ballCollider = RAPIER.ColliderDesc.ball(BALL_SIZE)
    .setDensity(3.0)
    .setRestitution(tunables.ballRestitution)
    .setFriction(1.0)
    .setMass(tunables.ballMass);
  let collider = world.createCollider(ballCollider, ballBody);
  let colliderGfx = new PIXI.Graphics()
    .circle(0.0, 0.0, BALL_SIZE)
    .fill(0xffff00);
  renderContext.bodies.set(collider.handle, colliderGfx);
  const initialBallPosition = () => ({
    x: tunables.rampLocation,
    y: tunables.rampHeight + BALL_SIZE + WOOD_WIDTH + 1,
  });
  ballBody.setTranslation(initialBallPosition(), true);

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
        {
          let px = platform.translation().x;
          let rx = ramp.translation().x;
          platform.setTranslation({ x: px, y: obg.value });
          ramp.setTranslation({ x: rx, y: obg.value + tunables.rampOffset });
        }
        break;
      case "rampOffset":
        {
          let rx = ramp.translation().x;
          ramp.setTranslation({ x: rx, y: obg.value + tunables.rampHeight });
        }
        break;
      case "rampLocation":
        {
          let py = platform.translation().y;
          let ry = ramp.translation().y;
          platform.setTranslation({ x: obg.value, y: py });
          ramp.setTranslation({ x: obg.value - RAMP_X_OFFSET, y: ry });
        }
        break;

      case "ballRestitution":
        collider.setRestitution(obg.value);
        break;
      case "ballMass":
        collider.setMass(obg.value);
        break;
    }

    storeControls(obg.object as Tunables);
  });

  onSpacebar(
    () => {
      ballBody.resetForces(false);
      ballBody.resetTorques(false);
      ballBody.setAngvel(0.0, false);
      ballBody.setLinvel({ x: 0.0, y: 0.0 }, false);
      ballBody.setTranslation(initialBallPosition(), false);
      tracer.points = [];
    },
    () => {
      ballBody.applyImpulse({ x: -tunables.forceOfPutt * 10.0, y: 0.0 }, true);
    }
  );

  let tracer = initTracer(renderContext.scene);
  viewport.addChild(tracer.gfx);
  viewport.addChild(colliderGfx);

  viewport.addChild(renderContext.lines);
  const origin = new PIXI.Graphics()
    .circle(0, 0, 5)
    .fill(0xff0000)
    .circle(WORLD_WIDTH, WORLD_HEIGHT, 5)
    .fill(0x00ff00)
    .circle(-WORLD_WIDTH, -WORLD_HEIGHT, 5)
    .fill(0x0000ff);
  viewport.addChild(origin);
  console.log("Simulation Started");
  let gameLoop = () => {
    trace(tracer, [ballBody.translation().x, ballBody.translation().y]);
    world.step();
    world.step();
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
