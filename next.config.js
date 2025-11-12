// next.config.js - FIXED Navigation Handling
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// CRITICAL: Reordered and enhanced caching strategies
	runtimeCaching: [
		// PRIORITY 1: Handle navigation requests (page loads/reloads) FIRST
		{
			urlPattern: ({ request }) => request.mode === 'navigate',
			handler: 'CacheFirst', // Changed to CacheFirst for instant offline loading
			options: {
				cacheName: 'atlas-navigation',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				plugins: [
					{
						// CRITICAL: Navigation fallback strategy
						cacheKeyWillBeUsed: async ({ request }) => {
							// For dynamic routes, use base route as cache key
							const url = new URL(request.url);
							let pathname = url.pathname;

							// Map dynamic routes to their base routes
							if (pathname.includes('/consultation/new')) {
								return `${url.origin}/consultation/new`;
							}
							if (pathname.match(/\/patients\/\d+/)) {
								return `${url.origin}/patients/1`; // Use cached patient page
							}
							if (pathname.match(/\/consultation\/\d+/)) {
								return `${url.origin}/consultation/new`; // Fallback to new consultation
							}

							return request.url;
						},

						cacheWillUpdate: async ({ response }) => {
							// Cache successful HTML responses
							return response.status === 200 &&
								response.headers.get('content-type')?.includes('text/html');
						},

						handlerDidError: async ({ request }) => {
							console.log('🔄 Navigation fallback for:', request.url);
							const url = new URL(request.url);
							const pathname = url.pathname;

							// Try progressive fallbacks
							const cache = await caches.open('atlas-navigation');

							// 1. Try exact match
							let fallback = await cache.match(request.url);
							if (fallback) return fallback;

							// 2. Try base route for dynamic routes
							if (pathname.includes('/consultation')) {
								fallback = await cache.match(`${url.origin}/consultation`) ||
									await cache.match(`${url.origin}/consultation/new`);
								if (fallback) return fallback;
							}

							if (pathname.includes('/patients')) {
								fallback = await cache.match(`${url.origin}/patients`);
								if (fallback) return fallback;
							}

							// 3. Try dashboard as ultimate fallback
							fallback = await cache.match(`${url.origin}/dashboard`);
							if (fallback) return fallback;

							// 4. Try root as last resort
							fallback = await cache.match(`${url.origin}/`);
							if (fallback) return fallback;

							// 5. Final fallback - custom offline page
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
                                        .container { background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 1rem; }
                                        .logo { font-size: 3rem; margin-bottom: 1rem; }
                                        .btn { 
                                            background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
                                            padding: 1rem 2rem; border-radius: 0.5rem; text-decoration: none; 
                                            display: inline-block; margin-top: 1rem;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <div class="container">
                                        <div class="logo">🏥</div>
                                        <h1>ATLAS Offline</h1>
                                        <p>This page isn't cached yet. Try accessing it online first.</p>
                                        <p><strong>Requested:</strong> ${pathname}</p>
                                        <a href="/dashboard" class="btn">Go to Dashboard</a>
                                        <a href="javascript:location.reload()" class="btn">Retry</a>
                                    </div>
                                    <script>
                                        // Auto-reload when back online
                                        window.addEventListener('online', () => location.reload());
                                        
                                        // Try to redirect to cached pages
                                        if ('caches' in window) {
                                            caches.match('/dashboard').then(response => {
                                                if (response && !navigator.onLine) {
                                                    setTimeout(() => window.location.href = '/dashboard', 3000);
                                                }
                                            });
                                        }
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
					}
				]
			}
		},

		// PRIORITY 2: Handle Next.js static assets
		{
			urlPattern: /\/_next\/static\/.*$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'next-static',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 365 * 24 * 60 * 60,
				},
			},
		},

		// PRIORITY 3: Handle API requests
		{
			urlPattern: /\/api\/.*$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60,
				},
				plugins: [
					{
						handlerDidError: async () => {
							return new Response(JSON.stringify({
								error: 'offline',
								message: 'This API is not available offline. Data will sync when online.'
							}), {
								status: 503,
								headers: { 'Content-Type': 'application/json' }
							});
						}
					}
				]
			},
		},

		// PRIORITY 4: Handle images and assets
		{
			urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-assets',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 30 * 24 * 60 * 60,
				},
			},
		},

		// PRIORITY 5: Catch-all for any other requests
		{
			urlPattern: /^https?:\/\/.*/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-general',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		}
	],

	// Remove fallbacks since we handle it in the navigation handler
	// fallbacks: {
	//     document: '/offline',
	// },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
	},

	webpack: (config, { isServer }) => {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				crypto: false,
			};
		}

		return config;
	},

	async headers() {
		return [
			{
				source: '/(.*)',
				headers: [
					{
						key: 'X-Frame-Options',
						value: 'DENY',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
				],
			},
			{
				source: '/manifest.json',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/manifest+json',
					},
					{
						key: 'Cache-Control',
						value: 'public, max-age=86400, must-revalidate',
					},
				],
			},
			{
				source: '/sw.js',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/javascript',
					},
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, must-revalidate',
					},
					// CRITICAL: Allow service worker to control navigation
					{
						key: 'Service-Worker-Allowed',
						value: '/',
					},
				],
			},
		];
	},

	images: {
		unoptimized: true,
	},
};

module.exports = withPWA(nextConfig);