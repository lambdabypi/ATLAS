// next.config.js - Enhanced PWA configuration
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// ENHANCED: Better caching strategies
	runtimeCaching: [
		{
			urlPattern: /^https?.*/, // Match all external resources
			handler: 'NetworkFirst',
			options: {
				cacheName: 'offlineCache',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
				},
				networkTimeoutSeconds: 3, // Quick fallback to cache
			},
		},
		{
			urlPattern: /\/api\/.*/, // API routes
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api-cache',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				networkTimeoutSeconds: 5,
				plugins: [
					{
						cacheKeyWillBeUsed: async ({ request }) => {
							// Custom cache key for API requests
							return `${request.url}-${Date.now() % (24 * 60 * 60 * 1000)}`;
						}
					}
				]
			},
		},
		{
			urlPattern: /\/_next\/static\/.*/, // Next.js static assets
			handler: 'CacheFirst',
			options: {
				cacheName: 'next-static',
				expiration: {
					maxEntries: 500,
					maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
				},
			},
		},
		{
			urlPattern: /\/dashboard/, // Critical pages
			handler: 'StaleWhileRevalidate',
			options: {
				cacheName: 'atlas-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
				},
			},
		},
		{
			urlPattern: /\/patients\/.*/, // Dynamic patient pages
			handler: 'NetworkFirst',
			options: {
				cacheName: 'patient-pages',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				networkTimeoutSeconds: 3,
			},
		},
		{
			urlPattern: /\/consultation\/.*/, // Consultation pages
			handler: 'NetworkFirst',
			options: {
				cacheName: 'consultation-pages',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 1 day
				},
				networkTimeoutSeconds: 3,
			},
		}
	],

	// ENHANCED: Better offline fallbacks
	fallbacks: {
		document: '/offline',
		image: '/icons/offline-fallback.png',
		audio: '/audio/offline-message.mp3',
		video: '/video/offline-placeholder.mp4',
		font: '/fonts/fallback-font.woff2'
	},

	// ENHANCED: Custom worker
	customWorkerPath: '/sw.js',

	// PWA configuration for better offline experience
	buildExcludes: [
		/middleware-manifest\.json$/,
		/_buildManifest\.js$/,
		/_ssgManifest\.js$/,
		/\.map$/,
		/^build-manifest\.json$/
	]
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,

	// Essential for offline-first apps
	trailingSlash: false,

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
		// Better offline handling
		workerThreads: false,
		cpus: 1
	},

	webpack: (config, { isServer, dev }) => {
		// Enhanced webpack optimizations for offline
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
				stream: false,
				buffer: false,
			};

			// Optimize for offline loading
			config.optimization = {
				...config.optimization,
				splitChunks: {
					...config.optimization.splitChunks,
					cacheGroups: {
						default: false,
						vendors: false,
						// Critical vendor bundle
						vendor: {
							chunks: 'all',
							name: 'vendor',
							test: /[\\/]node_modules[\\/]/,
							enforce: true
						},
						// Atlas-specific bundle
						atlas: {
							chunks: 'all',
							name: 'atlas-core',
							test: /[\\/]src[\\/](lib|components)[\\/]/,
							enforce: true,
							priority: 10
						}
					}
				}
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
					// ENHANCED: Better PWA caching
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
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
						value: 'public, max-age=0, must-revalidate',
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
						key: 'Service-Worker-Allowed',
						value: '/',
					},
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, must-revalidate',
					},
				],
			},
			// ENHANCED: API route caching
			{
				source: '/api/(.*)',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, s-maxage=60, stale-while-revalidate=300',
					},
				],
			},
		];
	},

	// ENHANCED: Better image optimization for offline
	images: {
		unoptimized: true,
		formats: ['image/webp', 'image/avif'],
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
	},

	// ENHANCED: Redirects for better offline handling
	async redirects() {
		return [
			{
				source: '/home',
				destination: '/dashboard',
				permanent: true,
			},
			// Add more redirects as needed
		];
	},

	// ENHANCED: Rewrites for offline API fallbacks
	async rewrites() {
		return {
			beforeFiles: [],
			afterFiles: [
				// Offline API fallbacks
				{
					source: '/api/offline/:path*',
					destination: '/api/offline',
				},
			],
			fallback: [],
		};
	},
};

module.exports = withPWA(nextConfig);