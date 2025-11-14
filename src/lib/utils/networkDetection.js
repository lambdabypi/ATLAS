// src/lib/utils/networkDetection.js - SSR-Safe robust network connectivity detection
export class NetworkDetector {
	constructor() {
		// SSR-safe initialization
		this.isOnline = typeof window !== 'undefined' ? navigator.onLine : true;
		this.lastConnectivityCheck = 0;
		this.connectivityCheckInterval = 30000; // 30 seconds
		this.fastCheckInterval = 5000; // 5 seconds when suspected offline
		this.testUrls = [
			'https://www.google.com/favicon.ico',
			'https://httpbin.org/status/200',
			'https://www.cloudflare.com/favicon.ico'
		];
		this.listeners = new Set();
		this.isChecking = false;
		this.isBrowser = typeof window !== 'undefined';

		// Only initialize in browser environment
		if (this.isBrowser) {
			this.setupEventListeners();
			this.startPeriodicChecks();
			console.log('🌐 Robust network detector initialized (browser)');
		} else {
			console.log('🌐 Network detector initialized (server-side - assuming online)');
		}
	}

	setupEventListeners() {
		if (!this.isBrowser) return;

		window.addEventListener('online', () => {
			console.log('🌐 Browser reports online - verifying...');
			this.verifyConnectivity();
		});

		window.addEventListener('offline', () => {
			console.log('📱 Browser reports offline');
			this.setOnlineStatus(false);
		});

		// Listen for failed fetch requests as an indicator
		const originalFetch = window.fetch;
		window.fetch = async (...args) => {
			try {
				const response = await originalFetch(...args);
				if (!response.ok && this.isNetworkError(response.status)) {
					this.handleNetworkError();
				}
				return response;
			} catch (error) {
				if (this.isNetworkError(error)) {
					this.handleNetworkError();
				}
				throw error;
			}
		};
	}

	isNetworkError(errorOrStatus) {
		// Check for common network error patterns
		if (typeof errorOrStatus === 'number') {
			return errorOrStatus === 0; // Network error usually returns 0
		}

		if (errorOrStatus && errorOrStatus.message) {
			const message = errorOrStatus.message.toLowerCase();
			return message.includes('failed to fetch') ||
				message.includes('network error') ||
				message.includes('internet disconnected') ||
				message.includes('connection refused') ||
				message.includes('timeout');
		}

		return false;
	}

	handleNetworkError() {
		if (!this.isBrowser) return;

		if (this.isOnline) {
			console.warn('🔍 Network error detected - checking connectivity...');
			this.verifyConnectivity();
		}
	}

	async verifyConnectivity() {
		if (!this.isBrowser || this.isChecking) return;

		this.isChecking = true;
		const now = Date.now();

		try {
			console.log('🔍 Verifying network connectivity...');

			// Try a quick, lightweight request
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const testUrl = this.testUrls[0] + '?t=' + now; // Cache busting
			const response = await fetch(testUrl, {
				method: 'HEAD',
				mode: 'no-cors',
				cache: 'no-cache',
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			// If we get here, we have connectivity
			this.setOnlineStatus(true);
			this.lastConnectivityCheck = now;

		} catch (error) {
			console.warn('🔍 Connectivity check failed:', error.message);

			// Try a fallback test
			try {
				await this.fallbackConnectivityTest();
			} catch (fallbackError) {
				console.warn('🔍 Fallback connectivity test also failed');
				this.setOnlineStatus(false);
			}
		} finally {
			this.isChecking = false;
		}
	}

	async fallbackConnectivityTest() {
		if (!this.isBrowser) return Promise.resolve();

		// Try to create a simple image request as a last resort
		return new Promise((resolve, reject) => {
			const img = new Image();
			const timeout = setTimeout(() => {
				img.onload = null;
				img.onerror = null;
				reject(new Error('Connectivity test timeout'));
			}, 3000);

			img.onload = () => {
				clearTimeout(timeout);
				this.setOnlineStatus(true);
				resolve(true);
			};

			img.onerror = () => {
				clearTimeout(timeout);
				reject(new Error('Connectivity test failed'));
			};

			img.src = 'https://www.google.com/favicon.ico?' + Date.now();
		});
	}

	setOnlineStatus(online) {
		if (this.isOnline !== online) {
			this.isOnline = online;

			if (this.isBrowser) {
				console.log(`📶 Network status changed: ${online ? 'ONLINE' : 'OFFLINE'}`);
			}

			// Notify all listeners
			this.listeners.forEach(callback => {
				try {
					callback(online);
				} catch (error) {
					if (this.isBrowser) {
						console.error('Network status callback error:', error);
					}
				}
			});
		}
	}

	startPeriodicChecks() {
		if (!this.isBrowser) return;

		const checkConnectivity = async () => {
			const now = Date.now();
			const timeSinceLastCheck = now - this.lastConnectivityCheck;

			// Check more frequently if we suspect we're offline
			const interval = this.isOnline ? this.connectivityCheckInterval : this.fastCheckInterval;

			if (timeSinceLastCheck > interval) {
				await this.verifyConnectivity();
			}
		};

		// Check every 10 seconds
		setInterval(checkConnectivity, 10000);

		// Initial check after 2 seconds
		setTimeout(() => this.verifyConnectivity(), 2000);
	}

	// Public API
	getOnlineStatus() {
		return this.isOnline;
	}

	addListener(callback) {
		this.listeners.add(callback);

		// Return unsubscribe function
		return () => {
			this.listeners.delete(callback);
		};
	}

	async forceConnectivityCheck() {
		if (!this.isBrowser) return this.isOnline;

		await this.verifyConnectivity();
		return this.isOnline;
	}
}

// SSR-safe singleton instance
let networkDetectorInstance = null;

export const getNetworkDetector = () => {
	if (!networkDetectorInstance) {
		networkDetectorInstance = new NetworkDetector();
	}
	return networkDetectorInstance;
};

// SSR-safe convenience functions
export const isOnline = () => {
	if (typeof window === 'undefined') return true; // Assume online on server
	return getNetworkDetector().getOnlineStatus();
};

export const addNetworkListener = (callback) => {
	if (typeof window === 'undefined') {
		// Return noop unsubscribe function for server-side
		return () => { };
	}
	return getNetworkDetector().addListener(callback);
};

export const checkConnectivity = () => {
	if (typeof window === 'undefined') return Promise.resolve(true);
	return getNetworkDetector().forceConnectivityCheck();
};

// Legacy export for backwards compatibility
export const networkDetector = typeof window !== 'undefined' ? getNetworkDetector() : {
	getOnlineStatus: () => true,
	addListener: () => () => { },
	forceConnectivityCheck: () => Promise.resolve(true)
};