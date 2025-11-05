// src/lib/db/patients.js - COMPLETELY FIXED VERSION
import db from './index';

/**
 * Database operations for patients - FIXED with better ID handling
 */

// Helper function to normalize patient ID
function normalizePatientId(id) {
	if (id === null || id === undefined || id === '') {
		return null;
	}

	// If it's already a number, return it
	if (typeof id === 'number') {
		return Number.isInteger(id) && id > 0 ? id : null;
	}

	// If it's a string, try to convert
	if (typeof id === 'string') {
		const numId = parseInt(id, 10);
		return (Number.isInteger(numId) && numId > 0) ? numId : null;
	}

	return null;
}

// Add a new patient
export async function add(patient) {
	try {
		const patientWithDefaults = {
			...patient,
			lastVisit: patient.lastVisit || new Date().toISOString()
		};

		// Add to local database
		const patientId = await db.patients.add(patientWithDefaults);
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

// Get patient by ID - FIXED with better validation
export async function getById(id) {
	try {
		const normalizedId = normalizePatientId(id);

		if (normalizedId === null) {
			console.warn('Invalid patient ID provided:', id);
			return null;
		}

		const patient = await db.patients.get(normalizedId);

		if (!patient) {
			console.log('Patient not found with ID:', normalizedId);
			return null;
		}

		return patient;
	} catch (error) {
		console.error('Error getting patient by ID:', error);
		return null; // Return null instead of throwing to avoid breaking the UI
	}
}

// Update patient
export async function update(id, updates) {
	try {
		const normalizedId = normalizePatientId(id);

		if (normalizedId === null) {
			throw new Error('Invalid patient ID provided for update');
		}

		// Update local database
		const result = await db.patients.update(normalizedId, updates);
		return result;
	} catch (error) {
		console.error('Error updating patient:', error);
		throw error;
	}
}

// Delete patient
export async function remove(id) {
	try {
		const normalizedId = normalizePatientId(id);

		if (normalizedId === null) {
			throw new Error('Invalid patient ID provided for deletion');
		}

		// Delete from local database
		return await db.patients.delete(normalizedId);
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
		return [];
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
		return [];
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