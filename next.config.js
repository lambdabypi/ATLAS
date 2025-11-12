// next.config.js - FIXED VERSION with proper PWA offline support
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	// FIXED: Changed from 'service-worker.js' to 'sw.js' to match your actual SW
	sw: 'sw.js',
	disable: process.env.NODE_ENV === 'development',

	// ADDED: Custom runtime caching for your dynamic routes
	runtimeCaching: [
		// Cache your main app pages with NetworkFirst
		{
			urlPattern: /^https:\/\/.*\/(dashboard|patients|consultation|reference)$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-main-pages',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60, // 24 hours
				},
			},
		},
		// CRITICAL: Cache dynamic patient routes like /patients/1, /patients/2 etc.
		{
			urlPattern: /^https:\/\/.*\/patients\/\d+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-patient-pages',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 24 hours
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},
		// Cache consultation routes
		{
			urlPattern: /^https:\/\/.*\/consultation\/\d+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-consultation-pages',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		},
		// CRITICAL: Cache API routes for offline data access
		{
			urlPattern: /^https:\/\/.*\/api\/patients\/\d+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-patient-api',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 60 * 60, // 1 hour
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},
		// Cache consultation API routes
		{
			urlPattern: /^https:\/\/.*\/api\/consultations\/\d+$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-consultation-api',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 60 * 60, // 1 hour
				},
			},
		},
		// Cache general API routes (patients list, etc.)
		{
			urlPattern: /^https:\/\/.*\/api\/(patients|consultations|reference)$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-general-api',
				networkTimeoutSeconds: 3,
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 30 * 60, // 30 minutes
				},
			},
		},
		// Fallback for any other pages - this ensures offline access
		{
			urlPattern: /^https:\/\/.*\/.*$/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-fallback-pages',
				networkTimeoutSeconds: 5,
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		},
	],

	// ADDED: Custom fallback for offline pages
	fallbacks: {
		document: '/offline.html', // Create this file in public/
	},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// MERGED: Experimental features (Transformers.js + existing optimizations)
	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
		optimizeCss: true,
	},

	// ENHANCED: Windows-specific optimizations + Transformers.js support
	webpack: (config, { isServer, dev }) => {
		// Enable WebAssembly experiments for Transformers.js
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		// Handle .wasm files for ONNX models
		config.module.rules.push({
			test: /\.wasm$/,
			type: 'webassembly/async',
		});

		// Handle .onnx model files
		config.module.rules.push({
			test: /\.onnx$/,
			type: 'asset/resource',
		});

		// Windows path handling (existing)
		if (process.platform === 'win32') {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
			};
		}

		// ENHANCED: Handle server/client differences + Transformers.js requirements
		if (!isServer) {
			config.resolve.fallback = {
				...config.resolve.fallback,
				fs: false,
				path: false,
				crypto: false,
				stream: false,
				util: false,
				buffer: false,
				events: false,
				// Additional fallbacks for Transformers.js
				os: false,
				url: false,
				assert: false,
			};
		}

		// Optimize for development on Windows (existing)
		if (dev && process.platform === 'win32') {
			config.resolve.symlinks = false;
		}

		// Ignore specific Transformers.js warnings in development
		if (dev) {
			config.ignoreWarnings = [
				...(config.ignoreWarnings || []),
				/Critical dependency: the request of a dependency is an expression/,
				/Module not found: Error: Can't resolve 'onnxruntime-node'/,
			];
		}

		return config;
	},

	// ENHANCED: Windows-friendly headers + Transformers.js requirements + PWA headers
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
					// CORS headers for SharedArrayBuffer (required by ONNX Runtime)
					{
						key: 'Cross-Origin-Embedder-Policy',
						value: 'require-corp'
					},
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin'
					},
					// Windows-friendly CORS for development (existing)
					...(process.env.NODE_ENV === 'development' ? [
						{
							key: 'Access-Control-Allow-Origin',
							value: '*',
						},
						// Additional development headers for Transformers.js
						{
							key: 'Access-Control-Allow-Methods',
							value: 'GET, POST, PUT, DELETE, OPTIONS',
						},
						{
							key: 'Access-Control-Allow-Headers',
							value: 'Content-Type, Authorization',
						},
					] : []),
				],
			},
			// ADDED: Service worker headers for proper caching
			{
				source: '/sw.js',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=0, must-revalidate',
					},
				],
			},
			// Specific headers for model files
			{
				source: '/models/:path*',
				headers: [
					{
						key: 'Cross-Origin-Resource-Policy',
						value: 'cross-origin',
					},
				],
			},
		];
	},

	// Enable static optimization (existing)
	output: 'standalone',

	// Reduce memory usage on Windows (existing)
	typescript: {
		// Only ignore build errors in development
		ignoreBuildErrors: process.env.NODE_ENV === 'development',
	},

	eslint: {
		// Only ignore ESLint during development builds
		ignoreDuringBuilds: process.env.NODE_ENV === 'development',
	},

	// ADDED: Optimize for large model files
	onDemandEntries: {
		// Period (in ms) where the server will keep pages in the buffer
		maxInactiveAge: 25 * 1000,
		// Number of pages that should be kept simultaneously without being disposed
		pagesBufferLength: 2,
	},

	// ADDED: Handle large assets (model files can be large)
	images: {
		unoptimized: true, // Disable if you need image optimization
	},
};

module.exports = withPWA(nextConfig);