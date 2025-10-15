// src/lib/sync/index.js - Update the existing file
import { syncQueueDb, offlineQueryDb } from '../db';
import { processOfflineQueries } from '../ai/gemini';

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

// Base API URL - for development, can be disabled
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const isDevelopmentMode = API_BASE_URL === 'disabled' || API_BASE_URL === undefined;

// Function to sync data with remote server
export async function syncData() {
	if (!isOnline()) {
		console.log('Cannot sync data while offline');
		return {
			success: false,
			message: 'Device is offline. Data will be synced when connection is restored.'
		};
	}

	// In development mode with no API, simulate successful sync
	if (isDevelopmentMode) {
		console.log('Development mode: Simulating sync operation');

		try {
			// Process any offline AI queries first
			const queryResults = await processOfflineQueries();
			console.log(`Processed ${queryResults.processed} offline queries with ${queryResults.errors} errors`);

			// Get all items in the sync queue
			const queueItems = await syncQueueDb.getQueue();

			// Simulate successful sync by removing items from queue
			for (const item of queueItems) {
				await syncQueueDb.removeFromQueue(item.id);
			}

			return {
				success: true,
				message: `Development mode: Simulated sync of ${queueItems.length} items`,
				syncedItems: queueItems.length,
				failedItems: 0,
				isDevelopmentMode: true
			};
		} catch (error) {
			return {
				success: false,
				message: `Development sync simulation failed: ${error.message}`,
				error: error.message
			};
		}
	}

	// Production sync logic (your existing code)
	try {
		// Process any offline AI queries first
		const queryResults = await processOfflineQueries();
		console.log(`Processed ${queryResults.processed} offline queries with ${queryResults.errors} errors`);

		// Get all items in the sync queue
		const queueItems = await syncQueueDb.getQueue();
		if (queueItems.length === 0) {
			return {
				success: true,
				message: 'No data to sync',
				syncedItems: 0
			};
		}

		console.log(`Found ${queueItems.length} items to sync`);
		let syncedItems = 0;
		let failedItems = 0;

		// Process each item in the queue
		for (const item of queueItems) {
			try {
				// Determine the endpoint based on the table
				const endpoint = `${API_BASE_URL}/${item.table}`;

				// Perform the operation based on the operation type
				let response;
				switch (item.operation) {
					case 'add':
						response = await fetch(endpoint, {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify(item.data),
						});
						break;

					case 'update':
						response = await fetch(`${endpoint}/${item.recordId}`, {
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
							},
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

				// Check if the request was successful
				if (response.ok) {
					// Remove the item from the queue
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
			message: `Synced ${syncedItems} items, ${failedItems} failed`,
			syncedItems,
			failedItems
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
		return {
			success: false,
			message: 'Cannot download reference data while offline'
		};
	}

	// In development mode, return mock success
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

	// Production download logic (your existing code)
	try {
		// Download medical reference data
		const endpoints = [
			'medications',
			'conditions',
			'guidelines'
		];

		const results = {};

		for (const endpoint of endpoints) {
			try {
				const response = await fetch(`${API_BASE_URL}/reference/${endpoint}`);

				if (response.ok) {
					const data = await response.json();
					results[endpoint] = {
						success: true,
						count: data.length
					};

					// Update local database with the fetched data
					// This would need to be implemented for each specific data type
					// For example:
					// if (endpoint === 'medications') {
					//   await updateMedicationsDatabase(data);
					// }
				} else {
					results[endpoint] = {
						success: false,
						error: response.statusText
					};
				}
			} catch (error) {
				results[endpoint] = {
					success: false,
					error: error.message
				};
			}
		}

		return {
			success: true,
			results
		};
	} catch (error) {
		console.error('Error downloading reference data:', error);
		return {
			success: false,
			message: `Download failed: ${error.message}`,
			error: error.message
		};
	}
}

// Set up periodic sync attempts when online
export function setupAutoSync(intervalMinutes = 60) {
	if (typeof window === 'undefined') return; // Skip on server-side

	// Setup event listeners for online/offline events
	window.addEventListener('online', async () => {
		console.log('Device is back online. Attempting to sync data...');
		await syncData();
	});

	// Set up periodic sync - skip in development mode
	if (!isDevelopmentMode) {
		const syncIntervalMs = intervalMinutes * 60 * 1000;

		setInterval(async () => {
			if (isOnline()) {
				await syncData();
			}
		}, syncIntervalMs);
	}

	// Initial sync when the app loads and is online
	if (isOnline()) {
		setTimeout(async () => {
			await syncData();
		}, 5000); // Wait 5 seconds after load before attempting initial sync
	}
}

// Add item to sync queue
export async function addToSyncQueue(table, recordId, operation, data) {
	return await syncQueueDb.addToQueue(table, recordId, operation, data);
}