// src/components/ui/Card.jsx
import React from 'react';

export function Card({ children, className = '', ...props }) {
  const classes = ['card', className].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', padding = true }) {
  return (
    <div className={`${padding ? 'px-6 py-4 ' : ''}${className}`}>
      {children}
    </div>
  );
}