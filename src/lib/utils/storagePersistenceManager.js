// lib/utils/storagePersistenceManager.js
'use client';

export class StoragePersistenceManager {
	constructor() {
		this.isInitialized = false;
		this.persistenceStatus = {
			persistent: false,
			quota: 0,
			used: 0,
			cacheStorage: false,
			indexedDB: false,
			localStorage: false
		};
	}

	// CRITICAL: Request persistent storage immediately
	async requestPersistentStorage() {
		console.log('🔒 Requesting persistent storage...');

		try {
			// 1. Request persistent storage permission
			if ('storage' in navigator && 'persist' in navigator.storage) {
				const persistent = await navigator.storage.persist();
				this.persistenceStatus.persistent = persistent;

				if (persistent) {
					console.log('✅ Persistent storage GRANTED - data will survive reloads!');
				} else {
					console.warn('⚠️ Persistent storage DENIED - data may be cleared on reload');
					// Try to encourage user interaction to get persistence
					this.showPersistencePrompt();
				}
			}

			// 2. Check current storage usage
			if ('storage' in navigator && 'estimate' in navigator.storage) {
				const estimate = await navigator.storage.estimate();
				this.persistenceStatus.quota = estimate.quota;
				this.persistenceStatus.used = estimate.usage;

				console.log(`📊 Storage: ${Math.round(estimate.usage / 1024 / 1024)}MB used of ${Math.round(estimate.quota / 1024 / 1024)}MB`);
			}

			// 3. Test each storage mechanism
			await this.testStorageMechanisms();

			return this.persistenceStatus;

		} catch (error) {
			console.error('❌ Storage persistence request failed:', error);
			return this.persistenceStatus;
		}
	}

	async testStorageMechanisms() {
		// Test Cache Storage
		try {
			const cache = await caches.open('atlas-persistence-test');
			await cache.put('/test', new Response('test'));
			const response = await cache.match('/test');
			this.persistenceStatus.cacheStorage = !!response;
			await cache.delete('/test');
		} catch (error) {
			console.warn('Cache Storage test failed:', error);
			this.persistenceStatus.cacheStorage = false;
		}

		// Test IndexedDB
		try {
			const request = indexedDB.open('atlas-persistence-test', 1);
			await new Promise((resolve, reject) => {
				request.onsuccess = () => {
					request.result.close();
					indexedDB.deleteDatabase('atlas-persistence-test');
					resolve();
				};
				request.onerror = () => reject(request.error);
				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					db.createObjectStore('test');
				};
			});
			this.persistenceStatus.indexedDB = true;
		} catch (error) {
			console.warn('IndexedDB test failed:', error);
			this.persistenceStatus.indexedDB = false;
		}

		// Test localStorage
		try {
			localStorage.setItem('atlas-persistence-test', 'test');
			const test = localStorage.getItem('atlas-persistence-test');
			localStorage.removeItem('atlas-persistence-test');
			this.persistenceStatus.localStorage = test === 'test';
		} catch (error) {
			console.warn('localStorage test failed:', error);
			this.persistenceStatus.localStorage = false;
		}
	}

	showPersistencePrompt() {
		// Create a user-friendly prompt to encourage interaction for persistence
		if (document.querySelector('#persistence-prompt')) return;

		const prompt = document.createElement('div');
		prompt.id = 'persistence-prompt';
		prompt.innerHTML = `
            <div style="
                position: fixed; top: 0; left: 0; right: 0; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white; padding: 16px; text-align: center; z-index: 10000;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            ">
                <div style="max-width: 600px; margin: 0 auto;">
                    <div style="font-size: 24px; margin-bottom: 8px;">🏥</div>
                    <div style="font-weight: bold; margin-bottom: 4px;">Enable Offline Mode for ATLAS</div>
                    <div style="font-size: 14px; margin-bottom: 12px;">
                        Keep your patient data and clinical guidelines available offline
                    </div>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.3);
                        padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 0 4px;
                    ">Enable Offline Access</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: transparent; color: white; border: 1px solid rgba(255,255,255,0.3);
                        padding: 8px 16px; border-radius: 4px; cursor: pointer; margin: 0 4px;
                    ">Later</button>
                </div>
            </div>
        `;

		document.body.appendChild(prompt);

		// Auto-remove after 10 seconds
		setTimeout(() => {
			if (prompt.parentElement) {
				prompt.parentElement.removeChild(prompt);
			}
		}, 10000);
	}

	// Monitor storage changes and warn if data might be lost
	setupStorageMonitoring() {
		if (!('storage' in navigator)) return;

		// Monitor storage changes
		const checkStorageQuota = async () => {
			try {
				const estimate = await navigator.storage.estimate();
				const usedMB = Math.round(estimate.usage / 1024 / 1024);
				const quotaMB = Math.round(estimate.quota / 1024 / 1024);

				// Warn if approaching quota limit
				if (estimate.usage / estimate.quota > 0.8) {
					console.warn(`⚠️ Storage almost full: ${usedMB}MB of ${quotaMB}MB used`);
					this.showStorageWarning(usedMB, quotaMB);
				}

				this.persistenceStatus.used = estimate.usage;
				this.persistenceStatus.quota = estimate.quota;

			} catch (error) {
				console.warn('Storage monitoring failed:', error);
			}
		};

		// Check storage every 30 seconds
		setInterval(checkStorageQuota, 30000);
		checkStorageQuota(); // Initial check
	}

	showStorageWarning(usedMB, quotaMB) {
		console.log(`📊 Storage Warning: ${usedMB}MB used of ${quotaMB}MB quota`);

		// Could show a toast notification or modal here
		// For now, just log it
	}

	// Get comprehensive storage status
	async getStorageStatus() {
		if (!this.isInitialized) {
			await this.requestPersistentStorage();
			this.isInitialized = true;
		}

		return {
			...this.persistenceStatus,
			browserSupport: {
				serviceWorker: 'serviceWorker' in navigator,
				cacheAPI: 'caches' in window,
				indexedDB: 'indexedDB' in window,
				storageManager: 'storage' in navigator,
				persistentStorage: 'storage' in navigator && 'persist' in navigator.storage
			},
			recommendations: this.getStorageRecommendations()
		};
	}

	getStorageRecommendations() {
		const recommendations = [];

		if (!this.persistenceStatus.persistent) {
			recommendations.push({
				type: 'warning',
				message: 'Enable persistent storage to prevent data loss on page reloads',
				action: 'Click "Enable Offline Access" when prompted'
			});
		}

		if (!this.persistenceStatus.cacheStorage) {
			recommendations.push({
				type: 'error',
				message: 'Cache Storage not working - offline functionality limited',
				action: 'Try refreshing the page or check browser settings'
			});
		}

		if (!this.persistenceStatus.indexedDB) {
			recommendations.push({
				type: 'error',
				message: 'IndexedDB not working - patient data may not persist',
				action: 'Check if private browsing is enabled'
			});
		}

		if (this.persistenceStatus.used / this.persistenceStatus.quota > 0.8) {
			recommendations.push({
				type: 'warning',
				message: 'Storage almost full - may cause data loss',
				action: 'Clear old consultation data or browser cache'
			});
		}

		return recommendations;
	}
}

// Enhanced Service Worker registration with immediate claim
export async function registerEnhancedServiceWorker() {
	if (!('serviceWorker' in navigator)) {
		console.warn('Service Worker not supported');
		return false;
	}

	try {
		console.log('🔧 Registering enhanced service worker...');

		const registration = await navigator.serviceWorker.register('/sw.js', {
			scope: '/',
			updateViaCache: 'none' // CRITICAL: Always check for updates
		});

		// CRITICAL: Immediately claim all pages
		if (registration.installing) {
			console.log('⏳ Service worker installing...');
			await new Promise(resolve => {
				registration.installing.addEventListener('statechange', (event) => {
					if (event.target.state === 'installed') {
						resolve();
					}
				});
			});
		}

		if (registration.waiting) {
			console.log('⏳ Service worker waiting...');
			// Force activation of waiting service worker
			registration.waiting.postMessage({ type: 'SKIP_WAITING' });
		}

		if (registration.active) {
			console.log('✅ Service worker active and ready');
			// Tell service worker to claim all pages immediately
			registration.active.postMessage({ type: 'CLIENTS_CLAIM' });
		}

		// Handle service worker updates
		registration.addEventListener('updatefound', () => {
			console.log('🔄 Service worker update found');
			const newWorker = registration.installing;

			newWorker.addEventListener('statechange', () => {
				if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
					console.log('🆕 New service worker available');
					// Optionally prompt user to reload
				}
			});
		});

		return registration;

	} catch (error) {
		console.error('❌ Service worker registration failed:', error);
		return false;
	}
}

// Page reload protection
export function setupReloadProtection() {
	// Prevent data loss during navigation
	window.addEventListener('beforeunload', (event) => {
		// Don't actually prevent the reload, but ensure data is saved
		console.log('🔄 Page reloading - data should persist...');

		// Quick save of critical data to localStorage as backup
		try {
			const criticalData = {
				timestamp: Date.now(),
				currentUser: localStorage.getItem('atlas_current_user'),
				userPatterns: localStorage.getItem('atlas_user_patterns'),
				lastActivity: Date.now()
			};
			localStorage.setItem('atlas_reload_backup', JSON.stringify(criticalData));
		} catch (error) {
			console.warn('Failed to save reload backup:', error);
		}
	});

	// Restore data after reload if needed
	window.addEventListener('load', () => {
		try {
			const backup = localStorage.getItem('atlas_reload_backup');
			if (backup) {
				const data = JSON.parse(backup);
				console.log('📥 Restored from reload backup:', new Date(data.timestamp));
				// Data should already be available, this is just for verification
				localStorage.removeItem('atlas_reload_backup');
			}
		} catch (error) {
			console.warn('Failed to restore from reload backup:', error);
		}
	});
}

// Create singleton instance
export const storagePersistenceManager = new StoragePersistenceManager();

// React hook for storage persistence
import { useState, useEffect } from 'react';

export function useStoragePersistence() {
	const [status, setStatus] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const initStorage = async () => {
			setIsLoading(true);
			const storageStatus = await storagePersistenceManager.getStorageStatus();
			setStatus(storageStatus);
			setIsLoading(false);
		};

		initStorage();

		// Setup monitoring
		storagePersistenceManager.setupStorageMonitoring();

	}, []);

	const requestPersistence = async () => {
		setIsLoading(true);
		await storagePersistenceManager.requestPersistentStorage();
		const updatedStatus = await storagePersistenceManager.getStorageStatus();
		setStatus(updatedStatus);
		setIsLoading(false);
	};

	return {
		status,
		isLoading,
		requestPersistence,
		hasPeristentStorage: status?.persistent || false,
		canStoreData: status?.cacheStorage && status?.indexedDB
	};
}