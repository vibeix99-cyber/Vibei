/**
 * App-icon / favicon compositions (static, hardcoded colors). They are exported
 * to public/favicon.svg + public/icons/*.svg and rasterized to PNG by
 * scripts/render-icons.mjs. OWNER: art area.
 */
import { KettleMark } from './Objects';
import { ChaiArt } from './Mascot';

export type AppIconVariant = 'any' | 'maskable' | 'kettle' | 'favicon' | 'faviconChai';

const BG = '#FFF3E2';
const SUN = '#FFE2B3';

export function AppIconArt({ variant = 'any', size = 512 }: { variant?: AppIconVariant; size?: number }) {
  const id = `ai${variant}`;
  if (variant === 'favicon') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} data-appicon={variant}>
        <g transform="translate(32 34) scale(1.12) translate(-32 -34)">
          <KettleMark id={id} />
        </g>
      </svg>
    );
  }
  if (variant === 'faviconChai') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="26 20 148 148" width={size} height={size} data-appicon={variant}>
        <ChaiArt pose="idle" id={id} big />
      </svg>
    );
  }
  if (variant === 'kettle') {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} data-appicon={variant}>
        <rect width="512" height="512" fill={BG} />
        <circle cx="256" cy="262" r="186" fill={SUN} />
        <ellipse cx="256" cy="420" rx="150" ry="14" fill="#3B2A20" opacity="0.08" />
        <g transform="translate(256 262) scale(5.5) translate(-32 -36)">
          <KettleMark id={id} />
        </g>
      </svg>
    );
  }
  // any / maskable: Chai close-up (head + yuzu), body cropped by the bottom edge.
  // Maskable keeps everything important inside the 40%-radius safe circle.
  const m = variant === 'maskable';
  const k = m ? 2.6 : 3;
  const tx = 256 - 100 * k;
  const ty = m ? 30 : 72 - 27 * k;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} data-appicon={variant}>
      <rect width="512" height="512" fill={BG} />
      <circle cx="256" cy="300" r={m ? 205 : 230} fill={SUN} />
      <g transform={`translate(${tx} ${ty}) scale(${k})`}>
        <ChaiArt pose="idle" id={id} />
      </g>
    </svg>
  );
}
