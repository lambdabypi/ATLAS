// next.config.js - FIXED VERSION - Compatible with all next-pwa versions
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development',

	// SIMPLIFIED - Remove problematic configurations
	// Let next-pwa handle defaults
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,
	swcMinify: true,

	// Remove output: 'export' - this was causing issues
	// Keep as regular Next.js app for Vercel deployment

	experimental: {
		serverComponentsExternalPackages: ['@xenova/transformers'],
	},

	webpack: (config, { isServer, dev }) => {
		// Webpack optimizations
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
						value: 'application/json',
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