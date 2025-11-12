// public/sw.js - TARGETED FIX for Query Parameter Caching
const CACHE_NAME = 'atlas-critical-v1';
const OFFLINE_FALLBACK = '/offline.html';

// CRITICAL: Install immediately and cache query parameter URLs
self.addEventListener('install', (event) => {
	console.log('[SW] Installing ATLAS Critical Cache...');

	// Skip waiting immediately
	self.skipWaiting();

	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			console.log('[SW] Opened cache');
			// Don't block installation on caching - handle it in activate
			return Promise.resolve();
		})
	);
});

// CRITICAL: Activate immediately and take control
self.addEventListener('activate', (event) => {
	console.log('[SW] Activating ATLAS Critical Cache...');

	event.waitUntil(
		(async () => {
			// Take control immediately
			await self.clients.claim();
			console.log('[SW] Claimed all clients');

			// Clean old caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter(name => name !== CACHE_NAME)
					.map(name => {
						console.log('[SW] Deleting old cache:', name);
						return caches.delete(name);
					})
			);

			console.log('[SW] Cache cleanup complete');
		})()
	);
});

// CRITICAL: Handle fetch requests with smart query parameter handling
self.addEventListener('fetch', (event) => {
	const request = event.request;
	const url = new URL(request.url);

	// Only handle same-origin requests
	if (url.origin !== self.location.origin) {
		return;
	}

	// Handle navigation requests (page loads)
	if (request.mode === 'navigate') {
		event.respondWith(handleNavigationRequest(request));
		return;
	}

	// Handle API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(handleApiRequest(request));
		return;
	}

	// Handle assets
	if (isAssetRequest(request)) {
		event.respondWith(handleAssetRequest(request));
		return;
	}

	// Default handling
	event.respondWith(handleDefaultRequest(request));
});

// CRITICAL: Smart navigation request handling
async function handleNavigationRequest(request) {
	const url = new URL(request.url);
	const pathname = url.pathname;
	const searchParams = url.search;

	console.log('[SW] Navigation request:', pathname + searchParams);

	try {
		// Try network first if online
		if (navigator.onLine) {
			console.log('[SW] Trying network for:', pathname + searchParams);

			const networkResponse = await fetch(request, {
				cache: 'no-cache'
			});

			if (networkResponse.ok) {
				// Cache the successful response
				const cache = await caches.open(CACHE_NAME);
				cache.put(request, networkResponse.clone());
				console.log('[SW] Cached from network:', pathname + searchParams);
				return networkResponse;
			}
		}
	} catch (error) {
		console.log('[SW] Network failed for:', pathname + searchParams, error.message);
	}

	// Try exact match from cache
	const cache = await caches.open(CACHE_NAME);
	const cachedResponse = await cache.match(request);

	if (cachedResponse) {
		console.log('[SW] Exact cache hit for:', pathname + searchParams);
		return cachedResponse;
	}

	// CRITICAL: Smart fallback for query parameter URLs
	if (pathname === '/consultation/new' && searchParams) {
		console.log('[SW] Trying fallbacks for consultation with params:', searchParams);

		// Try without query parameters first
		const baseUrl = `${url.origin}/consultation/new`;
		const baseResponse = await cache.match(baseUrl);

		if (baseResponse) {
			console.log('[SW] Using base consultation page for:', pathname + searchParams);
			return baseResponse;
		}

		// Try other common patient IDs
		const commonPatientUrls = [
			`${url.origin}/consultation/new?patientId=1`,
			`${url.origin}/consultation/new?patientId=2`,
			`${url.origin}/consultation/new?mode=enhanced`
		];

		for (const fallbackUrl of commonPatientUrls) {
			const fallback = await cache.match(fallbackUrl);
			if (fallback) {
				console.log('[SW] Using fallback URL:', fallbackUrl, 'for:', pathname + searchParams);
				return fallback;
			}
		}
	}

	// Route-based fallbacks
	const routeFallbacks = getRouteFallbacks(pathname);

	for (const fallbackPath of routeFallbacks) {
		const fallbackUrl = `${url.origin}${fallbackPath}`;
		const fallbackResponse = await cache.match(fallbackUrl);

		if (fallbackResponse) {
			console.log('[SW] Using route fallback:', fallbackPath, 'for:', pathname);
			return fallbackResponse;
		}
	}

	// Generate offline page
	return generateOfflinePage(url);
}

// Get route-based fallbacks
function getRouteFallbacks(pathname) {
	if (pathname.startsWith('/consultation')) {
		return ['/consultation/new', '/consultation', '/dashboard', '/'];
	}

	if (pathname.startsWith('/patients')) {
		return ['/patients', '/dashboard', '/'];
	}

	return ['/dashboard', '/'];
}

// Handle API requests
async function handleApiRequest(request) {
	try {
		const response = await fetch(request);

		if (response.ok && request.method === 'GET') {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}

		return response;

	} catch (error) {
		console.log('[SW] API request failed:', request.url);

		// Try cache for GET requests
		if (request.method === 'GET') {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match(request);

			if (cached) {
				return cached;
			}
		}

		return new Response(JSON.stringify({
			error: 'offline',
			message: 'API not available offline',
			offline: true
		}), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}

// Handle asset requests
async function handleAssetRequest(request) {
	const cache = await caches.open(CACHE_NAME);

	// Try cache first for assets
	const cached = await cache.match(request);
	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);

		if (response.ok) {
			cache.put(request, response.clone());
		}

		return response;

	} catch (error) {
		// Asset not available offline
		return new Response('', { status: 404 });
	}
}

// Handle default requests
async function handleDefaultRequest(request) {
	try {
		const response = await fetch(request);

		if (response.ok) {
			const cache = await caches.open(CACHE_NAME);
			cache.put(request, response.clone());
		}

		return response;

	} catch (error) {
		const cache = await caches.open(CACHE_NAME);
		const cached = await cache.match(request);

		return cached || new Response('Not available offline', { status: 503 });
	}
}

// Check if request is for an asset
function isAssetRequest(request) {
	const url = new URL(request.url);
	const pathname = url.pathname;

	return (
		pathname.includes('/_next/') ||
		pathname.includes('/static/') ||
		pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/) ||
		request.destination === 'image' ||
		request.destination === 'style' ||
		request.destination === 'script' ||
		request.destination === 'font'
	);
}

// Generate offline page
function generateOfflinePage(url) {
	const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <title>ATLAS - Offline</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center;
                    text-align: center; padding: 20px;
                }
                .container { 
                    background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; 
                    backdrop-filter: blur(10px); max-width: 500px; width: 100%;
                }
                .logo { font-size: 4rem; margin-bottom: 1rem; }
                h1 { margin-bottom: 1rem; font-size: 2rem; }
                p { margin-bottom: 1rem; opacity: 0.9; }
                .url { 
                    background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 0.5rem; 
                    font-family: monospace; font-size: 0.9rem; margin: 1rem 0; word-break: break-all;
                }
                .buttons { margin-top: 2rem; }
                .btn { 
                    display: inline-block; margin: 0.5rem; padding: 1rem 2rem; 
                    background: rgba(255,255,255,0.2); color: white; text-decoration: none; 
                    border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.3);
                    transition: background 0.2s;
                }
                .btn:hover { background: rgba(255,255,255,0.3); }
                .status { margin-top: 2rem; font-size: 0.8rem; opacity: 0.7; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">🏥</div>
                <h1>ATLAS Offline</h1>
                <p>This page isn't available offline yet.</p>
                
                <div class="url">Requested: ${url.pathname}${url.search}</div>
                
                <p>Your clinical data is safely stored locally and will sync when you're back online.</p>
                
                <div class="buttons">
                    <a href="/dashboard" class="btn">📊 Dashboard</a>
                    <a href="/patients" class="btn">👥 Patients</a>
                    <a href="/consultation/new" class="btn">📝 New Consultation</a>
                    <a href="/reference" class="btn">📚 Reference</a>
                </div>
                
                <div class="status" id="status">
                    Status: <span id="online-status">Checking...</span>
                </div>
            </div>
            
            <script>
                function updateStatus() {
                    const status = navigator.onLine ? 'Online' : 'Offline';
                    document.getElementById('online-status').textContent = status;
                    document.body.style.opacity = navigator.onLine ? '1' : '0.8';
                }
                
                // Initial status
                updateStatus();
                
                // Listen for status changes
                window.addEventListener('online', () => {
                    updateStatus();
                    setTimeout(() => location.reload(), 1000);
                });
                
                window.addEventListener('offline', updateStatus);
                
                // Auto-retry every 30 seconds when offline
                if (!navigator.onLine) {
                    const retryInterval = setInterval(() => {
                        if (navigator.onLine) {
                            clearInterval(retryInterval);
                            location.reload();
                        }
                    }, 30000);
                }
            </script>
        </body>
        </html>
    `;

	return new Response(html, {
		status: 200,
		headers: {
			'Content-Type': 'text/html',
			'Cache-Control': 'no-cache'
		}
	});
}

// Message handling
self.addEventListener('message', (event) => {
	const { type } = event.data;

	switch (type) {
		case 'SKIP_WAITING':
			self.skipWaiting();
			break;

		case 'GET_CACHE_STATUS':
			getCacheStatus().then(status => {
				event.ports[0].postMessage(status);
			});
			break;
	}
});

// Get cache status for debugging
async function getCacheStatus() {
	try {
		const cache = await caches.open(CACHE_NAME);
		const requests = await cache.keys();

		const status = {
			cacheName: CACHE_NAME,
			totalEntries: requests.length,
			urls: requests.map(req => req.url),
			consultationUrls: requests
				.filter(req => req.url.includes('/consultation/'))
				.map(req => req.url),
			timestamp: new Date().toISOString()
		};

		console.log('[SW] Cache Status:', status);
		return status;

	} catch (error) {
		return { error: error.message };
	}
}

console.log('[SW] ATLAS Critical Service Worker loaded');