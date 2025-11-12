// src/app/layout.js - Coordinated with single service worker
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

			console.log('🏥 Initializing ATLAS offline support...');

			// Step 1: Request persistent storage
			await requestPersistentStorage();

			// Step 2: Wait for service worker to be ready
			await waitForServiceWorker();

			// Step 3: Pre-cache critical pages (after SW is ready)
			setTimeout(() => preCacheCriticalPages(), 2000);

			// Step 4: Setup monitoring
			setupOfflineMonitoring();
		};

		initializeOfflineSupport();

		// Network event handlers
		const handleOnline = () => {
			console.log('🟢 Back online');
			// Trigger sync or refresh if needed
			setTimeout(() => preCacheCriticalPages(), 1000);
		};

		const handleOffline = () => {
			console.log('🔴 Offline mode');
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
				<meta name="description" content="Clinical decision support for resource-limited settings" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#667eea" />

				{/* PWA meta tags */}
				<meta name="application-name" content="ATLAS Clinical" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="ATLAS" />
				<meta name="mobile-web-app-capable" content="yes" />

				<link rel="manifest" href="/manifest.json" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
			</head>
			<body className={`${inter.className} m-0 p-0`}>
				<AppShell>
					{children}
				</AppShell>
			</body>
		</html>
	);
}

// Request persistent storage
async function requestPersistentStorage() {
	try {
		if ('storage' in navigator && 'persist' in navigator.storage) {
			const isPersisted = await navigator.storage.persisted();

			if (!isPersisted) {
				const granted = await navigator.storage.persist();
				if (granted) {
					console.log('✅ Persistent storage GRANTED');
				} else {
					console.warn('⚠️ Persistent storage DENIED');
				}
			} else {
				console.log('✅ Already have persistent storage');
			}

			// Check quota
			if ('estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				const usedMB = (estimate.usage / 1024 / 1024).toFixed(2);
				const totalMB = (estimate.quota / 1024 / 1024).toFixed(2);
				console.log(`📊 Storage: ${usedMB}MB / ${totalMB}MB`);
			}
		}
	} catch (error) {
		console.error('❌ Storage persistence error:', error);
	}
}

// Wait for service worker to be ready and controlling
async function waitForServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		console.warn('⚠️ Service Worker not supported');
		return false;
	}

	try {
		// Wait for registration
		const registration = await navigator.serviceWorker.ready;
		console.log('✅ Service Worker ready');

		// Check if SW is controlling the page
		if (!navigator.serviceWorker.controller) {
			console.log('⏳ Waiting for SW to control page...');

			// Wait for SW to take control
			await new Promise((resolve) => {
				navigator.serviceWorker.addEventListener('controllerchange', () => {
					console.log('✅ Service Worker now controlling page');
					resolve();
				});

				// Timeout after 5 seconds
				setTimeout(() => {
					console.warn('⚠️ SW control timeout - continuing anyway');
					resolve();
				}, 5000);
			});
		} else {
			console.log('✅ Service Worker already controlling page');
		}

		return registration;

	} catch (error) {
		console.error('❌ Service Worker initialization error:', error);
		return false;
	}
}

// Pre-cache critical pages for offline access
async function preCacheCriticalPages() {
	if (!('caches' in window)) {
		console.warn('⚠️ Cache API not supported');
		return;
	}

	if (!navigator.onLine) {
		console.log('📱 Offline - skipping pre-cache');
		return;
	}

	try {
		console.log('🔄 Pre-caching critical pages...');

		const cache = await caches.open('atlas-pages');

		// Critical pages to cache
		const urlsToCache = [
			'/',
			'/dashboard',
			'/patients',
			'/patients/add',
			'/consultation/new',
			'/reference',

			// Dynamic URLs that might be accessed
			'/consultation/new?patientId=1',
			'/consultation/new?patientId=2',
			'/consultation/new?mode=enhanced',
			'/patients/1',
			'/patients/2',
		];

		let cached = 0;
		let failed = 0;

		for (const url of urlsToCache) {
			try {
				const fullUrl = window.location.origin + url;

				// Check if already cached
				const existing = await cache.match(fullUrl);
				if (existing) {
					console.log('✓ Already cached:', url);
					continue;
				}

				// Fetch and cache
				const response = await fetch(fullUrl, {
					cache: 'no-cache',
					credentials: 'same-origin'
				});

				if (response.ok) {
					await cache.put(fullUrl, response.clone());
					console.log('✓ Cached:', url);
					cached++;
				} else {
					console.warn('✗ Failed:', url, response.status);
					failed++;
				}

			} catch (error) {
				console.warn('✗ Error caching:', url, error.message);
				failed++;
			}
		}

		console.log(`✅ Pre-cache complete: ${cached} cached, ${failed} failed`);

		// CRITICAL: Verify the problematic URL
		const testUrl = window.location.origin + '/consultation/new?patientId=1';
		const testResponse = await cache.match(testUrl);

		if (testResponse) {
			console.log('✅ VERIFIED: /consultation/new?patientId=1 is cached');
		} else {
			console.error('❌ CRITICAL: /consultation/new?patientId=1 NOT cached');
		}

	} catch (error) {
		console.error('❌ Pre-cache error:', error);
	}
}

// Setup offline monitoring
function setupOfflineMonitoring() {
	// Log network status changes
	console.log(`📡 Network status: ${navigator.onLine ? 'Online' : 'Offline'}`);

	// Monitor cache size periodically
	if ('storage' in navigator && 'estimate' in navigator.storage) {
		setInterval(async () => {
			try {
				const estimate = await navigator.storage.estimate();
				const percentUsed = (estimate.usage / estimate.quota * 100).toFixed(1);

				if (percentUsed > 80) {
					console.warn(`⚠️ Storage ${percentUsed}% full`);
				}
			} catch (error) {
				// Silently fail
			}
		}, 60000); // Check every minute
	}

	// Debug: List cached URLs (dev mode only)
	if (process.env.NODE_ENV === 'development') {
		setTimeout(async () => {
			try {
				const cache = await caches.open('atlas-pages');
				const requests = await cache.keys();
				console.log('📋 Cached pages:', requests.map(r => r.url));
			} catch (error) {
				console.warn('Could not list cache:', error);
			}
		}, 3000);
	}
}