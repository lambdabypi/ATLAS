// src/lib/sync/patientSync.js
import { syncQueueDb } from '../db';

// Base API URL - replace with your API endpoint in production
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

/**
 * Sync patients with the remote server
 * @returns {Promise<Object>} Sync result
 */
export async function syncPatients() {
	if (!isOnline()) {
		return {
			success: false,
			message: 'Cannot sync patients while offline'
		};
	}

	try {
		// Get patient-related items from sync queue
		const queueItems = await syncQueueDb.getQueue();
		const patientItems = queueItems.filter(item => item.table === 'patients');

		if (patientItems.length === 0) {
			return {
				success: true,
				message: 'No patient data to sync',
				syncedItems: 0
			};
		}

		console.log(`Found ${patientItems.length} patient records to sync`);
		let syncedItems = 0;
		let failedItems = 0;

		// Process each patient item in the queue
		for (const item of patientItems) {
			try {
				const endpoint = `${API_BASE_URL}/patients`;

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
					console.error(`Failed to sync patient ${item.id}: ${response.statusText}`);
					failedItems++;
				}
			} catch (error) {
				console.error(`Error syncing patient ${item.id}:`, error);
				failedItems++;
			}
		}

		return {
			success: true,
			message: `Synced ${syncedItems} patients, ${failedItems} failed`,
			syncedItems,
			failedItems
		};
	} catch (error) {
		console.error('Error during patient sync:', error);
		return {
			success: false,
			message: `Patient sync failed: ${error.message}`,
			error: error.message
		};
	}
}

/**
 * Download patient data from the server
 * @returns {Promise<Object>} Download result
 */
export async function downloadPatients() {
	if (!isOnline()) {
		return {
			success: false,
			message: 'Cannot download patients while offline'
		};
	}

	try {
		const response = await fetch(`${API_BASE_URL}/patients`);

		if (!response.ok) {
			throw new Error(`Failed to download patients: ${response.statusText}`);
		}

		const patients = await response.json();

		// The implementation would need to update the local database
		// This is a placeholder for that logic
		console.log(`Downloaded ${patients.length} patients`);

		return {
			success: true,
			message: `Downloaded ${patients.length} patients`,
			count: patients.length
		};
	} catch (error) {
		console.error('Error downloading patients:', error);
		return {
			success: false,
			message: `Download failed: ${error.message}`,
			error: error.message
		};
	}
}

/**
 * Add a patient record to the sync queue
 * @param {string} recordId Patient ID
 * @param {string} operation Operation type ('add', 'update', or 'delete')
 * @param {Object} data Patient data
 * @returns {Promise<number>} Queue item ID
 */
export async function queuePatientSync(recordId, operation, data) {
	return await syncQueueDb.addToQueue('patients', recordId, operation, data);
}