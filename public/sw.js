// public/sw.js - Enhanced Service Worker with Storage Persistence
const CACHE_VERSION = 'atlas-v4';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_PAGE = '/offline.html';

// Files to cache immediately on install
const STATIC_ASSETS = [
	'/',
	'/dashboard',
	'/patients',
	'/consultation/new',
	'/reference',
	'/offline.html',
	'/manifest.json'
];

// Install event - cache critical assets immediately
self.addEventListener('install', (event) => {
	console.log('[SW] Installing service worker...', CACHE_VERSION);

	event.waitUntil(
		(async () => {
			try {
				// CRITICAL: Skip waiting to take control immediately
				self.skipWaiting();

				const cache = await caches.open(STATIC_CACHE);

				// Cache static assets with error handling
				const cachePromises = STATIC_ASSETS.map(async (url) => {
					try {
						const response = await fetch(url, { cache: 'no-cache' });
						if (response.ok) {
							await cache.put(url, response);
							console.log('[SW] Cached:', url);
						}
					} catch (error) {
						console.warn('[SW] Failed to cache:', url, error);
					}
				});

				await Promise.allSettled(cachePromises);
				console.log('[SW] Static assets cached');

			} catch (error) {
				console.error('[SW] Install failed:', error);
			}
		})()
	);
});

// Activate event - clean old caches and take control
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating service worker...', CACHE_VERSION);

	event.waitUntil(
		(async () => {
			try {
				// CRITICAL: Take control of all pages immediately
				await self.clients.claim();
				console.log('[SW] Claimed all pages');

				// Clean up old caches
				const cacheNames = await caches.keys();
				const deletePromises = cacheNames
					.filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
					.map(name => {
						console.log('[SW] Deleting old cache:', name);
						return caches.delete(name);
					});

				await Promise.all(deletePromises);
				console.log('[SW] Old caches cleaned');

			} catch (error) {
				console.error('[SW] Activation failed:', error);
			}
		})()
	);
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Only handle same-origin requests
	if (url.origin !== self.location.origin) {
		return;
	}

	// Handle different types of requests
	if (request.mode === 'navigate') {
		// HTML page requests
		event.respondWith(handleNavigationRequest(request));
	} else if (url.pathname.startsWith('/api/')) {
		// API requests
		event.respondWith(handleApiRequest(request));
	} else if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script') {
		// Static assets
		event.respondWith(handleAssetRequest(request));
	} else {
		// Everything else
		event.respondWith(handleDefaultRequest(request));
	}
});

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
	const url = new URL(request.url);

	try {
		// Try network first for fresh content
		if (navigator.onLine) {
			const networkResponse = await fetch(request, {
				cache: 'no-cache'
			});

			if (networkResponse.ok) {
				// Cache the fresh response
				const cache = await caches.open(DYNAMIC_CACHE);
				cache.put(request, networkResponse.clone());
				return networkResponse;
			}
		}
	} catch (error) {
		console.log('[SW] Network failed for navigation:', url.pathname);
	}

	// Fallback to cache
	const cachedResponse = await getCachedResponse(request);
	if (cachedResponse) {
		console.log('[SW] Serving from cache:', url.pathname);
		return cachedResponse;
	}

	// Final fallback with smart routing
	return getNavigationFallback(url);
}

// Smart fallback for navigation requests
async function getNavigationFallback(url) {
	const cache = await caches.open(STATIC_CACHE);
	const dynamicCache = await caches.open(DYNAMIC_CACHE);

	// Try route-specific fallbacks first
	if (url.pathname.startsWith('/consultation')) {
		// Try consultation pages
		let fallback = await cache.match('/consultation/new') ||
			await dynamicCache.match('/consultation/new');
		if (fallback) return fallback;
	}

	if (url.pathname.startsWith('/patients')) {
		// Try patients page
		let fallback = await cache.match('/patients') ||
			await dynamicCache.match('/patients');
		if (fallback) return fallback;
	}

	// Try dashboard
	let fallback = await cache.match('/dashboard') ||
		await dynamicCache.match('/dashboard');
	if (fallback) return fallback;

	// Try root
	fallback = await cache.match('/') ||
		await dynamicCache.match('/');
	if (fallback) return fallback;

	// Final fallback - offline page
	const offlinePage = await cache.match(OFFLINE_PAGE);
	if (offlinePage) return offlinePage;

	// Ultimate fallback - generate offline page
	return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>ATLAS - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    display: flex; align-items: center; justify-content: center;
                    min-height: 100vh; margin: 0; 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; text-align: center;
                }
                .container { 
                    background: rgba(255,255,255,0.1); 
                    padding: 2rem; border-radius: 1rem; 
                    max-width: 400px;
                }
                .logo { font-size: 4rem; margin-bottom: 1rem; }
                .btn { 
                    background: rgba(255,255,255,0.2); color: white; 
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 1rem 2rem; border-radius: 0.5rem; 
                    text-decoration: none; display: inline-block; 
                    margin: 0.5rem; cursor: pointer;
                }
                .btn:hover { background: rgba(255,255,255,0.3); }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🏥</div>
                <h1>ATLAS Offline</h1>
                <p>This page isn't available offline yet.</p>
                <p><strong>Requested:</strong> ${url.pathname}</p>
                <p>Your data is safely stored and will sync when you're back online.</p>
                <div>
                    <a href="/dashboard" class="btn">📊 Dashboard</a>
                    <a href="/patients" class="btn">👥 Patients</a>
                    <a href="/consultation/new" class="btn">📝 New Consultation</a>
                </div>
                <p style="font-size: 0.8em; margin-top: 2rem; opacity: 0.7;">
                    Data will sync automatically when connection is restored
                </p>
            </div>
            <script>
                // Auto-reload when back online
                window.addEventListener('online', () => {
                    setTimeout(() => location.reload(), 1000);
                });
                
                // Show online status
                const updateStatus = () => {
                    const isOnline = navigator.onLine;
                    document.body.style.filter = isOnline ? 'none' : 'grayscale(20%)';
                };
                
                window.addEventListener('online', updateStatus);
                window.addEventListener('offline', updateStatus);
                updateStatus();
            </script>
        </body>
        </html>
    `, {
		status: 200,
		headers: {
			'Content-Type': 'text/html',
			'Cache-Control': 'no-cache'
		}
	});
}

// Handle API requests
async function handleApiRequest(request) {
	try {
		// Always try network for API requests
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			// Cache successful GET requests
			if (request.method === 'GET') {
				const cache = await caches.open(DYNAMIC_CACHE);
				cache.put(request, networkResponse.clone());
			}
			return networkResponse;
		}
	} catch (error) {
		console.log('[SW] API request failed:', request.url);
	}

	// Fallback for GET requests
	if (request.method === 'GET') {
		const cachedResponse = await getCachedResponse(request);
		if (cachedResponse) {
			return cachedResponse;
		}
	}

	// Return offline response for API requests
	return new Response(JSON.stringify({
		error: 'offline',
		message: 'This request is not available offline. Data will sync when online.',
		offline: true,
		timestamp: new Date().toISOString()
	}), {
		status: 503,
		headers: {
			'Content-Type': 'application/json',
			'Cache-Control': 'no-cache'
		}
	});
}

// Handle asset requests (images, CSS, JS)
async function handleAssetRequest(request) {
	// Try cache first for assets
	const cachedResponse = await getCachedResponse(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	try {
		// Try network
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			// Cache the asset
			const cache = await caches.open(STATIC_CACHE);
			cache.put(request, networkResponse.clone());
			return networkResponse;
		}
	} catch (error) {
		console.log('[SW] Asset request failed:', request.url);
	}

	// No fallback for assets - let them fail naturally
	return new Response('', { status: 404 });
}

// Handle default requests
async function handleDefaultRequest(request) {
	try {
		const networkResponse = await fetch(request);

		if (networkResponse.ok) {
			// Cache successful responses
			const cache = await caches.open(DYNAMIC_CACHE);
			cache.put(request, networkResponse.clone());
			return networkResponse;
		}
	} catch (error) {
		console.log('[SW] Default request failed:', request.url);
	}

	// Try cache
	const cachedResponse = await getCachedResponse(request);
	if (cachedResponse) {
		return cachedResponse;
	}

	// Final fallback
	return new Response('Not available offline', { status: 503 });
}

// Helper to get cached response from any cache
async function getCachedResponse(request) {
	// Try static cache first
	const staticCache = await caches.open(STATIC_CACHE);
	let response = await staticCache.match(request);

	if (response) return response;

	// Try dynamic cache
	const dynamicCache = await caches.open(DYNAMIC_CACHE);
	response = await dynamicCache.match(request);

	return response;
}

// Message handling
self.addEventListener('message', (event) => {
	const { type, payload } = event.data;

	switch (type) {
		case 'SKIP_WAITING':
			self.skipWaiting();
			break;

		case 'CLIENTS_CLAIM':
			self.clients.claim();
			break;

		case 'GET_CACHE_STATUS':
			getCacheStatus().then(status => {
				event.ports[0].postMessage({
					type: 'CACHE_STATUS',
					payload: status
				});
			});
			break;

		case 'CLEAR_CACHE':
			clearAllCaches().then(result => {
				event.ports[0].postMessage({
					type: 'CACHE_CLEARED',
					payload: result
				});
			});
			break;
	}
});

// Get cache status
async function getCacheStatus() {
	try {
		const cacheNames = await caches.keys();
		const status = {};

		for (const cacheName of cacheNames) {
			const cache = await caches.open(cacheName);
			const requests = await cache.keys();
			status[cacheName] = {
				entries: requests.length,
				requests: requests.map(req => req.url)
			};
		}

		return status;
	} catch (error) {
		return { error: error.message };
	}
}

// Clear all caches
async function clearAllCaches() {
	try {
		const cacheNames = await caches.keys();
		await Promise.all(cacheNames.map(name => caches.delete(name)));
		return { cleared: cacheNames.length };
	} catch (error) {
		return { error: error.message };
	}
}

// Periodic cache cleanup
setInterval(async () => {
	try {
		const dynamicCache = await caches.open(DYNAMIC_CACHE);
		const requests = await dynamicCache.keys();

		// Remove old cache entries (older than 1 week)
		const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

		for (const request of requests) {
			const response = await dynamicCache.match(request);
			const dateHeader = response.headers.get('date');

			if (dateHeader) {
				const cacheDate = new Date(dateHeader).getTime();
				if (cacheDate < oneWeekAgo) {
					await dynamicCache.delete(request);
					console.log('[SW] Cleaned old cache entry:', request.url);
				}
			}
		}
	} catch (error) {
		console.error('[SW] Cache cleanup failed:', error);
	}
}, 24 * 60 * 60 * 1000); // Run daily

console.log('[SW] Service Worker loaded:', CACHE_VERSION);