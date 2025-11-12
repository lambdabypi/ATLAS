// src/lib/hooks/useLocalStorage.js - FULLY SSR COMPATIBLE
import { useState, useEffect } from 'react';

// ✅ Robust browser check
const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export function useLocalStorage(key, initialValue) {
  // ✅ CRITICAL: Initialize with initialValue on server, don't access localStorage
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // ✅ Hydration effect - runs only on client after mount
  useEffect(() => {
    if (!isBrowser()) {
      setIsHydrated(true); // Mark as hydrated even if no localStorage
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      const value = item ? JSON.parse(item) : initialValue;
      setStoredValue(value);
      setIsHydrated(true);
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setStoredValue(initialValue);
      setIsHydrated(true);
    }
  }, [key, initialValue]);

  // ✅ Update function that's safe to call anytime
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      // Only access localStorage if we're in browser
      if (isBrowser()) {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // ✅ Return current value and setter, plus hydration status if needed
  return [storedValue, setValue, isHydrated];
}