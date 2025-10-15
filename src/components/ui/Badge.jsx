import React from 'react';

export function Badge({ children, variant = 'primary', className = '' }) {
  const classes = [
    'badge',
    `badge-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}