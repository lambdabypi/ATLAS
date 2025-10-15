// src/lib/db/patients.js - FIXED VERSION
import db from './index';
import { queuePatientSync } from '../sync/patient-sync';

/**
 * Database operations for patients - FIXED VERSION with proper ID validation
 */

// Add a new patient
export async function add(patient) {
	try {
		const patientWithDefaults = {
			...patient,
			lastVisit: patient.lastVisit || new Date().toISOString()
		};

		// Add to local database
		const patientId = await db.patients.add(patientWithDefaults);

		// Queue for sync when online - with error handling
		try {
			await queuePatientSync(patientId, 'add', patientWithDefaults);
		} catch (syncError) {
			console.warn('Could not queue patient for sync:', syncError);
			// Don't fail the whole operation if sync queueing fails
		}

		return patientId;
	} catch (error) {
		console.error('Error adding patient:', error);
		throw error;
	}
}

// Get all patients
export async function getAll() {
	try {
		return await db.patients.toArray();
	} catch (error) {
		console.error('Error getting all patients:', error);
		throw error;
	}
}

// Get patient by ID - with proper validation
export async function getById(id) {
	try {
		// Validate that id is a valid key
		if (id === null || id === undefined || id === '') {
			console.error('Invalid patient ID provided:', id);
			return null;
		}

		// Convert to number if it's a string
		let patientId = id;
		if (typeof id === 'string') {
			patientId = parseInt(id, 10);
			if (isNaN(patientId)) {
				console.error('Patient ID is not a valid number:', id);
				return null;
			}
		}

		// Ensure it's a positive integer
		if (!Number.isInteger(patientId) || patientId <= 0) {
			console.error('Patient ID must be a positive integer:', patientId);
			return null;
		}

		return await db.patients.get(patientId);
	} catch (error) {
		console.error('Error getting patient by ID:', error);
		throw error;
	}
}

// Update patient
export async function update(id, updates) {
	try {
		// Validate ID first
		if (id === null || id === undefined || id === '') {
			throw new Error('Invalid patient ID provided for update');
		}

		let patientId = id;
		if (typeof id === 'string') {
			patientId = parseInt(id, 10);
			if (isNaN(patientId)) {
				throw new Error('Patient ID must be a valid number');
			}
		}

		// Queue for sync when online - with error handling
		try {
			await queuePatientSync(patientId, 'update', updates);
		} catch (syncError) {
			console.warn('Could not queue patient for sync:', syncError);
			// Don't fail the whole operation if sync queueing fails
		}

		// Update local database
		return await db.patients.update(patientId, updates);
	} catch (error) {
		console.error('Error updating patient:', error);
		throw error;
	}
}

// Delete patient
export async function remove(id) {
	try {
		// Validate ID first
		if (id === null || id === undefined || id === '') {
			throw new Error('Invalid patient ID provided for deletion');
		}

		let patientId = id;
		if (typeof id === 'string') {
			patientId = parseInt(id, 10);
			if (isNaN(patientId)) {
				throw new Error('Patient ID must be a valid number');
			}
		}

		// Queue for sync when online - with error handling
		try {
			await queuePatientSync(patientId, 'delete', null);
		} catch (syncError) {
			console.warn('Could not queue patient for sync:', syncError);
			// Don't fail the whole operation if sync queueing fails
		}

		// Delete from local database
		return await db.patients.delete(patientId);
	} catch (error) {
		console.error('Error deleting patient:', error);
		throw error;
	}
}

// Search patients by name
export async function searchByName(name) {
	try {
		if (!name || typeof name !== 'string') {
			return [];
		}

		return await db.patients
			.filter(patient => patient.name.toLowerCase().includes(name.toLowerCase()))
			.toArray();
	} catch (error) {
		console.error('Error searching patients by name:', error);
		throw error;
	}
}

// Get recent patients
export async function getRecentPatients(limit = 5) {
	try {
		if (!Number.isInteger(limit) || limit <= 0) {
			limit = 5;
		}

		return await db.patients
			.orderBy('lastVisit')
			.reverse()
			.limit(limit)
			.toArray();
	} catch (error) {
		console.error('Error getting recent patients:', error);
		throw error;
	}
}

// Get patient statistics
export async function getPatientStats() {
	try {
		const allPatients = await getAll();

		// Get today's date at midnight
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// Get date 30 days ago
		const lastMonth = new Date();
		lastMonth.setDate(lastMonth.getDate() - 30);
		lastMonth.setHours(0, 0, 0, 0);

		// Count patients by last visit
		const seenToday = allPatients.filter(p => {
			try {
				return new Date(p.lastVisit) >= today;
			} catch (e) {
				return false;
			}
		}).length;

		const seenThisMonth = allPatients.filter(p => {
			try {
				return new Date(p.lastVisit) >= lastMonth;
			} catch (e) {
				return false;
			}
		}).length;

		const totalPatients = allPatients.length;

		return {
			total: totalPatients,
			seenToday,
			seenThisMonth
		};
	} catch (error) {
		console.error('Error getting patient stats:', error);
		return {
			total: 0,
			seenToday: 0,
			seenThisMonth: 0
		};
	}
}