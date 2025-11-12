// components/ui/AtlasDebugger.jsx - Debug Tool for Caching Issues
'use client';

import { useState, useEffect } from 'react';
import { Button } from './Button';
import { Card } from './Card';

const AtlasDebugger = () => {
	const [debugData, setDebugData] = useState({
		caches: {},
		storage: {},
		serviceWorker: {},
		network: {},
		persistence: {}
	});
	const [isLoading, setIsLoading] = useState(false);
	const [testResults, setTestResults] = useState([]);

	// Run comprehensive diagnostics
	const runDiagnostics = async () => {
		setIsLoading(true);
		const results = [];

		try {
			// 1. Test Cache API
			console.log('🔍 Testing Cache API...');
			const cacheData = await testCacheAPI();
			results.push({ test: 'Cache API', status: cacheData.working ? 'PASS' : 'FAIL', details: cacheData });

			// 2. Test Service Worker
			console.log('🔍 Testing Service Worker...');
			const swData = await testServiceWorker();
			results.push({ test: 'Service Worker', status: swData.working ? 'PASS' : 'FAIL', details: swData });

			// 3. Test Storage Persistence
			console.log('🔍 Testing Storage Persistence...');
			const persistenceData = await testStoragePersistence();
			results.push({ test: 'Storage Persistence', status: persistenceData.persistent ? 'PASS' : 'WARN', details: persistenceData });

			// 4. Test Critical URLs
			console.log('🔍 Testing Critical URLs...');
			const urlData = await testCriticalUrls();
			results.push({ test: 'Critical URLs', status: urlData.allCached ? 'PASS' : 'FAIL', details: urlData });

			// 5. Test IndexedDB
			console.log('🔍 Testing IndexedDB...');
			const idbData = await testIndexedDB();
			results.push({ test: 'IndexedDB', status: idbData.working ? 'PASS' : 'FAIL', details: idbData });

			setDebugData({
				caches: cacheData,
				serviceWorker: swData,
				persistence: persistenceData,
				criticalUrls: urlData,
				indexedDB: idbData
			});

			setTestResults(results);

		} catch (error) {
			console.error('Diagnostics failed:', error);
			results.push({ test: 'Diagnostics', status: 'ERROR', details: { error: error.message } });
			setTestResults(results);
		}

		setIsLoading(false);
	};

	// Test Cache API
	const testCacheAPI = async () => {
		try {
			if (!('caches' in window)) {
				return { working: false, error: 'Cache API not supported' };
			}

			const cacheNames = await caches.keys();
			const cacheData = {};

			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const requests = await cache.keys();
				cacheData[cacheName] = {
					entries: requests.length,
					urls: requests.map(req => req.url)
				};
			}

			// Check for our critical cache
			const criticalCache = await caches.open('atlas-critical-v1');
			const criticalUrls = await criticalCache.keys();

			const criticalUrlsMap = criticalUrls.map(req => req.url);
			const hasConsultationUrl = criticalUrlsMap.some(url => url.includes('/consultation/new?patientId=1'));

			return {
				working: true,
				cacheNames,
				cacheData,
				criticalCacheSize: criticalUrls.length,
				hasConsultationUrl,
				criticalUrls: criticalUrlsMap
			};

		} catch (error) {
			return { working: false, error: error.message };
		}
	};

	// Test Service Worker
	const testServiceWorker = async () => {
		try {
			if (!('serviceWorker' in navigator)) {
				return { working: false, error: 'Service Worker not supported' };
			}

			const registration = await navigator.serviceWorker.getRegistration();

			if (!registration) {
				return { working: false, error: 'No service worker registered' };
			}

			const sw = registration.active || registration.waiting || registration.installing;

			return {
				working: !!sw,
				scope: registration.scope,
				state: sw?.state,
				scriptURL: sw?.scriptURL,
				updateViaCache: registration.updateViaCache,
				hasActive: !!registration.active,
				hasWaiting: !!registration.waiting,
				hasInstalling: !!registration.installing
			};

		} catch (error) {
			return { working: false, error: error.message };
		}
	};

	// Test Storage Persistence
	const testStoragePersistence = async () => {
		try {
			if (!('storage' in navigator)) {
				return { persistent: false, error: 'Storage API not supported' };
			}

			const persistent = await navigator.storage.persist?.() || false;
			const estimate = await navigator.storage.estimate?.() || {};

			return {
				persistent,
				quota: estimate.quota,
				usage: estimate.usage,
				quotaMB: Math.round((estimate.quota || 0) / 1024 / 1024),
				usageMB: Math.round((estimate.usage || 0) / 1024 / 1024),
				percentageUsed: estimate.quota ? Math.round((estimate.usage / estimate.quota) * 100) : 0
			};

		} catch (error) {
			return { persistent: false, error: error.message };
		}
	};

	// Test Critical URLs
	const testCriticalUrls = async () => {
		const criticalUrls = [
			'/consultation/new?patientId=1',
			'/consultation/new?patientId=2',
			'/consultation/new',
			'/dashboard',
			'/patients'
		];

		const results = {};
		let cachedCount = 0;

		try {
			const cache = await caches.open('atlas-critical-v1');

			for (const url of criticalUrls) {
				const fullUrl = window.location.origin + url;
				const cached = await cache.match(fullUrl);
				results[url] = !!cached;
				if (cached) cachedCount++;
			}

			return {
				allCached: cachedCount === criticalUrls.length,
				cachedCount,
				totalCount: criticalUrls.length,
				results,
				percentageCached: Math.round((cachedCount / criticalUrls.length) * 100)
			};

		} catch (error) {
			return { allCached: false, error: error.message };
		}
	};

	// Test IndexedDB
	const testIndexedDB = async () => {
		try {
			if (!('indexedDB' in window)) {
				return { working: false, error: 'IndexedDB not supported' };
			}

			// Test basic IndexedDB operations
			const request = indexedDB.open('atlas-test', 1);

			return new Promise((resolve) => {
				request.onsuccess = () => {
					const db = request.result;
					db.close();
					indexedDB.deleteDatabase('atlas-test');
					resolve({ working: true, version: db.version });
				};

				request.onerror = () => {
					resolve({ working: false, error: request.error?.message || 'IndexedDB test failed' });
				};

				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					db.createObjectStore('test');
				};
			});

		} catch (error) {
			return { working: false, error: error.message };
		}
	};

	// Force cache the critical URL
	const forceCacheConsultationUrl = async () => {
		setIsLoading(true);
		try {
			const url = '/consultation/new?patientId=1';
			const fullUrl = window.location.origin + url;

			console.log('🔧 Force caching:', fullUrl);

			const cache = await caches.open('atlas-critical-v1');

			// Try to fetch and cache
			const response = await fetch(fullUrl, { cache: 'no-cache' });

			if (response.ok) {
				await cache.put(fullUrl, response);
				console.log('✅ Successfully cached:', url);

				// Verify it's cached
				const cached = await cache.match(fullUrl);
				if (cached) {
					console.log('✅ Verified cached:', url);
					alert('✅ Successfully cached /consultation/new?patientId=1');
				} else {
					console.error('❌ Failed to verify cache:', url);
					alert('❌ Failed to verify cache');
				}
			} else {
				console.error('❌ Bad response:', response.status);
				alert('❌ Bad response: ' + response.status);
			}

			// Re-run diagnostics
			await runDiagnostics();

		} catch (error) {
			console.error('❌ Force cache failed:', error);
			alert('❌ Force cache failed: ' + error.message);
		}
		setIsLoading(false);
	};

	// Clear all caches
	const clearAllCaches = async () => {
		setIsLoading(true);
		try {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map(name => caches.delete(name)));
			console.log('🗑️ Cleared all caches');
			alert('✅ Cleared all caches');
			await runDiagnostics();
		} catch (error) {
			console.error('❌ Clear caches failed:', error);
			alert('❌ Clear caches failed: ' + error.message);
		}
		setIsLoading(false);
	};

	// Request persistent storage
	const requestPersistentStorage = async () => {
		try {
			if ('storage' in navigator && 'persist' in navigator.storage) {
				const persistent = await navigator.storage.persist();
				if (persistent) {
					alert('✅ Persistent storage granted!');
				} else {
					alert('⚠️ Persistent storage denied');
				}
				await runDiagnostics();
			} else {
				alert('❌ Persistent storage not supported');
			}
		} catch (error) {
			alert('❌ Request failed: ' + error.message);
		}
	};

	useEffect(() => {
		runDiagnostics();
	}, []);

	const getStatusIcon = (status) => {
		switch (status) {
			case 'PASS': return '✅';
			case 'WARN': return '⚠️';
			case 'FAIL': return '❌';
			case 'ERROR': return '💥';
			default: return '❓';
		}
	};

	return (
		<div className="p-6 max-w-4xl mx-auto">
			<div className="mb-6">
				<h1 className="text-2xl font-bold mb-2">🔍 ATLAS Cache & Storage Debugger</h1>
				<p className="text-gray-600">Diagnose caching and storage persistence issues</p>
			</div>

			{/* Action Buttons */}
			<div className="mb-6 space-x-4">
				<Button
					onClick={runDiagnostics}
					disabled={isLoading}
					className="bg-blue-600 hover:bg-blue-700"
				>
					{isLoading ? '⏳ Running...' : '🔍 Run Diagnostics'}
				</Button>

				<Button
					onClick={forceCacheConsultationUrl}
					disabled={isLoading}
					className="bg-green-600 hover:bg-green-700"
				>
					🔧 Force Cache Consultation URL
				</Button>

				<Button
					onClick={requestPersistentStorage}
					disabled={isLoading}
					className="bg-purple-600 hover:bg-purple-700"
				>
					🛡️ Request Persistent Storage
				</Button>

				<Button
					onClick={clearAllCaches}
					disabled={isLoading}
					className="bg-red-600 hover:bg-red-700"
				>
					🗑️ Clear All Caches
				</Button>
			</div>

			{/* Test Results */}
			{testResults.length > 0 && (
				<Card className="mb-6">
					<h2 className="text-xl font-semibold mb-4">📊 Diagnostic Results</h2>
					<div className="space-y-2">
						{testResults.map((result, index) => (
							<div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
								<span className="font-medium">{result.test}</span>
								<span className="flex items-center gap-2">
									{getStatusIcon(result.status)}
									<span className="font-mono text-sm">{result.status}</span>
								</span>
							</div>
						))}
					</div>
				</Card>
			)}

			{/* Critical URL Status */}
			{debugData.criticalUrls && (
				<Card className="mb-6">
					<h2 className="text-xl font-semibold mb-4">🎯 Critical URL Cache Status</h2>
					<div className="mb-4 p-3 bg-gray-50 rounded">
						<strong>Cached: {debugData.criticalUrls.cachedCount}/{debugData.criticalUrls.totalCount}</strong>
						<span className="ml-2 text-sm">({debugData.criticalUrls.percentageCached}%)</span>
					</div>
					{debugData.criticalUrls.results && (
						<div className="space-y-2">
							{Object.entries(debugData.criticalUrls.results).map(([url, cached]) => (
								<div key={url} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
									<code className="font-mono">{url}</code>
									<span className={`font-semibold ${cached ? 'text-green-600' : 'text-red-600'}`}>
										{cached ? '✅ CACHED' : '❌ NOT CACHED'}
									</span>
								</div>
							))}
						</div>
					)}
				</Card>
			)}

			{/* Storage Persistence */}
			{debugData.persistence && (
				<Card className="mb-6">
					<h2 className="text-xl font-semibold mb-4">🛡️ Storage Persistence</h2>
					<div className="grid grid-cols-2 gap-4">
						<div className="p-3 bg-gray-50 rounded">
							<div className="font-semibold">Persistent Storage</div>
							<div className={`text-lg ${debugData.persistence.persistent ? 'text-green-600' : 'text-red-600'}`}>
								{debugData.persistence.persistent ? '✅ GRANTED' : '❌ DENIED'}
							</div>
						</div>
						<div className="p-3 bg-gray-50 rounded">
							<div className="font-semibold">Storage Usage</div>
							<div className="text-lg">
								{debugData.persistence.usageMB}MB / {debugData.persistence.quotaMB}MB
								<div className="text-sm text-gray-600">({debugData.persistence.percentageUsed}% used)</div>
							</div>
						</div>
					</div>
				</Card>
			)}

			{/* Raw Debug Data */}
			<Card>
				<h2 className="text-xl font-semibold mb-4">🔧 Raw Debug Data</h2>
				<pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
					{JSON.stringify(debugData, null, 2)}
				</pre>
			</Card>
		</div>
	);
};

export default AtlasDebugger;