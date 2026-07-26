/* ==========================================================================
   sprites.js — procedural creature renderer.

   Every fighter is drawn from a small parameter bag (see SPECIES[*].sprite)
   using canvas primitives, so the game ships with zero image assets.
   Local space: feet rest on y = 0, the body reaches up to about y = -105,
   and the creature always faces +x (the caller flips with `facing`).
   ========================================================================== */

/* ------------------------------------------------------------ color utils */

function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex(r, g, b) {
  const f = v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return '#' + f(r) + f(g) + f(b);
}
function mixColor(a, b, amt) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * amt, A[1] + (B[1] - A[1]) * amt, A[2] + (B[2] - A[2]) * amt);
}
function shade(hex, amt) {
  return amt < 0 ? mixColor(hex, '#000000', -amt) : mixColor(hex, '#ffffff', amt);
}

/* ------------------------------------------------------------- primitives */

function makePainter(ctx, tint, tintAmt) {
  const C = hex => (tintAmt > 0 ? mixColor(hex, tint, tintAmt) : hex);

  function stroked(fill, outline) {
    ctx.fillStyle = C(fill);
    ctx.fill();
    if (outline !== false) {
      /* dark fills get a lighter rim so the silhouette never turns to mush */
      const [r, g, b] = hexToRgb(fill);
      const lum = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      ctx.strokeStyle = C(lum < 0.28 ? shade(fill, 0.34) : shade(fill, -0.55));
      ctx.stroke();
    }
  }

  return {
    C,
    ell(x, y, rx, ry, fill, rot = 0, outline) {
      ctx.beginPath();
      ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
      stroked(fill, outline);
    },
    circ(x, y, r, fill, outline) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      stroked(fill, outline);
    },
    poly(points, fill, outline) {
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
      ctx.closePath();
      stroked(fill, outline);
    },
    /* quadratic ribbon: a tapered curve, handy for tails and necks */
    ribbon(pts, w0, w1, fill, outline) {
      ctx.beginPath();
      const n = pts.length;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1), w = w0 + (w1 - w0) * t;
        const p = pts[i], q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)];
        const dx = q[0] - r[0], dy = q[1] - r[1];
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len * w, ny = dx / len * w;
        if (i === 0) ctx.moveTo(p[0] + nx, p[1] + ny); else ctx.lineTo(p[0] + nx, p[1] + ny);
      }
      for (let i = n - 1; i >= 0; i--) {
        const t = i / (n - 1), w = w0 + (w1 - w0) * t;
        const p = pts[i], q = pts[Math.min(n - 1, i + 1)], r = pts[Math.max(0, i - 1)];
        const dx = q[0] - r[0], dy = q[1] - r[1];
        const len = Math.hypot(dx, dy) || 1;
        ctx.lineTo(p[0] + dy / len * w, p[1] - dx / len * w);
      }
      ctx.closePath();
      stroked(fill, outline);
    },
    line(x1, y1, x2, y2, color, w) {
      ctx.beginPath();
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
      ctx.strokeStyle = C(color);
      const old = ctx.lineWidth;
      ctx.lineWidth = w;
      ctx.stroke();
      ctx.lineWidth = old;
    },
    star(x, y, r, color, points = 4) {
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const rr = i % 2 ? r * 0.38 : r;
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = C(color);
      ctx.fill();
    }
  };
}

/* ------------------------------------------------------------------- eyes */

function drawEyes(P, s, hx, hy, hr) {
  const style = s.eyes || 'cute';
  const ec = s.eyeC || '#1b1b25';
  const x1 = hx + hr * 0.05, x2 = hx + hr * 0.62, y = hy - hr * 0.12;
  const r = hr * 0.19;

  const pupil = (x, big) => {
    P.ell(x, y, r * (big ? 1.15 : 1), r * (big ? 1.3 : 1.15), '#ffffff', 0, false);
    P.circ(x + r * 0.15, y + r * 0.1, r * 0.62, ec, false);
    P.circ(x + r * 0.35, y - r * 0.3, r * 0.24, '#ffffff', false);
  };

  switch (style) {
    case 'cute':
      pupil(x1, true); pupil(x2, true);
      break;
    case 'sharp':
      P.poly([[x1 - r, y - r * 0.5], [x1 + r, y - r * 1.1], [x1 + r, y + r * 0.5], [x1 - r, y + r * 0.6]], '#ffffff', false);
      P.poly([[x2 - r, y - r * 1.05], [x2 + r, y - r * 0.5], [x2 + r, y + r * 0.6], [x2 - r, y + r * 0.5]], '#ffffff', false);
      P.circ(x1 + r * 0.2, y, r * 0.5, ec, false);
      P.circ(x2 - r * 0.1, y, r * 0.5, ec, false);
      break;
    case 'furious':
      P.poly([[x1 - r, y - r * 0.2], [x1 + r, y - r * 1.2], [x1 + r, y + r * 0.7], [x1 - r, y + r * 0.7]], s.eyeC || '#f5e04a', false);
      P.poly([[x2 - r, y - r * 1.1], [x2 + r, y - r * 0.2], [x2 + r, y + r * 0.7], [x2 - r, y + r * 0.7]], s.eyeC || '#f5e04a', false);
      P.circ(x1 + r * 0.2, y + r * 0.1, r * 0.42, '#1b1b25', false);
      P.circ(x2 - r * 0.1, y + r * 0.1, r * 0.42, '#1b1b25', false);
      break;
    case 'glow': {
      const g = s.eyeC || '#f5d24a';
      P.ell(x1, y, r * 0.95, r * 0.75, g, -0.25, false);
      P.ell(x2, y, r * 0.95, r * 0.75, g, 0.25, false);
      P.ell(x1, y, r * 0.45, r * 0.35, '#ffffff', -0.25, false);
      P.ell(x2, y, r * 0.45, r * 0.35, '#ffffff', 0.25, false);
      break;
    }
    case 'closed':
    case 'calm': {
      P.line(x1 - r, y, x1 + r, y - (style === 'calm' ? r * 0.2 : 0), '#1b1b25', Math.max(1.6, r * 0.45));
      P.line(x2 - r, y - (style === 'calm' ? r * 0.2 : 0), x2 + r, y, '#1b1b25', Math.max(1.6, r * 0.45));
      break;
    }
    case 'grin':
      P.ell(x1, y, r * 1.1, r * 0.85, '#ffffff', -0.2, false);
      P.ell(x2, y, r * 1.1, r * 0.85, '#ffffff', 0.2, false);
      P.circ(x1, y + r * 0.1, r * 0.4, '#1b1b25', false);
      P.circ(x2, y + r * 0.1, r * 0.4, '#1b1b25', false);
      break;
  }

  /* mouths */
  const my = hy + hr * 0.45;
  if (style === 'grin') {
    P.poly([[hx - hr * 0.5, my - hr * 0.05], [hx + hr * 0.8, my - hr * 0.05], [hx + hr * 0.35, my + hr * 0.45]], '#2a1030', false);
    for (let i = 0; i < 4; i++) {
      const t = i / 3;
      const x = hx - hr * 0.5 + (hr * 1.3) * t;
      P.poly([[x, my - hr * 0.05], [x + hr * 0.14, my - hr * 0.05], [x + hr * 0.07, my + hr * 0.16]], '#ffffff', false);
    }
  } else if (style === 'furious' || style === 'sharp') {
    P.line(hx + hr * 0.15, my, hx + hr * 0.75, my - hr * 0.1, '#1b1b25', Math.max(1.4, hr * 0.09));
  }
}

/* ------------------------------------------------------------- appendages */

function drawEars(P, s, hx, hy, hr) {
  const c = s.c1, tip = s.earTip || shade(s.c1, -0.35);
  switch (s.ears) {
    case 'pointy':
      P.poly([[hx - hr * 0.7, hy - hr * 0.55], [hx - hr * 0.95, hy - hr * 2.3], [hx - hr * 0.1, hy - hr * 0.95]], c);
      P.poly([[hx + hr * 0.35, hy - hr * 0.85], [hx + hr * 0.75, hy - hr * 2.35], [hx + hr * 0.9, hy - hr * 0.5]], c);
      P.poly([[hx - hr * 0.95, hy - hr * 2.3], [hx - hr * 0.82, hy - hr * 1.62], [hx - hr * 0.45, hy - hr * 1.85]], tip, false);
      P.poly([[hx + hr * 0.75, hy - hr * 2.35], [hx + hr * 0.5, hy - hr * 1.75], [hx + hr * 0.85, hy - hr * 1.6]], tip, false);
      break;
    case 'long':
      P.ribbon([[hx - hr * 0.5, hy - hr * 0.6], [hx - hr * 0.95, hy - hr * 1.7], [hx - hr * 0.75, hy - hr * 2.6]], hr * 0.22, hr * 0.1, c);
      P.ribbon([[hx + hr * 0.55, hy - hr * 0.6], [hx + hr * 0.95, hy - hr * 1.7], [hx + hr * 0.8, hy - hr * 2.6]], hr * 0.22, hr * 0.1, c);
      break;
    case 'round':
      P.circ(hx - hr * 0.78, hy - hr * 0.75, hr * 0.3, c);
      P.circ(hx + hr * 0.82, hy - hr * 0.7, hr * 0.3, c);
      break;
  }
}

function drawHorn(P, s, hx, hy, hr) {
  const c = s.c3 || '#e8e0c8';
  switch (s.horn) {
    case 'single':
      P.poly([[hx + hr * 0.55, hy - hr * 0.35], [hx + hr * 1.55, hy - hr * 0.75], [hx + hr * 0.62, hy - hr * 0.02]], c);
      break;
    case 'pair':
      P.poly([[hx - hr * 0.35, hy - hr * 0.8], [hx - hr * 0.95, hy - hr * 1.75], [hx - hr * 0.02, hy - hr * 1.05]], c);
      P.poly([[hx + hr * 0.3, hy - hr * 0.85], [hx + hr * 0.35, hy - hr * 1.8], [hx + hr * 0.68, hy - hr * 0.7]], c);
      break;
    case 'fin':
      P.poly([[hx - hr * 0.2, hy - hr * 0.85], [hx - hr * 1.5, hy - hr * 1.45], [hx + hr * 0.35, hy - hr * 1.1]], c);
      P.poly([[hx + hr * 0.2, hy - hr * 0.9], [hx + hr * 1.5, hy - hr * 1.4], [hx + hr * 0.55, hy - hr * 0.6]], c);
      break;
    case 'tusks':
      P.ribbon([[hx + hr * 0.35, hy + hr * 0.6], [hx + hr * 1.7, hy + hr * 0.6], [hx + hr * 2.2, hy - hr * 0.6]], hr * 0.26, hr * 0.07, c);
      P.ribbon([[hx + hr * 0.3, hy + hr * 0.9], [hx + hr * 1.3, hy + hr * 0.95], [hx + hr * 1.7, hy + hr * 0.15]], hr * 0.22, hr * 0.06, shade(c, -0.18));
      break;
  }
}

function drawTail(P, s, bx, by, scale = 1) {
  const c = s.c1, d = s.c2;
  switch (s.tail) {
    case 'zigzag':
      P.poly([
        [bx, by], [bx - 14 * scale, by - 4 * scale], [bx - 24 * scale, by - 26 * scale],
        [bx - 8 * scale, by - 22 * scale], [bx - 16 * scale, by - 46 * scale],
        [bx + 6 * scale, by - 30 * scale], [bx + 2 * scale, by - 10 * scale]
      ], '#f0c33c');
      break;
    case 'flame':
      P.ribbon([[bx, by], [bx - 26 * scale, by - 8 * scale], [bx - 40 * scale, by - 34 * scale]], 8 * scale, 5 * scale, c);
      P.poly([[bx - 44 * scale, by - 32 * scale], [bx - 34 * scale, by - 60 * scale], [bx - 27 * scale, by - 40 * scale], [bx - 30 * scale, by - 31 * scale]], '#ff8a2a', false);
      P.poly([[bx - 41 * scale, by - 34 * scale], [bx - 35 * scale, by - 52 * scale], [bx - 30 * scale, by - 36 * scale]], '#ffd84a', false);
      break;
    case 'fluffy':
      P.circ(bx - 12 * scale, by - 6 * scale, 13 * scale, s.mane || s.c3);
      P.circ(bx - 22 * scale, by - 16 * scale, 11 * scale, s.mane || s.c3);
      P.circ(bx - 14 * scale, by - 22 * scale, 10 * scale, s.mane || s.c3);
      break;
    case 'spike':
      P.ribbon([[bx, by], [bx - 24 * scale, by + 2 * scale], [bx - 44 * scale, by - 12 * scale]], 9 * scale, 3 * scale, c);
      P.poly([[bx - 44 * scale, by - 12 * scale], [bx - 56 * scale, by - 20 * scale], [bx - 42 * scale, by - 4 * scale]], d);
      break;
    case 'long':
      P.ribbon([[bx, by], [bx - 22 * scale, by + 4 * scale], [bx - 40 * scale, by - 20 * scale]], 6 * scale, 3 * scale, c);
      break;
    case 'fin':
      P.poly([[bx, by + 4 * scale], [bx - 34 * scale, by - 2 * scale], [bx - 46 * scale, by - 22 * scale], [bx - 22 * scale, by - 14 * scale], [bx - 4 * scale, by - 12 * scale]], c);
      break;
  }
}

function drawWings(P, s, bx, by) {
  const wc = s.wingC || shade(s.c1, -0.2);
  switch (s.wings) {
    case 'bat':
      P.poly([[bx - 4, by + 6], [bx - 58, by - 58], [bx - 30, by - 44], [bx - 44, by - 20], [bx - 16, by - 24], [bx - 18, by + 8]], wc);
      P.poly([[bx + 6, by + 2], [bx + 64, by - 62], [bx + 38, by - 46], [bx + 52, by - 22], [bx + 20, by - 26], [bx + 22, by + 4]], shade(wc, -0.14));
      break;
    case 'small':
      P.poly([[bx - 6, by - 4], [bx - 46, by - 48], [bx - 22, by - 36], [bx - 26, by - 14]], wc);
      P.poly([[bx + 8, by - 6], [bx + 50, by - 50], [bx + 28, by - 38], [bx + 30, by - 16]], shade(wc, -0.14));
      break;
    case 'blade':
      P.poly([[bx - 6, by - 2], [bx - 60, by - 26], [bx - 18, by - 26]], wc);
      P.poly([[bx + 8, by - 4], [bx + 62, by - 28], [bx + 20, by - 28]], shade(wc, -0.1));
      break;
  }
}

function drawMarks(P, s, bx, by, rx, ry) {
  switch (s.marks) {
    case 'stripes':
      for (let i = -1; i <= 1; i++) {
        P.poly([
          [bx + i * rx * 0.5 - 3, by - ry * 0.75], [bx + i * rx * 0.5 + 5, by - ry * 0.7],
          [bx + i * rx * 0.5 + 1, by - ry * 0.1], [bx + i * rx * 0.5 - 6, by - ry * 0.15]
        ], s.c2, false);
      }
      break;
    case 'spots':
      P.circ(bx - rx * 0.35, by - ry * 0.35, rx * 0.13, s.c2, false);
      P.circ(bx + rx * 0.15, by - ry * 0.55, rx * 0.1, s.c2, false);
      P.circ(bx + rx * 0.4, by - ry * 0.1, rx * 0.11, s.c2, false);
      break;
    case 'rings':
      P.circ(bx - rx * 0.3, by - ry * 0.25, rx * 0.17, s.c3, false);
      P.circ(bx + rx * 0.42, by + ry * 0.1, rx * 0.13, s.c3, false);
      P.circ(bx - rx * 0.72, by + ry * 0.35, rx * 0.1, s.c3, false);
      P.circ(bx + rx * 0.1, by - ry * 0.75, rx * 0.11, s.c3, false);
      break;
    case 'plates':
      P.poly([[bx - rx * 0.72, by - ry * 0.25], [bx - rx * 0.12, by - ry * 0.55], [bx - rx * 0.05, by + ry * 0.2], [bx - rx * 0.66, by + ry * 0.4]], shade(s.c1, -0.26), false);
      P.poly([[bx + rx * 0.04, by - ry * 0.6], [bx + rx * 0.66, by - ry * 0.3], [bx + rx * 0.6, by + ry * 0.32], [bx + rx * 0.08, by + ry * 0.28]], shade(s.c1, 0.2), false);
      P.poly([[bx - rx * 0.78, by + ry * 0.45], [bx - rx * 0.3, by + ry * 0.42], [bx - rx * 0.36, by + ry * 0.82], [bx - rx * 0.72, by + ry * 0.78]], shade(s.c1, -0.16), false);
      break;
  }
}

function drawSpikes(P, s, bx, by, rx, ry) {
  const c = s.c3 || shade(s.c1, 0.3);
  for (let i = 0; i < 3; i++) {
    const t = i / 2;
    const x = bx - rx * 0.55 - 4, y = by - ry * (0.15 + t * 0.75);
    P.poly([[x, y], [x - 12, y - 6], [x + 2, y + 6]], c);
  }
}

/* ------------------------------------------------------------------ extras */

const EXTRAS = {
  cannons(P, s, g) {
    const c = '#8d97a4';
    for (const dir of [-1, 1]) {
      const x = g.bx + dir * g.rx * 1.05, y = g.by - g.ry * 0.5;
      P.ell(x, y, 13, 10, s.shell || '#9b6b3c', dir * 0.2);
      P.ell(x + dir * 9, y - 3, 8, 6, c, dir * 0.35);
      P.circ(x + dir * 14, y - 5, 4.5, '#2f3540', false);
    }
  },
  flower(P, s, g) {
    const cx = g.bx - 24, cy = g.by - g.ry * 1.5;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      P.ell(cx + Math.cos(a) * 15, cy + Math.sin(a) * 9, 11, 8, i % 2 ? '#f06a9a' : '#e8548a', a);
    }
    P.circ(cx, cy, 8, '#f5d24a');
    P.ell(cx - 26, cy + 8, 14, 7, '#4d8f6a', -0.3);
    P.ell(cx + 26, cy + 8, 14, 7, '#4d8f6a', 0.3);
  },
  fourarms(P, s, g) {
    for (const dir of [-1, 1]) {
      P.ell(g.bx + dir * g.rx * 1.0, g.by - g.ry * 0.1, 7, 16, s.c1, dir * 0.55);
      P.circ(g.bx + dir * g.rx * 1.25, g.by + g.ry * 0.3, 7.5, s.c1);
    }
  },
  spoons(P, s, g) {
    for (const dir of [-1, 1]) {
      const x = g.bx + dir * g.rx * 1.35, y = g.by - g.ry * 0.2;
      P.line(x, y, x + dir * 4, y - 20, '#c8ced8', 3.5);
      P.ell(x + dir * 5, y - 25, 5, 7, '#e2e8f0', dir * 0.3);
    }
  },
  mustache(P, s, g) {
    const { hx, hy, hr } = g;
    P.ribbon([[hx + hr * 0.3, hy + hr * 0.3], [hx + hr * 1.1, hy + hr * 0.55], [hx + hr * 1.35, hy + hr * 1.5]], 3, 1.5, '#d8b872');
    P.ribbon([[hx - hr * 0.15, hy + hr * 0.35], [hx + hr * 0.35, hy + hr * 0.8], [hx + hr * 0.3, hy + hr * 1.7]], 3, 1.5, '#d8b872');
  },
  scythes(P, s, g) {
    P.ribbon([[g.bx + g.rx * 0.5, g.by - g.ry * 0.4], [g.bx + g.rx * 1.6, g.by - g.ry * 1.1], [g.bx + g.rx * 2.1, g.by - g.ry * 0.1]], 5, 2, s.c3);
    P.ribbon([[g.bx - g.rx * 0.1, g.by - g.ry * 0.2], [g.bx + g.rx * 0.9, g.by - g.ry * 1.5], [g.bx + g.rx * 1.5, g.by - g.ry * 0.9]], 5, 2, shade(s.c3, -0.12));
  },
  aura(P, s, g) {
    P.circ(g.bx, g.by - g.ry * 0.15, 6, '#f5e04a', false);
    for (const dir of [-1, 1]) {
      P.poly([[g.bx + dir * g.rx * 0.9, g.by - g.ry * 0.75], [g.bx + dir * g.rx * 1.5, g.by - g.ry * 1.0], [g.bx + dir * g.rx * 1.0, g.by - g.ry * 0.45]], '#e8c86a');
    }
  },
  gown(P, s, g) { /* handled by the float archetype */ },
  scarf(P, s, g) {
    const c = s.scarfC || '#e05a7a';
    P.ribbon([[g.hx - g.hr * 0.6, g.hy + g.hr * 1.1], [g.hx - g.hr * 1.6, g.hy + g.hr * 2.4], [g.hx - g.hr * 2.6, g.hy + g.hr * 2.0]], 5, 3, c);
    P.ell(g.hx, g.hy + g.hr * 1.05, g.hr * 0.95, g.hr * 0.35, c);
  },
  ribbons(P, s, g) {
    const c = '#f2b6d2';
    /* one bow at the ear, streamers trailing behind the shoulder */
    P.ribbon([[g.hx - g.hr * 0.8, g.hy - g.hr * 0.1], [g.hx - g.hr * 1.5, g.hy + g.hr * 0.9], [g.hx - g.hr * 1.2, g.hy + g.hr * 2.0]], 3.6, 1.6, c);
    P.ribbon([[g.hx + g.hr * 0.2, g.hy + g.hr * 0.9], [g.hx + g.hr * 0.6, g.hy + g.hr * 1.8], [g.hx + g.hr * 1.4, g.hy + g.hr * 2.3]], 3.2, 1.4, shade(c, -0.12));
    P.circ(g.hx - g.hr * 0.8, g.hy - g.hr * 0.15, 5, '#ffeef6');
  },
  wristfire(P, s, g) {
    for (const dir of [-1, 1]) {
      const x = g.bx + dir * g.rx * 1.15, y = g.by - g.ry * 0.55;
      P.poly([[x - 8, y + 6], [x, y - 18], [x + 8, y + 6]], '#ffa42a', false);
      P.poly([[x - 4, y + 4], [x, y - 10], [x + 4, y + 4]], '#ffe07a', false);
    }
  },
  claws(P, s, g) {
    for (const dir of [-1, 1]) {
      const x = g.bx + dir * g.rx * 1.15, y = g.by - g.ry * 0.35;
      for (let i = -1; i <= 1; i++) {
        P.poly([[x, y + i * 4], [x + dir * 16, y + i * 6 - 4], [x, y + i * 4 + 4]], '#e8eff5', false);
      }
    }
  }
};

/* ------------------------------------------------------------- archetypes */

function bodyBiped(P, s) {
  const c1 = s.c1, c2 = s.c2, c3 = s.c3;
  /* legs + feet */
  P.ell(-13, -14, 12, 15, c1);
  P.ell(15, -13, 13, 16, c1);
  P.ell(-16, -5, 15, 7, shade(c1, -0.12));
  P.ell(19, -4, 16, 7, shade(c1, -0.12));
  /* torso */
  P.ell(2, -52, 25, 31, c1);
  P.ell(5, -47, 16, 22, c3, 0, false);
  drawMarks(P, s, 2, -52, 25, 31);
  /* arms */
  P.ell(-21, -56, 8, 17, c1, -0.35);
  P.ell(25, -54, 8, 17, c1, 0.35);
  return { bx: 2, by: -52, rx: 25, ry: 31, hx: 6, hy: -88, hr: 20 };
}

function bodyQuad(P, s) {
  const c1 = s.c1, c3 = s.c3;
  /* far legs first so the near pair reads in front */
  P.ell(-19, -17, 7, 17, shade(c1, -0.18));
  P.ell(17, -17, 7, 17, shade(c1, -0.18));
  /* barrel + haunches */
  P.ell(2, -52, 32, 21, c1);
  P.circ(-20, -50, 18, shade(c1, -0.05));
  P.ell(6, -45, 21, 12, c3, 0, false);
  drawMarks(P, s, 2, -54, 30, 20);
  /* near legs */
  P.ell(-11, -16, 8, 18, c1);
  P.ell(25, -16, 8, 18, c1);
  P.ell(-11, -3, 9, 5, shade(c1, -0.2), 0, false);
  P.ell(25, -3, 9, 5, shade(c1, -0.2), 0, false);
  if (s.spikyFur) {
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * 0.95 + (i / 9) * Math.PI * 1.1;
      const x = 2 + Math.cos(a) * 32, y = -52 + Math.sin(a) * 21;
      P.poly([[x, y], [x + Math.cos(a) * 17, y + Math.sin(a) * 15], [x + Math.cos(a + 1.2) * 9, y + Math.sin(a + 1.2) * 8]], c1, false);
    }
  }
  /* neck */
  P.ell(26, -60, 13, 15, c1, 0.25);
  if (s.mane) {
    P.circ(22, -70, 12, s.mane);
    P.circ(13, -62, 10, s.mane);
    P.circ(29, -58, 9, s.mane);
  }
  return { bx: 2, by: -52, rx: 32, ry: 21, hx: 38, hy: -74, hr: 17 };
}

function bodyBlob(P, s) {
  const c1 = s.c1, c3 = s.c3;
  const foot = s.stubby ? 10 : 15;
  P.ell(-20, -6, foot, 8, shade(c1, -0.15));
  P.ell(22, -6, foot, 8, shade(c1, -0.15));
  P.circ(0, -46, 40, c1);
  P.ell(4, -40, 25, 27, c3, 0, false);
  drawMarks(P, s, 0, -50, 34, 30);
  P.ell(-40, -50, 9, 15, c1, -0.4);
  P.ell(42, -50, 9, 15, c1, 0.4);
  if (s.spikes) drawSpikes(P, s, 0, -50, 40, 34);
  return { bx: 0, by: -46, rx: 40, ry: 40, hx: 4, hy: -70, hr: 24 };
}

function bodySerpent(P, s) {
  const c1 = s.c1, c2 = s.c2;
  const segs = 7;
  for (let i = 0; i < segs; i++) {
    const t = i / (segs - 1);
    const x = Math.sin(t * Math.PI * 1.6) * 26 - 10;
    const y = -8 - t * 74;
    const r = 19 - t * 5;
    P.circ(x, y, r, i % 2 ? c1 : shade(c1, -0.07));
    if (s.marks === 'plates') P.circ(x + 4, y, r * 0.5, shade(c1, 0.16), false);
  }
  const hx = Math.sin(Math.PI * 1.6) * 26 - 10, hy = -82;
  P.ell(hx + 6, hy, 20, 16, c1);
  if (s.jaw) P.ell(hx + 20, hy + 7, 13, 7, shade(c1, -0.2));
  if (s.crest) {
    P.poly([[hx - 6, hy - 12], [hx - 22, hy - 30], [hx + 4, hy - 20]], s.crest);
    P.poly([[hx + 8, hy - 14], [hx + 14, hy - 34], [hx + 20, hy - 12]], s.crest);
  }
  if (s.fins) {
    P.poly([[hx - 10, hy + 4], [hx - 30, hy - 4], [hx - 26, hy + 18]], s.fins);
    P.poly([[hx + 16, hy + 6], [hx + 34, hy + 2], [hx + 22, hy + 20]], s.fins);
  }
  return { bx: -4, by: -44, rx: 22, ry: 40, hx: hx + 6, hy, hr: 17 };
}

function bodyInsect(P, s) {
  const c1 = s.c1, c2 = s.c2, c3 = s.c3;
  /* six thin legs under the thorax */
  for (let i = -1; i <= 1; i++) {
    P.line(2 + i * 9, -40, -10 + i * 15, -2, c2, 4.5);
    P.line(2 + i * 9, -40, -4 + i * 15, -2, shade(c2, -0.2), 3.5);
  }
  P.ell(-22, -52, 21, 17, shade(c1, -0.08));   /* abdomen */
  P.ell(6, -60, 20, 19, c1);                   /* thorax  */
  P.ell(8, -58, 12, 12, c3, 0, false);
  P.ell(20, -74, 9, 9, c1, -0.4);              /* neck */
  return { bx: 4, by: -58, rx: 21, ry: 20, hx: 34, hy: -84, hr: 14 };
}

function bodyFloat(P, s) {
  const c1 = s.c1, c2 = s.c2;
  P.poly([[-4, -30], [-30, 0], [26, 0], [8, -30]], c1);
  P.poly([[0, -34], [-16, -2], [4, -6], [10, -30]], c2, false);
  P.ell(2, -54, 13, 22, c1);
  P.ell(2, -50, 9, 14, c2, 0, false);
  P.ell(-13, -56, 5, 14, c1, -0.3);
  P.ell(17, -56, 5, 14, c1, 0.3);
  P.circ(3, -84, 16, c1);
  P.poly([[-13, -88], [-20, -60], [-6, -76]], c2, false);
  P.poly([[19, -88], [26, -60], [12, -76]], c2, false);
  P.poly([[3, -100], [-6, -84], [12, -84]], c2, false);
  return { bx: 2, by: -54, rx: 16, ry: 24, hx: 3, hy: -84, hr: 16 };
}

function bodyNeck(P, s) {
  const c1 = s.c1, c3 = s.c3;
  P.ell(-26, -12, 12, 8, shade(c1, -0.2), -0.4);
  P.ell(20, -12, 12, 8, shade(c1, -0.2), 0.4);
  P.ell(-4, -34, 36, 22, c1);
  P.ell(-8, -44, 33, 22, s.shell || shade(c1, -0.25));
  for (let i = -1; i <= 1; i++) P.circ(-8 + i * 17, -46, 7, shade(s.shell || c1, 0.18), false);
  P.ribbon([[10, -38], [26, -54], [30, -74]], 9, 7, c1);
  P.ell(34, -80, 15, 12, c1);
  P.ell(44, -77, 7, 5, c3, 0, false);
  return { bx: -4, by: -36, rx: 34, ry: 22, hx: 34, hy: -80, hr: 14 };
}

function bodyMech(P, s) {
  const c1 = s.c1, c2 = s.c2;
  for (const dir of [-1, 1]) {
    P.poly([[dir * 6, -50], [dir * 44, -34], [dir * 40, -22], [dir * 4, -40]], c2);
    P.poly([[dir * 44, -34], [dir * 50, -4], [dir * 34, -6], [dir * 36, -28]], c1);
    P.poly([[dir * 20, -46], [dir * 30, -14], [dir * 16, -12], [dir * 12, -42]], shade(c1, -0.1));
  }
  P.ell(0, -62, 36, 26, c1);
  P.ell(0, -58, 30, 20, shade(c1, 0.12), 0, false);
  P.poly([[-24, -74], [-6, -62], [-24, -50]], c2, false);
  P.poly([[24, -74], [6, -62], [24, -50]], c2, false);
  P.poly([[0, -80], [-10, -62], [10, -62]], c2, false);
  return { bx: 0, by: -50, rx: 36, ry: 30, hx: 0, hy: -64, hr: 20 };
}

const ARCHETYPES = {
  biped: bodyBiped, quad: bodyQuad, blob: bodyBlob, serpent: bodySerpent,
  insect: bodyInsect, float: bodyFloat, neck: bodyNeck, mech: bodyMech
};

/* --------------------------------------------------------------- entry pt */

/**
 * Draw a creature.
 * opts: { x, y, size, facing (1|-1), t (ms), tint, tintAmt, shadow }
 */
function drawMon(ctx, speciesId, opts) {
  const sp = SPECIES[speciesId];
  if (!sp) return;
  const s = sp.sprite;
  const facing = opts.facing || 1;
  const size = opts.size || 140;
  const t = opts.t || 0;

  const scale = (size / 118) * (s.scale || 1);
  const bob = Math.sin(t / 520) * 2.2;

  ctx.save();
  ctx.translate(opts.x, opts.y);

  if (opts.shadow !== false) {
    ctx.save();
    ctx.globalAlpha = 0.25 * (opts.alpha === undefined ? 1 : opts.alpha);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
  ctx.translate(0, bob);
  ctx.scale(facing * scale, scale);
  ctx.lineWidth = 2.6;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const P = makePainter(ctx, opts.tint || '#ffffff', opts.tintAmt || 0);

  /* back layer: wings and tails sit behind the body */
  if (s.wings && s.wings !== 'insect') drawWings(P, s, 0, -52);
  if (s.wings === 'insect') {
    ctx.save();
    ctx.globalAlpha = (opts.alpha === undefined ? 1 : opts.alpha) * 0.55;
    P.ell(-22, -78, 30, 10, shade(s.c3 || '#ffffff', 0.35), -0.55);
    P.ell(-34, -66, 27, 9, shade(s.c3 || '#ffffff', 0.35), -0.35);
    ctx.restore();
  }
  if (s.tail) {
    const anchor = { quad: [-32, -54], blob: [-38, -44], insect: [-40, -52] }[s.arch] || [-25, -46];
    drawTail(P, s, anchor[0], anchor[1], 1);
  }

  const arch = ARCHETYPES[s.arch] || bodyBiped;
  const g = arch(P, s);

  /* head (archetypes that keep the head separate) */
  if (['biped', 'quad', 'insect'].includes(s.arch)) {
    P.circ(g.hx, g.hy, g.hr, s.c1);
    if (s.mask) P.ell(g.hx + g.hr * 0.15, g.hy + g.hr * 0.1, g.hr * 0.92, g.hr * 0.78, s.c2, 0, false);
    if (s.muzzle) P.ell(g.hx + g.hr * 0.95, g.hy + g.hr * 0.35, g.hr * 0.5, g.hr * 0.33, shade(s.c1, 0.18));
    if (s.beak) P.poly([[g.hx + g.hr * 0.5, g.hy + g.hr * 0.1], [g.hx + g.hr * 1.7, g.hy + g.hr * 0.45], [g.hx + g.hr * 0.5, g.hy + g.hr * 0.8]], '#f0d060');
    if (s.crest) {
      P.poly([[g.hx - g.hr * 0.2, g.hy - g.hr * 0.9], [g.hx - g.hr * 0.4, g.hy - g.hr * 2.1], [g.hx + g.hr * 0.45, g.hy - g.hr * 1.0]], s.crest);
      P.poly([[g.hx + g.hr * 0.2, g.hy - g.hr * 0.95], [g.hx + g.hr * 1.0, g.hy - g.hr * 1.9], [g.hx + g.hr * 0.8, g.hy - g.hr * 0.7]], s.crest);
    }
  } else if (s.arch === 'blob') {
    P.circ(g.hx, g.hy, g.hr, s.c1);
    if (s.muzzle) P.ell(g.hx + g.hr * 0.9, g.hy + g.hr * 0.35, g.hr * 0.45, g.hr * 0.3, shade(s.c1, 0.15));
  }

  if (s.ears) drawEars(P, s, g.hx, g.hy, g.hr);
  if (s.horn) drawHorn(P, s, g.hx, g.hy, g.hr);
  if (s.spikes && s.arch !== 'blob') drawSpikes(P, s, g.bx, g.by, g.rx, g.ry);
  if (s.cheeks) {
    P.circ(g.hx - g.hr * 0.55, g.hy + g.hr * 0.35, g.hr * 0.24, s.cheeks, false);
    P.circ(g.hx + g.hr * 0.95, g.hy + g.hr * 0.3, g.hr * 0.24, s.cheeks, false);
  }

  drawEyes(P, s, g.hx, g.hy, g.hr);

  (s.extras || []).forEach(name => { if (EXTRAS[name]) EXTRAS[name](P, s, g); });

  ctx.restore();
}

/* Small portrait helper used by the team preview and the party bar. */
function drawMonPortrait(canvas, speciesId, size) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + 'px';
  canvas.style.height = size + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  drawMon(ctx, speciesId, {
    x: size * 0.5, y: size * 0.94, size: size * 0.82, facing: 1, t: 0, shadow: false
  });
}
