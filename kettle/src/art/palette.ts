/**
 * Illustration palette. OWNER: art area.
 * Character/object colors are hardcoded (they must stay on-model in both
 * themes); anything that sits "on the page" (backgrounds, steam, shadows)
 * uses CSS vars set in art.module.css so it adapts to night mode.
 */
export const PAL = {
  // Chai
  fur: '#C98A59',
  furShade: '#A96C42',
  furHi: '#E0AA79',
  cream: '#F7E1C3',
  creamShade: '#E9C9A2',
  ear: '#9E643D',
  earIn: '#7C4A2D',
  paw: '#A5683F',
  pawHi: '#BF8152',
  nose: '#3A251B',
  eye: '#2B1C14',
  mouth: '#5B3324',
  tongue: '#EF7F7C',
  blush: '#F4918F',
  // yuzu + leaf
  yuzu: '#FFC83D',
  yuzuShade: '#EFA325',
  yuzuHi: '#FFE68A',
  stem: '#6B4A2B',
  leaf: '#6DB85A',
  leafShade: '#4E9A43',
  leafHi: '#9AD67F',
  // brand objects
  persimmon: '#F2733A',
  persimmonShade: '#D4592A',
  persimmonHi: '#FF9D6B',
  honey: '#FFC23D',
  honeyShade: '#E3A11C',
  honeyHi: '#FFE08A',
  matcha: '#6FB25C',
  matchaShade: '#55953F',
  matchaHi: '#9BD27F',
  sky: '#5AAEE0',
  skyShade: '#3F92C7',
  skyHi: '#9AD2F2',
  berry: '#EC6F86',
  berryShade: '#CF5169',
  berryHi: '#F7A1B0',
  oat: '#EBD7BA',
  oatShade: '#D4BA96',
  oatHi: '#F8EBD6',
  plum: '#2A2340',
  plumMid: '#3C3260',
  paper: '#FFF9F0',
  ink: '#3B2A20',
  tea: '#A8622E',
  teaHi: '#C98247',
  white: '#FFFFFF',
  steel: '#9FB2C2',
  steelShade: '#7E93A6',
  steelHi: '#C9D6E1',
} as const;

/** Tier colors for badges I–V: oat → sky → matcha → berry → honey-gold. */
export const TIER = [
  { base: '#D6AE7E', shade: '#BC9160', hi: '#EDD2AC', ribbon: '#9E7344', ink: '#5B3B1C' },
  { base: '#6DB9E6', shade: '#4A9ACF', hi: '#A9DAF5', ribbon: '#3B7FB0', ink: '#1F4D6E' },
  { base: '#7CC066', shade: '#5CA24A', hi: '#AEDD96', ribbon: '#4A8A3A', ink: '#2A5421' },
  { base: '#EE7C92', shade: '#D25C75', hi: '#F8AEBC', ribbon: '#B84760', ink: '#6E2436' },
  { base: '#FFC940', shade: '#E7A51E', hi: '#FFE68F', ribbon: '#D48A12', ink: '#7A4C06' },
] as const;

export const LOCKED = { base: '#D9D0C5', shade: '#C2B7AA', hi: '#EAE3DA', ribbon: '#B1A597', ink: '#8C7F72' } as const;

/** Stable, CSS-safe id prefix from React's useId(). */
export function safeId(id: string): string {
  return 'k' + id.replace(/[^a-zA-Z0-9_-]/g, '');
}
