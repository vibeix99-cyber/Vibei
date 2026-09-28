/** Ambience picker: tap to hear it right away (live preview), plus volume. */
import { Icon } from '@/art';
import { Button, PressableCard, Sheet, Slider } from '@/ui';
import { audio } from '@/audio';
import { useSettings, type AmbientKind } from '@/state/settings';
import { ambientOptions } from './ambience';
import s from './sheets.module.css';

export function AmbienceSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const current = useSettings((st) => st.ambient);
  const volume = useSettings((st) => st.ambientVolume);
  const muted = useSettings((st) => st.muted);
  const set = useSettings((st) => st.set);
  const options = ambientOptions();
  const currentOption = options.find((o) => o.id === current) ?? options[0];

  const choose = (id: AmbientKind) => {
    set({ ambient: id });
    audio.setAmbient(id, { fadeMs: 600 });
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ambience"
      description="Tap to listen. The window in your nook follows the sound."
      footer={
        <Button block size="lg" onClick={onClose}>
          Done
        </Button>
      }
    >
      {muted && (
        <div className={s.mutedNote}>
          <Icon name="mute" size={20} />
          <span>Sound is off right now.</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              set({ muted: false });
              audio.sync();
            }}
          >
            Turn on
          </Button>
        </div>
      )}
      <div className={s.ambGrid} role="group" aria-label="Ambient sound">
        {options.map((o) => {
          const on = o.id === current;
          return (
            <PressableCard
              key={o.id}
              padding="sm"
              selected={on}
              aria-pressed={on}
              aria-describedby={on ? 'amb-now' : undefined}
              sfx="toggle"
              onClick={() => choose(o.id)}
              className={s.amb}
            >
              <span className={s.ambIcon} data-on={on || undefined}>
                <Icon name={o.icon} size={24} />
              </span>
              <span className={s.ambLabel}>{o.label}</span>
            </PressableCard>
          );
        })}
      </div>
      <p className={s.ambNow} id="amb-now">
        {currentOption.hint}
      </p>
      <Slider
        label="Ambience volume"
        value={volume}
        min={0}
        max={1}
        step={0.05}
        tone="sky"
        showValue
        format={(v) => `${Math.round(v * 100)}%`}
        disabled={current === 'none'}
        start={<Icon name="sound" size={20} />}
        onChange={(v) => {
          set({ ambientVolume: v });
          audio.sync();
        }}
        className={s.volume}
      />
    </Sheet>
  );
}
