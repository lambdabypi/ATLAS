// next.config.js - AGGRESSIVE OFFLINE VERSION
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	sw: 'sw.js',
	disable: process.env.NODE_ENV === 'development',

	// AGGRESSIVE runtime caching for better offline support
	runtimeCaching: [
		// 1. Handle ALL navigation requests with CacheFirst for instant offline
		{
			urlPattern: ({ request }) => request.mode === 'navigate',
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-navigation',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60, // 24 hours
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},

		// 2. RSC requests - CacheFirst with fallback
		{
			urlPattern: ({ url }) => url.searchParams.has('_rsc'),
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-rsc',
				expiration: {
					maxEntries: 300,
					maxAgeSeconds: 60 * 60, // 1 hour
				},
				plugins: [
					{
						handlerDidError: async () => {
							console.log('RSC request failed, providing fallback');
							return new Response('null', {
								status: 200,
								headers: { 'Content-Type': 'text/x-component' }
							});
						},
					},
				],
			},
		},

		// 3. Main app pages - CacheFirst for instant offline
		{
			urlPattern: /^https:\/\/.*\/(dashboard|patients|consultation|reference|testing)$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-main-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60,
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},

		// 4. Dynamic patient routes - CacheFirst
		{
			urlPattern: /^https:\/\/.*\/patients\/\d+$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-patient-pages',
				expiration: {
					maxEntries: 100,
					maxAgeSeconds: 24 * 60 * 60,
				},
				cacheableResponse: {
					statuses: [0, 200],
				},
			},
		},

		// 5. Consultation routes - CacheFirst
		{
			urlPattern: /^https:\/\/.*\/consultation\/\d+$/,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-consultation-pages',
				expiration: {
					maxEntries: 50,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		},

		// 6. API routes - NetworkFirst with short timeout, then cache
		{
			urlPattern: /^https:\/\/.*\/api\/.*/,
			handler: 'NetworkFirst',
			options: {
				cacheName: 'atlas-api',
				networkTimeoutSeconds: 2, // Shorter timeout
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 60 * 60,
				},
				plugins: [
					{
						handlerDidError: async () => {
							return new Response('{"error": "offline", "data": null}', {
								status: 503,
								headers: { 'Content-Type': 'application/json' }
							});
						},
					},
				],
			},
		},

		// 7. Catch-all - CacheFirst for any other same-origin requests
		{
			urlPattern: ({ url }) => url.origin === self.location.origin,
			handler: 'CacheFirst',
			options: {
				cacheName: 'atlas-catch-all',
				expiration: {
					maxEntries: 200,
					maxAgeSeconds: 24 * 60 * 60,
				},
			},
		},
	],

	fallbacks: {
		document: '/offline.html',
	},
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
		optimizeCss: true,
	},

	webpack: (config, { isServer, dev }) => {
		config.experiments = {
			...config.experiments,
			asyncWebAssembly: true,
		};

		config.module.rules.push({
			test: /\.wasm$/,
			type: 'webassembly/async',
		});

		config.module.rules.push({
			test: /\.onnx$/,
			type: 'asset/resource',
		});

		if (process.platform === 'win32') {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
			};
		}

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
				os: false,
				url: false,
				assert: false,
			};
		}

		if (dev && process.platform === 'win32') {
			config.resolve.symlinks = false;
		}

		if (dev) {
			config.ignoreWarnings = [
				...(config.ignoreWarnings || []),
				/Critical dependency: the request of a dependency is an expression/,
				/Module not found: Error: Can't resolve 'onnxruntime-node'/,
			];
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
					{
						key: 'Cross-Origin-Embedder-Policy',
						value: 'require-corp'
					},
					{
						key: 'Cross-Origin-Opener-Policy',
						value: 'same-origin'
					},
					...(process.env.NODE_ENV === 'development' ? [
						{
							key: 'Access-Control-Allow-Origin',
							value: '*',
						},
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
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
				],
			},
			{
				source: '/icons/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000',
					},
					{
						key: 'Access-Control-Allow-Origin',
						value: '*',
					},
				],
			},
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

	output: 'standalone',

	typescript: {
		ignoreBuildErrors: process.env.NODE_ENV === 'development',
	},

	eslint: {
		ignoreDuringBuilds: process.env.NODE_ENV === 'development',
	},

	onDemandEntries: {
		maxInactiveAge: 25 * 1000,
		pagesBufferLength: 2,
	},

	images: {
		unoptimized: true,
	},
};

module.exports = withPWA(nextConfig);