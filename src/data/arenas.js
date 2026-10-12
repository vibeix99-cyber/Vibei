// Arena definitions — drive the 3D stage, lighting, skybox, props and weather tint.
//
// Contract notes for other agents:
//   * `sky` stays a two-entry array `[zenith, horizon]`, and `sun` / `ambient` /
//     `fog` / `ground` / `accent` keep their original shapes. tools/modelsheet.mjs
//     and any older code that reads them still works.
//   * Everything under `dome`, `light`, `palette`, `sea`, `deco` is additive and
//     only consumed by render/scene.js. Extend, don't mutate.
//
// Field reference
//   sky      [zenith, horizon]         base sky gradient
//   below    colour under the horizon line (haze / sea / rock)
//   dome     { sunDir, sunColor, sunSize, halo, clouds, cloudColor, cloudY,
//              stars, moon, moonColor }
//   light    { key, fill, rim, rimFix, hemi, eye, exposure }
//              key   — shadow-casting sun/moon        (falls back to legacy `sun`)
//              fill  — soft opposite-side bounce, no shadow
//              rim   — camera-relative backlight; guarantees silhouette separation
//              rimFix— a second fixed rim for arena flavour
//              hemi  — sky/ground hemisphere bounce
//              eye   — tiny camera-locked fill so nothing ever renders black
//   palette  named prop colours for the props builder
//   sea      null | { level, shallow, deep, foam, waveH, waveS, frozen }
//   deco     per-props-type tuning knobs
//   props    'colosseum' | 'plaza' | 'ship' | 'rooftop' | 'clouds' | 'restaurant'

export const ARENAS = [
  {
    id: 'colosseum', name: 'Corrida Colosseum', sub: 'Dressrosa',
    sky: ['#b8451f', '#ffc978'], ground: '#d79a58', accent: '#f2d24b',
    fog: { color: '#e8a86b', density: 0.0092 },
    sun: { color: '#ffe6bf', intensity: 2.5, position: [13, 13, 8] },
    ambient: { color: '#9a7050', intensity: 0.62 },
    props: 'colosseum', crowd: true,

    below: '#7c4230',
    dome: {
      sunColor: '#fff0c8', sunSize: 0.035, halo: 0.75,
      clouds: 0.42, cloudColor: '#ffd6a0', cloudY: 0.10, stars: 0, moon: 0
    },
    light: {
      fill:   { color: '#8fb6ff', intensity: 0.62, position: [-11, 8, -7] },
      rim:    { color: '#ffd07a', intensity: 2.15 },
      rimFix: { color: '#ff7a3c', intensity: 0.85, position: [-7, 10, -15] },
      hemi:   { sky: '#ffb583', ground: '#8a5330', intensity: 0.60 },
      eye: 0.18, exposure: 1.02
    },
    palette: {
      sand: '#dda45f', sandDark: '#b3713a', stone: '#cf9257', stoneDark: '#9c603a',
      tier: '#b3663f', tierDark: '#8b4a2e', banner: '#c8392b', trim: '#f2d24b',
      crowd: ['#e8d3b0', '#d0a06a', '#b46a5a', '#8a5f8a', '#5f7aa8', '#c8b04a']
    },
    sea: null,
    deco: { wallH: 6.2, tiers: 4, crowdRows: 5, crowdPerRow: 68, banners: 14, braziers: 6 }
  },

  {
    id: 'marineford', name: 'Marineford', sub: 'The Great War',
    sky: ['#33456b', '#b9cbdd'], ground: '#9fb0c2', accent: '#5aa6e8',
    fog: { color: '#a8bccd', density: 0.0125 },
    sun: { color: '#e8f2ff', intensity: 2.05, position: [-11, 14, 9] },
    ambient: { color: '#4a5f80', intensity: 0.66 },
    props: 'plaza', crowd: false,

    below: '#8fa8bd',
    dome: {
      sunColor: '#ffffff', sunSize: 0.022, halo: 0.42,
      clouds: 0.62, cloudColor: '#d8e6f2', cloudY: 0.06, stars: 0, moon: 0
    },
    light: {
      fill:   { color: '#7fa8d8', intensity: 0.60, position: [9, 7, -8] },
      rim:    { color: '#cfe6ff', intensity: 2.25 },
      rimFix: { color: '#4a7fc0', intensity: 0.9, position: [10, 9, -13] },
      hemi:   { sky: '#b9cbdd', ground: '#5f7288', intensity: 0.72 },
      eye: 0.20, exposure: 1.0
    },
    palette: {
      stone: '#aebccb', stoneDark: '#7d8fa2', pillar: '#d3dee8', pillarDark: '#9aabbb',
      metal: '#5f7288', banner: '#2f5f9e', trim: '#e8eef5',
      ice: '#dcecf7', iceDeep: '#9fc6de', hq: '#6d8298', hqDark: '#4c5f74'
    },
    sea: { level: -0.85, shallow: '#c9e2f2', deep: '#7fa9c6', foam: '#ffffff', waveH: 0.05, waveS: 0.25, frozen: true },
    deco: { pillars: 18, floes: 34, ruins: 9 }
  },

  {
    id: 'sunny_deck', name: 'Thousand Sunny', sub: 'Open Sea',
    sky: ['#2e8fd8', '#c8efff'], ground: '#5fae4a', accent: '#f0913a',
    fog: { color: '#bfe6f7', density: 0.0058 },
    sun: { color: '#fffbe8', intensity: 2.65, position: [9, 16, -6] },
    ambient: { color: '#8fc0e4', intensity: 0.70 },
    props: 'ship', crowd: false,

    below: '#1d6fb0',
    dome: {
      sunColor: '#fffce8', sunSize: 0.030, halo: 0.5,
      clouds: 0.55, cloudColor: '#ffffff', cloudY: 0.16, stars: 0, moon: 0
    },
    light: {
      fill:   { color: '#a8d8ff', intensity: 0.66, position: [-9, 7, 9] },
      rim:    { color: '#ffffff', intensity: 2.2 },
      rimFix: { color: '#7fd0ff', intensity: 0.85, position: [-8, 10, 13] },
      hemi:   { sky: '#c8efff', ground: '#3f7f4f', intensity: 0.78 },
      eye: 0.18, exposure: 1.03
    },
    palette: {
      grass: '#63b34c', grassDark: '#3f8a3a', wood: '#d8a058', woodDark: '#a06a34',
      rail: '#f2c46a', mast: '#b8813f', sail: '#f6efdc', rope: '#c8a878',
      trim: '#f0913a', hull: '#e3ba74'
    },
    sea: { level: -3.6, shallow: '#3fa0dc', deep: '#14508f', foam: '#eaf9ff', waveH: 0.42, waveS: 0.75 },
    deco: { islands: 5, gulls: 7 }
  },

  {
    id: 'onigashima', name: 'Onigashima Rooftop', sub: 'Wano',
    sky: ['#0a0713', '#4a1230'], ground: '#3b3348', accent: '#e0567c',
    fog: { color: '#2a1830', density: 0.0135 },
    sun: { color: '#ffc2d2', intensity: 1.35, position: [-3, 15, -13] },
    ambient: { color: '#4a2c58', intensity: 0.58 },
    props: 'rooftop', crowd: false,

    below: '#160f22',
    dome: {
      sunColor: '#ff8fa8', sunSize: 0.0, halo: 0.0,
      clouds: 0.34, cloudColor: '#5a2a44', cloudY: 0.04,
      stars: 0.95, moon: 0.10, moonColor: '#ff6a86', moonDir: [-0.34, 0.30, -0.9]
    },
    light: {
      fill:   { color: '#6a4fd0', intensity: 0.52, position: [10, 6, 8] },
      rim:    { color: '#ff8fb0', intensity: 2.5 },
      rimFix: { color: '#7f5fff', intensity: 1.0, position: [9, 8, 12] },
      hemi:   { sky: '#43264f', ground: '#241a2c', intensity: 0.62 },
      eye: 0.24, exposure: 1.10
    },
    palette: {
      tile: '#3a3346', tileDark: '#241f30', ridge: '#57506a', beam: '#4a3348',
      wood: '#5a3a3f', lantern: '#ff8a3c', lanternGlow: '#ffb066',
      banner: '#c03a5c', trim: '#e0b04a', rock: '#241d30'
    },
    sea: null,
    deco: { lanterns: 26, roofs: 11, poles: 6 }
  },

  {
    id: 'skypiea', name: 'Upper Yard', sub: 'Skypiea',
    sky: ['#3f9fe0', '#f2fbff'], ground: '#f0f8ff', accent: '#f5c542',
    fog: { color: '#e2f4ff', density: 0.0072 },
    sun: { color: '#ffffff', intensity: 2.7, position: [6, 18, 6] },
    ambient: { color: '#d6ecff', intensity: 0.92 },
    props: 'clouds', crowd: false,

    below: '#cfe9f8',
    dome: {
      sunColor: '#ffffff', sunSize: 0.032, halo: 0.6,
      clouds: 0.68, cloudColor: '#ffffff', cloudY: 0.22, stars: 0, moon: 0
    },
    light: {
      fill:   { color: '#bfe0ff', intensity: 0.72, position: [-8, 8, -8] },
      rim:    { color: '#ffeab0', intensity: 2.1 },
      rimFix: { color: '#9fd8ff', intensity: 0.85, position: [-7, 9, -12] },
      hemi:   { sky: '#eaf8ff', ground: '#a8c8d8', intensity: 0.90 },
      eye: 0.14, exposure: 0.98
    },
    palette: {
      cloud: '#f6fcff', cloudShade: '#cfe4f2', vine: '#4f9a3f', vineDark: '#33702c',
      leaf: '#6fc04a', stone: '#cdbba0', stoneDark: '#9c8a70', gold: '#f5c542',
      trim: '#f5c542'
    },
    sea: { level: -14, shallow: '#eaf7ff', deep: '#a8cfe6', foam: '#ffffff', waveH: 0.9, waveS: 0.18 },
    deco: { islets: 9, vines: 4, ruins: 6 }
  },

  {
    id: 'baratie', name: 'Baratie', sub: 'East Blue',
    sky: ['#5a3560', '#ff9f57'], ground: '#a06a3f', accent: '#f2a03a',
    fog: { color: '#c4784f', density: 0.0100 },
    sun: { color: '#ffd39a', intensity: 2.25, position: [-13, 7, 7] },
    ambient: { color: '#7a4a58', intensity: 0.64 },
    props: 'restaurant', crowd: false,

    below: '#2c3a5e',
    dome: {
      sunColor: '#ffd08a', sunSize: 0.055, halo: 0.9,
      clouds: 0.48, cloudColor: '#ffb277', cloudY: 0.08, stars: 0.12, moon: 0
    },
    light: {
      fill:   { color: '#6f8fd8', intensity: 0.58, position: [11, 7, -7] },
      rim:    { color: '#ffb46a', intensity: 2.3 },
      rimFix: { color: '#7f8fd8', intensity: 0.95, position: [10, 8, -12] },
      hemi:   { sky: '#ff9f57', ground: '#3f3348', intensity: 0.58 },
      eye: 0.20, exposure: 1.05
    },
    palette: {
      wood: '#a86c3c', woodDark: '#734122', deck: '#c08a4f', rail: '#e0a45a',
      wall: '#c8503a', wallDark: '#8c3326', roof: '#3f5a7a', window: '#ffd07a',
      fish: '#d8604a', trim: '#f2a03a', rope: '#c8a878'
    },
    sea: { level: -2.4, shallow: '#2f5f96', deep: '#132a52', foam: '#ffd9b0', waveH: 0.34, waveS: 0.6 },
    deco: { tables: 7, lanterns: 14, gulls: 6 }
  }
];

export const ARENA_BY_ID = Object.fromEntries(ARENAS.map((a) => [a.id, a]));
export function getArena(id) { return ARENA_BY_ID[id] || ARENAS[0]; }
