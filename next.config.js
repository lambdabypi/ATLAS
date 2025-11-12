// next.config.js - ENHANCED for RSC Offline Support
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// CRITICAL: Enhanced runtime caching for Next.js RSC
	runtimeCaching: [
		// FIXED: Handle Next.js RSC payloads specifically
		{
			urlPattern: /\/_next\/static\/chunks\/.*\.js$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'next-chunks',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
				},
			},
		},
		{
			urlPattern: /\/_next\/static\/.*$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'next-static-assets',
				expiration: {
					maxEntries: 300,
					maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
				},
			},
		},
		// CRITICAL: RSC payload caching with fallback
		{
			urlPattern: /^https:\/\/.*\?.*_rsc=.*$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'next-rsc-payloads',
				networkTimeoutSeconds: 2, // Quick timeout
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				plugins: [
					{
						// FIXED: Custom RSC fallback
						handlerDidError: async () => {
							// Return minimal RSC response that won't break Next.js
							return new Response('null', {
								status: 200,
								headers: {
									'Content-Type': 'text/x-component',
									'Cache-Control': 'no-cache'
								}
							});
						},
					},
				],
			},
		},
		// Navigation requests (pages)
		{
			urlPattern: /^https:\/\/.*\/(?:dashboard|patients|consultation|reference|testing)(?:\/.*)?$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-pages',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				plugins: [
					{
						// FIXED: Page fallback with error handling
						handlerDidError: async ({ request }) => {
							const cache = await caches.open('atlas-pages');
							// Try to find any cached page as fallback
							const cachedResponse = await cache.match(request) ||
								await cache.match('/dashboard') ||
								await cache.match('/');
							if (cachedResponse) {
								return cachedResponse;
							}
							// Final fallback - return offline page or basic HTML
							return new Response(`
                                <!DOCTYPE html>
                                <html>
                                <head><title>ATLAS - Offline</title></head>
                                <body>
                                    <h1>🏥 ATLAS Offline</h1>
                                    <p>You're offline. Core features are still available.</p>
                                    <script>
                                        if ('serviceWorker' in navigator) {
                                            // Try to reload when back online
                                            navigator.serviceWorker.addEventListener('message', e => {
                                                if (e.data.type === 'BACK_ONLINE') {
                                                    window.location.reload();
                                                }
                                            });
                                        }
                                        
                                        window.addEventListener('online', () => {
                                            window.location.reload();
                                        });
                                    </script>
                                </body>
                                </html>
                            `, {
								headers: { 'Content-Type': 'text/html' }
							});
						}
					}
				]
			},
		},
		// API routes
		{
			urlPattern: /\/api\/.*$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60, // 1 hour
				},
			},
		},
		// Images and static assets
		{
			urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-images',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
				},
			},
		}
	],

	// ENHANCED: Better offline fallbacks
	fallbacks: {
		document: '/offline',
	},

	// FIXED: Exclude problematic files from precaching
	buildExcludes: [
		/middleware-manifest\.json$/,
		/_buildManifest\.js$/,
		/_ssgManifest\.js$/,
		/\.map$/,
		/^build-manifest\.json$/,
		/chunks\/.*\.js$/,  // Let runtime caching handle these
	]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
	},

	webpack: (config, { isServer, dev }) => {
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

	// ENHANCED: Headers for better PWA caching
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
						value: 'public, max-age=86400, must-revalidate', // 1 day
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
				],
			},
			// FIXED: Better caching for static assets
			{
				source: '/_next/static/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
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