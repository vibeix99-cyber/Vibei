/** Badges grid (tiers I–V) with a detail sheet per badge. */
import { useId, useMemo, useState, type CSSProperties } from 'react';
import { Badge, Icon, TIER } from '@/art';
import { dayKey, type DayKey } from '@/lib/dates';
import { ROMAN, type BadgeProgress } from '@/progress';
import { Button, Card, ProgressBar, Sheet, cx, type Tone } from '@/ui';
import { monthDay } from './format';
import s from './stats.module.css';

/** Progress-bar tone nearest to each art tier colour (I oat → II sky → III matcha → IV berry → V honey). */
const TIER_TONE: Tone[] = ['honey', 'sky', 'matcha', 'berry', 'honey'];
export function tierTone(tier: number): Tone {
  return TIER_TONE[Math.max(0, Math.min(4, tier - 1))];
}

const UNIT: Record<string, [string, string]> = {
  'first-brew': ['full brew', 'full brews'],
  'warm-streak': ['day', 'days'],
  'leaf-collector': ['leaf', 'leaves'],
  'deep-steep': ['deep steep', 'deep steeps'],
  'morning-dew': ['morning brew', 'morning brews'],
  moonlit: ['late brew', 'late brews'],
  marathon: ['marathon day', 'marathon days'],
  'tea-time': ['tea break', 'tea breaks'],
  'goal-getter': ['goal day', 'goal days'],
  intentional: ['named brew', 'named brews'],
  'weekend-warmth': ['weekend day', 'weekend days'],
  'nook-builder': ['item', 'items'],
};
const unit = (id: string, n: number) => (UNIT[id] ? UNIT[id][n === 1 ? 0 : 1] : '');

/** The art area's hex medal for a badge at its current tier (locked when tier 0). Decorative. */
export function BadgeMedal({ badge, size = 84 }: { badge: BadgeProgress; size?: number }) {
  return <Badge id={badge.id} tier={Math.max(1, badge.tier)} locked={badge.tier === 0} size={size} title="" className={s.medalArt} />;
}

/** Inline style that paints a tier chip / row in the art palette's tier colours. */
function tierStyle(tier: number): CSSProperties {
  const t = TIER[Math.max(0, Math.min(4, tier - 1))];
  return { ['--tier-base' as string]: t.base, ['--tier-ink' as string]: t.ink, ['--tier-shade' as string]: t.shade };
}

const PREVIEW = 6;
const lastUnlock = (b: BadgeProgress) => b.unlockedAt[b.tier - 1] ?? 0;

/** Most recently earned first, then the locked ones you're closest to. Stable within ties. */
function orderBadges(badges: BadgeProgress[]): BadgeProgress[] {
  const earned = badges.filter((b) => b.tier > 0).sort((a, b) => lastUnlock(b) - lastUnlock(a));
  const locked = badges.filter((b) => b.tier === 0).sort((a, b) => b.toNext - a.toNext);
  return [...earned, ...locked];
}

export function BadgesSection({ badges, today }: { badges: BadgeProgress[]; today: DayKey }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [all, setAll] = useState(false);
  const headingId = useId();
  const gridId = useId();
  const earnedTiers = badges.reduce((a, b) => a + b.tier, 0);
  const totalTiers = badges.reduce((a, b) => a + b.maxTier, 0);
  const earnedBadges = badges.filter((b) => b.tier > 0).length;
  const open = badges.find((b) => b.id === openId) ?? null;
  const ordered = useMemo(() => orderBadges(badges), [badges]);
  const shown = all ? ordered : ordered.slice(0, PREVIEW);
  return (
    <Card as="section" className={cx(s.card, s.badgesCard)} aria-labelledby={headingId}>
      <div className={s.cardHead}>
        <div className={s.cardTitles}>
          <h2 id={headingId} className={s.cardTitle}>
            Badges
          </h2>
          <p className={s.cardSub}>
            {earnedBadges} of {badges.length} badges earned · {earnedTiers} of {totalTiers} tiers
          </p>
        </div>
      </div>
      <ul className={s.badgeGrid} id={gridId}>
        {shown.map((b) => {
          const next = b.next != null ? `${b.value.toLocaleString()} of ${b.next.toLocaleString()}` : 'All tiers earned';
          return (
            <li key={b.id}>
              <button
                type="button"
                className={s.badgeBtn}
                onClick={() => setOpenId(b.id)}
                aria-label={`${b.title}, ${b.tier === 0 ? 'locked' : b.maxTier > 1 ? `tier ${b.tier} of ${b.maxTier}` : 'earned'}. ${b.next != null ? `${next} toward the next tier.` : ''}`}
              >
                <BadgeMedal badge={b} size={92} />
                <span className={s.badgeName}>{b.title}</span>
                <span className={s.badgeMeta}>{b.tier === 0 ? 'Locked' : b.maxTier > 1 ? `Tier ${ROMAN[b.tier]}` : 'Earned'}</span>
                {b.next != null ? (
                  <span className={s.badgeProgress} aria-hidden="true">
                    <span className={s.badgeTrack}>
                      <span className={s.badgeFill} style={{ width: `${Math.min(100, Math.round((b.value / b.next) * 100))}%` }} />
                    </span>
                    <span className={s.badgeCount}>{next}</span>
                  </span>
                ) : (
                  b.maxTier > 1 && <span className={s.badgeCount}>All tiers ✓</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {ordered.length > PREVIEW && (
        <Button variant="secondary" block aria-expanded={all} aria-controls={gridId} onClick={() => setAll((v) => !v)} iconRight={all ? 'chevronUp' : 'chevronDown'}>
          {all ? 'Show fewer' : `Show ${ordered.length - PREVIEW} more badges`}
        </Button>
      )}
      <BadgeSheet badge={open} today={today} onClose={() => setOpenId(null)} />
    </Card>
  );
}

function BadgeSheet({ badge, today, onClose }: { badge: BadgeProgress | null; today: DayKey; onClose: () => void }) {
  const b = badge;
  return (
    <Sheet
      open={!!b}
      onClose={onClose}
      title={b?.title ?? 'Badge'}
      align="center"
      hero={b ? <BadgeMedal badge={b} size={128} /> : undefined}
      description={
        b
          ? b.tier === 0
            ? 'Not earned yet — here’s how.'
            : b.maxTier > 1
              ? `Tier ${ROMAN[b.tier]} of ${ROMAN[b.maxTier]}`
              : b.unlockedAt[0]
                ? `Earned ${monthDay(dayKey(b.unlockedAt[0]), today)}`
                : 'Earned'
          : undefined
      }
      footer={
        <Button block onClick={onClose} variant="secondary">
          Got it
        </Button>
      }
    >
      {b && (
        <div className={s.badgeDetail}>
          {b.next != null ? (
            <div className={s.badgeNext}>
              <p className={s.badgeGoal}>{b.description}</p>
              <ProgressBar
                value={b.toNext}
                tone={b.maxTier === 1 ? 'honey' : tierTone(b.tier + 1)}
                label={`Progress toward ${b.maxTier > 1 ? `tier ${ROMAN[b.tier + 1]}` : b.title}`}
                valueText={`${b.value} of ${b.next}`}
              />
              <p className={s.badgeCount}>
                <strong>{b.value.toLocaleString()}</strong> / {b.next.toLocaleString()} {unit(b.id, b.next)} ·{' '}
                {(b.next - b.value).toLocaleString()} to go
              </p>
            </div>
          ) : (
            <p className={s.badgeGoal}>You’ve earned every tier. Chai is quietly impressed.</p>
          )}
          {b.maxTier > 1 && (
            <ol className={s.tierList} aria-label="Tiers">
              {b.tiers.map((threshold, i) => {
                const reached = i < b.tier;
                const at = b.unlockedAt[i];
                return (
                  <li key={i} className={s.tierRow} data-reached={reached || undefined} style={reached ? tierStyle(i + 1) : undefined}>
                    <span className={s.tierBadge}>{ROMAN[i + 1]}</span>
                    <span className={s.tierText}>
                      {threshold.toLocaleString()} {unit(b.id, threshold)}
                    </span>
                    <span className={s.tierWhen}>
                      {reached ? (
                        <>
                          <Icon name="check" size={16} />
                          {at ? monthDay(dayKey(at), today) : 'Earned'}
                        </>
                      ) : (
                        <Icon name="lock" size={16} title="Locked" />
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
    </Sheet>
  );
}
