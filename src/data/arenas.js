// Arena definitions — drive the 3D stage, lighting and skybox.

export const ARENAS = [
  {
    id: 'colosseum', name: 'Corrida Colosseum', sub: 'Dressrosa',
    sky: ['#ffb26b', '#5a3a6b'], ground: '#c98a4b', accent: '#f2d24b',
    fog: { color: '#e8a86b', density: 0.012 },
    sun: { color: '#fff2d0', intensity: 2.4, position: [8, 14, 6] },
    ambient: { color: '#7a5fa0', intensity: 0.55 },
    props: 'colosseum', crowd: true
  },
  {
    id: 'marineford', name: 'Marineford', sub: 'The Great War',
    sky: ['#6b7fa8', '#1a1f33'], ground: '#8fa3b8', accent: '#4a8fd0',
    fog: { color: '#7a8aa0', density: 0.018 },
    sun: { color: '#dce8ff', intensity: 1.9, position: [-6, 12, 8] },
    ambient: { color: '#3a4a6b', intensity: 0.6 },
    props: 'plaza', crowd: false
  },
  {
    id: 'sunny_deck', name: 'Thousand Sunny', sub: 'Open Sea',
    sky: ['#8fd8ff', '#2a6fb0'], ground: '#c8a165', accent: '#f0913a',
    fog: { color: '#a8d8f0', density: 0.008 },
    sun: { color: '#fffbe8', intensity: 2.6, position: [6, 16, -4] },
    ambient: { color: '#88b8e0', intensity: 0.7 },
    props: 'ship', crowd: false
  },
  {
    id: 'onigashima', name: 'Onigashima Rooftop', sub: 'Wano',
    sky: ['#2a1f3a', '#0c0a14'], ground: '#3a2a3a', accent: '#c04a6a',
    fog: { color: '#2a1f3a', density: 0.02 },
    sun: { color: '#ffb0c0', intensity: 1.6, position: [0, 14, -10] },
    ambient: { color: '#4a2a5a', intensity: 0.5 },
    props: 'rooftop', crowd: false
  },
  {
    id: 'skypiea', name: 'Upper Yard', sub: 'Skypiea',
    sky: ['#dff5ff', '#7fc8f0'], ground: '#eaf6ff', accent: '#f5c542',
    fog: { color: '#dff5ff', density: 0.01 },
    sun: { color: '#ffffff', intensity: 2.8, position: [4, 18, 4] },
    ambient: { color: '#cfe8ff', intensity: 0.9 },
    props: 'clouds', crowd: false
  },
  {
    id: 'baratie', name: 'Baratie', sub: 'East Blue',
    sky: ['#ff9a5c', '#3a2a4a'], ground: '#8a5a3a', accent: '#f2a03a',
    fog: { color: '#c07a5a', density: 0.014 },
    sun: { color: '#ffd8a0', intensity: 2.2, position: [-8, 8, 6] },
    ambient: { color: '#6a4a5a', intensity: 0.6 },
    props: 'ship', crowd: false
  }
];

export const ARENA_BY_ID = Object.fromEntries(ARENAS.map((a) => [a.id, a]));
export function getArena(id) { return ARENA_BY_ID[id] || ARENAS[0]; }
