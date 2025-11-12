// src/app/layout.js
'use client';

import { useEffect } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import AppShell from '../components/layout/AppShell';
import '../styles/components.css';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
	// Manual cache fallback effect
	useEffect(() => {
		const manualCache = async () => {
			if ('caches' in window && navigator.onLine) {
				try {
					console.log('🔧 Starting manual cache backup...');

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

					for (const url of urlsToCache) {
						try {
							const fullUrl = window.location.origin + url;
							await cache.add(new Request(fullUrl));
							console.log('✅ Manually cached:', url);
						} catch (err) {
							console.warn('⚠️ Failed to cache:', url, err.message);
						}
					}

					console.log('🎉 Manual caching complete!');

				} catch (error) {
					console.error('❌ Manual cache failed:', error);
				}
			}
		};

		// Cache on load and when online
		const handleOnline = () => {
			console.log('🌐 Back online - refreshing caches...');
			manualCache();
		};

		// Initial cache
		if (typeof window !== 'undefined') {
			manualCache();
			window.addEventListener('online', handleOnline);
		}

		return () => {
			if (typeof window !== 'undefined') {
				window.removeEventListener('online', handleOnline);
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