import React from 'react';
import { Link } from 'react-router-dom';

const LOGO_URL = 'https://media.base44.com/images/public/6a60902adcc8c65641dc85b0/db168cfd1_MIN-LOGO-final-White-1.png';

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center group">
      <img
        src={LOGO_URL}
        alt="Made in Nagaland"
        className="h-11 w-auto object-contain transition-opacity group-hover:opacity-90"
        style={light ? undefined : { filter: 'brightness(0) saturate(100%) invert(24%) sepia(38%) saturate(1345%) hue-rotate(337deg) brightness(95%) contrast(88%)' }}
      />
    </Link>
  );
}