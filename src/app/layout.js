// src/app/layout.js - Improved with SW communication
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	useEffect(() => {
		if (typeof window === 'undefined') return;

		let isInitialized = false;

		const initializeOfflineSupport = async () => {
			if (isInitialized) return;
			isInitialized = true;

			console.log('🏥 ATLAS: Initializing offline support...');

			try {
				// Step 1: Request persistent storage
				await requestPersistentStorage();

				// Step 2: Register and wait for service worker
				const registration = await registerServiceWorker();

				if (registration) {
					// Step 3: Wait for SW to be ready and controlling
					await waitForServiceWorkerControl();

					// Step 4: Pre-cache critical pages via SW
					await preCacheCriticalPages();

					// Step 5: Setup monitoring
					setupOfflineMonitoring();

					console.log('✅ ATLAS: Offline support fully initialized');
				} else {
					console.warn('⚠️ ATLAS: Running without offline support');
				}
			} catch (error) {
				console.error('❌ ATLAS: Offline support initialization failed:', error);
			}
		};

		initializeOfflineSupport();

		// Network event handlers
		const handleOnline = () => {
			console.log('🟢 ATLAS: Back online - refreshing cache');
			setTimeout(() => preCacheCriticalPages(), 1000);
		};

		const handleOffline = () => {
			console.log('🔴 ATLAS: Offline mode activated');
		};

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return (
		<html lang="en">
			<head>
				<title>ATLAS Clinical Decision Support</title>
				<meta name="description" content="Adaptive Triage and Local Advisory System - Clinical decision support for resource-limited settings" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#3b82f6" />

				{/* App metadata */}
				<meta name="application-name" content="ATLAS Clinical" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="ATLAS" />
				<meta name="mobile-web-app-capable" content="yes" />

				{/* Favicons - Updated to match your actual files */}
				<link rel="icon" type="image/x-icon" href="/icons/favicon.ico" />
				<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
				<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
				<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

				{/* Web App Manifest */}
				<link rel="manifest" href="/manifest.json" />

				{/* PWA iOS Safari pinned tab */}
				<link rel="mask-icon" href="/icons/android-chrome-512x512.png" color="#3b82f6" />

				{/* Microsoft Tiles */}
				<meta name="msapplication-TileImage" content="/icons/android-chrome-512x512.png" />
				<meta name="msapplication-TileColor" content="#3b82f6" />
				<meta name="msapplication-config" content="/browserconfig.xml" />
			</head>
			<body className={`${inter.className} m-0 p-0`}>
				<AppShell>
					{children}
				</AppShell>
			</body>
		</html>
	);
}

// ============================================================================
// Storage Persistence
// ============================================================================
async function requestPersistentStorage() {
	try {
		if ('storage' in navigator && 'persist' in navigator.storage) {
			const isPersisted = await navigator.storage.persisted();

			if (!isPersisted) {
				const granted = await navigator.storage.persist();
				console.log(granted ? '✅ Persistent storage GRANTED' : '⚠️ Persistent storage DENIED');
			} else {
				console.log('✅ Already have persistent storage');
			}

			if ('estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
				const totalMB = (estimate.quota / 1024 / 1024).toFixed(2);
				const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);
				console.log(`📊 Storage: ${usedMB}MB / ${totalMB}MB (${percentUsed}% used)`);
			}
		}
	} catch (error) {
		console.error('❌ Storage persistence error:', error);
	}
}

// ============================================================================
// Service Worker Registration
// ============================================================================
async function registerServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		console.warn('⚠️ Service Worker not supported in this browser');
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.register('/sw.js', {
			scope: '/',
		});

		console.log('✅ Service Worker registered');

		// Listen for updates
		registration.addEventListener('updatefound', () => {
			const newWorker = registration.installing;
			console.log('🔄 Service Worker update found');

			newWorker.addEventListener('statechange', () => {
				if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
					console.log('🆕 New version available');
					// Optionally notify user to refresh
					if (confirm('A new version of ATLAS is available. Reload now?')) {
						window.location.reload();
					}
				}
			});
		});

		return registration;
	} catch (error) {
		console.error('❌ Service Worker registration failed:', error);
		return null;
	}
}

// ============================================================================
// Wait for Service Worker Control
// ============================================================================
async function waitForServiceWorkerControl() {
	if (!navigator.serviceWorker.controller) {
		console.log('⏳ Waiting for Service Worker to take control...');

		await new Promise((resolve) => {
			const timeout = setTimeout(() => {
				console.warn('⚠️ Service Worker control timeout (continuing anyway)');
				resolve();
			}, 10000); // 10 second timeout

			navigator.serviceWorker.addEventListener('controllerchange', () => {
				clearTimeout(timeout);
				console.log('✅ Service Worker now controlling page');
				resolve();
			}, { once: true });

			// If already controlling, resolve immediately
			if (navigator.serviceWorker.controller) {
				clearTimeout(timeout);
				resolve();
			}
		});
	} else {
		console.log('✅ Service Worker already controlling page');
	}
}

// ============================================================================
// Pre-cache Critical Pages via Service Worker
// ============================================================================
// src/app/layout.js - FIXED PRE-CACHE FUNCTION

async function preCacheCriticalPages() {
	if (!navigator.onLine) {
		console.log('📱 Offline - skipping pre-cache');
		return;
	}

	if (!navigator.serviceWorker.controller) {
		console.warn('⚠️ Service Worker not controlling - cannot pre-cache');
		return;
	}

	try {
		console.log('🔄 Pre-caching critical pages...');

		// Get all URLs that need to be cached
		const urlsToCache = getCriticalUrls();

		// Send cache request to service worker (it will handle the fetching)
		navigator.serviceWorker.controller.postMessage({
			type: 'CACHE_URLS',
			urls: urlsToCache,
		});

		console.log(`📤 Sent ${urlsToCache.length} URLs to Service Worker for caching`);

		// Wait a bit for caching to complete, then verify
		setTimeout(async () => {
			await verifyCachedUrls();
		}, 5000);

	} catch (error) {
		console.error('❌ Pre-cache error:', error);
	}
}


// ============================================================================
// Get Critical URLs to Cache
// ============================================================================

function getCriticalUrls() {
	const baseUrls = [
		'/',
		'/dashboard',
		'/patients',
		'/patients/add',
		'/patients/new',
		'/consultation/new',
		'/reference',
		'/guidelines',
	];

	// Add dynamic patient URLs (1-10)
	const patientUrls = Array.from(
		{ length: 10 },
		(_, i) => `/patients/${i + 1}`
	);

	// Add consultation URLs with patient IDs (1-10)
	const consultationUrls = Array.from(
		{ length: 10 },
		(_, i) => `/consultation/new?patientId=${i + 1}`
	);

	// Add enhanced mode
	const enhancedUrls = [
		'/consultation/new?mode=enhanced',
	];

	// Convert to absolute URLs
	return [
		...baseUrls,
		...patientUrls,
		...consultationUrls,
		...enhancedUrls,
	].map(url => new URL(url, window.location.origin).href);
}

// ============================================================================
// Verify Cached URLs
// ============================================================================

async function verifyCachedUrls() {
	try {
		const cache = await caches.open('atlas-pages-v2');
		const cachedRequests = await cache.keys();
		const cachedUrls = cachedRequests.map(req => req.url);

		console.log(`📋 Total cached pages: ${cachedUrls.length}`);

		// Test critical URLs
		const testUrls = [
			'/consultation/new?patientId=1',
			'/consultation/new?patientId=2',
			'/patients/1',
			'/dashboard',
		];

		console.log('🔍 Verifying critical URLs...');

		for (const testUrl of testUrls) {
			const fullUrl = new URL(testUrl, window.location.origin).href;
			const response = await cache.match(fullUrl, { ignoreSearch: false });

			if (response) {
				console.log('✅ VERIFIED:', testUrl);
			} else {
				console.warn('⚠️ NOT CACHED:', testUrl);
			}
		}
	} catch (error) {
		console.warn('⚠️ Could not verify cache:', error);
	}
}

// ============================================================================
// Offline Monitoring
// ============================================================================
function setupOfflineMonitoring() {
	console.log(`📡 Network: ${navigator.onLine ? 'Online' : 'Offline'}`);

	// Monitor storage usage
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		const checkStorage = async () => {
			try {
				const estimate = await navigator.storage.estimate();
				const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1);

				if (percentUsed > 80) {
					console.warn(`⚠️ Storage ${percentUsed}% full - consider clearing old cache`);
				}
			} catch (error) {
				// Silent fail
			}
		};

		// Check immediately and then every 5 minutes
		checkStorage();
		setInterval(checkStorage, 5 * 60 * 1000);
	}

	// Debug cache contents in development
	if (process.env.NODE_ENV === 'development') {
		setTimeout(async () => {
			try {
				console.log('📦 Cache Debug Info:');
				const cacheNames = await caches.keys();

				for (const cacheName of cacheNames) {
					const cache = await caches.open(cacheName);
					const requests = await cache.keys();
					console.log(`  ${cacheName}: ${requests.length} items`);

					// Show first 5 URLs
					requests.slice(0, 5).forEach(req => {
						console.log(`    - ${req.url}`);
					});

					if (requests.length > 5) {
						console.log(`    ... and ${requests.length - 5} more`);
					}
				}
			} catch (error) {
				console.warn('Could not list cache:', error);
			}
		}, 5000);
	}
}

// ============================================================================
// Export utility functions for use elsewhere
// ============================================================================
if (typeof window !== 'undefined') {
	window.atlasOffline = {
		getCacheStatus: async () => {
			const cacheNames = await caches.keys();
			const status = {};

			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();
				status[cacheName] = keys.length;
			}

			return status;
		},

		clearAllCaches: async () => {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map(name => caches.delete(name)));
			console.log('✅ All caches cleared');
			alert('All caches cleared. Refresh to rebuild.');
		},

		testOfflineUrl: async (url) => {
			const fullUrl = new URL(url, window.location.origin).href;
			const cache = await caches.open('atlas-pages-v1');
			const response = await cache.match(fullUrl, { ignoreSearch: false });

			if (response) {
				console.log('✅ URL is cached:', url);
				return true;
			} else {
				console.log('❌ URL NOT cached:', url);
				return false;
			}
		},
	};
}