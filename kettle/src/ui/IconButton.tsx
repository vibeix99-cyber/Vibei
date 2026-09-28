/**
 * Square/round icon-only button. OWNER: design-system area.
 * `label` is required (becomes aria-label and the hover tooltip).
 */
import { forwardRef } from 'react';
import { Button, type ButtonProps } from './Button';
import { Tooltip } from './Tooltip';
import type { IconSlot } from './util';

export interface IconButtonProps extends Omit<ButtonProps, 'children' | 'icon' | 'iconRight' | 'block'> {
  icon: IconSlot;
  /** Accessible name (required). */
  label: string;
  /** Show the label as a tooltip on hover/focus (pointer devices). Default true. */
  tooltip?: boolean | 'top' | 'bottom';
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', tooltip = true, ...rest },
  ref,
) {
  const btn = <Button ref={ref} variant={variant} icon={icon} aria-label={label} {...rest} />;
  if (!tooltip) return btn;
  return (
    <Tooltip content={label} side={tooltip === 'bottom' ? 'bottom' : 'top'} describe={false}>
      {btn}
    </Tooltip>
  );
});
