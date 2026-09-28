/**
 * Settings-style rows. OWNER: design-system area.
 *   <ListGroup title="Sound">
 *     <ListRow icon="sound" iconTone="sky" label="Sound effects" toggle={{ checked, onChange }} />
 *     <ListRow icon="clock" label="Focus length" value="25 min" onClick={open} />
 *   </ListGroup>
 * - with `onClick` the row is a button (chevron shown by default)
 * - with `toggle` the switch is the control; tapping anywhere on the row flips it
 * - with `trailing` you can put any control (Slider, NumberStepper…) at the end
 */
import { useId, type ReactNode } from 'react';
import { Icon } from '@/art';
import { audio } from '@/audio';
import { Toggle } from './Toggle';
import { cx, renderIcon, type IconSlot, type Tone } from './util';
import s from './ListRow.module.css';

export interface ListRowProps {
  icon?: IconSlot;
  iconTone?: Tone;
  label: ReactNode;
  description?: ReactNode;
  /** Right-aligned value text ("25 min"). */
  value?: ReactNode;
  onClick?: () => void;
  /** Show a chevron. Default true when `onClick` is set. */
  chevron?: boolean;
  toggle?: { checked: boolean; onChange: (checked: boolean) => void; disabled?: boolean };
  /** Any trailing control. */
  trailing?: ReactNode;
  /** Put `trailing` on its own line under the label (for sliders on narrow screens). */
  stacked?: boolean;
  disabled?: boolean;
  /** Destructive action (berry label). */
  danger?: boolean;
  className?: string;
}

export function ListRow({
  icon,
  iconTone,
  label,
  description,
  value,
  onClick,
  chevron,
  toggle,
  trailing,
  stacked,
  disabled,
  danger,
  className,
}: ListRowProps) {
  const id = useId();
  const labelId = `${id}-l`;
  const descId = `${id}-d`;
  const showChevron = chevron ?? (!!onClick && !toggle);
  const body = (
    <>
      {icon != null && (
        <span className={s.icon} data-tone={danger ? 'berry' : iconTone}>
          {renderIcon(icon, 24)}
        </span>
      )}
      <span className={s.text}>
        <span id={labelId} className={s.label}>
          {label}
        </span>
        {description != null && (
          <span id={descId} className={s.desc}>
            {description}
          </span>
        )}
      </span>
      {value != null && <span className={s.value}>{value}</span>}
      {toggle && (
        <Toggle
          checked={toggle.checked}
          onChange={toggle.onChange}
          disabled={disabled || toggle.disabled}
          aria-labelledby={labelId}
          aria-describedby={description != null ? descId : undefined}
          onClick={(e) => e.stopPropagation()}
        />
      )}
      {trailing != null && !stacked && <span className={s.trailing}>{trailing}</span>}
      {showChevron && (
        <span className={s.chevron} aria-hidden="true">
          <Icon name="chevronRight" size={20} />
        </span>
      )}
    </>
  );

  const cls = cx(s.row, (onClick || toggle) && s.interactive, disabled && s.disabled, danger && s.danger, stacked && s.stacked, className);

  if (onClick && !toggle) {
    return (
      <button
        type="button"
        className={cls}
        disabled={disabled}
        onClick={() => {
          audio.play('tap');
          onClick();
        }}
        aria-describedby={description != null ? descId : undefined}
      >
        <span className={s.main}>{body}</span>
      </button>
    );
  }
  return (
    <div
      className={cls}
      onClick={
        toggle && !disabled && !toggle.disabled
          ? (e) => {
              if ((e.target as HTMLElement).closest('button, a, input')) return;
              audio.play('toggle', { pitch: toggle.checked ? -2 : 2 });
              toggle.onChange(!toggle.checked);
            }
          : undefined
      }
    >
      <div className={s.main}>{body}</div>
      {stacked && trailing != null && <div className={s.below}>{trailing}</div>}
    </div>
  );
}

export interface ListGroupProps {
  title?: ReactNode;
  /** Heading level of the title. Default 2 (use 3 inside a sheet/dialog). */
  headingLevel?: 2 | 3;
  /** Small print under the group. */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ title, headingLevel = 2, footer, children, className }: ListGroupProps) {
  const id = useId();
  const H = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section className={cx(s.group, className)} aria-labelledby={title ? id : undefined}>
      {title && (
        <H id={id} className={s.groupTitle}>
          {title}
        </H>
      )}
      <div className={s.card}>{children}</div>
      {footer && <p className={s.footer}>{footer}</p>}
    </section>
  );
}
