import GUI from "lil-gui";

export type Tunables = {
  woodDensity: number;
  woodFriction: number;
  woodRestitution: number;

  rampAngle: number;
};

export function storeControls(tunables: Tunables) {
  localStorage.setItem("controls", JSON.stringify(tunables));
}

export function loadControls(): Tunables {
  const storedControls = localStorage.getItem("controls");
  if (storedControls) {
    return JSON.parse(storedControls);
  } else {
    return {
      woodDensity: 1.0,
      woodFriction: 0.5,
      woodRestitution: 0.5,
      rampAngle: 0.5,
    };
  }
}

export function initGui(tunables: Tunables) {
  const gui = new GUI();
  const wood = gui.addFolder("Wood Material");
  wood.add(tunables, "woodDensity", 0.1, 10);
  wood.add(tunables, "woodFriction", 0, 1);
  wood.add(tunables, "woodRestitution", 0, 1);

  const ramp = gui.addFolder("Ramp");
  ramp.add(tunables, "rampAngle", 0, 1.0);

  return gui;
}
