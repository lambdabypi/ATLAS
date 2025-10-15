// src/lib/db/patients.js
import db from './index';
import { queuePatientSync } from '../sync/patientSync';

/**
 * Database operations for patients
 */

// Add a new patient
export async function add(patient) {
	const patientWithDefaults = {
		...patient,
		lastVisit: patient.lastVisit || new Date().toISOString()
	};

	// Add to local database
	const patientId = await db.patients.add(patientWithDefaults);

	// Queue for sync when online
	await queuePatientSync(patientId, 'add', patientWithDefaults);

	return patientId;
}

// Get all patients
export async function getAll() {
	return await db.patients.toArray();
}

// Get patient by ID
export async function getById(id) {
	return await db.patients.get(id);
}

// Update patient
export async function update(id, updates) {
	// Queue for sync when online
	await queuePatientSync(id, 'update', updates);

	// Update local database
	return await db.patients.update(id, updates);
}

// Delete patient
export async function remove(id) {
	// Queue for sync when online
	await queuePatientSync(id, 'delete', null);

	// Delete from local database
	return await db.patients.delete(id);
}

// Search patients by name
export async function searchByName(name) {
	return await db.patients
		.filter(patient => patient.name.toLowerCase().includes(name.toLowerCase()))
		.toArray();
}

// Get recent patients
export async function getRecentPatients(limit = 5) {
	return await db.patients
		.orderBy('lastVisit')
		.reverse()
		.limit(limit)
		.toArray();
}

// Get patient statistics
export async function getPatientStats() {
	const allPatients = await getAll();

	// Get today's date at midnight
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Get date 30 days ago
	const lastMonth = new Date();
	lastMonth.setDate(lastMonth.getDate() - 30);
	lastMonth.setHours(0, 0, 0, 0);

	// Count patients by last visit
	const seenToday = allPatients.filter(p => new Date(p.lastVisit) >= today).length;
	const seenThisMonth = allPatients.filter(p => new Date(p.lastVisit) >= lastMonth).length;
	const totalPatients = allPatients.length;

	return {
		total: totalPatients,
		seenToday,
		seenThisMonth
	};
}