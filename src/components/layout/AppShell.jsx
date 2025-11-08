// src/components/layout/AppShell.jsx
'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const showNavigation = pathname !== '/';

  return (
    <div className="min-h-screen">
      {showNavigation && <Navigation />}

      {/* This main wrapper ensures proper centering for all pages */}
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}