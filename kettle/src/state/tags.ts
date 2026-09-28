/**
 * Intention tags — single source of truth for label, icon and tone.
 * Shared (orchestrator). Home, focus, stats and the kit all read from here.
 */
import type { IconName } from '@/art';
import type { TagId } from './settings';

export type TagTone = 'persimmon' | 'sky' | 'berry' | 'honey' | 'matcha';

export interface TagMeta {
  id: TagId;
  label: string;
  icon: IconName;
  tone: TagTone;
}

export const TAGS: TagMeta[] = [
  { id: 'work', label: 'Work', icon: 'target', tone: 'persimmon' },
  { id: 'study', label: 'Study', icon: 'pencil', tone: 'sky' },
  { id: 'read', label: 'Read', icon: 'eye', tone: 'berry' },
  { id: 'create', label: 'Create', icon: 'sparkle', tone: 'honey' },
  { id: 'life', label: 'Life', icon: 'heart', tone: 'matcha' },
];

export const TAG_BY_ID = Object.fromEntries(TAGS.map((t) => [t.id, t])) as Record<TagId, TagMeta>;
