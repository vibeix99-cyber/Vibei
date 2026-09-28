/**
 * Icon set — PLACEHOLDER. OWNER: art area.
 * Chunky duotone icons. Keep `IconName` values stable (screens use them).
 */
export type IconName =
  | 'home'
  | 'stats'
  | 'nook'
  | 'settings'
  | 'play'
  | 'pause'
  | 'stop'
  | 'skip'
  | 'plus'
  | 'minus'
  | 'close'
  | 'back'
  | 'check'
  | 'chevronRight'
  | 'chevronDown'
  | 'sound'
  | 'mute'
  | 'leaf'
  | 'mug'
  | 'cozy'
  | 'bell'
  | 'moon'
  | 'sun'
  | 'rain'
  | 'fire'
  | 'forest'
  | 'wave'
  | 'music'
  | 'clock'
  | 'target'
  | 'trophy'
  | 'lock'
  | 'edit'
  | 'trash'
  | 'download'
  | 'upload'
  | 'keyboard'
  | 'info'
  | 'sparkle'
  | 'tin';

export interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  /** Accessible label; decorative when omitted. */
  title?: string;
}

export function Icon({ name, size = 24, className, title }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      data-icon={name}
    >
      <circle cx="12" cy="12" r="9" fill="currentColor" opacity="0.25" />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
