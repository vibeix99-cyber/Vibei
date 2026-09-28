/** Shared building blocks for illustrations. OWNER: art area. */
import { useId, type CSSProperties, type ReactNode } from 'react';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { safeId } from './palette';
import s from './art.module.css';

/** True when idle animation should run (prop on + motion allowed). */
export function useLive(animate = true): boolean {
  const reduced = useReducedMotion();
  return animate && !reduced;
}

/** Unique, CSS-safe id prefix for clipPaths/masks inside one illustration instance. */
export function useArtId(): string {
  return safeId(useId());
}

export interface ArtSvgProps {
  viewBox: string;
  width?: number | string;
  height?: number | string;
  title?: string;
  className?: string;
  live?: boolean;
  style?: CSSProperties;
  children: ReactNode;
  preserveAspectRatio?: string;
  'data-art'?: string;
}

/** Root <svg> for every illustration: theming vars, a11y, animation switch. */
export function ArtSvg({ viewBox, width, height, title, className, live, style, children, preserveAspectRatio, ...rest }: ArtSvgProps) {
  return (
    <svg
      viewBox={viewBox}
      width={width}
      height={height}
      className={[s.root, live ? s.live : '', className].filter(Boolean).join(' ')}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={style}
      preserveAspectRatio={preserveAspectRatio}
      data-art={rest['data-art']}
    >
      {children}
    </svg>
  );
}

/** Concave 4-point sparkle. */
export function star(cx: number, cy: number, r: number): string {
  const k = r * 0.22;
  return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r} Z`;
}

export function Sparkles({ pts, color }: { pts: [number, number, number][]; color: string }) {
  return (
    <g fill={color}>
      {pts.map(([x, y, r], i) => (
        <path key={i} className={s.twinkle} d={star(x, y, r)} />
      ))}
    </g>
  );
}

/**
 * Flat form with one shade + (optional) highlight: fills `d` with `shade`, then
 * the same shape nudged up-left in `base`, clipped to itself — leaving a crisp
 * shade crescent on the bottom-right (light from the top-left).
 */
export function Shaded({
  d,
  id,
  base,
  shade,
  dx = -5,
  dy = -5,
  children,
}: {
  d: string;
  id: string;
  base: string;
  shade: string;
  dx?: number;
  dy?: number;
  children?: ReactNode;
}) {
  return (
    <>
      <clipPath id={id}>
        <path d={d} />
      </clipPath>
      <path d={d} fill={shade} />
      <g clipPath={`url(#${id})`}>
        <path d={d} fill={base} transform={`translate(${dx} ${dy})`} />
        {children}
      </g>
    </>
  );
}

/** Rising steam wisps (3), animated when inside a `.live` root. */
export function Steam({ x, y, scale = 1, width = 5, count = 3, color = 'var(--art-steam)' }: { x: number; y: number; scale?: number; width?: number; count?: 1 | 2 | 3; color?: string }) {
  const paths = ['M1 -2 C-5 -12 7 -16 1 -28', 'M-10 0 C-16 -8 -4 -12 -10 -22', 'M12 0 C6 -8 18 -12 12 -22'].slice(0, count);
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} stroke={color} strokeWidth={width} strokeLinecap="round" fill="none">
      {paths.map((d) => (
        <path key={d} className={s.steam} d={d} />
      ))}
    </g>
  );
}

export { s as artStyles };
