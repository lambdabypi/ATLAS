// lib/debug/fetchLogger.js
let originalFetch;

export function enableFetchLogging() {
	if (typeof window === 'undefined') return; // Only run on client side

	if (!originalFetch) {
		originalFetch = window.fetch;
	}

	window.fetch = async function (url, options = {}) {
		const startTime = Date.now();
		const timestamp = new Date().toISOString();

		console.log('\n📡 FETCH REQUEST:', {
			timestamp,
			url: typeof url === 'string' ? url : url.toString(),
			method: options.method || 'GET',
			headers: options.headers,
			body: options.body ? JSON.stringify(options.body).substring(0, 200) + '...' : undefined,
			stack: new Error().stack.split('\n').slice(1, 6) // Show call stack
		});

		try {
			const response = await originalFetch(url, options);
			const duration = Date.now() - startTime;

			console.log('📡 FETCH RESPONSE:', {
				url: typeof url === 'string' ? url : url.toString(),
				status: response.status,
				statusText: response.statusText,
				duration: `${duration}ms`,
				headers: Object.fromEntries(response.headers.entries())
			});

			// Special logging for consultation endpoints
			const urlString = typeof url === 'string' ? url : url.toString();
			if (urlString.includes('consultation')) {
				console.log('🎯 CONSULTATION API CALL:', {
					url: urlString,
					method: options.method || 'GET',
					status: response.status,
					isError: !response.ok
				});
			}

			return response;
		} catch (error) {
			const duration = Date.now() - startTime;
			console.error('📡 FETCH ERROR:', {
				url: typeof url === 'string' ? url : url.toString(),
				error: error.message,
				duration: `${duration}ms`,
				stack: error.stack
			});
			throw error;
		}
	};
}

export function disableFetchLogging() {
	if (typeof window !== 'undefined' && originalFetch) {
		window.fetch = originalFetch;
	}
}