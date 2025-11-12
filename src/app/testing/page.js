'use client';
// src/app/testing/page.js

import { useState, useEffect } from 'react';
import CacheDebugger from '../../components/ui/CacheDebugger';

export default function TestingPage() {
	const [pageData, setPageData] = useState({
		online: navigator?.onLine ?? true,
		swSupported: 'serviceWorker' in navigator,
		cacheSupported: 'caches' in window
	});

	useEffect(() => {
		const updateOnlineStatus = () => {
			setPageData(prev => ({ ...prev, online: navigator.onLine }));
		};

		window.addEventListener('online', updateOnlineStatus);
		window.addEventListener('offline', updateOnlineStatus);

		return () => {
			window.removeEventListener('online', updateOnlineStatus);
			window.removeEventListener('offline', updateOnlineStatus);
		};
	}, []);

	const testOfflineScenarios = [
		{
			name: 'Visit patients while online',
			description: 'Go to /patients/1 to cache it for offline access',
			action: () => window.location.href = '/patients/1'
		},
		{
			name: 'Visit dashboard',
			description: 'Cache the dashboard page',
			action: () => window.location.href = '/dashboard'
		},
		{
			name: 'Test consultation page',
			description: 'Cache consultation for offline access',
			action: () => window.location.href = '/consultation'
		}
	];

	return (
		<div className="container mx-auto p-6 max-w-4xl">
			{/* Debug Component */}
			<CacheDebugger />

			<div className="space-y-8">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						🔬 ATLAS Testing & Debug Center
					</h1>
					<p className="text-lg text-gray-600">
						Test offline functionality and debug caching issues
					</p>
				</div>

				{/* Status Cards */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-3 h-3 rounded-full ${pageData.online ? 'bg-green-500' : 'bg-red-500'}`}></div>
							<h3 className="font-semibold">Network Status</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.online ? '🌐 Online' : '📱 Offline'}
						</p>
						<p className="text-sm text-gray-600">
							{pageData.online ? 'Connected to internet' : 'Using cached content'}
						</p>
					</div>

					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-3 h-3 rounded-full ${pageData.swSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
							<h3 className="font-semibold">Service Worker</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.swSupported ? '✅ Supported' : '❌ Not Supported'}
						</p>
						<p className="text-sm text-gray-600">
							Required for offline functionality
						</p>
					</div>

					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-3 h-3 rounded-full ${pageData.cacheSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
							<h3 className="font-semibold">Cache API</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.cacheSupported ? '✅ Supported' : '❌ Not Supported'}
						</p>
						<p className="text-sm text-gray-600">
							Stores offline content
						</p>
					</div>
				</div>

				{/* Testing Instructions */}
				<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
					<h3 className="text-lg font-semibold text-blue-900 mb-4">
						📋 Offline Testing Instructions
					</h3>
					<div className="space-y-3 text-blue-800">
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
							<p>While ONLINE: Use the debug panel or buttons below to visit pages you want to cache</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
							<p>Watch the debug panel logs to see if caching is working</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
							<p>Go OFFLINE: Open Chrome DevTools → Network → Set to "Offline"</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
							<p>Try visiting the cached pages - they should work offline!</p>
						</div>
					</div>
				</div>

				{/* Test Scenarios */}
				<div className="bg-white rounded-lg p-6 border">
					<h3 className="text-lg font-semibold mb-4">🚀 Quick Test Scenarios</h3>
					<div className="grid gap-4">
						{testOfflineScenarios.map((scenario, index) => (
							<div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
								<div>
									<h4 className="font-medium text-gray-900">{scenario.name}</h4>
									<p className="text-sm text-gray-600">{scenario.description}</p>
								</div>
								<button
									onClick={scenario.action}
									className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
								>
									Run Test
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Console Log Guide */}
				<div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
					<h3 className="text-lg font-semibold text-yellow-900 mb-4">
						👀 What to Look For in Console
					</h3>
					<div className="space-y-2 text-yellow-800 text-sm">
						<div className="flex items-center gap-2">
							<span className="text-green-600">✅</span>
							<code className="bg-white px-2 py-1 rounded">Service Worker registered successfully</code>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-green-600">✅</span>
							<code className="bg-white px-2 py-1 rounded">Available caches: [array of cache names]</code>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-green-600">✅</span>
							<code className="bg-white px-2 py-1 rounded">Manually cached: /patients/1</code>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-red-600">❌</span>
							<code className="bg-white px-2 py-1 rounded">Service Worker registration failed</code>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-red-600">❌</span>
							<code className="bg-white px-2 py-1 rounded">Cache test failed</code>
						</div>
					</div>
				</div>

				{/* Manual Cache Control */}
				<div className="bg-white rounded-lg p-6 border">
					<h3 className="text-lg font-semibold mb-4">🔧 Manual Cache Controls</h3>
					<p className="text-gray-600 mb-4">
						If automatic caching isn't working, use these manual controls:
					</p>
					<div className="flex gap-4 flex-wrap">
						<button
							onClick={() => {
								if ('caches' in window) {
									caches.open('atlas-manual-test').then(cache => {
										cache.add(window.location.href).then(() => {
											alert('Current page cached manually!');
										});
									});
								}
							}}
							className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
						>
							Cache This Page
						</button>

						<button
							onClick={() => {
								if ('caches' in window) {
									caches.keys().then(cacheNames => {
										console.log('Available caches:', cacheNames);
										alert(`Found ${cacheNames.length} caches. Check console for details.`);
									});
								}
							}}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
						>
							List All Caches
						</button>

						<button
							onClick={() => {
								if ('caches' in window) {
									caches.keys().then(cacheNames => {
										return Promise.all(cacheNames.map(name => caches.delete(name)));
									}).then(() => {
										alert('All caches cleared!');
									});
								}
							}}
							className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						>
							Clear All Caches
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}