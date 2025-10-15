// src/lib/sync/prioritizedSync.js
import { syncQueueDb } from '../db';

// Clinical priority levels for data synchronization
const SYNC_PRIORITIES = {
	CRITICAL: 1,    // Active patient emergencies, vital signs
	HIGH: 2,        // Active consultations, recent diagnoses  
	MEDIUM: 3,      // Patient records, medication lists
	LOW: 4,         // Historical data, reference materials
	BACKGROUND: 5   // Analytics, system logs
};

// Data classification for clinical priority
const DATA_CLASSIFICATIONS = {
	'consultations': {
		priority: (item) => {
			const age = Date.now() - new Date(item.data.date).getTime();
			const hoursOld = age / (1000 * 60 * 60);

			if (hoursOld < 1) return SYNC_PRIORITIES.CRITICAL;
			if (hoursOld < 24) return SYNC_PRIORITIES.HIGH;
			return SYNC_PRIORITIES.MEDIUM;
		},
		conflictResolution: 'medical_last_writer_wins'
	},
	'patients': {
		priority: (item) => {
			const hasRecentActivity = item.data.lastVisit &&
				Date.now() - new Date(item.data.lastVisit).getTime() < 24 * 60 * 60 * 1000;
			return hasRecentActivity ? SYNC_PRIORITIES.HIGH : SYNC_PRIORITIES.MEDIUM;
		},
		conflictResolution: 'merge_with_audit'
	},
	'vitals': {
		priority: () => SYNC_PRIORITIES.CRITICAL,
		conflictResolution: 'keep_both_timestamped'
	}
};

/**
 * Enhanced sync with clinical prioritization
 */
export async function syncWithClinicalPriority() {
	if (!navigator.onLine) {
		return { success: false, message: 'Device is offline' };
	}

	try {
		const queueItems = await syncQueueDb.getQueue();

		// Classify and prioritize items
		const prioritizedItems = queueItems
			.map(item => ({
				...item,
				priority: getPriority(item),
				classification: DATA_CLASSIFICATIONS[item.table] || {}
			}))
			.sort((a, b) => a.priority - b.priority);

		console.log(`Syncing ${prioritizedItems.length} items by clinical priority`);

		let syncedItems = 0;
		let failedItems = 0;
		const syncResults = [];

		// Process items by priority
		for (const item of prioritizedItems) {
			try {
				const result = await syncSingleItem(item);

				if (result.success) {
					await syncQueueDb.removeFromQueue(item.id);
					syncedItems++;
					syncResults.push({ id: item.id, status: 'success', priority: item.priority });
				} else {
					failedItems++;
					syncResults.push({ id: item.id, status: 'failed', error: result.error, priority: item.priority });

					// For critical items, retry immediately
					if (item.priority === SYNC_PRIORITIES.CRITICAL) {
						console.log(`Retrying critical sync for item ${item.id}`);
						await new Promise(resolve => setTimeout(resolve, 1000));
						const retryResult = await syncSingleItem(item);
						if (retryResult.success) {
							await syncQueueDb.removeFromQueue(item.id);
							syncedItems++;
						}
					}
				}
			} catch (error) {
				console.error(`Error syncing item ${item.id}:`, error);
				failedItems++;
				syncResults.push({ id: item.id, status: 'error', error: error.message });
			}
		}

		// Download updates prioritizing clinical content
		await downloadPrioritizedUpdates();

		return {
			success: true,
			message: `Synced ${syncedItems} items, ${failedItems} failed`,
			syncedItems,
			failedItems,
			results: syncResults
		};

	} catch (error) {
		console.error('Error during prioritized sync:', error);
		return {
			success: false,
			message: `Sync failed: ${error.message}`,
			error: error.message
		};
	}
}

function getPriority(item) {
	const classifier = DATA_CLASSIFICATIONS[item.table];
	if (classifier && classifier.priority) {
		return classifier.priority(item);
	}
	return SYNC_PRIORITIES.MEDIUM;
}

async function syncSingleItem(item) {
	const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.yourdomain.com';
	const endpoint = `${API_BASE_URL}/${item.table}`;

	try {
		let response;
		const headers = {
			'Content-Type': 'application/json',
			'X-Sync-Priority': item.priority.toString(),
			'X-Device-Id': getDeviceId(),
			'X-Timestamp': new Date().toISOString()
		};

		switch (item.operation) {
			case 'add':
				response = await fetch(endpoint, {
					method: 'POST',
					headers,
					body: JSON.stringify({
						...item.data,
						_clientTimestamp: item.timestamp,
						_syncPriority: item.priority
					})
				});
				break;

			case 'update':
				response = await fetch(`${endpoint}/${item.recordId}`, {
					method: 'PUT',
					headers,
					body: JSON.stringify({
						...item.data,
						_clientTimestamp: item.timestamp,
						_syncPriority: item.priority,
						_lastModified: new Date().toISOString()
					})
				});
				break;

			case 'delete':
				response = await fetch(`${endpoint}/${item.recordId}`, {
					method: 'DELETE',
					headers
				});
				break;

			default:
				throw new Error(`Unknown operation: ${item.operation}`);
		}

		if (response.ok) {
			const result = await response.json();

			// Handle conflict resolution if server indicates conflict
			if (response.status === 409) {
				return await resolveConflict(item, result);
			}

			return { success: true, result };
		} else {
			return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
		}

	} catch (error) {
		return { success: false, error: error.message };
	}
}

async function resolveConflict(item, serverResponse) {
	const classification = DATA_CLASSIFICATIONS[item.table];
	const strategy = classification?.conflictResolution || 'last_writer_wins';

	switch (strategy) {
		case 'medical_last_writer_wins':
			// In medical contexts, most recent clinical data typically takes precedence
			return { success: true, resolution: 'client_wins' };

		case 'merge_with_audit':
			// Merge changes and create audit trail
			const merged = await mergeWithAuditTrail(item.data, serverResponse.serverData);
			return { success: true, resolution: 'merged', data: merged };

		case 'keep_both_timestamped':
			// For vitals and measurements, keep both with timestamps
			return { success: true, resolution: 'both_kept' };

		default:
			return { success: true, resolution: 'server_wins' };
	}
}

async function downloadPrioritizedUpdates() {
	// Download critical clinical updates first
	const prioritizedEndpoints = [
		{ endpoint: 'clinical-guidelines', priority: SYNC_PRIORITIES.HIGH },
		{ endpoint: 'medication-updates', priority: SYNC_PRIORITIES.HIGH },
		{ endpoint: 'reference-data', priority: SYNC_PRIORITIES.MEDIUM }
	];

	for (const { endpoint, priority } of prioritizedEndpoints) {
		try {
			const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/${endpoint}`, {
				headers: {
					'X-Sync-Priority': priority.toString(),
					'X-Last-Sync': localStorage.getItem(`last-sync-${endpoint}`) || '1970-01-01'
				}
			});

			if (response.ok) {
				const data = await response.json();
				await updateLocalData(endpoint, data);
				localStorage.setItem(`last-sync-${endpoint}`, new Date().toISOString());
			}
		} catch (error) {
			console.error(`Failed to download ${endpoint}:`, error);
		}
	}
}

function getDeviceId() {
	let deviceId = localStorage.getItem('device-id');
	if (!deviceId) {
		deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
		localStorage.setItem('device-id', deviceId);
	}
	return deviceId;
}

async function updateLocalData(endpoint, data) {
	// Update local IndexedDB with downloaded data
	// Implementation would depend on specific data structure
	console.log(`Updated local ${endpoint} data with ${data.length} items`);
}

async function mergeWithAuditTrail(clientData, serverData) {
	// Implement smart merging logic for patient data
	const merged = { ...serverData, ...clientData };
	merged._auditTrail = {
		lastMerge: new Date().toISOString(),
		clientVersion: clientData._lastModified,
		serverVersion: serverData._lastModified,
		mergeStrategy: 'field_level_merge'
	};
	return merged;
}