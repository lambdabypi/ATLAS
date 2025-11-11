// src/lib/utils/serviceWorkerUtils.js
// Utilities to communicate with your enhanced service worker

export class ServiceWorkerManager {
	constructor() {
		this.sw = null;
		this.initialized = false;
	}

	async initialize() {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
			console.warn('Service Worker not supported');
			return false;
		}

		try {
			const registration = await navigator.serviceWorker.ready;
			this.sw = registration.active;
			this.initialized = true;
			console.log('✅ Service Worker ready for communication');
			return true;
		} catch (error) {
			console.error('Service Worker initialization failed:', error);
			return false;
		}
	}

	async sendMessage(type, payload = {}) {
		if (!this.initialized) {
			await this.initialize();
		}

		if (!this.sw) {
			throw new Error('Service Worker not available');
		}

		return new Promise((resolve, reject) => {
			const messageChannel = new MessageChannel();

			messageChannel.port1.onmessage = (event) => {
				if (event.data.type === type.replace('GET_', '').replace('CLEAR_', '') + '_STATUS' ||
					event.data.type === type.replace('GET_', '').replace('CLEAR_', '') + 'ED') {
					resolve(event.data.payload);
				} else {
					resolve(event.data);
				}
			};

			messageChannel.port1.onerror = (error) => {
				reject(error);
			};

			this.sw.postMessage({ type, payload }, [messageChannel.port2]);
		});
	}

	// Get current cache status
	async getCacheStatus() {
		try {
			return await this.sendMessage('GET_CACHE_STATUS');
		} catch (error) {
			console.error('Failed to get cache status:', error);
			return { error: error.message };
		}
	}

	// Clear model cache
	async clearModelCache() {
		try {
			const result = await this.sendMessage('CLEAR_MODEL_CACHE');
			console.log('Model cache cleared:', result);
			return result;
		} catch (error) {
			console.error('Failed to clear model cache:', error);
			return false;
		}
	}

	// Preload specific models
	async preloadModels(modelUrls) {
		try {
			console.log('🚀 Preloading models via Service Worker...');
			return await this.sendMessage('PRELOAD_MODELS', { models: modelUrls });
		} catch (error) {
			console.error('Failed to preload models:', error);
			return [];
		}
	}

	// Check if offline
	isOffline() {
		return typeof navigator !== 'undefined' && !navigator.onLine;
	}

	// Listen for service worker updates
	onUpdate(callback) {
		if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
			return;
		}

		navigator.serviceWorker.addEventListener('controllerchange', () => {
			callback('updated');
		});

		navigator.serviceWorker.addEventListener('message', (event) => {
			if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE') {
				callback('available');
			}
		});
	}
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Hook for React components
import { useState, useEffect } from 'react';

export function useServiceWorker() {
	const [status, setStatus] = useState({
		ready: false,
		cacheStatus: null,
		offline: !navigator?.onLine
	});

	useEffect(() => {
		const initSW = async () => {
			const ready = await serviceWorkerManager.initialize();
			if (ready) {
				const cacheStatus = await serviceWorkerManager.getCacheStatus();
				setStatus(prev => ({
					...prev,
					ready: true,
					cacheStatus
				}));
			}
		};

		initSW();

		// Listen for online/offline changes
		const handleOnline = () => setStatus(prev => ({ ...prev, offline: false }));
		const handleOffline = () => setStatus(prev => ({ ...prev, offline: true }));

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	return {
		...status,
		clearCache: serviceWorkerManager.clearModelCache,
		preloadModels: serviceWorkerManager.preloadModels,
		getCacheStatus: serviceWorkerManager.getCacheStatus
	};
}

// Usage examples for your components:
export const ServiceWorkerDemo = () => {
	const { ready, cacheStatus, offline, clearCache, preloadModels } = useServiceWorker();

	if (!ready) return <div>Loading service worker...</div>;

	return (
		<div className="service-worker-status">
			<h3>🔧 Service Worker Status</h3>

			<div className={`status-indicator ${offline ? 'offline' : 'online'}`}>
				{offline ? '📡 Offline Mode' : '🌐 Online'}
			</div>

			{cacheStatus && (
				<div className="cache-info">
					<h4>📦 Cache Status:</h4>
					{Object.entries(cacheStatus).map(([cacheName, info]) => (
						<div key={cacheName} className="cache-entry">
							<strong>{cacheName}:</strong> {info.entries} entries
							{info.size && <span> ({info.size}MB)</span>}
						</div>
					))}
				</div>
			)}

			<div className="actions">
				<button onClick={() => clearCache()}>
					🗑️ Clear Model Cache
				</button>

				<button onClick={() => preloadModels([
					'https://huggingface.co/microsoft/DialoGPT-small/resolve/main/config.json'
				])}>
					⬇️ Preload Models
				</button>
			</div>
		</div>
	);
};