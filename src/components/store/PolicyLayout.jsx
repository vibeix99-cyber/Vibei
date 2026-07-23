import React from 'react';

export default function PolicyLayout({ title, children }) {
  return (
    <div className="max-w-[860px] mx-auto px-5 md:px-8 py-14">
      <h1 className="font-heading font-bold text-3xl md:text-5xl text-terracotta text-center">{title}</h1>
      <div className="thread-line my-10" />
      <div className="prose-policy space-y-4 text-charcoal/85 leading-relaxed">{children}</div>
    </div>
  );
}

export function PolicyHeading({ children }) {
  return <h2 className="font-heading font-bold text-xl text-charcoal mt-8 mb-2">{children}</h2>;
}