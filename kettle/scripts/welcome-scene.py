#!/usr/bin/env python3
"""Usage: python3 scripts/welcome-scene.py  (writes src/screens/welcome/art/welcome-scene-{day,dusk}.svg)
Chai's valley v2 (after the blind critique): flat two-tone fills only, no gradients or glows,
pale-sky day so the yuzu keeps its outline, nothing near Chai's head or waving paw,
lighter ground under him. Canvas 400x400 shown as a circle 1.48x Chai's size;
Chai covers x≈107–293, y≈157–390 (paw up to x≈290, y 230–278)."""
import sys
DAY = dict(sky='#DDEFFB', skyLow='#EAF6FD', sun='#FFD36B', sunHi='#FFE08A', cloud='#FFFFFF',
  far='#CDE6B6', mid='#A9D58F', midShade='#98CB7E', near='#8FCB74', nearHi='#A6D88A', nearLow='#7FBE66', ground='#A6D88A',
  tree='#6FB25C', treeHi='#9BD27F', trunk='#8A5A36', bush='#7DBE64',
  wall='#FBEBD3', wallShade='#EFD9B8', roof='#DE8A5E', roofShade='#C9714A', win='#FFC23D', winHi='#FFE08A', frame='#A8622E',
  chim='#B98763', steam='#FFFFFF', path='#F1DFC2', pathShade='#E4CDA8', f1='#EC6F86', f2='#FFC23D', shadow='#3B2A20', shadowOp='0.10',
  halo='0', stars='0', moon=False)
DUSK = dict(sky='#302850', skyLow='#433A6C', sun='#FFF3D1', sunHi='#FFF3D1', cloud='#4E4478',
  far='#5A5288', mid='#557568', midShade='#4D6C60', near='#608A73', nearHi='#6E977F', nearLow='#557D68', ground='#6E977F',
  tree='#3F6E58', treeHi='#4F8068', trunk='#4A3226', bush='#4C7A62',
  wall='#B9A9C4', wallShade='#A696B3', roof='#A45A45', roofShade='#8A4A39', win='#FFC23D', winHi='#FFE08A', frame='#5A3A2A',
  chim='#7A5A54', steam='#D9D0EA', path='#8A7EA8', pathShade='#7B6F9A', f1='#C77A94', f2='#E3B24A', shadow='#120E1F', shadowOp='0.22',
  halo='0.28', stars='1', moon=True)

def svg(c):
    stars = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#FFF3D1"/>' for x, y, r in
        [(58,78,1.6),(104,46,1.3),(150,92,1.2),(252,52,1.3),(214,118,1.1),(92,128,1.1),(170,30,1.4),(300,130,1.1),(130,20,1.1)])
    sky_obj = ('<path d="M316 70 a20 20 0 1 0 22 24 a16 16 0 1 1 -22 -24Z" fill="{sun}"/>' if c['moon'] else
               '<circle cx="322" cy="86" r="16" fill="{sun}"/><circle cx="317" cy="81" r="5.5" fill="{sunHi}"/>').format(**c)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<rect width="400" height="400" fill="{c['sky']}"/>
<path d="M0 136 C120 148 280 148 400 134 L400 400 L0 400Z" fill="{c['skyLow']}"/>
<g opacity="{c['stars']}">{stars}</g>
{sky_obj}
<g fill="{c['cloud']}"><path d="M40 118c0-9 8-15 16-13 4-8 16-10 22-2 8-2 15 4 14 11z"/><path d="M252 104c0-7 6-11 12-10 3-6 12-7 16-1 6-1 11 3 10 9z"/></g>
<path d="M0 176 C60 168 120 188 180 194 C240 200 300 178 400 168 L400 400 L0 400Z" fill="{c['far']}"/>
<path d="M0 222 C60 204 120 210 170 222 C230 236 290 212 400 214 L400 400 L0 400Z" fill="{c['mid']}"/>
<path d="M0 222 C60 204 120 210 170 222 L150 230 C110 220 60 218 0 234Z" fill="{c['midShade']}"/>
<!-- near meadow, two-tone, calm centre -->
<path d="M0 270 C80 244 160 250 220 258 C290 268 340 254 400 262 L400 400 L0 400Z" fill="{c['near']}"/>
<path d="M0 346 C90 330 300 330 400 346 L400 400 L0 400Z" fill="{c['nearLow']}"/>
<path d="M40 268 C100 252 160 254 210 260" stroke="{c['nearHi']}" stroke-width="7" stroke-linecap="round" fill="none"/>
<!-- lighter ground under Chai -->
<ellipse cx="200" cy="384" rx="118" ry="20" fill="{c['ground']}"/>
<!-- right: one round tree low at the far edge + a low bush, clear of the waving paw -->
<ellipse cx="352" cy="300" rx="26" ry="5" fill="{c['shadow']}" opacity="{c['shadowOp']}"/>
<rect x="348" y="268" width="8" height="32" rx="4" fill="{c['trunk']}"/>
<circle cx="352" cy="256" r="24" fill="{c['tree']}"/>
<path d="M352 232 a24 24 0 0 1 24 24 a24 24 0 0 1 -24 24Z" fill="{c['shadow']}" opacity="{c['shadowOp']}"/>
<circle cx="343" cy="247" r="8" fill="{c['treeHi']}"/>
<path d="M306 318 a14 14 0 0 1 24 -6 a12 12 0 0 1 20 8 Z" fill="{c['bush']}"/>
<!-- path from the cottage door, ending in a rounded tip inside the disc -->
<path d="M70 288 C64 302 56 314 50 324 C44 334 50 342 60 338 C68 328 78 312 84 288Z" fill="{c['path']}"/>
<path d="M84 288 C78 312 68 328 60 338 C66 338 72 332 76 326 C84 312 88 300 88 288Z" fill="{c['pathShade']}"/>
<!-- cottage at the left rim -->
<g transform="translate(58 256)">
  <ellipse cx="2" cy="32" rx="40" ry="6" fill="{c['shadow']}" opacity="{c['shadowOp']}"/>
  <circle cx="-7" cy="10" r="22" fill="#FFC23D" opacity="{c['halo']}"/>
  <rect x="16" y="-50" width="10" height="22" rx="3" fill="{c['chim']}"/>
  <g fill="{c['steam']}" opacity=".85"><circle cx="17" cy="-57" r="4.5"/><circle cx="12" cy="-65" r="5"/></g>
  <rect x="-32" y="-18" width="64" height="50" rx="8" fill="{c['wall']}"/>
  <rect x="14" y="-18" width="18" height="50" rx="8" fill="{c['wallShade']}"/>
  <path d="M-40 -12 C-28 -40 -10 -50 2 -50 C14 -50 32 -40 42 -12 C44 -6 39 -3 34 -5 L-30 -5 C-37 -3 -42 -6 -40 -12Z" fill="{c['roof']}"/>
  <path d="M2 -50 C14 -50 32 -40 42 -12 C44 -6 39 -3 34 -5 L20 -5 C26 -22 18 -42 2 -50Z" fill="{c['roofShade']}"/>
  <path d="M-19 22 L-19 5 A12 12 0 0 1 5 5 L5 22Z" fill="{c['frame']}"/>
  <path d="M-16 20 L-16 5 A9 9 0 0 1 2 5 L2 20Z" fill="{c['win']}"/>
  <path d="M-16 20 L-16 5 A9 9 0 0 1 -7 -4 L-7 20Z" fill="{c['winHi']}"/>
  <rect x="-8" y="-4" width="2" height="24" fill="{c['frame']}"/><rect x="-16" y="10" width="18" height="2" fill="{c['frame']}"/>
  <rect x="11" y="6" width="14" height="26" rx="6" fill="{c['frame']}"/>
</g>
<g><circle cx="104" cy="318" r="3" fill="{c['f1']}"/><circle cx="112" cy="324" r="2.5" fill="{c['f2']}"/><circle cx="318" cy="338" r="3" fill="{c['f2']}"/><circle cx="330" cy="344" r="2.5" fill="{c['f1']}"/><circle cx="74" cy="376" r="2.5" fill="{c['f2']}"/></g>
</svg>
'''
out = sys.argv[1] if len(sys.argv) > 1 else "src/screens/welcome/art"
open(f'{out}/welcome-scene-day.svg', 'w').write(svg(DAY))
open(f'{out}/welcome-scene-dusk.svg', 'w').write(svg(DUSK))
print('ok')
