// next.config.js - FIXED VERSION (removed invalid 'api' key)
const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	sw: 'service-worker.js',
	disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
	reactStrictMode: true,

	// Windows-specific optimizations
	webpack: (config, { isServer, dev }) => {
		// Windows path handling
		if (process.platform === 'win32') {
			config.watchOptions = {
				poll: 1000,
				aggregateTimeout: 300,
			};
		}

		// Handle server/client differences
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
			};
		}

		// Optimize for development on Windows
		if (dev && process.platform === 'win32') {
			config.resolve.symlinks = false;
		}

		return config;
	},

	// REMOVED: api configuration (not valid in newer Next.js)
	// API configuration now goes in individual API route files

	// Windows-friendly headers
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
					// Windows-friendly CORS for development
					...(process.env.NODE_ENV === 'development' ? [
						{
							key: 'Access-Control-Allow-Origin',
							value: '*',
						},
					] : []),
				],
			},
		];
	},

	// Enable static optimization
	output: 'standalone',

	// Windows performance optimizations
	experimental: {
		optimizeCss: true,
	},

	// Reduce memory usage on Windows
	typescript: {
		// Only ignore build errors in development
		ignoreBuildErrors: process.env.NODE_ENV === 'development',
	},

	eslint: {
		// Only ignore ESLint during development builds
		ignoreDuringBuilds: process.env.NODE_ENV === 'development',
	},
};

module.exports = withPWA(nextConfig);