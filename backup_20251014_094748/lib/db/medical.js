// src/lib/db/consultations.js
import db from './index';

/**
 * Database operations for consultations
 */

// Add a new consultation
export async function addConsultation(consultation) {
	const consultationId = await db.consultations.add({
		...consultation,
		date: consultation.date || new Date().toISOString()
	});

	// Update patient's last visit date
	if (consultation.patientId) {
		await db.patients.update(consultation.patientId, {
			lastVisit: new Date().toISOString()
		});
	}

	return consultationId;
}

// Get all consultations
export async function getAllConsultations() {
	return await db.consultations.toArray();
}

// Get consultation by ID
export async function getConsultationById(id) {
	return await db.consultations.get(id);
}

// Get consultations for a specific patient
export async function getConsultationsByPatientId(patientId) {
	return await db.consultations
		.where('patientId')
		.equals(patientId)
		.sortBy('date'); // Sort by date ascending
}

// Get recent consultations with patient info included
export async function getRecentConsultations(limit = 10) {
	const consultations = await db.consultations
		.orderBy('date')
		.reverse()
		.limit(limit)
		.toArray();

	// Fetch patient info for each consultation
	const consultationsWithPatients = await Promise.all(
		consultations.map(async (consultation) => {
			const patient = await db.patients.get(consultation.patientId);
			return {
				...consultation,
				patientName: patient ? patient.name : 'Unknown',
				patientAge: patient ? patient.age : '',
				patientGender: patient ? patient.gender : ''
			};
		})
	);

	return consultationsWithPatients;
}

// Get consultations from today
export async function getTodayConsultations() {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	return await db.consultations
		.where('date')
		.aboveOrEqual(today.toISOString())
		.toArray();
}

// Update a consultation
export async function updateConsultation(id, updates) {
	return await db.consultations.update(id, updates);
}

// Delete a consultation
export async function deleteConsultation(id) {
	return await db.consultations.delete(id);
}

// Search consultations by symptoms or diagnosis
export async function searchConsultations(query) {
	return await db.consultations
		.filter(consultation => {
			const symptoms = consultation.symptoms ? consultation.symptoms.toLowerCase() : '';
			const diagnosis = consultation.finalDiagnosis ? consultation.finalDiagnosis.toLowerCase() : '';
			const chiefComplaint = consultation.chiefComplaint ? consultation.chiefComplaint.toLowerCase() : '';

			return symptoms.includes(query.toLowerCase()) ||
				diagnosis.includes(query.toLowerCase()) ||
				chiefComplaint.includes(query.toLowerCase());
		})
		.toArray();
}

// Get consultation statistics
export async function getConsultationStats() {
	const allConsultations = await getAllConsultations();

	// Get today's date at midnight
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	// Get date 7 days ago
	const lastWeek = new Date();
	lastWeek.setDate(lastWeek.getDate() - 7);
	lastWeek.setHours(0, 0, 0, 0);

	// Count consultations by period
	const todayCount = allConsultations.filter(c => new Date(c.date) >= today).length;
	const weekCount = allConsultations.filter(c => new Date(c.date) >= lastWeek).length;
	const totalCount = allConsultations.length;

	// Count unique patients seen
	const uniquePatients = new Set(allConsultations.map(c => c.patientId)).size;

	return {
		today: todayCount,
		week: weekCount,
		total: totalCount,
		uniquePatients
	};
}