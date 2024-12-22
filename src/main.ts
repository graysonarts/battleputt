import RAPIER from "@dimforge/rapier2d";
import * as PIXI from "pixi.js";
import { Viewport } from "pixi-viewport";
import "./style.css";
import { initGui, loadControls, storeControls, Tunables } from "./controls";
import { initTracer, renderTracer, trace, Tracer } from "./tracer";

// WORLD UNIT = 1 cm

const COMBINE_RULE = RAPIER.CoefficientCombineRule.Multiply;

type RenderContext = {
  scene: PIXI.Container;
  renderer: PIXI.Renderer;
  lines: PIXI.Graphics;
  bodies: Map<number, PIXI.Graphics>;
};

function render(
  world: RAPIER.World,
  { scene, lines, renderer }: RenderContext,
  tracer: Tracer
) {
  const { vertices, colors } = world.debugRender();

  lines.clear();

  for (let i = 0; i < vertices.length / 4; i += 1) {
    let color = [colors[i * 8], colors[i * 8 + 1], colors[i * 8 + 2]];
    lines.moveTo(vertices[i * 4], vertices[i * 4 + 1]);
    lines.lineTo(vertices[i * 4 + 2], vertices[i * 4 + 3]);
    lines.stroke({ color: color, pixelLine: true });
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

  let ground = RAPIER.ColliderDesc.cuboid(1000.0, 0.1)
    .setRestitution(tunables.woodRestitution)
    .setRestitutionCombineRule(COMBINE_RULE)
    .setFriction(tunables.woodFriction)
    .setFrictionCombineRule(COMBINE_RULE)
    .setDensity(tunables.woodDensity)
    .setRotation(tunables.rampAngle);
  world.createCollider(ground);
  let leftWall = RAPIER.ColliderDesc.cuboid(0.1, 1000.0)
    .setTranslation(800, 0.0)
    .setRestitution(tunables.woodRestitution)
    .setRestitutionCombineRule(COMBINE_RULE)
    .setFriction(tunables.woodFriction)
    .setFrictionCombineRule(COMBINE_RULE)
    .setDensity(tunables.woodDensity);
  world.createCollider(leftWall);
  let rightWall = RAPIER.ColliderDesc.cuboid(0.1, 1000.0)
    .setTranslation(0.0, 0.0)
    .setRestitution(tunables.woodRestitution)
    .setRestitutionCombineRule(COMBINE_RULE)
    .setFriction(tunables.woodFriction)
    .setFrictionCombineRule(COMBINE_RULE)
    .setDensity(tunables.woodDensity);
  world.createCollider(rightWall);

  gui.onChange((obg) => {
    let restore = false;
    switch (obg.property) {
      case "woodDensity":
        ground.setDensity(obg.value);
        leftWall.setDensity(obg.value);
        rightWall.setDensity(obg.value);
        restore = true;
        break;
      case "woodFriction":
        ground.setFriction(obg.value);
        leftWall.setFriction(obg.value);
        rightWall.setFriction(obg.value);
        restore = true;
        break;
      case "woodRestitution":
        ground.setRestitution(obg.value);
        leftWall.setRestitution(obg.value);
        rightWall.setRestitution(obg.value);
        restore = true;

        break;
      case "rampAngle":
        restore = true;
        break;
    }

    if (restore) {
      storeControls(obg.object as Tunables);
    }
  });

  let rigidBodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(
    700.0,
    500.0
  );
  let rigidBody = world.createRigidBody(rigidBodyDesc);

  let colliderDesc = RAPIER.ColliderDesc.ball(30.0)
    .setDensity(3.0)
    .setRestitution(1.0)
    .setFriction(1.0);
  let collider = world.createCollider(colliderDesc, rigidBody);
  let colliderGfx = new PIXI.Graphics().circle(0.0, 0.0, 30.0).fill(0xffff00);
  renderContext.bodies.set(collider.handle, colliderGfx);

  let tracer = initTracer(renderContext.scene);
  viewport.addChild(tracer.gfx);
  viewport.addChild(colliderGfx);

  viewport.addChild(renderContext.lines);
  console.log("Simulation Started");
  let gameLoop = () => {
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
    trace(tracer, [rigidBody.translation().x, rigidBody.translation().y]);
    render(world, renderContext, tracer);

    setTimeout(gameLoop, 16);
  };

  gameLoop();
}
