// src/components/ui/TextArea.jsx
import React, { forwardRef } from 'react';

export const TextArea = forwardRef(function TextArea({
  label,
  error,
  helperText,
  className = '',
  required = false,
  rows = 4,
  ...props
}, ref) {
  const textareaClasses = [
    'input',
    'textarea',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});