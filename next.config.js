// next.config.js - FIXED VERSION
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// Use custom service worker
	sw: 'sw.js',

	// CRITICAL: Disable automatic precaching (it's causing 404 errors)
	runtimeCaching: [],

	// Don't include these in precache manifest
	buildExcludes: [
		/middleware-manifest\.json$/,
		/app-build-manifest\.json$/,
		/_buildManifest\.js$/,
		/_ssgManifest\.js$/,
	],

	// Reduce logging
	cacheOnFrontEndNav: true,
	reloadOnOnline: false,
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
						value: 'public, max-age=3600',
					},
				],
			},
			{
				source: '/sw.js',
				headers: [
					{
						key: 'Content-Type',
						value: 'application/javascript; charset=utf-8',
					},
					{
						key: 'Cache-Control',
						value: 'no-cache, no-store, must-revalidate',
					},
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