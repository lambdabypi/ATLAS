// public/sw.js - Improved Service Worker with robust offline handling
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

const CACHE_VERSION = 'v1';
const PAGE_CACHE = 'atlas-pages-v1';
const API_CACHE = 'atlas-api-v1';
const STATIC_CACHE = 'next-static-v1';
const ASSET_CACHE = 'atlas-assets-v1';

// Configure Workbox
workbox.setConfig({ debug: false });
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

// ============================================================================
// STRATEGY 1: HTML Pages - Network First with Smart Fallbacks
// ============================================================================
workbox.routing.registerRoute(
	({ request, url }) => {
		return request.mode === 'navigate' ||
			request.destination === 'document';
	},
	async ({ request, event }) => {
		const cache = await caches.open(PAGE_CACHE);
		const url = new URL(request.url);

		console.log('📄 Navigation request:', url.href);

		// STEP 1: Try network first (with timeout)
		try {
			const networkPromise = fetch(request);
			const timeoutPromise = new Promise((_, reject) =>
				setTimeout(() => reject(new Error('Network timeout')), 3000)
			);

			const response = await Promise.race([networkPromise, timeoutPromise]);

			if (response.ok) {
				console.log('✅ Serving from network:', url.href);
				// Cache the response for next time
				cache.put(request.url, response.clone());
				return response;
			}
		} catch (error) {
			console.log('❌ Network failed:', error.message);
		}

		// STEP 2: Try exact cache match (including query params)
		try {
			const cachedResponse = await cache.match(request.url, {
				ignoreSearch: false // Must match query params exactly
			});

			if (cachedResponse) {
				console.log('✅ Serving from cache (exact match):', url.href);
				return cachedResponse;
			}
		} catch (error) {
			console.log('❌ Cache match failed:', error);
		}

		// STEP 3: Smart fallback chain for consultation URLs
		if (url.pathname === '/consultation/new' && url.searchParams.has('patientId')) {
			console.log('🔄 Trying consultation fallbacks...');

			// Try: Same URL without query params
			const baseUrl = `${url.origin}${url.pathname}`;
			const baseResponse = await cache.match(baseUrl);
			if (baseResponse) {
				console.log('✅ Using base consultation page');
				return baseResponse;
			}
		}

		// STEP 4: Generic fallback chain
		const fallbacks = [
			`${url.origin}${url.pathname}`, // Same path, no query params
			`${url.origin}/dashboard`,
			`${url.origin}/`,
		];

		for (const fallbackUrl of fallbacks) {
			const fallbackResponse = await cache.match(fallbackUrl);
			if (fallbackResponse) {
				console.log('✅ Using fallback:', fallbackUrl);
				return fallbackResponse;
			}
		}

		// STEP 5: Return offline page
		console.log('📵 No cache available - showing offline page');
		return generateOfflinePage(url);
	}
);

// ============================================================================
// STRATEGY 2: API Requests - Network First with JSON Error Fallback
// ============================================================================
workbox.routing.registerRoute(
	({ url }) => url.pathname.startsWith('/api/'),
	new workbox.strategies.NetworkFirst({
		cacheName: API_CACHE,
		networkTimeoutSeconds: 5,
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 100,
				maxAgeSeconds: 5 * 60,
			}),
			{
				handlerDidError: async ({ request }) => {
					console.log('❌ API request failed offline:', request.url);
					return new Response(
						JSON.stringify({
							error: 'offline',
							message: 'API not available offline',
							offline: true,
						}),
						{
							status: 503,
							headers: {
								'Content-Type': 'application/json',
								'X-Offline': 'true'
							},
						}
					);
				},
			},
		],
	})
);

// ============================================================================
// STRATEGY 3: Next.js Static Files - Cache First
// ============================================================================
workbox.routing.registerRoute(
	({ url }) => url.pathname.startsWith('/_next/static/'),
	new workbox.strategies.CacheFirst({
		cacheName: STATIC_CACHE,
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 200,
				maxAgeSeconds: 365 * 24 * 60 * 60,
			}),
		],
	})
);

// ============================================================================
// STRATEGY 4: Assets - Cache First
// ============================================================================
workbox.routing.registerRoute(
	({ request }) => {
		return request.destination === 'image' ||
			request.destination === 'font' ||
			request.destination === 'style' ||
			request.destination === 'script';
	},
	new workbox.strategies.CacheFirst({
		cacheName: ASSET_CACHE,
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 100,
				maxAgeSeconds: 30 * 24 * 60 * 60,
			}),
		],
	})
);

// ============================================================================
// Install Handler - Immediate Activation
// ============================================================================
self.addEventListener('install', (event) => {
	console.log('🔧 [SW] Installing...');
	self.skipWaiting(); // Activate immediately
});

// ============================================================================
// Activate Handler - Clean Old Caches & Take Control
// ============================================================================
self.addEventListener('activate', (event) => {
	console.log('✅ [SW] Activating...');

	event.waitUntil(
		(async () => {
			// Clean up old caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter(name => {
						const isOldCache = name.startsWith('atlas-') &&
							!name.includes(CACHE_VERSION) &&
							![PAGE_CACHE, API_CACHE, STATIC_CACHE, ASSET_CACHE].includes(name);
						if (isOldCache) {
							console.log('🗑️ Deleting old cache:', name);
						}
						return isOldCache;
					})
					.map(name => caches.delete(name))
			);

			// Take control of all pages immediately
			await self.clients.claim();
			console.log('✅ [SW] Now controlling all pages');
		})()
	);
});

// ============================================================================
// Fetch Handler - Logging & Diagnostics
// ============================================================================
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Log navigation requests for debugging
	if (event.request.mode === 'navigate') {
		console.log('🧭 [SW] Navigation:', url.pathname + url.search);
	}
});

// ============================================================================
// Message Handler - Cache Management from Client
// ============================================================================
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'CACHE_URLS') {
		console.log('📥 [SW] Received cache request:', event.data.urls);
		event.waitUntil(cacheUrls(event.data.urls));
	}

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'GET_CACHE_STATUS') {
		event.waitUntil(
			(async () => {
				const status = await getCacheStatus();
				event.ports[0].postMessage(status);
			})()
		);
	}
});

// ============================================================================
// Helper: Cache URLs from Client
// ============================================================================
async function cacheUrls(urls) {
	const cache = await caches.open(PAGE_CACHE);
	const results = [];

	for (const url of urls) {
		try {
			const response = await fetch(url, {
				cache: 'no-cache',
				credentials: 'same-origin'
			});

			if (response.ok) {
				await cache.put(url, response.clone());
				results.push({ url, cached: true });
				console.log('✅ [SW] Cached:', url);
			} else {
				results.push({ url, cached: false, status: response.status });
				console.log('❌ [SW] Failed to cache:', url, response.status);
			}
		} catch (error) {
			results.push({ url, cached: false, error: error.message });
			console.log('❌ [SW] Error caching:', url, error.message);
		}
	}

	return results;
}

// ============================================================================
// Helper: Get Cache Status
// ============================================================================
async function getCacheStatus() {
	const caches_list = await caches.keys();
	const status = {};

	for (const cacheName of caches_list) {
		const cache = await caches.open(cacheName);
		const keys = await cache.keys();
		status[cacheName] = {
			count: keys.length,
			urls: keys.map(req => req.url)
		};
	}

	return status;
}

// ============================================================================
// Helper: Generate Offline Page
// ============================================================================
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
          color: white; min-height: 100vh; display: flex; 
          align-items: center; justify-content: center;
          text-align: center; padding: 20px;
        }
        .container { 
          background: rgba(255,255,255,0.1); padding: 2rem; 
          border-radius: 1rem; backdrop-filter: blur(10px); 
          max-width: 500px; width: 100%;
        }
        .logo { font-size: 4rem; margin-bottom: 1rem; }
        h1 { margin-bottom: 1rem; font-size: 2rem; }
        p { margin-bottom: 1rem; opacity: 0.9; line-height: 1.5; }
        .url { 
          background: rgba(0,0,0,0.2); padding: 0.5rem; 
          border-radius: 0.5rem; word-break: break-all; 
          font-size: 0.9rem; margin: 1rem 0;
        }
        .btn { 
          display: inline-block; margin: 0.5rem; padding: 1rem 2rem; 
          background: rgba(255,255,255,0.2); color: white; 
          text-decoration: none; border-radius: 0.5rem; 
          border: 1px solid rgba(255,255,255,0.3);
          transition: all 0.2s; cursor: pointer;
          font-size: 1rem; font-family: inherit;
        }
        .btn:hover { background: rgba(255,255,255,0.3); }
        .status { 
          margin-top: 1.5rem; 
          padding: 0.75rem; 
          background: rgba(0,0,0,0.2);
          border-radius: 0.5rem;
          font-size: 0.9rem; 
        }
        .online { color: #4ade80; }
        .offline { color: #f87171; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🏥</div>
        <h1>ATLAS Offline</h1>
        <p>You're currently offline and this page hasn't been cached yet.</p>
        <div class="url">${url.pathname}${url.search}</div>
        <p><strong>Available offline pages:</strong></p>
        <div style="margin-top: 1.5rem;">
          <a href="/" class="btn">🏠 Home</a>
          <a href="/dashboard" class="btn">📊 Dashboard</a>
          <a href="/patients" class="btn">👥 Patients</a>
        </div>
        <button onclick="location.reload()" class="btn" style="margin-top: 1rem; border: 2px solid white;">
          🔄 Retry
        </button>
        <div class="status">
          <div id="status">Checking connection...</div>
        </div>
      </div>
      <script>
        function updateStatus() {
          const status = document.getElementById('status');
          if (navigator.onLine) {
            status.innerHTML = '<span class="online">🟢 Back online! Click Retry or wait...</span>';
            setTimeout(() => location.reload(), 2000);
          } else {
            status.innerHTML = '<span class="offline">🔴 Still offline</span>';
          }
        }
        
        updateStatus();
        window.addEventListener('online', updateStatus);
        window.addEventListener('offline', updateStatus);
        
        // Auto-check every 3 seconds
        setInterval(() => {
          if (navigator.onLine) {
            updateStatus();
          }
        }, 3000);
      </script>
    </body>
    </html>
  `;

	return new Response(html, {
		status: 200,
		statusText: 'OK',
		headers: {
			'Content-Type': 'text/html; charset=utf-8',
			'Cache-Control': 'no-cache'
		},
	});
}