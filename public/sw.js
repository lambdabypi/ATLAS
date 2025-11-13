// public/sw.js - FIXED VERSION WITH WORKING CACHE
const CACHE_VERSION = 'v2';
const CACHE_NAMES = {
	pages: `atlas-pages-${CACHE_VERSION}`,
	api: `atlas-api-${CACHE_VERSION}`,
	static: `atlas-static-${CACHE_VERSION}`,
	assets: `atlas-assets-${CACHE_VERSION}`,
};

const ALL_CACHES = Object.values(CACHE_NAMES);

console.log('🔧 [SW] Service Worker loading...');

// ============================================================================
// Install
// ============================================================================
self.addEventListener('install', (event) => {
	console.log('🔧 [SW] Installing...');
	self.skipWaiting();

	event.waitUntil(
		caches.open(CACHE_NAMES.pages).then(() => {
			console.log('✅ [SW] Cache initialized');
		})
	);
});

// ============================================================================
// Activate
// ============================================================================
self.addEventListener('activate', (event) => {
	console.log('✅ [SW] Activating...');

	event.waitUntil(
		(async () => {
			// Clean old caches
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter(name => name.startsWith('atlas-') && !ALL_CACHES.includes(name))
					.map(name => {
						console.log('🗑️ [SW] Deleting old cache:', name);
						return caches.delete(name);
					})
			);

			// Take control immediately
			await self.clients.claim();
			console.log('✅ [SW] Now controlling all pages');

			// Notify clients
			const clients = await self.clients.matchAll({ type: 'window' });
			clients.forEach(client => {
				client.postMessage({
					type: 'SW_READY',
					caches: CACHE_NAMES,
				});
			});
		})()
	);
});

// ============================================================================
// Message Handler - FIXED
// ============================================================================
self.addEventListener('message', (event) => {
	console.log('📨 [SW] Received message:', event.data?.type);

	if (event.data && event.data.type === 'CACHE_URLS') {
		console.log('📥 [SW] Cache request for', event.data.urls?.length, 'URLs');
		event.waitUntil(
			cacheUrlsFixed(event.data.urls).then(results => {
				console.log('✅ [SW] Cache operation complete:', results);

				// Send response back to client
				event.source?.postMessage({
					type: 'CACHE_COMPLETE',
					results: results,
				});
			})
		);
	}

	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}
});

// ============================================================================
// FIXED Cache Function
// ============================================================================
async function cacheUrlsFixed(urls) {
	if (!urls || urls.length === 0) {
		console.warn('⚠️ [SW] No URLs provided to cache');
		return [];
	}

	console.log('🔄 [SW] Starting to cache', urls.length, 'URLs...');
	const cache = await caches.open(CACHE_NAMES.pages);
	const results = [];

	for (const url of urls) {
		try {
			console.log('📍 [SW] Fetching:', url);

			// Fetch with proper options
			const response = await fetch(url, {
				method: 'GET',
				credentials: 'same-origin',
				cache: 'no-cache',
			});

			if (response.ok && response.status === 200) {
				// Clone before caching
				const responseToCache = response.clone();
				await cache.put(url, responseToCache);

				console.log('✅ [SW] Cached:', url);
				results.push({ url, success: true, status: response.status });
			} else {
				console.warn('⚠️ [SW] Bad response:', url, response.status);
				results.push({ url, success: false, status: response.status });
			}
		} catch (error) {
			console.error('❌ [SW] Error caching:', url, error.message);
			results.push({ url, success: false, error: error.message });
		}
	}

	// Log summary
	const successful = results.filter(r => r.success).length;
	console.log(`✅ [SW] Cache summary: ${successful}/${urls.length} URLs cached successfully`);

	return results;
}

// ============================================================================
// Fetch Handler
// ============================================================================
self.addEventListener('fetch', (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// Skip non-GET
	if (request.method !== 'GET') return;

	// Skip non-http
	if (!url.protocol.startsWith('http')) return;

	// Route requests
	if (request.mode === 'navigate') {
		event.respondWith(handleNavigationRequest(request));
	} else if (url.pathname.startsWith('/api/')) {
		event.respondWith(handleApiRequest(request));
	} else if (url.pathname.startsWith('/_next/static/')) {
		event.respondWith(handleStaticRequest(request));
	} else if (isAssetRequest(request)) {
		event.respondWith(handleAssetRequest(request));
	}
});

// ============================================================================
// Navigation Handler
// ============================================================================
async function handleNavigationRequest(request) {
	const cache = await caches.open(CACHE_NAMES.pages);
	const url = new URL(request.url);

	console.log('🧭 [SW] Navigation:', url.pathname + url.search);

	try {
		// Network first with timeout
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch(request, { signal: controller.signal });
		clearTimeout(timeoutId);

		if (response.ok) {
			console.log('✅ [SW] Network success:', request.url);
			cache.put(request.url, response.clone());
			return response;
		}
	} catch (error) {
		console.log('📱 [SW] Network failed, trying cache');
	}

	// Try exact cache match (with query params)
	let cachedResponse = await cache.match(request.url, { ignoreSearch: false });

	if (cachedResponse) {
		console.log('✅ [SW] Cache hit (exact):', request.url);
		return cachedResponse;
	}

	// Try without query params
	const baseUrl = url.origin + url.pathname;
	cachedResponse = await cache.match(baseUrl);

	if (cachedResponse) {
		console.log('✅ [SW] Cache hit (base):', baseUrl);
		return cachedResponse;
	}

	// Fallback chain
	const fallbacks = ['/dashboard', '/'];
	for (const fallback of fallbacks) {
		const fallbackUrl = new URL(fallback, url.origin).href;
		const fallbackResponse = await cache.match(fallbackUrl);

		if (fallbackResponse) {
			console.log('✅ [SW] Using fallback:', fallback);
			return fallbackResponse;
		}
	}

	// Offline page
	console.log('📵 [SW] No cache - showing offline page');
	return generateOfflinePage(url);
}

// ============================================================================
// API Handler
// ============================================================================
async function handleApiRequest(request) {
	const cache = await caches.open(CACHE_NAMES.api);

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request.url, response.clone());
		}
		return response;
	} catch (error) {
		const cachedResponse = await cache.match(request.url);
		if (cachedResponse) return cachedResponse;

		return new Response(
			JSON.stringify({ error: 'offline', message: 'API unavailable' }),
			{ status: 503, headers: { 'Content-Type': 'application/json' } }
		);
	}
}

// ============================================================================
// Static Handler
// ============================================================================
async function handleStaticRequest(request) {
	const cache = await caches.open(CACHE_NAMES.static);

	const cachedResponse = await cache.match(request.url);
	if (cachedResponse) return cachedResponse;

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request.url, response.clone());
		}
		return response;
	} catch (error) {
		return new Response('Not found', { status: 404 });
	}
}

// ============================================================================
// Asset Handler
// ============================================================================
async function handleAssetRequest(request) {
	const cache = await caches.open(CACHE_NAMES.assets);

	const cachedResponse = await cache.match(request.url);
	if (cachedResponse) return cachedResponse;

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request.url, response.clone());
		}
		return response;
	} catch (error) {
		return new Response('Not found', { status: 404 });
	}
}

// ============================================================================
// Helper: Check Asset Request
// ============================================================================
function isAssetRequest(request) {
	const url = new URL(request.url);
	return (
		request.destination === 'image' ||
		request.destination === 'font' ||
		/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|otf)$/i.test(url.pathname)
	);
}

// ============================================================================
// Generate Offline Page
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
          font-size: 0.85rem; margin: 1rem 0;
        }
        .btn { 
          display: inline-block; margin: 0.5rem; padding: 1rem 1.5rem; 
          background: rgba(255,255,255,0.2); color: white; 
          text-decoration: none; border-radius: 0.5rem; 
          border: 1px solid rgba(255,255,255,0.3);
          transition: all 0.2s; cursor: pointer; font-size: 0.95rem;
        }
        .btn:hover { background: rgba(255,255,255,0.3); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">🏥</div>
        <h1>ATLAS Offline</h1>
        <p>You're offline and this page hasn't been cached yet.</p>
        <div class="url">${url.pathname}${url.search}</div>
        <p><strong>Try these cached pages:</strong></p>
        <div style="margin-top: 1.5rem;">
          <a href="/" class="btn">🏠 Home</a>
          <a href="/dashboard" class="btn">📊 Dashboard</a>
          <a href="/patients" class="btn">👥 Patients</a>
        </div>
        <button onclick="location.reload()" class="btn" style="margin-top: 1rem;">
          🔄 Retry
        </button>
      </div>
      <script>
        window.addEventListener('online', () => {
          setTimeout(() => location.reload(), 1000);
        });
      </script>
    </body>
    </html>
  `;

	return new Response(html, {
		status: 200,
		headers: { 'Content-Type': 'text/html; charset=utf-8' },
	});
}