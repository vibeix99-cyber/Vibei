import { html } from '../lib/html.mjs';
import { layout } from './layout.mjs';

export function renderRoom({ room, rooms }) {
  const root = '../';
  const sections = room.sections({ root, rooms, self: room });
  const rail = sections.map(({ id, label }) => ({ id, label }));
  const main = html`${sections.map((s) => s.html)}`;
  return layout({
    title: room.name, description: room.summary, root, bodyClass: `room room--${room.slug}`,
    rooms, current: room.slug, room, rail, main, themeColor: room.themeColor, image: `img/og.png`,
  });
}
