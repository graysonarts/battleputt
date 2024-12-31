import RAPIER, { Collider } from "@dimforge/rapier2d";
import * as PIXI from "pixi.js";

import { Tunables } from "./controls";
import {
  COMBINE_RULE,
  PLATFORM_LENGTH,
  RAMP_LENGTH,
  WOOD_COLOR,
  WOOD_WIDTH,
} from "./consts";
import { BodiesMap } from "./types";

type ParameterUpdates = {
  restitution?: number;
  friction?: number;
  density?: number;
};

const woods: Array<Collider> = [];

export function updateWoodParameters(updates: ParameterUpdates) {
  woods.forEach((wood) => {
    if (updates.restitution !== undefined) {
      wood.setRestitution(updates.restitution);
    }
    if (updates.friction !== undefined) {
      wood.setFriction(updates.friction);
    }
    if (updates.density !== undefined) {
      wood.setDensity(updates.density);
    }
  });
}

export function createWood(
  tunables: Tunables,
  world: RAPIER.World,
  bodies: BodiesMap,
  w: number,
  h: number,
  angle: number
) {
  const newWood = RAPIER.ColliderDesc.roundCuboid(w, h, 5.0)
    .setRestitution(tunables.woodRestitution)
    .setRestitutionCombineRule(COMBINE_RULE)
    .setFriction(tunables.woodFriction)
    .setFrictionCombineRule(COMBINE_RULE)
    .setDensity(tunables.woodDensity)
    .setRotation(angle);
  const collider = world.createCollider(newWood);
  woods.push(collider);
  const gfx = new PIXI.Graphics().rect(0, 0, w, h).fill(WOOD_COLOR);

  bodies.set(collider.handle, gfx);

  return collider;
}

export function createPlatformRamp(
  tunables: Tunables,
  world: RAPIER.World,
  bodies: BodiesMap,
  angle: number
) {
  const platform = createWood(
    tunables,
    world,
    bodies,
    PLATFORM_LENGTH,
    WOOD_WIDTH,
    0.0
  );
  const ramp = createWood(
    tunables,
    world,
    bodies,
    RAMP_LENGTH,
    WOOD_WIDTH,
    angle
  );

  platform.setCollisionGroups(0x000d0004);
  platform.setSolverGroups(0x000d0004);
  ramp.setCollisionGroups(0x000d0004);
  ramp.setSolverGroups(0x000d0004);

  return { platform, ramp };
}
