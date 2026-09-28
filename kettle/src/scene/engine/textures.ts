/**
 * Tiny procedural canvas textures (no image files). Cached per engine and
 * disposed with it.
 */
import { CanvasTexture, SRGBColorSpace, RepeatWrapping, type Texture } from 'three';
import { C } from './palette';

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

export class TextureBank {
  private cache = new Map<string, Texture>();

  private make(key: string, w: number, h: number, draw: Draw, color = false): Texture {
    const hit = this.cache.get(key);
    if (hit) return hit;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    draw(ctx, w, h);
    const tex = new CanvasTexture(canvas);
    if (color) tex.colorSpace = SRGBColorSpace;
    tex.needsUpdate = true;
    this.cache.set(key, tex);
    return tex;
  }

  /** White radial falloff — blob shadows and glows. */
  soft(): Texture {
    return this.make('soft', 128, 128, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.72)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.22)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    });
  }

  /** Tighter glow with a hot core — bulbs, flames, moon halo. */
  glow(): Texture {
    return this.make('glow', 128, 128, (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.12, 'rgba(255,255,255,0.85)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.28)');
      g.addColorStop(0.7, 'rgba(255,255,255,0.06)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, w);
    });
  }

  /** Cartoon steam puff: a few overlapping soft circles. */
  puff(): Texture {
    return this.make('puff', 128, 128, (ctx, w) => {
      const blobs = [
        [0.5, 0.56, 0.3],
        [0.34, 0.5, 0.2],
        [0.66, 0.46, 0.22],
        [0.5, 0.36, 0.2],
      ];
      for (const [x, y, r] of blobs) {
        const g = ctx.createRadialGradient(x * w, y * w, 0, x * w, y * w, r * w);
        g.addColorStop(0, 'rgba(255,255,255,0.9)');
        g.addColorStop(0.6, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x * w, y * w, r * w, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  /** Arched window light patch (with muntin cross) for the floor. */
  windowPatch(): Texture {
    return this.make('winpatch', 128, 192, (ctx, w, h) => {
      ctx.filter = 'blur(5px)';
      ctx.fillStyle = '#fff';
      const pad = 14;
      const r = (w - pad * 2) / 2;
      ctx.beginPath();
      ctx.moveTo(pad, h - pad);
      ctx.lineTo(pad, pad + r);
      ctx.arc(w / 2, pad + r, r, Math.PI, 0);
      ctx.lineTo(w - pad, h - pad);
      ctx.closePath();
      ctx.fill();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillRect(w / 2 - 4, pad, 8, h);
      ctx.fillRect(pad, h * 0.52, w, 8);
      ctx.filter = 'none';
    });
  }

  /** Chunky knit: rows of V stitches in two tones. */
  knit(): Texture {
    const t = this.make(
      'knit',
      128,
      128,
      (ctx, w, h) => {
        const rows = 8;
        const cols = 8;
        const band = [C.honey, C.honey, C.cream, C.berry, C.berry, C.cream, C.honey, C.honey];
        for (let r = 0; r < rows; r++) {
          const col = band[r % band.length];
          for (let c = 0; c < cols; c++) {
            const x = (c / cols) * w;
            const y = (r / rows) * h;
            const cw = w / cols;
            const ch = h / rows;
            ctx.fillStyle = col;
            ctx.fillRect(x, y, cw, ch);
            ctx.fillStyle = 'rgba(0,0,0,0.13)';
            ctx.beginPath();
            ctx.moveTo(x + cw / 2, y + ch);
            ctx.lineTo(x, y);
            ctx.lineTo(x + cw * 0.18, y);
            ctx.lineTo(x + cw / 2, y + ch * 0.7);
            ctx.lineTo(x + cw * 0.82, y);
            ctx.lineTo(x + cw, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      },
      true,
    );
    t.wrapS = t.wrapT = RepeatWrapping;
    return t;
  }

  /** Mountain painting canvas. */
  painting(): Texture {
    return this.make(
      'painting',
      192,
      144,
      (ctx, w, h) => {
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#FFD9B8');
        g.addColorStop(1, '#FFF1DE');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = C.persimmon;
        ctx.beginPath();
        ctx.arc(w * 0.7, h * 0.34, h * 0.12, 0, Math.PI * 2);
        ctx.fill();
        const peak = (pts: number[][], color: string) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(0, h);
          for (const [x, y] of pts) ctx.lineTo(x * w, y * h);
          ctx.lineTo(w, h);
          ctx.closePath();
          ctx.fill();
        };
        peak(
          [
            [0, 0.62],
            [0.22, 0.34],
            [0.4, 0.58],
            [0.58, 0.28],
            [0.82, 0.6],
            [1, 0.5],
          ],
          C.lilac,
        );
        // snow caps
        ctx.fillStyle = '#FFF9F0';
        ctx.beginPath();
        ctx.moveTo(0.58 * w, 0.28 * h);
        ctx.lineTo(0.51 * w, 0.38 * h);
        ctx.lineTo(0.56 * w, 0.36 * h);
        ctx.lineTo(0.59 * w, 0.4 * h);
        ctx.lineTo(0.63 * w, 0.36 * h);
        ctx.lineTo(0.655 * w, 0.37 * h);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(0.22 * w, 0.34 * h);
        ctx.lineTo(0.17 * w, 0.41 * h);
        ctx.lineTo(0.21 * w, 0.4 * h);
        ctx.lineTo(0.25 * w, 0.43 * h);
        ctx.lineTo(0.27 * w, 0.4 * h);
        ctx.closePath();
        ctx.fill();
        peak(
          [
            [0, 0.8],
            [0.3, 0.62],
            [0.55, 0.78],
            [0.8, 0.64],
            [1, 0.74],
          ],
          C.sage,
        );
        peak(
          [
            [0, 0.92],
            [0.45, 0.82],
            [1, 0.9],
          ],
          C.matchaDeep,
        );
      },
      true,
    );
  }

  /** A single "z" glyph (Chai's nap) drawn as a rounded path. */
  zee(): Texture {
    return this.make('zee', 64, 64, (ctx, w) => {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = w * 0.13;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(w * 0.24, w * 0.26);
      ctx.lineTo(w * 0.74, w * 0.26);
      ctx.lineTo(w * 0.26, w * 0.74);
      ctx.lineTo(w * 0.76, w * 0.74);
      ctx.stroke();
    });
  }

  /** A music note for the whistle + record player. */
  note(): Texture {
    return this.make('note', 64, 64, (ctx, w) => {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = w * 0.1;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.ellipse(w * 0.34, w * 0.72, w * 0.16, w * 0.12, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(w * 0.47, w * 0.7);
      ctx.lineTo(w * 0.47, w * 0.16);
      ctx.quadraticCurveTo(w * 0.62, w * 0.3, w * 0.78, w * 0.3);
      ctx.stroke();
    });
  }

  /** Four-point sparkle for highlights. */
  sparkle(): Texture {
    return this.make('sparkle', 64, 64, (ctx, w) => {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      const c = w / 2;
      ctx.moveTo(c, 2);
      ctx.quadraticCurveTo(c + 4, c - 4, w - 2, c);
      ctx.quadraticCurveTo(c + 4, c + 4, c, w - 2);
      ctx.quadraticCurveTo(c - 4, c + 4, 2, c);
      ctx.quadraticCurveTo(c - 4, c - 4, c, 2);
      ctx.fill();
    });
  }

  dispose(): void {
    this.cache.forEach((t) => t.dispose());
    this.cache.clear();
  }
}
