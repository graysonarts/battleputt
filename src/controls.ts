import GUI from "lil-gui";
import { WORLD_HEIGHT, WORLD_WIDTH } from "./consts";

export type Tunables = {
  debugRender: boolean;

  woodDensity: number;
  woodFriction: number;
  woodRestitution: number;

  rampAngle: number;
  rampHeight: number;
  rampOffset: number;
  rampLocation: number;

  ballRestitution: number;
  ballMass: number;

  forceOfPutt: number;
};

export function storeControls(tunables: Tunables) {
  localStorage.setItem("controls", JSON.stringify(tunables));
}

export function loadControls(): Tunables {
  const defaultValues = {
    debugRender: true,
    woodDensity: 1.0,
    woodFriction: 0.5,
    woodRestitution: 0.5,
    rampAngle: 0.5,
    rampHeight: 0,
    rampLocation: WORLD_WIDTH / 2,
    rampOffset: 0,
    ballRestitution: 0.5,
    ballMass: 10.0,
    forceOfPutt: 5000,
  };
  const storedControls = localStorage.getItem("controls");
  if (storedControls) {
    return { ...defaultValues, ...JSON.parse(storedControls) };
  } else {
    return defaultValues;
  }
}

export function initGui(tunables: Tunables) {
  const gui = new GUI();
  const dev = gui.addFolder("Dev");
  dev.add(tunables, "debugRender");

  const wood = gui.addFolder("Wood Material");
  wood.add(tunables, "woodDensity", 0.1, 10);
  wood.add(tunables, "woodFriction", 0, 1);
  wood.add(tunables, "woodRestitution", 0, 3);

  const ramp = gui.addFolder("Ramp");
  ramp.add(tunables, "rampAngle", -1.0, 1.0);
  ramp.add(tunables, "rampHeight", 0.0, WORLD_HEIGHT);
  ramp.add(tunables, "rampOffset", -100.0, 100.0);
  ramp.add(tunables, "rampLocation", -WORLD_WIDTH, WORLD_WIDTH);

  const ball = gui.addFolder("Ball");
  ball.add(tunables, "ballRestitution", 0, 3);
  ball.add(tunables, "ballMass", 0.1, 1000);

  const putt = gui.addFolder("Putt");
  putt.add(tunables, "forceOfPutt", 1000, 20000);

  return gui;
}

export function onSpacebar(down: () => void, up: () => void) {
  window.addEventListener("keyup", (event) => {
    if (event.code === "Space") {
      up();
    }
  });
  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      down();
    }
  });
}
