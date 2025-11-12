// next.config.js - SINGLE SERVICE WORKER APPROACH
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// CRITICAL: Custom service worker to handle dynamic URLs
	sw: '/sw.js', // We'll create a custom one that next-pwa will use

	runtimeCaching: [
		// PRIORITY 1: Navigation requests (including dynamic URLs)
		{
			urlPattern: ({ request }) => request.mode === 'navigate',
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-pages',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60,
				},
				plugins: [
					{
						// Handle cache key for dynamic URLs
						cacheKeyWillBeUsed: async ({ request }) => {
							const url = new URL(request.url);

							// For consultation URLs with query params, cache separately
							if (url.pathname === '/consultation/new') {
								// Cache WITH query params to support offline
								return request.url;
							}

							// For dynamic patient IDs, use base route
							if (url.pathname.match(/\/patients\/\d+/)) {
								return `${url.origin}/patients/[id]`;
							}

							return request.url;
						},

						// Fallback strategy for failed requests
						handlerDidError: async ({ request, event, error }) => {
							console.log('Navigation failed:', request.url, error);

							const url = new URL(request.url);
							const cache = await caches.open('atlas-pages');

							// Try fallback chain
							const fallbacks = [
								// 1. Try base route without query params
								`${url.origin}${url.pathname}`,
								// 2. Try consultation base
								`${url.origin}/consultation/new`,
								// 3. Try dashboard
								`${url.origin}/dashboard`,
								// 4. Try home
								`${url.origin}/`
							];

							for (const fallbackUrl of fallbacks) {
								const response = await cache.match(fallbackUrl);
								if (response) {
									console.log('Using fallback:', fallbackUrl);
									return response;
								}
							}

							// Return offline page
							return cache.match('/offline.html') ||
								generateOfflinePage(url);
						}
					}
				]
			}
		},

		// PRIORITY 2: API requests
		{
			urlPattern: /\/api\/.*/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 5 * 60, // 5 minutes
				},
				plugins: [
					{
						handlerDidError: async () => {
							return new Response(JSON.stringify({
								error: 'offline',
								message: 'API not available offline'
							}), {
								status: 503,
								headers: { 'Content-Type': 'application/json' }
							});
						}
					}
				]
			}
		},

		// PRIORITY 3: Next.js static files
		{
			urlPattern: /\/_next\/static\/.*/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'next-static',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 365 * 24 * 60 * 60,
				},
			},
		},

		// PRIORITY 4: Images and assets
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
	],
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
		];
	},

	images: {
		unoptimized: true,
	},
};

module.exports = withPWA(nextConfig);

function generateOfflinePage(url) {
	return new Response(`
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
				p { margin-bottom: 1rem; opacity: 0.9; }
				.btn { 
					display: inline-block; margin: 0.5rem; padding: 1rem 2rem; 
					background: rgba(255,255,255,0.2); color: white; 
					text-decoration: none; border-radius: 0.5rem; 
					border: 1px solid rgba(255,255,255,0.3);
					transition: background 0.2s;
				}
				.btn:hover { background: rgba(255,255,255,0.3); }
			</style>
		</head>
		<body>
			<div class="container">
				<div class="logo">🏥</div>
				<h1>ATLAS Offline</h1>
				<p>This page isn't available offline yet.</p>
				<p><strong>Requested:</strong> ${url.pathname}${url.search}</p>
				<div style="margin-top: 2rem;">
					<a href="/dashboard" class="btn">Dashboard</a>
					<a href="/patients" class="btn">Patients</a>
					<a href="javascript:location.reload()" class="btn">Retry</a>
				</div>
			</div>
			<script>
				window.addEventListener('online', () => {
					setTimeout(() => location.reload(), 1000);
				});
			</script>
		</body>
		</html>
	`, {
		status: 200,
		headers: { 'Content-Type': 'text/html' }
	});
}