// src/app/layout.js - ENHANCED Manual Cache with Query Params
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	useEffect(() => {
		const enhancedManualCache = async () => {
			if (!('caches' in window) || !navigator.onLine) {
				console.log('⚠️ Skipping manual cache - offline or not supported');
				return;
			}

			try {
				console.log('🔧 Starting enhanced manual cache backup (online)...');

				const cache = await caches.open('atlas-manual-v2');

				// ENHANCED: Include common query parameter combinations
				const urlsToCache = [
					'/',
					'/dashboard',
					'/patients',
					'/patients/1',
					'/patients/2',
					'/consultation',
					'/consultation/new',
					'/consultation/new?patientId=1', // ADDED: Your specific failing URL
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

						// ENHANCED: Pre-fetch and cache
						const response = await fetch(fullUrl);
						if (response.ok) {
							await cache.put(fullUrl, response);
							console.log('✅ Manually cached:', url);
							successCount++;
						} else {
							console.warn('⚠️ Bad response for:', url, response.status);
						}
					} catch (err) {
						console.warn('⚠️ Failed to cache:', url, err.message);
					}
				}

				// CRITICAL: Also cache the current page if it has query params
				const currentUrl = window.location.href;
				if (currentUrl.includes('?')) {
					try {
						const cachedResponse = await cache.match(currentUrl);
						if (!cachedResponse) {
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

				console.log(`🎉 Enhanced manual caching complete! ${successCount} URLs cached`);

				// ENHANCED: Also pre-cache in service worker cache
				if ('serviceWorker' in navigator) {
					try {
						const registration = await navigator.serviceWorker.ready;
						if (registration.active) {
							registration.active.postMessage({
								type: 'PRECACHE_URLS',
								urls: urlsToCache
							});
						}
					} catch (err) {
						console.warn('⚠️ SW precache message failed:', err.message);
					}
				}

			} catch (error) {
				console.error('❌ Enhanced manual cache failed:', error);
			}
		};

		const handleOnline = () => {
			console.log('🌐 Back online - refreshing enhanced caches...');
			setTimeout(enhancedManualCache, 1000);
		};

		const handleOffline = () => {
			console.log('📱 Gone offline - enhanced cache paused');
		};

		// Initial cache only if online
		if (typeof window !== 'undefined') {
			if (navigator.onLine) {
				// Delay initial cache to let page load first
				setTimeout(enhancedManualCache, 2000);
			}

			window.addEventListener('online', handleOnline);
			window.addEventListener('offline', handleOffline);

			// ENHANCED: Cache pages as user navigates
			const cacheCurrentPageOnNavigation = () => {
				if (navigator.onLine && 'caches' in window) {
					caches.open('atlas-manual-v2').then(cache => {
						cache.put(window.location.href, new Response()).catch(() => {
							// Silent fail for navigation cache
						});
					});
				}
			};

			// Cache page on navigation
			window.addEventListener('beforeunload', cacheCurrentPageOnNavigation);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('online', handleOnline);
				window.removeEventListener('offline', handleOffline);
				window.removeEventListener('beforeunload', cacheCurrentPageOnNavigation);
			}
		};
	}, []);

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