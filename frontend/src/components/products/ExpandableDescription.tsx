'use client';

import { useState } from 'react';
import styles from './expandable-description.module.css';

interface ExpandableDescriptionProps {
  readonly text: string;
  readonly maxLength?: number;
  readonly className?: string;
}

export default function ExpandableDescription({
  text,
  maxLength = 80,
  className = '',
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) {
    return null;
  }

  if (text.length <= maxLength) {
    return (
      <p className={`${styles.text} ${className}`}>{text}</p>
    );
  }

  const displayText = isExpanded
    ? text
    : `${text.substring(0, maxLength)}...`;

  return (
    <div className={styles.container}>
      <p className={`${styles.text} ${className}`}>
        {displayText}
      </p>
      <button
        type="button"
        className={styles.button}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Ver menos' : 'Ver más'}
      </button>
    </div>
  );
}
