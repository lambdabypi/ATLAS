// next.config.js - MERGED VERSION with Transformers.js support
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

	// ENHANCED: Windows-friendly headers + Transformers.js requirements
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