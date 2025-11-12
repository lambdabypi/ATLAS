// src/app/layout.js - CRITICAL FIX for Query Parameter Caching
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	useEffect(() => {
		// CRITICAL: Initialize storage persistence IMMEDIATELY
		const initializeCriticalCaching = async () => {
			if (typeof window === 'undefined') return;

			console.log('🚨 CRITICAL: Initializing ATLAS caching fix...');

			// STEP 1: Request persistent storage IMMEDIATELY
			try {
				if ('storage' in navigator && 'persist' in navigator.storage) {
					const persistent = await navigator.storage.persist();
					console.log(persistent ? '✅ Persistent storage GRANTED' : '❌ Persistent storage DENIED');
				}
			} catch (error) {
				console.error('Persistent storage request failed:', error);
			}

			// STEP 2: Register service worker with IMMEDIATE activation
			if ('serviceWorker' in navigator) {
				try {
					const registration = await navigator.serviceWorker.register('/sw.js', {
						scope: '/',
						updateViaCache: 'none'
					});

					// Force immediate activation
					if (registration.waiting) {
						registration.waiting.postMessage({ type: 'SKIP_WAITING' });
					}

					if (registration.installing) {
						registration.installing.postMessage({ type: 'SKIP_WAITING' });
					}

					// Wait for service worker to be ready
					await navigator.serviceWorker.ready;
					console.log('✅ Service Worker ready');

				} catch (error) {
					console.error('❌ Service Worker registration failed:', error);
				}
			}

			// STEP 3: CRITICAL - Cache query parameter URLs specifically
			await cacheQueryParameterUrls();

			// STEP 4: Set up storage monitoring
			setupStorageProtection();
		};

		// Start immediately - don't wait!
		initializeCriticalCaching();

		// Network handlers
		const handleOnline = () => {
			console.log('🟢 Back online - refreshing critical caches');
			setTimeout(cacheQueryParameterUrls, 1000);
		};

		const handleOffline = () => {
			console.log('🔴 Offline - relying on cached data');
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
	}, []);

	// CRITICAL: Cache URLs with query parameters specifically
	const cacheQueryParameterUrls = async () => {
		if (!('caches' in window)) {
			console.error('❌ Cache API not supported');
			return;
		}

		try {
			console.log('🔧 Caching query parameter URLs...');

			const cache = await caches.open('atlas-critical-v1');

			// CRITICAL: These are the exact URLs that must work offline
			const criticalUrls = [
				// Base pages
				'/',
				'/dashboard',
				'/patients',
				'/consultation/new',
				'/reference',

				// Query parameter variations - THESE ARE CRITICAL
				'/consultation/new?patientId=1',
				'/consultation/new?patientId=2',
				'/consultation/new?patientId=3',
				'/consultation/new?patientId=4',
				'/consultation/new?patientId=5',

				// Different modes
				'/consultation/new?mode=enhanced',
				'/consultation/new?mode=quick',
				'/consultation/new?patientId=1&mode=enhanced',
				'/consultation/new?patientId=2&mode=enhanced',

				// Patient pages
				'/patients/1',
				'/patients/2',
				'/patients/add',
				'/patients/new'
			];

			let cachedCount = 0;
			let existingCount = 0;

			for (const url of criticalUrls) {
				try {
					const fullUrl = window.location.origin + url;

					// Check if already cached
					const existing = await cache.match(fullUrl);
					if (existing) {
						console.log('✅ Already cached:', url);
						existingCount++;
						continue;
					}

					// Only fetch if online
					if (!navigator.onLine) {
						console.log('📱 Offline - skipping:', url);
						continue;
					}

					// Fetch with timeout
					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), 8000);

					const response = await fetch(fullUrl, {
						signal: controller.signal,
						cache: 'no-cache',
						credentials: 'same-origin'
					});

					clearTimeout(timeoutId);

					if (response.ok) {
						await cache.put(fullUrl, response);
						console.log('✅ Cached:', url);
						cachedCount++;
					} else {
						console.warn('⚠️ Failed to cache (bad response):', url, response.status);
					}

				} catch (error) {
					if (error.name === 'AbortError') {
						console.warn('⏰ Timeout caching:', url);
					} else {
						console.warn('❌ Error caching:', url, error.message);
					}
				}
			}

			console.log(`🎉 Critical caching complete: ${cachedCount} new, ${existingCount} existing`);

			// CRITICAL: Verify the problematic URL is cached
			const testUrl = window.location.origin + '/consultation/new?patientId=1';
			const testCache = await cache.match(testUrl);
			if (testCache) {
				console.log('✅ VERIFIED: /consultation/new?patientId=1 IS CACHED');
			} else {
				console.error('❌ CRITICAL: /consultation/new?patientId=1 NOT CACHED');
			}

		} catch (error) {
			console.error('❌ Critical caching failed:', error);
		}
	};

	// CRITICAL: Protect storage from being wiped
	const setupStorageProtection = () => {
		console.log('🛡️ Setting up storage protection...');

		// Prevent page unload from clearing data
		window.addEventListener('beforeunload', (event) => {
			console.log('🔄 Page unloading - storage should persist...');

			// Save critical data to multiple storage locations
			try {
				const timestamp = Date.now();
				const criticalData = {
					timestamp,
					url: window.location.href,
					user: localStorage.getItem('atlas_current_user'),
					patterns: localStorage.getItem('atlas_user_patterns')
				};

				// Save to multiple places
				localStorage.setItem('atlas_persistence_backup', JSON.stringify(criticalData));
				sessionStorage.setItem('atlas_session_backup', JSON.stringify(criticalData));

				console.log('💾 Critical data backed up');
			} catch (error) {
				console.error('❌ Failed to backup critical data:', error);
			}
		});

		// Restore data on load
		window.addEventListener('DOMContentLoaded', () => {
			try {
				const backup = localStorage.getItem('atlas_persistence_backup');
				if (backup) {
					const data = JSON.parse(backup);
					console.log('📥 Restored data from backup:', new Date(data.timestamp));
				}
			} catch (error) {
				console.warn('Failed to restore backup:', error);
			}
		});

		// Monitor storage quota
		if ('storage' in navigator && 'estimate' in navigator.storage) {
			const checkQuota = async () => {
				try {
					const estimate = await navigator.storage.estimate();
					const usedMB = Math.round(estimate.usage / 1024 / 1024);
					const quotaMB = Math.round(estimate.quota / 1024 / 1024);

					if (estimate.usage / estimate.quota > 0.8) {
						console.warn(`⚠️ Storage almost full: ${usedMB}/${quotaMB}MB`);
					}
				} catch (error) {
					console.warn('Storage monitoring failed:', error);
				}
			};

			// Check immediately and then every 30 seconds
			checkQuota();
			setInterval(checkQuota, 30000);
		}
	};

	return (
		<html lang="en">
			<head>
				<title>Clinical Decision Support System</title>
				<meta name="description" content="LLM-powered clinical decision support for resource-limited settings" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#667eea" />

				{/* CRITICAL: PWA meta tags for better persistence */}
				<meta name="application-name" content="ATLAS Clinical" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="ATLAS Clinical" />
				<meta name="mobile-web-app-capable" content="yes" />
				<meta name="format-detection" content="telephone=no" />

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