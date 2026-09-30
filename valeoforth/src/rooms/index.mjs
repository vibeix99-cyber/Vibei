// The room registry. Order = door order = room numbers.
// To add a room: create src/rooms/<slug>.mjs (copy _template.mjs), then list it here.
import kettle from './kettle.mjs';
export const rooms = [kettle].map((r, i) => ({ ...r, number: String(i + 1).padStart(2, '0') }));
