// Room 01 — Kettle. Copy is limited to what was verified in the running app / its built bundle (see docs/CHECKPOINT.md).
import { html, raw } from '../lib/html.mjs';
import { img } from '../lib/images.mjs';
import { sectionHead, tour, tiles, scene, exit } from '../templates/blocks.mjs';

const poses = [
  ['idle', 'Idle', 'Just being a capybara. Breathing, blinking, the odd ear twitch.'],
  ['wave', 'Wave', 'Hello — the pose that greets you on first launch.'],
  ['focus', 'Focus', 'Eyes closed, holding a warm mug.'],
  ['sleep', 'Sleep', 'Curled up, dreaming in Zs.'],
  ['sip', 'Sip', 'A quiet sip of something hot.'],
  ['cheer', 'Cheer', 'Arms up — the pose from the brew-complete screen.'],
  ['proud', 'Proud', 'Wide-eyed, with a few sparkles.'],
  ['concerned', 'Concerned', 'A small worried frown, hands clasped.'],
  ['think', 'Think', 'Mulling something over.'],
  ['peek', 'Peek', 'Peeks out of empty screens so nothing feels bare.'],
  ['stretch', 'Stretch', 'Arms up for a big stretch.'],
];

const light = [{ value: 'morning', label: 'Morning' }, { value: 'day', label: 'Daytime' }, { value: 'dusk', label: 'Dusk' }, { value: 'night', label: 'Night' }];
const windows = [{ value: 'clear', label: 'Clear sky' }, { value: 'rain', label: 'Rain' }, { value: 'snow', label: 'Snow' }];
const tIdx = { morning: 1, day: 2, dusk: 3, night: 4 }, wIdx = { clear: 1, rain: 2, snow: 3 };
const sceneImages = {};
for (const t of light) for (const w of windows) sceneImages[`${t.value}|${w.value}`] = `nook-t${tIdx[t.value]}-w${wIdx[w.value]}`;

export default {
  slug: 'kettle',
  name: 'Kettle',
  tagline: 'Put the kettle on. Get cozy. Get it done.',
  summary: 'A cozy focus timer with tea breaks, a capybara called Chai, and a little room that fills up as you work.',
  summaryShort: 'a cozy focus timer',
  statusShort: 'Open · private preview',
  doorImage: 'nook-t4-w2',
  themeColor: '#fbf3e6',
  privateNote: 'There’s no public link yet — Kettle is still a private build, so this room is the tour. When there’s something you can open, the door will be right here.',
  demo: null, // set { url, public: true, note } ONLY when a public build is intentionally published

  sections({ root, rooms, self }) {
    const S = [];

    S.push({ id: 'welcome', label: 'Welcome', html: html`
<section class="rhero" id="welcome" aria-labelledby="k-title">
  <div class="wrap rhero__grid">
    <div class="rhero__head">
      <p class="kicker" data-reveal>Room ${self.number}</p>
      <h1 id="k-title" class="display" data-reveal style="--d:60ms">Kettle</h1>
      <p class="rhero__tag" data-reveal style="--d:120ms">${self.tagline}</p>
    </div>
    <div class="rhero__art">
      <div class="arch" data-window>
        <div class="arch__view">${img(root, 'nook-t3-w2', { alt: 'Kettle’s 3D nook at dusk: a small room with a stove and kettle, a floor lamp, a low table on a round rug, fairy lights, and Chai the capybara on a cushion, rain on the window.', sizes: '(min-width: 1040px) 40vw, 80vw', eager: true })}</div>
      </div>
      <div class="rhero__phone phone" aria-hidden="true">${img(root, 'm-focus', { alt: '', sizes: '200px' })}</div>
      <img class="rhero__chai" src="${root}img/chai/peek.svg" alt="" width="150" height="150">
    </div>
    <div class="rhero__body">
      <p class="lede" data-reveal>A focus timer that turns every work session into a small ritual: a kettle warming on a stove, a capybara keeping you company, and a room that gets cozier the more you show up.</p>
      <p class="rhero__cta" data-reveal>
        <a class="btn" href="#brew">Take the tour <span class="arrow" aria-hidden="true" style="transform:rotate(90deg)">→</span></a>
        <a class="btn btn--ghost" href="#chai">Meet Chai</a>
      </p>
      <ul class="facts" role="list" data-reveal>
        <li>Installable web app</li><li>Light &amp; dark themes</li><li>Everything stays on your device</li>
      </ul>
      <p class="status"><span class="dot" aria-hidden="true"></span>Private preview — not public yet</p>
    </div>
  </div>
</section>` });

    S.push({ id: 'brew', label: 'The brew', html: html`
<section class="section" id="brew" aria-labelledby="brew-t">
  <div class="wrap">
    ${sectionHead({ kicker: 'What it does', title: raw('One cup at a time.'), lede: 'Kettle is a Pomodoro-style timer with a gentler tone. You choose what you’re brewing, focus while the kettle heats, and rest when it whistles. Every screen below is the real app.' })}
    ${tour({ root, id: 'brew', label: 'The brew, step by step', steps: [
      { title: 'Choose the shape of your day', image: 'm-ob-goal', alt: 'Kettle onboarding: pick a daily goal — a sip, a cup, a pot or a whole kettle.',
        body: 'On first launch Chai asks how much focus feels right: a sip (15 minutes), a cup (30), a pot (60) or a whole kettle (120). Then a rhythm — Classic 25-minute brews, Deep 50, or Gentle 15 — and a sound to work to.' },
      { title: 'Name what you’re brewing', image: 'm-home', alt: 'Kettle’s Today screen: streak, leaves and level, a daily goal ring, an intention field with Work, Study and Read tags, and a “Put the kettle on” button.',
        body: 'Today shows your streak, leaves and cozy level. Type what you’re working on, tag it — Work, Study, Read, Create or Life — pick a rhythm and put the kettle on.' },
      { title: 'Focus while the kettle heats', image: 'm-focus', alt: 'Kettle’s focus screen: the 3D nook above a large countdown ring reading 13:57, with Add time, Pause and End buttons.',
        body: 'A big ring counts down while steam curls off the stove in the 3D room above it. Pause, end early, or add five minutes. The kettle’s mood changes as the brew goes: “warming up”, “deep in it”, “almost whistling”.',
        note: 'The timer keeps time from the clock, so a reload picks up exactly where you were.' },
      { title: 'The kettle whistles', image: 'm-done-1', alt: 'Kettle’s brew-complete screen: Chai cheering with tiles for minutes focused, leaves earned and progress toward the daily goal.',
        body: 'When a brew ends Chai cheers and tallies the haul: minutes focused, leaves earned, and how close you are to today’s goal. Then, depending on the day, the daily recipes, a streak, or a new badge.' },
      { title: 'Take a proper tea break', image: 'm-tea-break', alt: 'Kettle’s long tea break screen with Chai holding a mug, a 14:56 countdown and a suggestion to take a little walk.',
        body: 'Breaks are part of the loop. After the fourth brew comes a long tea break, with small suggestions — like a little walk to the kitchen and back — and the option to skip or start the next brew.' },
      { title: 'Watch it add up', image: 'm-stats-a', alt: 'Kettle’s Stats screen: day streak, best streak, total focus, full brews, and a cozy level 8 progress card.',
        body: 'Streaks, total focus, full brews, a seven-day chart against your goal, cozy levels and badges. Levels unlock things for your room.',
        note: 'Sample data: I ran a week of sessions through the real app so the numbers you see are Kettle’s own arithmetic, not a mock-up.' },
    ] })}
  </div>
</section>` });

    S.push({ id: 'details', label: 'Little things', html: html`
<section class="section section--tint" id="details" aria-labelledby="det-t">
  <div class="wrap">
    ${sectionHead({ kicker: 'Key interactions', title: 'Little things, done warmly.', lede: 'The details that make it feel lived-in rather than clinical.' })}
    ${tiles({ root, items: [
      { title: 'Sounds you can try first', image: 'tile-sounds',  alt: 'A list of background sounds: Rain, Fireside, Forest, Brown noise, Lo-fi keys and Quiet.', body: 'Rain, Fireside, Forest, Brown noise, Lo-fi keys — or Quiet. Tap one to hear a preview before you commit.' },
      { title: 'Rhythms, or your own', image: 'tile-rhythm',  alt: 'Rhythm choices: Classic 25/5, Deep 50/10, Gentle.', body: 'Classic, Deep and Gentle presets, plus a custom length for the days that don’t fit any of them.' },
      { title: 'Daily recipes', image: 'tile-recipes',  alt: 'Three daily recipes with progress bars: brew 15 minutes, use two tags, finish three full brews.', body: 'Three small daily quests — brew for 15 minutes, use two different tags, finish three full brews — pay out leaves from the tea tin.' },
      { title: 'Badges with a sense of humour', image: 'tile-badge',  alt: 'A “Moonlit Sipper I” badge: finish a brew started after 10 pm.', body: 'Twelve badges, most with five tiers — like Moonlit Sipper, for brews started after 10 pm.' },
      { title: 'Plum, for late nights', image: 'tile-plum',  alt: 'Kettle’s Today screen in the dark Plum theme.', body: 'Paper and Plum themes, following your system by default — and a reduce-motion setting that quiets the animation.' },
      { title: 'Nudges only if you want them', image: 'tile-nudge',  alt: 'A preview of the optional notification: “The kettle’s whistling! Time for tea.”', body: 'Notifications are opt-in, and the app shows you exactly what one will say before asking.' },
    ] })}
  </div>
</section>` });

    S.push({ id: 'nook', label: 'The nook', html: html`
<section class="section band--night" id="nook" aria-labelledby="nook-t">
  <div class="wrap">
    ${sectionHead({ kicker: 'The cozy room', title: 'A room that grows as you do.', lede: 'Every brew earns leaves; leaves raise your cozy level; levels unlock things for the nook — fourteen in all, from a trailing pothos to a record player. It’s a real 3D scene you can drag around. Change the light and the weather:' })}
    ${scene({ root, id: 'nook', groups: [{ name: 'light', label: 'Light', options: light }, { name: 'window', label: 'Window', options: windows }], images: sceneImages, initial: { light: 'dusk', window: 'rain' }, alt: 'Kettle’s 3D nook: a stove with a steaming kettle, a floor lamp, a low table with a tea set on a round rug, books, a plant, a record player, and Chai on a cushion.', caption: 'Captured from the running app with seven of the fourteen things unlocked. In the app, the time of day can follow your clock and the window can match your sound.' })}
  </div>
</section>` });

    S.push({ id: 'chai', label: 'Chai', html: html`
<section class="section" id="chai" aria-labelledby="chai-t">
  <div class="wrap chai">
    <div class="chai__copy">
      ${sectionHead({ kicker: 'The mascot', title: 'Meet Chai.', lede: 'A capybara who wears a yuzu, and keeps you company. Chai greets you on first launch, cheers when the kettle whistles, and peeks out of empty screens so nothing feels bare.' })}
      <p style="color:var(--text-2);max-width:48ch">Eleven poses so far. Each is drawn in code as SVG — no image files — with a little idle life (breathing, blinking, an ear twitch, a wobbling yuzu) that switches off when reduced motion is on.</p>
    </div>
    <div class="chai__stage" data-chai>
      <div class="chai__big" aria-live="polite"><img src="${root}img/chai/idle.svg" alt="Chai the capybara, idle" width="300" height="300" data-chai-big></div>
      <p class="chai__name"><b data-chai-name>Idle</b> <span data-chai-desc>${poses[0][2]}</span></p>
      <ul class="chai__row" role="list" aria-label="Chai’s poses">
        ${poses.map(([id, name, desc], i) => html`<li><button type="button" class="chai__pose" data-pose="${id}" data-name="${name}" data-desc="${desc}" aria-pressed="${i === 0 ? 'true' : 'false'}"><img src="${root}img/chai/${id}.svg" alt="" width="64" height="64" loading="lazy"><span class="sr-only">${name}</span></button></li>`)}
      </ul>
    </div>
  </div>
</section>` });

    S.push({ id: 'built', label: 'How it’s built', html: html`
<section class="section section--tint" id="built" aria-labelledby="built-t">
  <div class="wrap">
    ${sectionHead({ kicker: 'What I built', title: 'The engineering behind the cozy.', lede: 'Kettle is a React and three.js web app, installable as a PWA. A few decisions I’m happiest with:' })}
    <div class="feat">
      <article class="feat__row" data-reveal>
        <div class="feat__copy"><h3 class="display">A timer built on timestamps, not ticks</h3>
          <p>The timer stores when a brew started and when it ends, and a small Web Worker just nudges the display. Remaining time is always computed from the clock — so a reload, a backgrounded tab or a lock screen can’t make it drift.</p></div>
        <figure class="feat__viz" aria-label="Diagram: a brew is stored as a start time and an end time; the display derives remaining time from now.">
          <svg viewBox="0 0 420 150" role="img" aria-label="Timeline showing startedAt, now, and endsAt, with remaining time computed as endsAt minus now">
            <line x1="30" y1="86" x2="390" y2="86" stroke="currentColor" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
            <line x1="30" y1="86" x2="250" y2="86" stroke="#ffb45c" stroke-width="6" stroke-linecap="round"/>
            <g fill="currentColor" font-size="13" font-weight="700" font-family="inherit">
              <circle cx="30" cy="86" r="8" fill="#ffb45c"/><text x="30" y="122" text-anchor="middle">startedAt</text>
              <circle cx="250" cy="86" r="9" fill="#fff" stroke="#ffb45c" stroke-width="4"/><text x="250" y="122" text-anchor="middle">now</text>
              <circle cx="390" cy="86" r="8" fill="none" stroke="currentColor" stroke-width="3"/><text x="390" y="122" text-anchor="middle">endsAt</text>
            </g>
            <path d="M254 66 H386" stroke="currentColor" stroke-width="2" fill="none"/><path d="M254 60v12M386 60v12" stroke="currentColor" stroke-width="2"/>
            <text x="320" y="46" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor">remaining = endsAt − now</text>
          </svg></figure>
      </article>
      <article class="feat__row feat__row--flip" data-reveal>
        <div class="feat__copy"><h3 class="display">A 3D room that degrades gracefully</h3>
          <p>The nook is a three.js scene. When WebGL isn’t available — or 3D is switched off — an illustrated static room takes its place, with the same furniture and weather. Nobody is left with an empty box.</p></div>
        <figure class="feat__viz feat__viz--pair">
          <div>${img(root, 'nook-t2-w2', { alt: 'The live 3D nook, daytime with rain.', sizes: '(min-width: 900px) 24vw, 45vw' })}<figcaption>3D (three.js)</figcaption></div>
          <div>${img(root, 'fallback-rain', { alt: 'The static illustrated fallback nook with rain.', sizes: '(min-width: 900px) 24vw, 45vw' })}<figcaption>Static fallback</figcaption></div>
        </figure>
      </article>
    </div>
    <ul class="deck" role="list">
      <li data-reveal><h3>Sound without audio files</h3><p>Rain, fireside, forest, brown noise and lo-fi keys are generated with the Web Audio API. The whole app ships no sound files.</p></li>
      <li data-reveal><h3>Local-first and private</h3><p>Progress lives in your browser. There’s no account, and the app makes no network calls of its own. Settings can export and import a JSON backup.</p></li>
      <li data-reveal><h3>Installable, and considerate</h3><p>A manifest and service worker make it installable. It can keep the screen awake during a brew, add a haptic tap, and — if you opt in — send a notification.</p></li>
      <li data-reveal><h3>A small design system</h3><p>Six tones (persimmon, matcha, honey, sky, berry, plum), each with face, edge, soft and ink shades, and a script that checks text pairings for AA contrast. Two typefaces: Fredoka and Nunito.</p></li>
    </ul>
    <div class="tech" data-reveal><span>React</span><span>three.js</span><span>Zustand</span><span>Vite</span><span>Web Audio</span><span>Web Workers</span><span>Service worker</span></div>
    <figure class="kit" data-reveal>${img(root, 'kit', { alt: 'Kettle’s in-app UI kit page showing the six tone swatches — Persimmon, Matcha, Honey, Sky, Berry, Plum — and surface colours.', sizes: '(min-width: 1200px) 1100px, 92vw' })}<figcaption>Kettle’s own UI-kit page, part of the app: every component and colour in one place.</figcaption></figure>
  </div>
</section>` });

    S.push({ id: 'visit', label: 'Visiting', html: exit({ root, room: self, rooms }) });
    return S;
  },
};
