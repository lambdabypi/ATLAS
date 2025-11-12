'use client';
// src/components/ui/CacheDebugger.jsx

import { useState, useEffect } from 'react';

export default function CacheDebugger() {
	const [debugInfo, setDebugInfo] = useState({
		swStatus: 'checking...',
		caches: {},
		lastTest: null,
		logs: []
	});

	const addLog = (message) => {
		setDebugInfo(prev => ({
			...prev,
			logs: [...prev.logs.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]
		}));
	};

	useEffect(() => {
		checkServiceWorker();
		interceptFetch();
	}, []);

	const checkServiceWorker = async () => {
		if (!('serviceWorker' in navigator)) {
			setDebugInfo(prev => ({ ...prev, swStatus: '❌ Not supported' }));
			return;
		}

		try {
			const registrations = await navigator.serviceWorker.getRegistrations();
			addLog(`Found ${registrations.length} SW registrations`);

			for (const reg of registrations) {
				addLog(`SW scope: ${reg.scope}`);
			}

			const ready = await navigator.serviceWorker.ready;
			setDebugInfo(prev => ({
				...prev,
				swStatus: ready.active ? '✅ Active' : '⏳ Installing'
			}));

			await checkCaches();

		} catch (error) {
			setDebugInfo(prev => ({ ...prev, swStatus: `❌ Error: ${error.message}` }));
		}
	};

	const checkCaches = async () => {
		try {
			const cacheNames = await caches.keys();
			const cacheData = {};

			addLog(`Found ${cacheNames.length} caches`);

			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();
				cacheData[cacheName] = {
					count: keys.length,
					urls: keys.map(req => req.url).slice(0, 5)
				};
				addLog(`Cache "${cacheName}": ${keys.length} entries`);
			}

			setDebugInfo(prev => ({ ...prev, caches: cacheData }));
		} catch (error) {
			addLog(`Cache check failed: ${error.message}`);
		}
	};

	// Intercept fetch requests to see what's happening
	const interceptFetch = () => {
		const originalFetch = window.fetch;
		let intercepted = false;

		if (!intercepted) {
			window.fetch = async (...args) => {
				const url = args[0];
				addLog(`🌐 Fetch: ${typeof url === 'string' ? url.split('/').slice(-2).join('/') : 'Request object'}`);

				try {
					const response = await originalFetch(...args);
					addLog(`✅ Response: ${response.status} ${response.ok ? 'OK' : 'Failed'}`);
					return response;
				} catch (error) {
					addLog(`❌ Fetch failed: ${error.message}`);
					throw error;
				}
			};
			intercepted = true;
			addLog('🎯 Fetch interceptor enabled');
		}
	};

	const testCurrentPage = async () => {
		try {
			addLog('🧪 Testing current page caching...');

			// Try to cache current page manually
			const cache = await caches.open('atlas-manual-test');
			await cache.add(new Request(window.location.href, { cache: 'reload' }));
			addLog('✅ Current page cached manually');

			// Test if we can retrieve it
			const cached = await cache.match(window.location.href);
			addLog(cached ? '✅ Page retrieved from cache' : '❌ Page not found in cache');

			await checkCaches();
			setDebugInfo(prev => ({ ...prev, lastTest: new Date().toLocaleTimeString() }));

		} catch (error) {
			addLog(`❌ Test failed: ${error.message}`);
		}
	};

	const visitPatientsPage = () => {
		addLog('🚀 Navigating to /patients/1...');
		window.location.href = '/patients/1';
	};

	const clearCaches = async () => {
		try {
			const cacheNames = await caches.keys();
			for (const name of cacheNames) {
				await caches.delete(name);
			}
			addLog('🗑️ All caches cleared');
			await checkCaches();
		} catch (error) {
			addLog(`❌ Clear failed: ${error.message}`);
		}
	};

	return (
		<div className="fixed top-4 right-4 w-80 max-h-96 bg-white border shadow-lg rounded p-3 text-xs font-mono overflow-y-auto z-50">
			<div className="flex justify-between items-center mb-2">
				<h3 className="font-bold">🔍 Cache Debugger</h3>
				<div className={`px-2 py-1 rounded text-xs ${navigator.onLine ? 'bg-green-100' : 'bg-red-100'}`}>
					{navigator.onLine ? '🌐' : '📱'}
				</div>
			</div>

			{/* Service Worker Status */}
			<div className="mb-2 p-2 bg-gray-50 rounded">
				<div><strong>SW:</strong> {debugInfo.swStatus}</div>
			</div>

			{/* Caches */}
			<div className="mb-2 p-2 bg-blue-50 rounded">
				<div><strong>Caches ({Object.keys(debugInfo.caches).length}):</strong></div>
				{Object.entries(debugInfo.caches).map(([name, info]) => (
					<div key={name} className="ml-2">
						<div className="font-semibold truncate">{name.split('-').slice(-1)[0]}: {info.count}</div>
						{info.urls.slice(0, 2).map((url, i) => (
							<div key={i} className="text-gray-600 truncate ml-2">
								{new URL(url).pathname}
							</div>
						))}
					</div>
				))}
			</div>

			{/* Controls */}
			<div className="space-y-1 mb-2">
				<button onClick={testCurrentPage} className="w-full px-2 py-1 bg-green-500 text-white rounded text-xs">
					🧪 Test Cache Current Page
				</button>
				<button onClick={visitPatientsPage} className="w-full px-2 py-1 bg-blue-500 text-white rounded text-xs">
					🚀 Go to /patients/1
				</button>
				<button onClick={checkCaches} className="w-full px-2 py-1 bg-yellow-500 text-white rounded text-xs">
					🔄 Refresh Cache Info
				</button>
				<button onClick={clearCaches} className="w-full px-2 py-1 bg-red-500 text-white rounded text-xs">
					🗑️ Clear All Caches
				</button>
			</div>

			{/* Logs */}
			<div className="bg-black text-green-400 p-2 rounded text-xs">
				<div className="font-bold mb-1">Logs:</div>
				{debugInfo.logs.slice(-8).map((log, i) => (
					<div key={i} className="truncate">{log}</div>
				))}
			</div>
		</div>
	);
}