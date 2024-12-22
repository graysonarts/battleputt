import * as PIXI from "pixi.js";

const MAX_POINTS = 1000;

export type Position = [number, number];
export type Tracer = {
  points: Array<Position>;
  gfx: PIXI.Graphics;
};

export function initTracer(scene: PIXI.Container): Tracer {
  const gfx = new PIXI.Graphics();
  return {
    points: [],
    gfx,
  };
  scene.addChild(gfx);
}

export function trace(tracer: Tracer, position: Position) {
  tracer.points.push(position);
  tracer.points.splice(0, Math.max(0, tracer.points.length - MAX_POINTS));
}

export function renderTracer(tracer: Tracer) {
  let points = tracer.points;
  let lines = tracer.gfx;
  lines.clear();

  for (let i = 0; i < tracer.points.length - 1; i += 1) {
    lines.moveTo(points[i][0], points[i][1]);
    lines.lineTo(points[i + 1][0], points[i + 1][1]);
    lines.stroke({ color: 0xffffff, pixelLine: true });
  }
}
