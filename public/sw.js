// Import Workbox if available, otherwise use manual caching
if (typeof importScripts === 'function') {
	try {
		importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');
	} catch (e) {
		console.log('Workbox not available, using manual caching');
	}
}

const CACHE_NAME = 'atlas-v1';
const DYNAMIC_CACHE = 'atlas-dynamic-v1';
const API_CACHE = 'atlas-api-v1';

// Assets to precache
const PRECACHE_ASSETS = [
	'/',
	'/dashboard/',
	'/patients/',
	'/consultation/',
	'/reference/',
	'/testing/',
	'/offline.html',
	'/manifest.json'
];

// Install event - precache assets
self.addEventListener('install', (event) => {
	console.log('🔧 Service Worker installing...');

	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => {
				console.log('📦 Precaching assets...');
				return cache.addAll(PRECACHE_ASSETS);
			})
			.then(() => {
				console.log('✅ Precaching complete');
				return self.skipWaiting(); // Activate immediately
			})
			.catch(error => {
				console.error('❌ Precaching failed:', error);
			})
	);
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
	console.log('🚀 Service Worker activating...');

	event.waitUntil(
		caches.keys()
			.then(cacheNames => {
				return Promise.all(
					cacheNames.map(cacheName => {
						if (cacheName !== CACHE_NAME &&
							cacheName !== DYNAMIC_CACHE &&
							cacheName !== API_CACHE) {
							console.log('🗑️ Deleting old cache:', cacheName);
							return caches.delete(cacheName);
						}
					})
				);
			})
			.then(() => {
				console.log('✅ Service Worker activated');
				return self.clients.claim(); // Take control immediately
			})
	);
});

// Fetch event - handle all requests
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET requests and chrome-extension
	if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
		return;
	}

	// Handle RSC requests specially
	if (url.searchParams.has('_rsc')) {
		event.respondWith(handleRSCRequest(request));
		return;
	}

	// Handle API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(handleAPIRequest(request));
		return;
	}

	// Handle navigation requests
	if (request.mode === 'navigate') {
		event.respondWith(handleNavigationRequest(request));
		return;
	}

	// Handle all other requests
	event.respondWith(handleGeneralRequest(request));
});

// RSC Request Handler - Always try network first, fallback gracefully
async function handleRSCRequest(request) {
	try {
		console.log('🔄 RSC Request:', request.url);

		// Try network with short timeout
		const networkResponse = await fetch(request, {
			signal: AbortSignal.timeout(3000)
		});

		if (networkResponse.ok) {
			return networkResponse;
		}

		throw new Error('Network response not ok');

	} catch (error) {
		console.log('⚠️ RSC fallback for:', request.url);

		// Return minimal RSC response that won't break Next.js
		return new Response('null', {
			status: 200,
			headers: {
				'Content-Type': 'text/x-component',
				'Cache-Control': 'no-cache'
			}
		});
	}
}

// API Request Handler - NetworkFirst with cache fallback
async function handleAPIRequest(request) {
	const cache = await caches.open(API_CACHE);

	try {
		// Try network first
		const networkResponse = await fetch(request, {
			signal: AbortSignal.timeout(5000)
		});

		if (networkResponse.ok) {
			// Cache successful responses
			cache.put(request, networkResponse.clone());
			return networkResponse;
		}

		throw new Error('API request failed');

	} catch (error) {
		console.log('📱 API cache fallback for:', request.url);

		// Try cache
		const cachedResponse = await cache.match(request);
		if (cachedResponse) {
			return cachedResponse;
		}

		// Return offline API response
		return new Response(
			JSON.stringify({
				error: 'offline',
				message: 'This feature requires an internet connection',
				data: null
			}),
			{
				status: 503,
				headers: { 'Content-Type': 'application/json' }
			}
		);
	}
}

// Navigation Request Handler - CacheFirst with network fallback
async function handleNavigationRequest(request) {
	const cache = await caches.open(CACHE_NAME);

	// Try cache first for instant loading
	const cachedResponse = await cache.match(request);
	if (cachedResponse) {
		console.log('⚡ Serving cached page:', request.url);

		// Update cache in background if online
		if (navigator.onLine) {
			fetch(request).then(response => {
				if (response.ok) {
					cache.put(request, response);
				}
			}).catch(() => {
				// Silent fail for background update
			});
		}

		return cachedResponse;
	}

	// Try network if no cache
	try {
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
			return networkResponse;
		}

		throw new Error('Network response not ok');

	} catch (error) {
		console.log('🚫 Offline fallback for:', request.url);

		// Return offline page
		const offlineResponse = await cache.match('/offline.html');
		return offlineResponse || new Response('Offline - Page not available', {
			status: 503,
			headers: { 'Content-Type': 'text/html' }
		});
	}
}

// General Request Handler - CacheFirst for assets
async function handleGeneralRequest(request) {
	const cache = await caches.open(DYNAMIC_CACHE);

	// Try cache first
	const cachedResponse = await cache.match(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	// Try network and cache
	try {
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			cache.put(request, networkResponse.clone());
		}

		return networkResponse;

	} catch (error) {
		// Return 503 for failed requests
		return new Response('Resource not available offline', {
			status: 503,
			statusText: 'Service Unavailable'
		});
	}
}

// Message handling for debugging
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_CACHE_INFO') {
		getCacheInfo().then(info => {
			event.ports[0].postMessage(info);
		});
	}
});

async function getCacheInfo() {
	const cacheNames = await caches.keys();
	const info = {};

	for (const cacheName of cacheNames) {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		info[cacheName] = {
			count: keys.length,
			entries: keys.slice(0, 5).map(key => key.url) // Only first 5
		};
	}

	return info;
}