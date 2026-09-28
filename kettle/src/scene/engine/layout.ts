/** Room dimensions + where things live. World units ≈ half-metres, y up, floor at y=0. */
export const ROOM = {
  xMin: -3.2,
  xMax: 3.2,
  zBack: -2.5,
  zFront: 2.5,
  h: 4,
  wall: 0.26,
  bevel: 0.05,
  slab: 0.36,
};

/** Arched window in the back wall. */
export const WIN = {
  cx: 0.55,
  w: 1.9,
  y0: 1.25,
  /** Top of the arch. */
  y1: 3.4,
  get r() {
    return this.w / 2;
  },
  get x0() {
    return this.cx - this.w / 2;
  },
  get x1() {
    return this.cx + this.w / 2;
  },
  /** Where the straight sides end and the arch begins. */
  get ySpring() {
    return this.y1 - this.w / 2;
  },
};

export const SPOTS = {
  lamp: { x: -2.62, z: -1.92 },
  stove: { x: -2.6, z: -0.3 },
  table: { x: 0.45, z: 0.55 },
  rug: { x: 0.2, z: 0.55 },
  cushion: { x: -0.95, z: 1.15 },
  books: { x: -1.55, z: -2.08 },
  shelf: { x: -1.45, y: 2.55 },
  crate: { x: 2.3, z: -2.02 },
  monstera: { x: -0.78, z: -1.86 },
  basket: { x: 2.05, z: 1.65 },
  catBed: { x: -2.5, z: 1.25 },
  painting: { z: 0.95, y: 2.5 },
  lantern: { x: -1.9, y: 3.2, z: 1.75 },
  telescope: { x: 1.75, z: -1.05 },
};
