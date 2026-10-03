import * as PIXI from "pixi.js";

const MAX_POINTS = 1000;

export type Position = [number, number];
export type Tracer = {
  points: Array<Position>;
  previousPoints: Array<Array<Position>>;
  gfx: PIXI.Graphics;
};

export function initTracer(scene: PIXI.Container): Tracer {
  const gfx = new PIXI.Graphics();
  return {
    points: [],
    previousPoints: [],
    gfx,
  };
  scene.addChild(gfx);
}

export function nextShot(tracer: Tracer) {
  tracer.previousPoints.push(tracer.points);
  tracer.previousPoints.splice(
    0,
    Math.max(0, tracer.previousPoints.length - MAX_POINTS)
  );
  tracer.points = [];
}

export function trace(tracer: Tracer, position: Position) {
  if (tracer.points.length >= MAX_POINTS) {
    return;
  }
  tracer.points.push(position);
  tracer.points.splice(0, Math.max(0, tracer.points.length - MAX_POINTS));
}

export function renderTracer(tracer: Tracer) {
  let points = tracer.points;
  let lines = tracer.gfx;
  lines.clear();
  const active: PIXI.Color = new PIXI.Color(0xff0000);
  const oldWhite: PIXI.Color = new PIXI.Color([1, 1, 1, 0.35]);

  for (const previousPoints of tracer.previousPoints) {
    for (let i = 0; i < previousPoints.length - 1; i += 1) {
      lines.moveTo(previousPoints[i][0], previousPoints[i][1]);
      lines.lineTo(previousPoints[i + 1][0], previousPoints[i + 1][1]);
      lines.stroke({ color: oldWhite, pixelLine: true });
    }
  }

  for (let i = 0; i < tracer.points.length - 1; i += 1) {
    lines.moveTo(points[i][0], points[i][1]);
    lines.lineTo(points[i + 1][0], points[i + 1][1]);
    lines.stroke({ color: active, pixelLine: true });
  }
}
