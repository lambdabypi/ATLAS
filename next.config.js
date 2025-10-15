// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
	// Enable detailed logging for development
	logging: {
		fetches: {
			fullUrl: true,
		},
	},
};

module.exports = nextConfig;