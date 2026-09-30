// Copy this file to src/rooms/<slug>.mjs and register it in index.mjs.
import { html } from '../lib/html.mjs';
import { img } from '../lib/images.mjs';
import { sectionHead, tour, tiles, scene, exit } from '../templates/blocks.mjs';

export default {
  slug: 'example',                 // URL: /example/
  name: 'Example',
  tagline: 'One line, in the project’s own voice.',
  summary: 'One or two sentences for the hall list and the Rooms menu.',
  summaryShort: 'a few words on the door plate',
  statusShort: 'Open',             // shown in the hall list
  doorImage: 'example-door',       // image name from public/img (see tools/images.mjs), seen through the doorway
  themeColor: '#fbf3e6',
  privateNote: 'Shown in the exit block while there is no public link.',
  demo: null,                      // { url, public: true, note } ONLY once a public build is intentionally published

  // Return the room's sections. Each is { id, label, html }: labels become the in-room rail.
  sections({ root, rooms, self }) {
    return [
      { id: 'welcome', label: 'Welcome', html: html`<section class="section" id="welcome"><div class="wrap"><h1 class="display">${self.name}</h1></div></section>` },
      { id: 'visit', label: 'Visiting', html: exit({ root, room: self, rooms }) },
    ];
  },
};
