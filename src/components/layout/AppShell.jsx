// src/components/layout/AppShell.jsx
'use client';

import Navigation from './Navigation';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container py-6">
        {children}
      </main>
    </div>
  );
}