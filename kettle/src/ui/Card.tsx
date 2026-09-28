import type { HTMLAttributes } from 'react';
import s from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: 'plain' | 'persimmon' | 'matcha' | 'honey' | 'sky' | 'berry';
  as?: 'div' | 'section' | 'article' | 'li';
}

export function Card({ tone = 'plain', as = 'div', className, ...rest }: CardProps) {
  const Tag = as as 'div';
  return <Tag className={[s.card, s[tone], className].filter(Boolean).join(' ')} {...rest} />;
}
