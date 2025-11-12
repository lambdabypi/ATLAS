// next.config.js - FIXED VERSION (Removes invalid customWorkerPath)
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

	// ENHANCED: Better offline fallbacks (FIXED - removed invalid options)
	fallbacks: {
		document: '/offline',
		// Note: Only add these if you have the actual files
		// image: '/icons/offline-fallback.png',
		// audio: '/audio/offline-message.mp3', 
		// video: '/video/offline-placeholder.mp4',
		// font: '/fonts/fallback-font.woff2'
	},

	// REMOVED: customWorkerPath - not valid for GenerateSW strategy

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
		];
	},

	images: {
		unoptimized: true,
	},
};

module.exports = withPWA(nextConfig);