// public/custom-sw.js - Add this logic to handle dynamic routes better

// Cache for offline patient data
const DYNAMIC_CACHE = 'atlas-dynamic-v1';
const OFFLINE_CACHE = 'atlas-offline-v1';

// Handle dynamic patient routes specifically
workbox.routing.registerRoute(
	/\/patients\/\d+$/,
	async ({ event, url }) => {
		const cache = await caches.open(DYNAMIC_CACHE);

		try {
			// Try network first
			const response = await fetch(event.request);

			if (response.ok) {
				// Cache the successful response
				await cache.put(event.request, response.clone());
				console.log('✅ Cached patient page:', url.pathname);
			}

			return response;
		} catch (error) {
			console.log('📱 Network failed for patient page, trying cache:', url.pathname);

			// Try to serve from cache
			const cachedResponse = await cache.match(event.request);

			if (cachedResponse) {
				console.log('✅ Serving cached patient page:', url.pathname);
				return cachedResponse;
			}

			// No cached version, serve offline fallback
			console.log('❌ No cache available, serving offline fallback');
			return await serveOfflinePatientPage(url.pathname);
		}
	},
	'GET'
);

// Handle consultation routes
workbox.routing.registerRoute(
	/\/consultation\/\d+$/,
	new workbox.strategies.NetworkFirst({
		cacheName: 'consultation-pages',
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 50,
				maxAgeSeconds: 24 * 60 * 60, // 24 hours
			}),
		],
	}),
	'GET'
);

// Serve offline fallback for patient pages
async function serveOfflinePatientPage(pathname) {
	const patientId = pathname.split('/').pop();

	const offlineHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>ATLAS - Offline</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0; padding: 2rem; background: #f8fafc; color: #334155;
          }
          .container { max-width: 600px; margin: 0 auto; text-align: center; }
          .icon { font-size: 4rem; margin-bottom: 1rem; }
          h1 { color: #1e293b; margin-bottom: 1rem; }
          .status { 
            background: #fef3c7; border: 1px solid #f59e0b; 
            padding: 1rem; border-radius: 8px; margin: 2rem 0;
          }
          .retry-btn { 
            background: #2563eb; color: white; border: none; 
            padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;
          }
          .retry-btn:hover { background: #1d4ed8; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🏥</div>
          <h1>ATLAS Clinical Support</h1>
          <div class="status">
            <strong>Offline Mode</strong><br>
            You're viewing Patient ${patientId} in offline mode.<br>
            Some features may be limited.
          </div>
          <button class="retry-btn" onclick="window.location.reload()">
            Try Again
          </button>
          <script>
            window.addEventListener('online', () => {
              window.location.reload();
            });
            
            // Try to get cached data
            if ('caches' in window) {
              caches.match('/api/patients/${patientId}')
                .then(response => {
                  if (response) {
                    response.json().then(data => {
                      console.log('Found cached patient data:', data);
                      // You could display cached patient data here
                    });
                  }
                });
            }
          </script>
        </div>
      </body>
    </html>
  `;

	return new Response(offlineHTML, {
		headers: { 'Content-Type': 'text/html' },
		status: 200
	});
}

// Improved API caching strategy
workbox.routing.registerRoute(
	/\/api\/patients\/\d+$/,
	new workbox.strategies.NetworkFirst({
		cacheName: 'patient-api-cache',
		networkTimeoutSeconds: 5,
		plugins: [
			new workbox.expiration.ExpirationPlugin({
				maxEntries: 100,
				maxAgeSeconds: 60 * 60, // 1 hour
			}),
			new workbox.cacheableResponse.CacheableResponsePlugin({
				statuses: [0, 200],
			}),
		],
	}),
	'GET'
);

// Message handler for debugging
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
			entries: keys.map(key => key.url)
		};
	}

	return info;
}