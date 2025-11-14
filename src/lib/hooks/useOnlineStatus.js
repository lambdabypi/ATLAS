// src/lib/hooks/useOnlineStatus.js - CENTRALIZED ONLINE STATUS MANAGEMENT
import { useState, useEffect, useRef } from 'react';

// Global state to share between components
let globalOnlineState = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  connectionType: 'unknown',
  lastConnectivityCheck: null,
  listeners: new Set()
};

// Notify all listeners when status changes
const notifyListeners = (newState) => {
  globalOnlineState = { ...globalOnlineState, ...newState };
  globalOnlineState.listeners.forEach(listener => listener(globalOnlineState));
};

// Test real connectivity with timeout
const testRealConnectivity = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);

    notifyListeners({
      isOnline: true,
      lastConnectivityCheck: new Date().toISOString()
    });

    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.warn('Real connectivity test failed:', error.message);
      notifyListeners({
        isOnline: false,
        lastConnectivityCheck: new Date().toISOString()
      });
    }
    return false;
  }
};

// Detect connection quality
const detectConnectionQuality = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.effectiveType) {
      notifyListeners({ connectionType: connection.effectiveType });
    }
  }
};

// Global event handlers
let globalHandlersInitialized = false;

const initializeGlobalHandlers = () => {
  if (globalHandlersInitialized || typeof window === 'undefined') {
    return;
  }

  const handleOnline = () => {
    console.log('🟢 Global Network: Back online');
    notifyListeners({ isOnline: true });
    detectConnectionQuality();
    testRealConnectivity();
  };

  const handleOffline = () => {
    console.log('🔴 Global Network: Gone offline');
    notifyListeners({
      isOnline: false,
      connectionType: 'offline',
      lastConnectivityCheck: new Date().toISOString()
    });
  };

  const handleConnectionChange = () => {
    console.log('📶 Global Network: Connection changed');
    detectConnectionQuality();
    if (navigator.onLine) {
      testRealConnectivity();
    }
  };

  // Add global event listeners
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Network Information API listener
  if ('connection' in navigator) {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }
  }

  // Periodic connectivity check (every 30 seconds)
  const connectivityCheckInterval = setInterval(() => {
    if (navigator.onLine) {
      testRealConnectivity();
    }
  }, 30000);

  // Initial checks
  detectConnectionQuality();
  if (navigator.onLine) {
    testRealConnectivity();
  }

  globalHandlersInitialized = true;

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    }

    clearInterval(connectivityCheckInterval);
    globalHandlersInitialized = false;
  };
};

// Main hook
export const useOnlineStatus = (options = {}) => {
  const {
    enableRealConnectivityTest = true,
    enableConnectionQuality = true,
    enablePeriodicCheck = true
  } = options;

  const [onlineState, setOnlineState] = useState(() => ({
    isOnline: globalOnlineState.isOnline,
    connectionType: globalOnlineState.connectionType,
    lastConnectivityCheck: globalOnlineState.lastConnectivityCheck
  }));

  const cleanupRef = useRef(null);

  useEffect(() => {
    // Initialize global handlers if not already done
    cleanupRef.current = initializeGlobalHandlers();

    // Subscribe to global state changes
    const handleStateChange = (newState) => {
      setOnlineState({
        isOnline: newState.isOnline,
        connectionType: newState.connectionType,
        lastConnectivityCheck: newState.lastConnectivityCheck
      });
    };

    globalOnlineState.listeners.add(handleStateChange);

    // Set initial state
    handleStateChange(globalOnlineState);

    return () => {
      globalOnlineState.listeners.delete(handleStateChange);
      if (cleanupRef.current && globalOnlineState.listeners.size === 0) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // Manual connectivity test function
  const checkConnectivity = async () => {
    if (enableRealConnectivityTest) {
      return await testRealConnectivity();
    }
    return navigator.onLine;
  };

  // Get status with enhanced info
  const getStatusInfo = () => {
    const { isOnline, connectionType, lastConnectivityCheck } = onlineState;

    let statusText = isOnline ? 'Online' : 'Offline';
    let statusColor = isOnline ? 'green' : 'red';
    let statusIcon = isOnline ? '🟢' : '🔴';

    if (isOnline && connectionType && connectionType !== 'unknown') {
      statusText = `Online (${connectionType.toUpperCase()})`;

      // Color coding based on connection quality
      switch (connectionType) {
        case 'slow-2g':
        case '2g':
          statusColor = 'red';
          statusIcon = '🔴';
          break;
        case '3g':
          statusColor = 'yellow';
          statusIcon = '🟡';
          break;
        case '4g':
        case '5g':
          statusColor = 'green';
          statusIcon = '🟢';
          break;
      }
    }

    return {
      isOnline,
      connectionType,
      lastConnectivityCheck,
      statusText,
      statusColor,
      statusIcon,
      isSlowConnection: ['slow-2g', '2g'].includes(connectionType)
    };
  };

  return {
    ...onlineState,
    checkConnectivity,
    getStatusInfo
  };
};

export default useOnlineStatus;