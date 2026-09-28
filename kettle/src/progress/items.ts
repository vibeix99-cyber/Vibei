/**
 * Nook items catalog — shared contract between progress (unlocks), scene
 * (3D rendering) and the Nook screen. Ids are stable; never rename.
 * Base room (always present): window, kettle on a little stove, low table, mug, rug, floor lamp.
 */
export interface NookItem {
  id: string;
  name: string;
  /** One-line story shown when tapped. Chai's voice. */
  story: string;
  unlockLevel: number;
}

export const ITEMS: NookItem[] = [
  { id: 'pothos', name: 'Trailing pothos', story: 'It grows a little every time you focus. Probably.', unlockLevel: 2 },
  { id: 'books', name: 'Stack of books', story: 'Half-read, all loved.', unlockLevel: 3 },
  { id: 'cushion', name: 'Floor cushion', story: 'Chai insists this one is theirs.', unlockLevel: 4 },
  { id: 'fairyLights', name: 'Fairy lights', story: 'Tiny warm stars for rainy evenings.', unlockLevel: 5 },
  { id: 'shelf', name: 'Wall shelf', story: 'A home for little treasures.', unlockLevel: 6 },
  { id: 'teaSet', name: 'Tea set', story: 'For when a mug just won’t do.', unlockLevel: 7 },
  { id: 'recordPlayer', name: 'Record player', story: 'Plays mostly rain sounds. Chai approves.', unlockLevel: 8 },
  { id: 'blanket', name: 'Knitted blanket', story: 'Knitted slowly, one focus session at a time.', unlockLevel: 9 },
  { id: 'painting', name: 'Mountain painting', story: 'A view for when the window shows only rain.', unlockLevel: 10 },
  { id: 'lantern', name: 'Paper lantern', story: 'Soft light, softer thoughts.', unlockLevel: 12 },
  { id: 'monstera', name: 'Big monstera', story: 'Proof that patience pays off.', unlockLevel: 14 },
  { id: 'catBed', name: 'Tiny visitor', story: 'A neighbour cat who naps here on focus days.', unlockLevel: 16 },
  { id: 'telescope', name: 'Little telescope', story: 'For counting stars between sessions.', unlockLevel: 18 },
  { id: 'kotatsu', name: 'Kotatsu', story: 'The coziest table ever invented. You earned it.', unlockLevel: 20 },
];

export const ITEM_BY_ID: Record<string, NookItem> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

export function itemsUnlockedAt(level: number): string[] {
  return ITEMS.filter((i) => i.unlockLevel <= level).map((i) => i.id);
}
