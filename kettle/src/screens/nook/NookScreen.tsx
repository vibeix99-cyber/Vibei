/**
 * Nook — the cozy room collection. OWNER: scene area.
 * Big interactive 3D room (drag to look around, pinch/scroll to zoom, tap
 * things), level progress toward the next unlock, and the collection grid,
 * which is also the accessible representation of the room.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Nook, type SceneTime, type SceneWeather } from '@/scene';
import { ITEMS, ITEM_BY_ID, leavesForLevel, useLevel, useUnlockedItems, type NookItem } from '@/progress';
import { Icon, LevelBadge, Mascot, type IconName } from '@/art';
import { Card, IconButton, Pill, PressableCard, ProgressBar, ScreenHeader, SectionHeader, SpeechBubble, VisuallyHidden } from '@/ui';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { spring } from '@/lib/motion';
import { useSettings } from '@/state/settings';
import { ItemGlyph } from './ItemGlyph';
import s from './NookScreen.module.css';

const TIME_CYCLE: SceneTime[] = ['auto', 'morning', 'day', 'dusk', 'night'];
const TIME_LABEL: Record<SceneTime, string> = { auto: 'Right now', morning: 'Morning', day: 'Daytime', dusk: 'Dusk', night: 'Night' };
const TIME_ICON: Record<SceneTime, IconName> = { auto: 'clock', morning: 'sun', day: 'sun', dusk: 'moon', night: 'moon' };
type WeatherPref = SceneWeather | 'auto';
const WEATHER_CYCLE: WeatherPref[] = ['auto', 'clear', 'rain', 'snow'];
const WEATHER_LABEL: Record<WeatherPref, string> = { auto: 'Matches your sounds', clear: 'Clear sky', rain: 'Rain', snow: 'Snow' };
const WEATHER_ICON: Record<SceneWeather, IconName> = { clear: 'star', rain: 'rain', snow: 'snow' };

const HINT_KEY = 'kettle:nook-hint-seen';

function readHintSeen(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1';
  } catch {
    return false;
  }
}

export default function NookScreen() {
  const unlocked = useUnlockedItems();
  const level = useLevel();
  const reduced = useReducedMotion();
  const ambient = useSettings((st) => st.ambient);
  const [selected, setSelected] = useState<string | null>(null);
  const [time, setTime] = useState<SceneTime>('auto');
  const [weather, setWeather] = useState<WeatherPref>('auto');
  const [hint, setHint] = useState(() => !readHintSeen());
  const stageRef = useRef<HTMLDivElement>(null);
  const storyId = useId();

  const unlockedSet = useMemo(() => new Set(unlocked), [unlocked]);
  const next = ITEMS.find((i) => !unlockedSet.has(i.id)) ?? null;
  const selectedItem = selected ? ITEM_BY_ID[selected] ?? null : null;
  const highlight = selected && unlockedSet.has(selected) ? selected : null;

  const dismissHint = useCallback(() => {
    if (!hint) return;
    setHint(false);
    try {
      localStorage.setItem(HINT_KEY, '1');
    } catch {
      /* private mode: fine */
    }
  }, [hint]);

  const onSceneSelect = useCallback((id: string | null) => {
    setSelected(id);
  }, []);

  const choose = (id: string) => {
    setSelected((cur) => (cur === id ? null : id));
    // Bring the room into view so the highlight is seen.
    const el = stageRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.top < -r.height * 0.35 || r.bottom > window.innerHeight + r.height * 0.35) {
        el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const cycleTime = () => setTime((t) => TIME_CYCLE[(TIME_CYCLE.indexOf(t) + 1) % TIME_CYCLE.length]);
  const cycleWeather = () => setWeather((w) => WEATHER_CYCLE[(WEATHER_CYCLE.indexOf(w) + 1) % WEATHER_CYCLE.length]);

  const count = unlocked.length;
  const total = ITEMS.length;
  const toNext = Math.max(0, level.size - level.into);
  const subtitle =
    count === 0
      ? 'Your first cozy thing arrives at level 2.'
      : count === total
        ? `All ${total} cozy things found. It’s perfect in here.`
        : `${count} of ${total} cozy things · Cozy level ${level.level}`;

  const described = describeRoom(unlocked, weather === 'auto' ? ambientWeather(ambient) : weather);

  return (
    <div className={s.root} data-layout="wide">
      <ScreenHeader className={s.header} title="Your nook" subtitle={subtitle} />

      <section className={s.stageCol} aria-label="The room">
        <div ref={stageRef} className={s.stage} onPointerDown={dismissHint}>
          <Nook
            mode="showcase"
            items={unlocked}
            interactive
            highlightItem={highlight}
            onItemSelect={onSceneSelect}
            timeOfDay={time}
            weather={weather === 'auto' ? undefined : weather}
            className={s.scene}
          />
          <VisuallyHidden>{described}</VisuallyHidden>
          <div className={s.controls}>
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Icon name={TIME_ICON[time]} size={20} />}
              label={`Time of day: ${TIME_LABEL[time]}. Change`}
              tooltip="bottom"
              onClick={cycleTime}
            />
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Icon name={WEATHER_ICON[weather === 'auto' ? ambientWeather(ambient) : weather]} size={20} />}
              label={`Window: ${weather === 'auto' ? `${WEATHER_LABEL[ambientWeather(ambient)]}, matching your sounds` : WEATHER_LABEL[weather]}. Change`}
              tooltip="bottom"
              onClick={cycleWeather}
            />
          </div>
          <AnimatePresence>
            {(time !== 'auto' || weather !== 'auto') && (
              <motion.span
                key={`${time}-${weather}`}
                className={s.skyTag}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-live="polite"
              >
                {TIME_LABEL[time]} · {WEATHER_LABEL[weather]}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {hint && (
              <motion.p
                className={s.hint}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, delay: reduced ? 0 : 0.8 }}
              >
                <Icon name="eye" size={16} /> Drag to look around · tap things
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className={s.storySlot} id={storyId} aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            {selectedItem && (
              <motion.div
                key={selectedItem.id}
                initial={reduced ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reduced ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
                transition={reduced ? { duration: 0.15 } : spring.cozy}
              >
                <StoryCard item={selectedItem} unlocked={unlockedSet.has(selectedItem.id)} leaves={level.leaves} onClose={() => setSelected(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className={s.panel}>
        <Card className={s.levelCard}>
          <div className={s.levelTop}>
            <LevelBadge level={level.level} size={56} />
            <div className={s.levelText}>
              <h2 className={s.levelTitle}>Cozy level {level.level}</h2>
              <p className={s.levelSub}>
                {toNext.toLocaleString()} {toNext === 1 ? 'leaf' : 'leaves'} to level {level.level + 1}
              </p>
            </div>
          </div>
          <ProgressBar value={level.size ? level.into / level.size : 1} tone="honey" height={14} label={`Progress to cozy level ${level.level + 1}`} valueText={`${level.into} of ${level.size} leaves`} />
          <div className={s.nextRow}>
            {next ? (
              <>
                <span className={s.nextGlyph}>
                  <ItemGlyph id={next.id} size={36} locked />
                  <span className={s.lockDot}>
                    <Icon name="lock" size={12} />
                  </span>
                </span>
                <p className={s.nextText}>
                  <strong>A surprise at level {next.unlockLevel}</strong>
                  <span>{levelsToGo(level.level, next.unlockLevel)}</span>
                </p>
              </>
            ) : (
              <p className={s.nextText}>
                <strong>Everything’s unlocked.</strong>
                <span>Chai is very impressed.</span>
              </p>
            )}
          </div>
        </Card>

        <div className={s.collection}>
          <SectionHeader title="Cozy things" action={<Pill tone="honey" size="sm">{`${count}/${total}`}</Pill>} />
          <ul className={s.grid} aria-label="Cozy things in your nook">
            {ITEMS.map((item) => {
              const has = unlockedSet.has(item.id);
              const isSel = selected === item.id;
              return (
                <li key={item.id}>
                  <PressableCard
                    className={s.tile}
                    padding="sm"
                    selected={isSel}
                    aria-pressed={isSel}
                    aria-controls={storyId}
                    aria-label={has ? item.name : `Locked. Unlocks at cozy level ${item.unlockLevel}`}
                    onClick={() => choose(item.id)}
                    data-locked={has ? undefined : 'true'}
                  >
                    <span className={s.tileArt}>
                      <ItemGlyph id={item.id} size={52} locked={!has} />
                      {!has && (
                        <span className={s.lockBadge}>
                          <Icon name="lock" size={14} />
                        </span>
                      )}
                    </span>
                    <span className={s.tileName}>{has ? item.name : `Level ${item.unlockLevel}`}</span>
                  </PressableCard>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function StoryCard({ item, unlocked, leaves, onClose }: { item: NookItem; unlocked: boolean; leaves: number; onClose: () => void }) {
  const need = Math.max(0, leavesForLevel(item.unlockLevel) - leaves);
  return (
    <Card className={s.story}>
      <div className={s.storyHead}>
        <span className={s.storyArt} data-locked={unlocked ? undefined : 'true'}>
          <ItemGlyph id={item.id} size={44} locked={!unlocked} />
        </span>
        <div className={s.storyTitleWrap}>
          <h3 className={s.storyTitle}>{unlocked ? item.name : 'Still a surprise'}</h3>
          <p className={s.storyMeta}>{unlocked ? `Found at cozy level ${item.unlockLevel}` : `Unlocks at cozy level ${item.unlockLevel}`}</p>
        </div>
        <IconButton size="sm" variant="ghost" icon={<Icon name="close" size={18} />} label="Close" onClick={onClose} />
      </div>
      <div className={s.storyTalk}>
        <Mascot pose={unlocked ? 'proud' : 'think'} size={60} />
        <SpeechBubble tail="left" className={s.bubble}>
          {unlocked ? item.story : `Keep brewing — about ${need.toLocaleString()} more ${need === 1 ? 'leaf' : 'leaves'} and it’s yours.`}
        </SpeechBubble>
      </div>
    </Card>
  );
}

function levelsToGo(cur: number, target: number): string {
  const n = target - cur;
  return n <= 1 ? 'Next level!' : `${n} levels to go`;
}

function ambientWeather(ambient: string): SceneWeather {
  if (ambient === 'rain' || ambient === 'lofi') return 'rain';
  if (ambient === 'fire') return 'snow';
  return 'clear';
}

/** Text description of the room for screen readers (the canvas is decorative). */
function describeRoom(ids: string[], weather: SceneWeather): string {
  const sky = weather === 'rain' ? 'rain on the window' : weather === 'snow' ? 'snow falling outside the window' : 'a clear sky in the window';
  const base = `A small cozy room with ${sky}, a kettle on a little stove, a floor lamp, a low table with a mug on a round rug, and Chai the capybara.`;
  if (!ids.length) return base;
  const names = ids.map((id) => ITEM_BY_ID[id]?.name.toLowerCase()).filter(Boolean);
  return `${base} Also here: ${names.join(', ')}.`;
}
