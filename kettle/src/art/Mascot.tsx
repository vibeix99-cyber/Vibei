/**
 * Chai the capybara — PLACEHOLDER. OWNER: art area.
 * Keep the props contract stable; replace the drawing entirely.
 */
export type MascotPose =
  | 'idle'
  | 'wave'
  | 'focus'
  | 'sleep'
  | 'sip'
  | 'cheer'
  | 'proud'
  | 'concerned'
  | 'think'
  | 'peek';

export interface MascotProps {
  pose?: MascotPose;
  /** Rendered width/height in px (square viewBox). */
  size?: number;
  /** Idle life (breathing/blinking). Automatically off under reduced motion. */
  animate?: boolean;
  className?: string;
  /** Accessible label; decorative (aria-hidden) when omitted. */
  title?: string;
}

export function Mascot({ pose = 'idle', size = 160, className, title }: MascotProps) {
  const closed = pose === 'focus' || pose === 'sleep';
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-pose={pose}
    >
      <ellipse cx="100" cy="182" rx="62" ry="8" fill="rgba(59,42,32,.12)" />
      <rect x="38" y="70" width="124" height="110" rx="52" fill="#B9825A" />
      <circle cx="68" cy="72" r="10" fill="#9C6A45" />
      <circle cx="132" cy="72" r="10" fill="#9C6A45" />
      <rect x="60" y="112" width="80" height="50" rx="25" fill="#E7C9A5" />
      <ellipse cx="100" cy="122" rx="20" ry="12" fill="#4A3226" />
      {closed ? (
        <>
          <path d="M70 100 q8 6 16 0" stroke="#3B2A20" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M114 100 q8 6 16 0" stroke="#3B2A20" strokeWidth="4" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="78" cy="98" r="6" fill="#3B2A20" />
          <circle cx="122" cy="98" r="6" fill="#3B2A20" />
        </>
      )}
      <circle cx="100" cy="58" r="14" fill="#FFC53D" />
      <path d="M100 44 q8 -10 16 -4 q-8 8 -16 4z" fill="#7CC36B" />
    </svg>
  );
}
