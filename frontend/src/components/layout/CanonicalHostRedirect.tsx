'use client';

import { useEffect } from 'react';

export default function CanonicalHostRedirect() {
  useEffect(() => {
    if (window.location.hostname !== 'localtest.me') {
      return;
    }

    const canonicalUrl = new URL(window.location.href);
    canonicalUrl.hostname = 'localhost';
    window.location.replace(canonicalUrl.toString());
  }, []);

  return null;
}
