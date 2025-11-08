// src/lib/sync/index.js - Updated with intelligent offline query processing
import { syncQueueDb } from '../db';

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

// Base API URL - for development, can be disabled
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const isDevelopmentMode = API_BASE_URL === 'disabled' || API_BASE_URL === undefined;

// Function to sync data with remote server
export async function syncData(options = {}) {
	// Check if initialization is complete
	if (typeof window !== 'undefined' && !window.ATLAS_INITIALIZATION_COMPLETE) {
		console.log('🚫 Skipping sync during initialization');
		return {
			success: true,
			message: 'Sync skipped during system initialization',
			syncedItems: 0,
			failedItems: 0
		};
	}

	if (!isOnline()) {
		console.log('Cannot sync data while offline');
		return {
			success: false,
			message: 'Device is offline. Data will be synced when connection is restored.'
		};
	}

	const {
		processOfflineQueries = true,
		queryProcessingStrategy = 'balanced'
	} = options;

	try {
		let queryResults = { processed: 0, skipped: 0 };

		// Process offline AI queries intelligently (not all of them!)
		if (processOfflineQueries) {
			console.log('🧠 Processing offline queries intelligently...');

			const { OfflineQueryStrategies } = await import('../ai/smartOfflineQueries');

			// Use the specified strategy
			switch (queryProcessingStrategy) {
				case 'conservative':
					queryResults = await OfflineQueryStrategies.conservative();
					break;
				case 'balanced':
					queryResults = await OfflineQueryStrategies.balanced();
					break;
				case 'comprehensive':
					queryResults = await OfflineQueryStrategies.comprehensive();
					break;
				case 'critical_only':
					queryResults = await OfflineQueryStrategies.critical_only();
					break;
				default:
					queryResults = await OfflineQueryStrategies.balanced();
			}

			console.log(`📊 Query processing results: ${queryResults.processed} processed, ${queryResults.skipped} skipped intelligently`);
		}

		// In development mode, simulate successful sync
		if (isDevelopmentMode) {
			console.log('Development mode: Simulating sync operation');

			// Get all items in the sync queue
			const queueItems = await syncQueueDb.getQueue();

			// Simulate successful sync by removing items from queue
			for (const item of queueItems) {
				await syncQueueDb.removeFromQueue(item.id);
			}

			return {
				success: true,
				message: `Development sync completed`,
				syncedItems: queueItems.length,
				failedItems: 0,
				queryResults,
				isDevelopmentMode: true
			};
		}

		// Production sync logic
		const queueItems = await syncQueueDb.getQueue();
		if (queueItems.length === 0) {
			return {
				success: true,
				message: 'No data to sync',
				syncedItems: 0,
				queryResults
			};
		}

		console.log(`Found ${queueItems.length} items to sync`);
		let syncedItems = 0;
		let failedItems = 0;

		// Process each item in the queue
		for (const item of queueItems) {
			try {
				const endpoint = `${API_BASE_URL}/${item.table}`;

				let response;
				switch (item.operation) {
					case 'add':
						response = await fetch(endpoint, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(item.data),
						});
						break;

					case 'update':
						response = await fetch(`${endpoint}/${item.recordId}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(item.data),
						});
						break;

					case 'delete':
						response = await fetch(`${endpoint}/${item.recordId}`, {
							method: 'DELETE',
						});
						break;

					default:
						throw new Error(`Unknown operation: ${item.operation}`);
				}

				if (response.ok) {
					await syncQueueDb.removeFromQueue(item.id);
					syncedItems++;
				} else {
					console.error(`Failed to sync item ${item.id}: ${response.statusText}`);
					failedItems++;
				}
			} catch (error) {
				console.error(`Error syncing item ${item.id}:`, error);
				failedItems++;
			}
		}

		return {
			success: true,
			message: `Synced ${syncedItems} items, ${failedItems} failed. Queries: ${queryResults.processed} processed, ${queryResults.skipped} skipped`,
			syncedItems,
			failedItems,
			queryResults
		};

	} catch (error) {
		console.error('Error during data sync:', error);
		return {
			success: false,
			message: `Sync failed: ${error.message}`,
			error: error.message
		};
	}
}

// Function to download reference data from the server
export async function downloadReferenceData() {
	if (!isOnline()) {
		return { success: false, message: 'Cannot download reference data while offline' };
	}

	if (isDevelopmentMode) {
		return {
			success: true,
			message: 'Development mode: Reference data sync simulated',
			results: {
				medications: { success: true, count: 0 },
				conditions: { success: true, count: 0 },
				guidelines: { success: true, count: 0 }
			}
		};
	}

	// Production download logic
	try {
		const endpoints = ['medications', 'conditions', 'guidelines'];
		const results = {};

		for (const endpoint of endpoints) {
			try {
				const response = await fetch(`${API_BASE_URL}/reference/${endpoint}`);
				if (response.ok) {
					const data = await response.json();
					results[endpoint] = { success: true, count: data.length };
				} else {
					results[endpoint] = { success: false, error: response.statusText };
				}
			} catch (error) {
				results[endpoint] = { success: false, error: error.message };
			}
		}

		return { success: true, results };
	} catch (error) {
		console.error('Error downloading reference data:', error);
		return { success: false, message: `Download failed: ${error.message}`, error: error.message };
	}
}

// Set up periodic sync with different strategies for different times
export function setupAutoSync(intervalMinutes = 60) {
	if (typeof window === 'undefined') return;

	console.log(`Setting up intelligent auto-sync with ${intervalMinutes} minute interval`);

	// Setup event listeners for online/offline events
	window.addEventListener('online', async () => {
		console.log('📡 Device is back online. Running conservative sync...');
		if (window.ATLAS_INITIALIZATION_COMPLETE) {
			// When coming back online, use conservative strategy to avoid quota exhaustion
			await syncData({ queryProcessingStrategy: 'conservative' });
		}
	});

	// Different sync strategies based on time of day and usage patterns
	const intelligentSync = async () => {
		if (!isOnline() || !window.ATLAS_INITIALIZATION_COMPLETE) return;

		const hour = new Date().getHours();
		let strategy = 'balanced';

		// Adjust strategy based on time of day
		if (hour >= 22 || hour <= 6) {
			// Night time - very conservative to save quota
			strategy = 'critical_only';
		} else if (hour >= 9 && hour <= 17) {
			// Business hours - balanced approach
			strategy = 'balanced';
		} else {
			// Other times - conservative
			strategy = 'conservative';
		}

		console.log(`🔄 Running scheduled sync with ${strategy} strategy...`);
		await syncData({ queryProcessingStrategy: strategy });
	};

	// Set up periodic sync
	setInterval(intelligentSync, intervalMinutes * 60 * 1000);

	// Initial sync after a delay
	const checkAndSync = () => {
		if (window.ATLAS_INITIALIZATION_COMPLETE && isOnline()) {
			console.log('🔄 Running initial intelligent sync...');
			// Use conservative strategy for initial sync
			syncData({ queryProcessingStrategy: 'conservative' });
		} else if (!window.ATLAS_INITIALIZATION_COMPLETE) {
			setTimeout(checkAndSync, 2000);
		}
	};

	setTimeout(checkAndSync, 5000);
}

// Manual sync functions with different strategies
export const SyncStrategies = {
	// Process only critical safety queries
	emergencySync: () => syncData({ queryProcessingStrategy: 'critical_only' }),

	// Conservative sync for regular use
	conservativeSync: () => syncData({ queryProcessingStrategy: 'conservative' }),

	// Balanced sync for normal operation
	balancedSync: () => syncData({ queryProcessingStrategy: 'balanced' }),

	// Process everything (use sparingly)
	comprehensiveSync: () => syncData({ queryProcessingStrategy: 'comprehensive' }),

	// Sync data only, skip query processing entirely
	dataOnlySync: () => syncData({ processOfflineQueries: false })
};

// Add item to sync queue
export async function addToSyncQueue(table, recordId, operation, data) {
	return await syncQueueDb.addToQueue(table, recordId, operation, data);
}