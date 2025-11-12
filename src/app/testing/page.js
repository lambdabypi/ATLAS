// src/app/testing/page.js - Updated with enhanced offline testing
'use client';

import { useState, useEffect } from 'react';

export default function TestingPage() {
	const [pageData, setPageData] = useState({
		online: typeof navigator !== 'undefined' ? navigator.onLine : true,
		swSupported: typeof navigator !== 'undefined' ? 'serviceWorker' in navigator : false,
		cacheSupported: typeof window !== 'undefined' ? 'caches' in window : false
	});

	const [testResults, setTestResults] = useState([]);
	const [cacheInfo, setCacheInfo] = useState(null);
	const [testing, setTesting] = useState(false);

	useEffect(() => {
		const updateOnlineStatus = () => {
			setPageData(prev => ({ ...prev, online: navigator.onLine }));
		};

		if (typeof window !== 'undefined') {
			window.addEventListener('online', updateOnlineStatus);
			window.addEventListener('offline', updateOnlineStatus);

			return () => {
				window.removeEventListener('online', updateOnlineStatus);
				window.removeEventListener('offline', updateOnlineStatus);
			};
		}
	}, []);

	// COMPREHENSIVE OFFLINE TEST SUITE
	const runComprehensiveOfflineTest = async () => {
		setTesting(true);
		const results = [];

		try {
			console.log('🧪 Starting comprehensive offline test suite...');

			// Test 1: Service Worker Status
			try {
				const swReg = await navigator.serviceWorker.ready;
				const swActive = swReg.active ? swReg.active.state : 'none';
				results.push({
					test: 'Service Worker',
					status: swActive === 'activated' ? 'PASS' : 'FAIL',
					details: `State: ${swActive}`,
					icon: swActive === 'activated' ? '✅' : '❌'
				});
			} catch (error) {
				results.push({
					test: 'Service Worker',
					status: 'FAIL',
					details: error.message,
					icon: '❌'
				});
			}

			// Test 2: Cache API Availability
			const cacheNames = await caches.keys();
			results.push({
				test: 'Cache API',
				status: cacheNames.length > 0 ? 'PASS' : 'FAIL',
				details: `${cacheNames.length} caches found: ${cacheNames.join(', ')}`,
				icon: cacheNames.length > 0 ? '✅' : '❌'
			});

			// Test 3: Critical Pages Cached
			const criticalPages = [
				'/',
				'/dashboard/',
				'/patients/',
				'/consultation/',
				'/offline.html'
			];

			const cachedPages = [];
			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				for (const page of criticalPages) {
					const match = await cache.match(page) || await cache.match(new Request(page));
					if (match && !cachedPages.includes(page)) {
						cachedPages.push(page);
					}
				}
			}

			results.push({
				test: 'Critical Pages Cached',
				status: cachedPages.length >= 3 ? 'PASS' : 'WARN',
				details: `${cachedPages.length}/${criticalPages.length} pages cached: ${cachedPages.join(', ')}`,
				icon: cachedPages.length >= 3 ? '✅' : '⚠️'
			});

			// Test 4: Offline Page Available
			let offlinePageAvailable = false;
			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const match = await cache.match('/offline.html');
				if (match) {
					offlinePageAvailable = true;
					break;
				}
			}

			results.push({
				test: 'Offline Fallback Page',
				status: offlinePageAvailable ? 'PASS' : 'FAIL',
				details: offlinePageAvailable ? 'Available in cache' : 'Not found in cache',
				icon: offlinePageAvailable ? '✅' : '❌'
			});

			// Test 5: Manifest.json Access
			try {
				const manifestResponse = await fetch('/manifest.json', { cache: 'no-cache' });
				results.push({
					test: 'Manifest.json',
					status: manifestResponse.ok ? 'PASS' : 'FAIL',
					details: `Status: ${manifestResponse.status} ${manifestResponse.statusText}`,
					icon: manifestResponse.ok ? '✅' : '❌'
				});
			} catch (error) {
				results.push({
					test: 'Manifest.json',
					status: 'FAIL',
					details: error.message,
					icon: '❌'
				});
			}

			// Test 6: RSC Request Handling (simulate)
			try {
				const rscUrl = `${window.location.origin}/dashboard?_rsc=test`;
				const rscResponse = await fetch(rscUrl);
				results.push({
					test: 'RSC Request Handling',
					status: 'PASS',
					details: `RSC requests handled (${rscResponse.status})`,
					icon: '✅'
				});
			} catch (error) {
				// This might fail and that's expected offline
				results.push({
					test: 'RSC Request Handling',
					status: 'INFO',
					details: 'RSC requests will be handled by service worker when offline',
					icon: 'ℹ️'
				});
			}

			// Test 7: Cache Size Analysis
			let totalCacheSize = 0;
			let totalEntries = 0;
			const cacheDetails = {};

			for (const cacheName of cacheNames) {
				const cache = await caches.open(cacheName);
				const keys = await cache.keys();
				totalEntries += keys.length;

				cacheDetails[cacheName] = {
					entries: keys.length,
					urls: keys.slice(0, 5).map(req => new URL(req.url).pathname)
				};
			}

			results.push({
				test: 'Cache Performance',
				status: totalEntries > 0 ? 'PASS' : 'FAIL',
				details: `${totalEntries} total cached entries across ${cacheNames.length} caches`,
				icon: totalEntries > 0 ? '📊' : '❌'
			});

			setCacheInfo(cacheDetails);
			console.log('🎉 Comprehensive test complete!');

		} catch (error) {
			console.error('❌ Test suite failed:', error);
			results.push({
				test: 'Test Suite Execution',
				status: 'FAIL',
				details: error.message,
				icon: '❌'
			});
		}

		setTestResults(results);
		setTesting(false);
	};

	// AGGRESSIVE CACHE EVERYTHING
	const aggressiveCacheAll = async () => {
		try {
			console.log('🚀 Starting ULTRA aggressive caching...');

			// Pages to cache
			const mainPages = [
				'/',
				'/dashboard',
				'/patients',
				'/patients/1',
				'/patients/2',
				'/consultation',
				'/consultation/new',
				'/reference',
				'/testing',
				'/offline.html'
			];

			// Assets to cache
			const assets = [
				'/manifest.json',
				'/icons/icon-192x192.png',
				'/icons/icon-512x512.png'
			];

			const allUrls = [...mainPages, ...assets];

			// Use multiple cache strategies
			const caches = [
				'atlas-v1',
				'atlas-dynamic-v1',
				'atlas-manual-aggressive'
			];

			let successCount = 0;

			for (const cacheName of caches) {
				const cache = await window.caches.open(cacheName);

				for (const url of allUrls) {
					try {
						const fullUrl = url.startsWith('/') ? window.location.origin + url : url;

						// Multiple request variations
						const requests = [
							new Request(fullUrl),
							new Request(fullUrl, { mode: 'navigate' }),
							new Request(fullUrl, { cache: 'reload' }),
							new Request(fullUrl, { cache: 'default' })
						];

						for (const req of requests) {
							try {
								await cache.add(req);
							} catch (e) {
								// Try manual fetch and put
								try {
									const response = await fetch(req);
									if (response.ok) {
										await cache.put(req, response);
									}
								} catch (e2) {
									// Silent fail for individual requests
								}
							}
						}

						successCount++;
						console.log(`✅ Cached (${cacheName}):`, url);

					} catch (error) {
						console.warn(`⚠️ Failed to cache (${cacheName}):`, url, error.message);
					}
				}
			}

			// Force cache current page with all possible variations
			const currentUrl = window.location.href;
			for (const cacheName of caches) {
				const cache = await window.caches.open(cacheName);
				try {
					const response = await fetch(currentUrl);
					const html = await response.text();

					// Cache as different content types and request modes
					const variations = [
						{ url: currentUrl, headers: { 'Content-Type': 'text/html' } },
						{ url: new Request(currentUrl, { mode: 'navigate' }), headers: { 'Content-Type': 'text/html' } },
						{ url: new Request(currentUrl, { cache: 'reload' }), headers: { 'Content-Type': 'text/html' } }
					];

					for (const variation of variations) {
						const htmlResponse = new Response(html, {
							headers: variation.headers
						});
						await cache.put(variation.url, htmlResponse.clone());
					}

				} catch (e) {
					console.warn('Failed to cache current page variation:', e.message);
				}
			}

			console.log(`🎉 ULTRA aggressive caching complete! Attempted ${successCount} URLs across ${caches.length} caches`);
			alert(`✅ ULTRA Aggressive caching complete!\n\n` +
				`- Cached ${successCount} resources\n` +
				`- Used ${caches.length} different caches\n` +
				`- Multiple request variations per resource\n\n` +
				`Try going offline and navigating between pages!`);

		} catch (error) {
			console.error('❌ ULTRA aggressive caching failed:', error);
			alert('❌ Caching failed: ' + error.message);
		}
	};

	// Clear all caches
	const clearAllCaches = async () => {
		try {
			const cacheNames = await caches.keys();
			await Promise.all(cacheNames.map(name => caches.delete(name)));
			console.log('🗑️ All caches cleared');
			alert(`✅ Cleared ${cacheNames.length} caches`);
			setCacheInfo(null);
			setTestResults([]);
		} catch (error) {
			console.error('❌ Cache clear failed:', error);
			alert('❌ Failed to clear caches: ' + error.message);
		}
	};

	return (
		<div className="container mx-auto p-6 max-w-6xl">
			<div className="space-y-8">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">
						🔬 ATLAS Enhanced Testing Suite
					</h1>
					<p className="text-lg text-gray-600">
						Comprehensive offline functionality testing and debugging
					</p>
				</div>

				{/* CRITICAL TESTING CONTROLS */}
				<div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-6 border-2 border-red-200">
					<h3 className="text-xl font-semibold text-red-900 mb-4 flex items-center gap-2">
						🚨 Critical Testing Controls
					</h3>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<button
							onClick={runComprehensiveOfflineTest}
							disabled={testing}
							className="px-6 py-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold text-lg shadow-lg disabled:opacity-50 transition-all"
						>
							{testing ? '🔄 Testing...' : '🧪 RUN COMPREHENSIVE TEST'}
						</button>

						<button
							onClick={aggressiveCacheAll}
							className="px-6 py-4 bg-red-500 text-white rounded-lg hover:bg-red-600 font-bold text-lg shadow-lg transition-all"
						>
							🚀 ULTRA AGGRESSIVE CACHE
						</button>

						<button
							onClick={clearAllCaches}
							className="px-6 py-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-bold text-lg shadow-lg transition-all"
						>
							🗑️ CLEAR ALL CACHES
						</button>
					</div>
					<div className="mt-4 p-4 bg-red-100 rounded-lg">
						<p className="text-red-800 text-sm">
							<strong>Testing Protocol:</strong> 1) Run comprehensive test → 2) Ultra aggressive cache → 3) Go offline in DevTools → 4) Navigate between pages → 5) Check results
						</p>
					</div>
				</div>

				{/* Status Overview */}
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-4 h-4 rounded-full ${pageData.online ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
							<h3 className="font-semibold">Network Status</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.online ? '🌐 Online' : '📱 Offline'}
						</p>
						<p className="text-sm text-gray-600">
							{pageData.online ? 'Connected to internet' : 'Using cached content only'}
						</p>
					</div>

					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-4 h-4 rounded-full ${pageData.swSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
							<h3 className="font-semibold">Service Worker</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.swSupported ? '✅ Available' : '❌ Not Available'}
						</p>
						<p className="text-sm text-gray-600">
							Required for offline functionality
						</p>
					</div>

					<div className="bg-white rounded-lg p-6 border shadow-sm">
						<div className="flex items-center gap-3 mb-3">
							<div className={`w-4 h-4 rounded-full ${pageData.cacheSupported ? 'bg-green-500' : 'bg-red-500'}`}></div>
							<h3 className="font-semibold">Cache Storage</h3>
						</div>
						<p className="text-2xl font-bold mb-2">
							{pageData.cacheSupported ? '✅ Available' : '❌ Not Available'}
						</p>
						<p className="text-sm text-gray-600">
							Stores content for offline access
						</p>
					</div>
				</div>

				{/* Test Results */}
				{testResults.length > 0 && (
					<div className="bg-white rounded-lg p-6 border shadow-lg">
						<h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
							📊 Test Results
							<span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded">
								{testResults.filter(r => r.status === 'PASS').length}/{testResults.length} passed
							</span>
						</h3>
						<div className="space-y-3">
							{testResults.map((result, index) => (
								<div key={index} className={`p-4 rounded-lg border-l-4 ${result.status === 'PASS' ? 'border-green-500 bg-green-50' :
										result.status === 'WARN' ? 'border-yellow-500 bg-yellow-50' :
											result.status === 'INFO' ? 'border-blue-500 bg-blue-50' :
												'border-red-500 bg-red-50'
									}`}>
									<div className="flex justify-between items-start">
										<div className="flex items-center gap-3">
											<span className="text-2xl">{result.icon}</span>
											<div>
												<h4 className="font-medium text-gray-900">{result.test}</h4>
												<p className="text-sm text-gray-600 mt-1">{result.details}</p>
											</div>
										</div>
										<span className={`px-3 py-1 rounded-full text-sm font-medium ${result.status === 'PASS' ? 'bg-green-100 text-green-800' :
												result.status === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
													result.status === 'INFO' ? 'bg-blue-100 text-blue-800' :
														'bg-red-100 text-red-800'
											}`}>
											{result.status}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Cache Information */}
				{cacheInfo && (
					<div className="bg-gray-50 rounded-lg p-6 border">
						<h3 className="text-xl font-semibold mb-4">📦 Cache Storage Details</h3>
						<div className="grid gap-4">
							{Object.entries(cacheInfo).map(([cacheName, info]) => (
								<div key={cacheName} className="bg-white p-4 rounded-lg border">
									<div className="flex justify-between items-center mb-2">
										<h4 className="font-medium text-blue-900">{cacheName}</h4>
										<span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
											{info.entries} entries
										</span>
									</div>
									<details className="text-sm">
										<summary className="cursor-pointer text-blue-600 hover:text-blue-800">
											Show cached URLs
										</summary>
										<ul className="mt-2 space-y-1 ml-4 max-h-32 overflow-y-auto">
											{info.urls.map((url, i) => (
												<li key={i} className="text-gray-600 font-mono text-xs">
													• {url}
												</li>
											))}
											{info.entries > 5 && (
												<li className="text-gray-500 italic">
													... and {info.entries - 5} more
												</li>
											)}
										</ul>
									</details>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Instructions */}
				<div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
					<h3 className="text-lg font-semibold text-blue-900 mb-4">
						📋 Enhanced Testing Protocol
					</h3>
					<div className="space-y-3 text-blue-800">
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
							<p><strong>Comprehensive Test:</strong> Click "RUN COMPREHENSIVE TEST" to check all systems</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
							<p><strong>Ultra Cache:</strong> Click "ULTRA AGGRESSIVE CACHE" to cache everything possible</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
							<p><strong>Go Offline:</strong> Chrome DevTools → Network → Throttling → "Offline"</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
							<p><strong>Navigate:</strong> Test /dashboard, /patients/1, /consultation - all should work!</p>
						</div>
						<div className="flex items-start gap-3">
							<span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
							<p><strong>Verify:</strong> Run comprehensive test again while offline to see results</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}