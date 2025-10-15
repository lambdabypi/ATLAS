// src/lib/sync/consultationSync.js
import { syncQueueDb } from '../db';

// Base API URL - replace with your API endpoint in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Sync consultations with the remote server
 * @returns {Promise<Object>} Sync result
 */
export async function syncConsultations() {
	if (!isOnline()) {
		return {
			success: false,
			message: 'Cannot sync consultations while offline'
		};
	}

	try {
		// Get consultation-related items from sync queue
		const queueItems = await syncQueueDb.getQueue();
		const consultationItems = queueItems.filter(item => item.table === 'consultations');

		if (consultationItems.length === 0) {
			return {
				success: true,
				message: 'No consultation data to sync',
				syncedItems: 0
			};
		}

		console.log(`Found ${consultationItems.length} consultation records to sync`);
		let syncedItems = 0;
		let failedItems = 0;

		// Process each consultation item in the queue
		for (const item of consultationItems) {
			try {
				const endpoint = `${API_BASE_URL}/consultation`;

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
					console.error(`Failed to sync consultation ${item.id}: ${response.statusText}`);
					failedItems++;
				}
			} catch (error) {
				console.error(`Error syncing consultation ${item.id}:`, error);
				failedItems++;
			}
		}

		return {
			success: true,
			message: `Synced ${syncedItems} consultations, ${failedItems} failed`,
			syncedItems,
			failedItems
		};
	} catch (error) {
		console.error('Error during consultation sync:', error);
		return {
			success: false,
			message: `Consultation sync failed: ${error.message}`,
			error: error.message
		};
	}
}

/**
 * Download consultation data from the server
 * @returns {Promise<Object>} Download result
 */
export async function downloadConsultations() {
	if (!isOnline()) {
		return {
			success: false,
			message: 'Cannot download consultations while offline'
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/consultation`);

		if (!response.ok) {
			throw new Error(`Failed to download consultations: ${response.statusText}`);
		}

		const consultations = await response.json();

		// The implementation would need to update the local database
		// This is a placeholder for that logic
		console.log(`Downloaded ${consultations.length} consultations`);

		return {
			success: true,
			message: `Downloaded ${consultations.length} consultations`,
			count: consultations.length
		};
	} catch (error) {
		console.error('Error downloading consultations:', error);
		return {
			success: false,
			message: `Download failed: ${error.message}`,
			error: error.message
		};
	}
}

/**
 * Add a consultation record to the sync queue
 * @param {string} recordId Consultation ID
 * @param {string} operation Operation type ('add', 'update', or 'delete')
 * @param {Object} data Consultation data
 * @returns {Promise<number>} Queue item ID
 */
export async function queueConsultationSync(recordId, operation, data) {
	return await syncQueueDb.addToQueue('consultations', recordId, operation, data);
}