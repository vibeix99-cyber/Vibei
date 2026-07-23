import React from 'react';

export default function SectionHeading({ eyebrow, title, tagline, action }) {
  return (
    <div className="flex items-end justify-between mb-8 gap-4">
      <div>
        {eyebrow && (
          <span className="eyebrow text-amber-clay">
            <span className="h-px w-6 bg-amber-clay/60" aria-hidden="true" />
            {eyebrow}
          </span>
        )}
        <h2 className="display-hero text-3xl md:text-[2.6rem] text-terracotta mt-2 leading-[1.05]">{title}</h2>
        {tagline && <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-xl">{tagline}</p>}
      </div>
      {action}
    </div>
  );
}