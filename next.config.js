// next.config.js - Simplified PWA config
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// Use our custom service worker
	sw: 'sw.js',

	// Disable workbox's default runtime caching (we handle it in sw.js)
	runtimeCaching: [],

	// Build service worker for production
	buildExcludes: [/middleware-manifest\.json$/],
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
			// Ensure service worker is served with correct headers
			{
				source: '/sw.js',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/javascript',
					},
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
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