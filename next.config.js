// next.config.js - AGGRESSIVE OFFLINE VERSION
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	sw: 'sw.js',
	disable: process.env.NODE_ENV === 'development',

	// SIMPLIFIED runtime caching - avoid RSC conflicts
	runtimeCaching: [
		// 1. Main navigation - CacheFirst for instant offline
		{
			urlPattern: ({ request }) => request.mode === 'navigate',
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60, // 24 hours
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},

		// 2. RSC requests - Special handling with fallbacks
		{
			urlPattern: ({ url }) => url.searchParams.has('_rsc'),
			handler: async ({ event, url }) => {
				try {
					// Try network first for RSC
					const response = await fetch(event.request);
					return response;
				} catch (error) {
					console.log('RSC request failed, providing fallback');

					// Return a minimal RSC response that won't break the app
					return new Response('null', {
						status: 200,
						headers: {
							'Content-Type': 'text/x-component',
							'Cache-Control': 'no-cache'
						}
					});
				}
			}
		},

		// 3. Static assets - StaleWhileRevalidate
		{
			urlPattern: /\/_next\/static\/.*/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-static',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
				},
			},
		},

		// 4. API routes - NetworkFirst with timeout
		{
			urlPattern: /^https:\/\/.*\/api\/.*/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 60 * 60, // 1 hour
				},
			},
		},

		// 5. Same-origin requests - CacheFirst
		{
			urlPattern: ({ url }) => url.origin === self.location.origin,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-same-origin',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		},
	],

	fallbacks: {
		document: '/offline.html',
		image: '/icons/offline-image.png'
	},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// Force static export to avoid RSC issues
	output: 'export',
	trailingSlash: true,
	images: { unoptimized: true },

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
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
						key: 'Cache-Control',
						value: 'public, max-age=3600, must-revalidate',
					},
				],
			},
			{
				source: '/manifest.json',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/json',
					},
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, must-revalidate',
					},
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
				],
			},
		];
	},
};

module.exports = withPWA(nextConfig);