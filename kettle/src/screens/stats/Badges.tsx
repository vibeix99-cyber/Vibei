/** Badges grid (tiers I–V) with a detail sheet per badge. */
import { useId, useState } from 'react';
import { Icon, type IconName } from '@/art';
import { dayKey, type DayKey } from '@/lib/dates';
import { ROMAN, type BadgeProgress } from '@/progress';
import { Button, Card, ProgressBar, Sheet, cx, type Tone } from '@/ui';
import { monthDay } from './format';
import s from './stats.module.css';

export const BADGE_ICON: Record<string, IconName> = {
  'first-brew': 'kettle',
  'warm-streak': 'mug',
  'leaf-collector': 'leaf',
  'deep-steep': 'droplet',
  'morning-dew': 'sun',
  moonlit: 'moon',
  marathon: 'lightning',
  'tea-time': 'break',
  'goal-getter': 'target',
  intentional: 'pencil',
  'weekend-warmth': 'heart',
  'nook-builder': 'nook',
};

/** Tier colours climb persimmon → matcha → sky → plum → honey (gold). One-tier badges are gold. */
export function tierTone(tier: number, maxTier: number): Tone {
  if (maxTier === 1) return 'honey';
  return (['persimmon', 'matcha', 'sky', 'plum', 'honey'] as Tone[])[Math.max(0, Math.min(4, tier - 1))];
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

export function BadgeMedal({ badge, size = 76 }: { badge: BadgeProgress; size?: number }) {
  const locked = badge.tier === 0;
  const tone = locked ? undefined : tierTone(badge.tier, badge.maxTier);
  return (
    <span className={cx(s.medal, locked && s.medalLocked)} data-tone={tone} style={{ width: size, height: size }} aria-hidden="true">
      <span className={s.medalFace}>
        <Icon name={BADGE_ICON[badge.id] ?? 'star'} size={Math.round(size * 0.46)} />
      </span>
      {locked ? (
        <span className={s.medalLock}>
          <Icon name="lock" size={14} />
        </span>
      ) : (
        badge.maxTier > 1 && <span className={s.medalTier}>{ROMAN[badge.tier]}</span>
      )}
    </span>
  );
}

export function BadgesSection({ badges, today }: { badges: BadgeProgress[]; today: DayKey }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const headingId = useId();
  const earnedTiers = badges.reduce((a, b) => a + b.tier, 0);
  const totalTiers = badges.reduce((a, b) => a + b.maxTier, 0);
  const open = badges.find((b) => b.id === openId) ?? null;
  return (
    <Card as="section" className={cx(s.card, s.badgesCard)} aria-labelledby={headingId}>
      <div className={s.cardHead}>
        <div className={s.cardTitles}>
          <h2 id={headingId} className={s.cardTitle}>
            Badges
          </h2>
          <p className={s.cardSub}>
            {earnedTiers} of {totalTiers} tiers earned
          </p>
        </div>
      </div>
      <ul className={s.badgeGrid}>
        {badges.map((b) => {
          const next = b.next != null ? `${b.value.toLocaleString()} of ${b.next.toLocaleString()}` : 'All tiers earned';
          return (
            <li key={b.id}>
              <button
                type="button"
                className={s.badgeBtn}
                onClick={() => setOpenId(b.id)}
                aria-label={`${b.title}, ${b.tier === 0 ? 'locked' : b.maxTier > 1 ? `tier ${b.tier} of ${b.maxTier}` : 'earned'}. ${b.next != null ? `${next} toward the next tier.` : ''}`}
              >
                <BadgeMedal badge={b} />
                <span className={s.badgeName}>{b.title}</span>
                <span className={s.badgeMeta}>{b.tier === 0 ? next : b.maxTier > 1 ? `Tier ${ROMAN[b.tier]}` : 'Earned'}</span>
              </button>
            </li>
          );
        })}
      </ul>
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
      hero={b ? <BadgeMedal badge={b} size={112} /> : undefined}
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
                tone={tierTone(b.tier + 1, b.maxTier)}
                label={`Progress toward ${b.maxTier > 1 ? `tier ${ROMAN[b.tier + 1]}` : b.title}`}
                valueText={`${b.value} of ${b.next}`}
              />
              <p className={s.badgeCount}>
                <strong>{b.value.toLocaleString()}</strong> / {b.next.toLocaleString()} {unit(b.id, b.next)}
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
                  <li key={i} className={s.tierRow} data-reached={reached || undefined} data-tone={reached ? tierTone(i + 1, b.maxTier) : undefined}>
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
