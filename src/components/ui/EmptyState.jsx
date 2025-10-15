// src/components/ui/EmptyState.jsx
import React from 'react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) {
  return (
    <div className={`text-center p-8 ${className}`}>
      {Icon && (
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}