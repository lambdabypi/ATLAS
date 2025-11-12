// src/app/layout.js - ENHANCED with Storage Persistence
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

// Import our new storage persistence manager
import {
	storagePersistenceManager,
	registerEnhancedServiceWorker,
	setupReloadProtection
} from '../lib/utils/storagePersistenceManager';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	useEffect(() => {
		const initializeAtlasPersistence = async () => {
			if (typeof window === 'undefined') return;

			console.log('🏥 Initializing ATLAS with enhanced persistence...');

			// STEP 1: Setup reload protection immediately
			setupReloadProtection();

			// STEP 2: Request persistent storage BEFORE any caching
			try {
				const persistenceStatus = await storagePersistenceManager.requestPersistentStorage();

				if (persistenceStatus.persistent) {
					console.log('✅ ATLAS has persistent storage - data will survive reloads!');
				} else {
					console.warn('⚠️ ATLAS running without persistent storage - data may be lost on reload');
				}
			} catch (error) {
				console.error('Failed to setup storage persistence:', error);
			}

			// STEP 3: Register enhanced service worker with immediate claim
			try {
				const registration = await registerEnhancedServiceWorker();
				if (registration) {
					console.log('✅ Enhanced service worker registered');
				} else {
					console.warn('⚠️ Service worker registration failed');
				}
			} catch (error) {
				console.error('Service worker error:', error);
			}

			// STEP 4: Enhanced manual caching (after persistence is established)
			await enhancedManualCache();

			// STEP 5: Setup storage monitoring
			storagePersistenceManager.setupStorageMonitoring();

			console.log('🎉 ATLAS persistence initialization complete!');
		};

		// CRITICAL: Initialize persistence immediately, don't wait
		if (typeof window !== 'undefined') {
			// Start immediately - don't delay this!
			initializeAtlasPersistence();
		}

		// Network event handlers (unchanged but improved)
		const handleOnline = () => {
			console.log('🟢 Network: Back online');
			setTimeout(() => {
				enhancedManualCache();
			}, 1000);
		};

		const handleOffline = () => {
			console.log('🔴 Network: Gone offline - data should persist through reloads');
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
			}
		};
	}, []); // Run only once

	// Enhanced manual cache with better error handling
	const enhancedManualCache = async () => {
		if (!('caches' in window)) {
			console.log('⚠️ Cache API not supported');
			return;
		}

		try {
			console.log('🔧 Starting enhanced manual cache with persistence...');

			const cache = await caches.open('atlas-manual-v3'); // Increment version

			const urlsToCache = [
				'/',
				'/dashboard',
				'/patients',
				'/patients/1',
				'/patients/2',
				'/consultation',
				'/consultation/new',
				'/consultation/new?patientId=1',
				'/consultation/new?patientId=2',
				'/reference',
				'/testing'
			];

			let successCount = 0;

			for (const url of urlsToCache) {
				try {
					const fullUrl = window.location.origin + url;

					// Check if already cached
					const cachedResponse = await cache.match(fullUrl);
					if (cachedResponse) {
						console.log('✅ Already cached:', url);
						successCount++;
						continue;
					}

					// Only cache if online
					if (!navigator.onLine) {
						console.log('📱 Offline - skipping cache of:', url);
						continue;
					}

					// Cache with timeout
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 10000);

					const response = await fetch(fullUrl, {
						signal: controller.signal,
						cache: 'no-cache' // Always fetch fresh version
					});

					clearTimeout(timeoutId);

					if (response.ok) {
						await cache.put(fullUrl, response);
						console.log('✅ Manually cached:', url);
						successCount++;
					} else {
						console.warn('⚠️ Bad response for:', url, response.status);
					}
				} catch (err) {
					if (err.name === 'AbortError') {
						console.warn('⚠️ Cache timeout for:', url);
					} else {
						console.warn('⚠️ Failed to cache:', url, err.message);
					}
				}
			}

			// Also cache the current page if it has query params
			const currentUrl = window.location.href;
			if (currentUrl.includes('?')) {
				try {
					const cachedResponse = await cache.match(currentUrl);
					if (!cachedResponse && navigator.onLine) {
						const response = await fetch(currentUrl);
						if (response.ok) {
							await cache.put(currentUrl, response);
							console.log('✅ Cached current page with params:', currentUrl);
							successCount++;
						}
					}
				} catch (err) {
					console.warn('⚠️ Failed to cache current page:', err.message);
				}
			}

			console.log(`🎉 Enhanced manual caching complete! ${successCount} URLs cached with persistence`);

		} catch (error) {
			console.error('❌ Enhanced manual cache failed:', error);
		}
	};

	return (
		<html lang="en">
			<head>
				<title>Clinical Decision Support System</title>
				<meta name="description" content="LLM-powered clinical decision support for resource-limited settings" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#667eea" />
				<meta name="application-name" content="Clinical Support" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Clinical Support" />
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />

				{/* CRITICAL: Add these PWA optimization meta tags */}
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="apple-touch-fullscreen" content="yes" />

				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
				<link rel="manifest" href="/manifest.json" />
			</head>
			<body className={`${inter.className} m-0 p-0`}>
				<AppShell>
					{children}
				</AppShell>
			</body>
		</html>
	);
}