// src/components/layout/AppShell.jsx - UPDATED WITH USER SYSTEM
'use client';

import { useEffect, useState } from 'react';
import Navigation from './Navigation';

// ADD THESE IMPORTS
import { UserSelection, UserHeader } from '../auth/UserSelection';
import { useUserSystem } from '../../lib/auth/simpleUserSystem';

export default function AppShell({ children }) {
  // ADD USER SYSTEM
  const { currentUser } = useUserSystem();
  const [showUserSelection, setShowUserSelection] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize and check for existing user
    const initializeUserSystem = () => {
      if (!currentUser) {
        setShowUserSelection(true);
      }
      setIsInitialized(true);
    };

    // Small delay to ensure proper hydration
    const timer = setTimeout(initializeUserSystem, 100);
    return () => clearTimeout(timer);
  }, [currentUser]);

  const handleUserSelected = (user) => {
    console.log('User selected in AppShell:', user);
    setShowUserSelection(false);
  };

  const handleSwitchUser = () => {
    setShowUserSelection(true);
  };

  // Show loading state during initialization
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Initializing ATLAS...</p>
        </div>
      </div>
    );
  }

  // SHOW USER SELECTION IF NO USER
  if (showUserSelection || !currentUser) {
    return <UserSelection onUserSelected={handleUserSelected} />;
  }

  // NORMAL APP LAYOUT WITH USER SYSTEM
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ADD USER HEADER */}
      <UserHeader onSwitchUser={handleSwitchUser} />

      {/* KEEP YOUR EXISTING NAVIGATION */}
      <Navigation />

      {/* MAIN CONTENT */}
      <main className="pt-4">
        {children}
      </main>
    </div>
  );
}