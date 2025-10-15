// src/components/ui/Button.jsx
'use client';

import React from 'react';
import Link from 'next/link';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  as: Component = 'button',
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = 'btn-' + variant;
  const sizeClass = size !== 'md' ? 'btn-' + size : '';
  const classes = [baseClass, variantClass, sizeClass, className].filter(Boolean).join(' ');

  if (Component === Link) {
    return (
      <Link className={classes} {...props}>
        {loading && <span className="loading-spinner mr-2" />}
        {children}
      </Link>
    );
  }

  return (
    <Component
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="loading-spinner mr-2" />}
      {children}
    </Component>
  );
}