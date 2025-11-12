// src/app/layout.js - FIXED CACHE TIMING
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	// FIXED: Manual cache with proper online/offline detection
	useEffect(() => {
		const manualCache = async () => {
			// CRITICAL: Only run if online AND cache available
			if (!('caches' in window) || !navigator.onLine) {
				console.log('⚠️ Skipping manual cache - offline or not supported');
				return;
			}

			try {
				console.log('🔧 Starting manual cache backup (online)...');

				const cache = await caches.open('atlas-manual-v1');

				const urlsToCache = [
					'/',
					'/dashboard',
					'/patients',
					'/patients/1',
					'/patients/2',
					'/consultation',
					'/consultation/new',
					'/reference',
					'/testing'
				];

				let successCount = 0;

				for (const url of urlsToCache) {
					try {
						const fullUrl = window.location.origin + url;

						// FIXED: Check if already cached to avoid unnecessary requests
						const cachedResponse = await cache.match(fullUrl);
						if (cachedResponse) {
							console.log('✅ Already cached:', url);
							successCount++;
							continue;
						}

						await cache.add(new Request(fullUrl));
						console.log('✅ Manually cached:', url);
						successCount++;
					} catch (err) {
						console.warn('⚠️ Failed to cache:', url, err.message);
					}
				}

				console.log(`🎉 Manual caching complete! ${successCount}/${urlsToCache.length} URLs cached`);

			} catch (error) {
				console.error('❌ Manual cache failed:', error);
			}
		};

		// FIXED: Better online event handling
		const handleOnline = () => {
			console.log('🌐 Back online - refreshing caches...');
			// Wait a moment for connection to stabilize
			setTimeout(manualCache, 1000);
		};

		const handleOffline = () => {
			console.log('📱 Gone offline - manual cache paused');
		};

		// Initial cache only if online
		if (typeof window !== 'undefined') {
			if (navigator.onLine) {
				// Delay initial cache to let page load first
				setTimeout(manualCache, 2000);
			}

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