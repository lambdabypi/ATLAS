// src/lib/db/index.js - FIXED DATABASE SCHEMA VERSION
import Dexie from 'dexie';

// ADD THIS IMPORT - You'll create this file
import { withUserContext } from '../auth/simpleUserSystem';

// Create Dexie database (keep your existing version)
const db = new Dexie('ClinicalSupportDB');

// ✅ FIXED: Update to version 2 with user tracking fields
db.version(1).stores({
	// Original schema without user tracking
	patients: '++id, name, age, gender, lastVisit',
	consultations: '++id, patientId, date, symptoms, diagnosis, plan, *tags, aiRecommendations, finalDiagnosis, providerNotes',
	medications: 'id, name, category, dosages, indications, contraindications, sideEffects',
	conditions: 'id, name, symptoms, diagnostics, treatments, *keywords',
	guidelines: '++id, title, category, subcategory, resourceLevel, content, lastUpdated',
	offlineQueries: '++id, query, timestamp, priority, error',
	syncQueue: '++id, table, recordId, operation, data, timestamp',
	performanceMetrics: '++id, operation, duration, timestamp, additionalData',
	biasReports: '++id, queryId, overallSeverity, detectedBiases, timestamp',
	aiErrors: '++id, errorType, timestamp, query, attempt',
	crdtDocuments: '++id, type, nodeId, vectorClock, operations, state',
	testResults: '++id, testSuite, timestamp, results, overallScore'
});

// ✅ NEW: Version 2 with user tracking fields
db.version(2).stores({
	patients: '++id, name, age, gender, lastVisit, createdBy, modifiedBy, createdAt, modifiedAt, lastModifiedBy',
	consultations: '++id, patientId, date, symptoms, diagnosis, plan, *tags, aiRecommendations, finalDiagnosis, providerNotes, createdBy, providerId, providerName, providerRole, createdAt, modifiedAt',
	medications: 'id, name, category, dosages, indications, contraindications, sideEffects',
	conditions: 'id, name, symptoms, diagnostics, treatments, *keywords',
	guidelines: '++id, title, category, subcategory, resourceLevel, content, lastUpdated',
	offlineQueries: '++id, query, timestamp, priority, error',
	syncQueue: '++id, table, recordId, operation, data, timestamp',
	performanceMetrics: '++id, operation, duration, timestamp, additionalData',
	biasReports: '++id, queryId, overallSeverity, detectedBiases, timestamp',
	aiErrors: '++id, errorType, timestamp, query, attempt',
	crdtDocuments: '++id, type, nodeId, vectorClock, operations, state',
	testResults: '++id, testSuite, timestamp, results, overallScore',
	userActivity: '++id, userId, action, timestamp, data' // NEW: User activity tracking
}).upgrade(tx => {
	// Migration logic: Add user tracking fields to existing records
	console.log('Migrating database to version 2 with user tracking...');

	// Set default values for existing patients
	return tx.patients.toCollection().modify(patient => {
		patient.createdBy = patient.createdBy || 'migration';
		patient.modifiedBy = patient.modifiedBy || 'migration';
		patient.createdAt = patient.createdAt || new Date().toISOString();
		patient.modifiedAt = patient.modifiedAt || new Date().toISOString();
		patient.lastModifiedBy = patient.lastModifiedBy || 'System Migration';
	}).then(() => {
		// Set default values for existing consultations
		return tx.consultations.toCollection().modify(consultation => {
			consultation.createdBy = consultation.createdBy || 'migration';
			consultation.providerId = consultation.providerId || 'migration';
			consultation.providerName = consultation.providerName || 'Unknown Provider';
			consultation.providerRole = consultation.providerRole || 'unknown';
			consultation.createdAt = consultation.createdAt || new Date().toISOString();
			consultation.modifiedAt = consultation.modifiedAt || new Date().toISOString();
		});
	});
});

// Keep your existing event handlers
db.on('ready', function () {
	console.log('ClinicalSupportDB is ready');
	return Promise.resolve();
});

db.on('versionchange', function () {
	console.log('Database version changed - reloading page');
	window.location.reload();
});

// ✅ ENHANCED: Add database info logging for debugging
db.on('ready', function () {
	console.log('ClinicalSupportDB is ready');
	console.log('Database version:', db.verno);
	console.log('Database tables:', Object.keys(db._allTables));
	return Promise.resolve();
});

// REST OF YOUR FILE STAYS EXACTLY THE SAME...

// KEEP YOUR EXISTING seedInitialData function exactly as is
export async function seedInitialData() {
	try {
		// Only seed if tables are empty
		const medicationCount = await db.medications.count();
		const conditionCount = await db.conditions.count();
		const guidelineCount = await db.guidelines.count();

		if (medicationCount === 0) {
			try {
				await db.medications.bulkPut([
					{
						id: 'med1',
						name: 'Amoxicillin',
						category: 'Antibiotic',
						dosages: [
							{ form: 'Tablet', strength: '250mg', dosing: 'Adult: 250-500mg three times daily' },
							{ form: 'Suspension', strength: '125mg/5ml', dosing: 'Children: 20-40mg/kg/day in divided doses' }
						],
						indications: ['Respiratory tract infections', 'Urinary tract infections', 'Skin infections'],
						contraindications: ['Known hypersensitivity to penicillins'],
						sideEffects: ['Diarrhea', 'Rash', 'Nausea']
					},
					{
						id: 'med2',
						name: 'Paracetamol',
						category: 'Analgesic',
						dosages: [
							{ form: 'Tablet', strength: '500mg', dosing: 'Adult: 500-1000mg every 4-6 hours, max 4g/day' },
							{ form: 'Syrup', strength: '120mg/5ml', dosing: 'Children: 10-15mg/kg every 4-6 hours' }
						],
						indications: ['Pain relief', 'Fever reduction'],
						contraindications: ['Severe liver disease'],
						sideEffects: ['Rare: liver toxicity with overdose']
					}
				]);
				console.log('Essential medications seeded');
			} catch (error) {
				console.error('Error seeding medications:', error);
			}
		}

		if (conditionCount === 0) {
			try {
				await db.conditions.bulkPut([
					{
						id: 'cond1',
						name: 'Pneumonia',
						symptoms: ['Cough', 'Fever', 'Shortness of breath', 'Chest pain'],
						diagnostics: ['Clinical assessment', 'Chest X-ray if available'],
						treatments: [
							'Mild: Amoxicillin 500mg three times daily for 5 days',
							'Severe: Refer to hospital if available'
						],
						keywords: ['respiratory', 'infection', 'lung']
					},
					{
						id: 'cond2',
						name: 'Malaria',
						symptoms: ['Fever', 'Headache', 'Chills', 'Muscle pain'],
						diagnostics: ['RDT (Rapid Diagnostic Test)', 'Clinical assessment'],
						treatments: [
							'Uncomplicated: Artemisinin-based combination therapy',
							'Severe: IM artesunate and urgent referral'
						],
						keywords: ['fever', 'tropical', 'parasitic']
					}
				]);
				console.log('Common conditions seeded');
			} catch (error) {
				console.error('Error seeding conditions:', error);
			}
		}

		if (guidelineCount === 0) {
			try {
				await db.guidelines.bulkPut([
					{
						title: 'Management of Acute Respiratory Infections',
						category: 'Respiratory',
						subcategory: 'Infectious Disease',
						resourceLevel: 'LEVEL_2',
						content: JSON.stringify({
							overview: 'This guideline covers the assessment and management of acute respiratory infections in resource-limited settings.',
							assessment: [
								'Assess for danger signs: inability to drink, severe chest indrawing, stridor in calm child',
								'Check respiratory rate and temperature',
								'Assess for chest indrawing and auscultate if possible'
							],
							management: [
								'Mild: Home treatment with supportive care',
								'Moderate: Amoxicillin for 5 days',
								'Severe: Refer to hospital if possible, start antibiotics before transfer'
							],
							followUp: 'Follow up in 2 days if not improving, immediately if worsening'
						}),
						lastUpdated: new Date().toISOString()
					}
				]);
				console.log('Basic guidelines seeded');
			} catch (error) {
				console.error('Error seeding guidelines:', error);
			}
		}
	} catch (error) {
		console.error('Error during database initialization:', error);
		if (error.name === 'UpgradeError' || error.name === 'DatabaseClosedError') {
			console.log('Database schema error detected. Clearing database for fresh start.');
			await db.delete();
			window.location.reload();
		}
	}
}

// CORE FUNCTIONS: Create versions that accept user context
const corePatientDb = {
	async add(patient, userContext = {}) {
		try {
			return await db.patients.add({
				...patient,
				lastVisit: new Date().toISOString(),
				createdBy: userContext.userId || 'unknown',
				createdAt: new Date().toISOString(),
				modifiedBy: userContext.userId || 'unknown',
				modifiedAt: new Date().toISOString(),
				lastModifiedBy: userContext.userName || 'Unknown User'
			});
		} catch (error) {
			console.error('Error adding patient:', error);
			throw error;
		}
	},

	async update(id, updates, userContext = {}) {
		try {
			let patientId = id;
			if (typeof id === 'string') {
				patientId = parseInt(id, 10);
				if (isNaN(patientId)) {
					throw new Error('Invalid patient ID provided for update');
				}
			}

			return await db.patients.update(patientId, {
				...updates,
				modifiedBy: userContext.userId || 'unknown',
				modifiedAt: new Date().toISOString(),
				lastModifiedBy: userContext.userName || 'Unknown User'
			});
		} catch (error) {
			console.error('Error updating patient:', error);
			throw error;
		}
	},

	async delete(id, userContext = {}) {
		try {
			let patientId = id;
			if (typeof id === 'string') {
				patientId = parseInt(id, 10);
				if (isNaN(patientId)) {
					throw new Error('Invalid patient ID provided for deletion');
				}
			}

			// Log deletion activity
			await db.userActivity.add({
				userId: userContext.userId || 'unknown',
				action: 'delete_patient',
				timestamp: new Date().toISOString(),
				data: { patientId: id }
			});

			return await db.patients.delete(patientId);
		} catch (error) {
			console.error('Error deleting patient:', error);
			throw error;
		}
	},

	// Keep your existing read functions unchanged
	async getAll() {
		try {
			return await db.patients.toArray();
		} catch (error) {
			console.error('Error getting all patients:', error);
			throw error;
		}
	},

	async getById(id) {
		try {
			if (id === null || id === undefined || id === '') {
				console.error('Invalid patient ID provided:', id);
				return null;
			}

			let patientId = id;
			if (typeof id === 'string') {
				patientId = parseInt(id, 10);
				if (isNaN(patientId)) {
					console.error('Patient ID is not a valid number:', id);
					return null;
				}
			}

			if (!Number.isInteger(patientId) || patientId <= 0) {
				console.error('Patient ID must be a positive integer:', patientId);
				return null;
			}

			const patient = await db.patients.get(patientId);

			if (!patient) {
				console.log('Patient not found with ID:', patientId);
				return null;
			}

			return patient;
		} catch (error) {
			console.error('Error getting patient by ID:', error);
			return null;
		}
	},

	async searchByName(name) {
		try {
			return await db.patients
				.filter(patient => patient.name.toLowerCase().includes(name.toLowerCase()))
				.toArray();
		} catch (error) {
			console.error('Error searching patients by name:', error);
			throw error;
		}
	}
};

const coreConsultationDb = {
	async add(consultation, userContext = {}) {
		try {
			const consultationId = await db.consultations.add({
				...consultation,
				date: consultation.date || new Date().toISOString(),
				createdBy: userContext.userId || 'unknown',
				providerId: userContext.userId || 'unknown',
				providerName: userContext.userName || 'Unknown Provider',
				providerRole: userContext.userRole || 'unknown',
				createdAt: new Date().toISOString(),
				modifiedAt: new Date().toISOString()
			});

			// Update patient's last visit date
			if (consultation.patientId) {
				await corePatientDb.update(consultation.patientId, {
					lastVisit: new Date().toISOString()
				}, userContext);
			}

			// Log consultation activity
			await db.userActivity.add({
				userId: userContext.userId || 'unknown',
				action: 'create_consultation',
				timestamp: new Date().toISOString(),
				data: {
					consultationId,
					patientId: consultation.patientId,
					chiefComplaint: consultation.chiefComplaint
				}
			});

			return consultationId;
		} catch (error) {
			console.error('Error adding consultation:', error);
			throw error;
		}
	},

	// Keep all your existing read functions unchanged
	async getById(id) {
		try {
			return await db.consultations.get(id);
		} catch (error) {
			console.error('Error getting consultation by ID:', error);
			throw error;
		}
	},

	async getByPatientId(patientId) {
		try {
			return await db.consultations
				.where('patientId')
				.equals(patientId)
				.sortBy('date');
		} catch (error) {
			console.error('Error getting consultations by patient ID:', error);
			throw error;
		}
	},

	async getAll() {
		try {
			return await db.consultations.orderBy('date').reverse().toArray();
		} catch (error) {
			console.error('Error getting all consultations:', error);
			throw error;
		}
	},

	async update(id, updates, userContext = {}) {
		try {
			await db.userActivity.add({
				userId: userContext.userId || 'unknown',
				action: 'update_consultation',
				timestamp: new Date().toISOString(),
				data: { consultationId: id, updatedFields: Object.keys(updates) }
			});

			return await db.consultations.update(id, {
				...updates,
				modifiedBy: userContext.userId || 'unknown',
				modifiedAt: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error updating consultation:', error);
			throw error;
		}
	},

	async delete(id, userContext = {}) {
		try {
			await db.userActivity.add({
				userId: userContext.userId || 'unknown',
				action: 'delete_consultation',
				timestamp: new Date().toISOString(),
				data: { consultationId: id }
			});

			return await db.consultations.delete(id);
		} catch (error) {
			console.error('Error deleting consultation:', error);
			throw error;
		}
	}
};

// UPDATED EXPORTS: Wrap write operations with user context
export const patientDb = {
	add: withUserContext(corePatientDb.add),           // ← WRAPPED
	update: withUserContext(corePatientDb.update),     // ← WRAPPED  
	delete: withUserContext(corePatientDb.delete),     // ← WRAPPED
	getAll: corePatientDb.getAll,                      // ← READ-ONLY, no wrap needed
	getById: corePatientDb.getById,                    // ← READ-ONLY, no wrap needed
	searchByName: corePatientDb.searchByName           // ← READ-ONLY, no wrap needed
};

export const consultationDb = {
	add: withUserContext(coreConsultationDb.add),           // ← WRAPPED
	update: withUserContext(coreConsultationDb.update),     // ← WRAPPED
	delete: withUserContext(coreConsultationDb.delete),     // ← WRAPPED
	getById: coreConsultationDb.getById,                    // ← READ-ONLY, no wrap needed
	getByPatientId: coreConsultationDb.getByPatientId,     // ← READ-ONLY, no wrap needed
	getAll: coreConsultationDb.getAll                      // ← READ-ONLY, no wrap needed
};

// Keep ALL your existing exports unchanged
export const medicalDb = {
	async searchMedications(query) {
		try {
			return await db.medications
				.filter(med =>
					med.name.toLowerCase().includes(query.toLowerCase()) ||
					med.indications.some(i => i.toLowerCase().includes(query.toLowerCase()))
				)
				.toArray();
		} catch (error) {
			console.error('Error searching medications:', error);
			throw error;
		}
	},

	async searchConditions(query) {
		try {
			return await db.conditions
				.filter(condition =>
					condition.name.toLowerCase().includes(query.toLowerCase()) ||
					condition.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
				)
				.toArray();
		} catch (error) {
			console.error('Error searching conditions:', error);
			throw error;
		}
	},

	async getGuidelinesByCategory(category) {
		try {
			return await db.guidelines
				.where('category')
				.equals(category)
				.toArray();
		} catch (error) {
			console.error('Error getting guidelines by category:', error);
			throw error;
		}
	},

	async searchGuidelines(query) {
		try {
			if (!query || query.trim() === '') {
				return await db.guidelines.toArray();
			}
			return await db.guidelines
				.filter(guide =>
					guide.title.toLowerCase().includes(query.toLowerCase()) ||
					guide.content.toLowerCase().includes(query.toLowerCase())
				)
				.toArray();
		} catch (error) {
			console.error('Error searching guidelines:', error);
			throw error;
		}
	}
};

// Keep ALL your other existing exports exactly as they are
export const syncQueueDb = {
	async addToQueue(table, recordId, operation, data) {
		try {
			return await db.syncQueue.add({
				table,
				recordId,
				operation,
				data,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding to sync queue:', error);
			throw error;
		}
	},

	async getQueue() {
		try {
			return await db.syncQueue.toArray();
		} catch (error) {
			console.error('Error getting sync queue:', error);
			throw error;
		}
	},

	async removeFromQueue(id) {
		try {
			return await db.syncQueue.delete(id);
		} catch (error) {
			console.error('Error removing from sync queue:', error);
			throw error;
		}
	}
};

export const offlineQueryDb = {
	async add(query) {
		try {
			return await db.offlineQueries.add({
				...query,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding offline query:', error);
			throw error;
		}
	},

	async getAll() {
		try {
			return await db.offlineQueries.toArray();
		} catch (error) {
			console.error('Error getting offline queries:', error);
			throw error;
		}
	},

	async delete(id) {
		try {
			return await db.offlineQueries.delete(id);
		} catch (error) {
			console.error('Error deleting offline query:', error);
			throw error;
		}
	}
};

export const performanceDb = {
	async addMetric(metric) {
		try {
			return await db.performanceMetrics.add({
				...metric,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding performance metric:', error);
			return null;
		}
	},

	async getMetrics(hours = 24) {
		try {
			const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
			return await db.performanceMetrics
				.where('timestamp')
				.above(cutoff.toISOString())
				.toArray();
		} catch (error) {
			console.error('Error getting performance metrics:', error);
			return [];
		}
	}
};

export const biasDb = {
	async addReport(report) {
		try {
			return await db.biasReports.add({
				...report,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding bias report:', error);
			return null;
		}
	},

	async getReports(days = 30) {
		try {
			const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
			return await db.biasReports
				.where('timestamp')
				.above(cutoff.toISOString())
				.toArray();
		} catch (error) {
			console.error('Error getting bias reports:', error);
			return [];
		}
	}
};

export { db };
export default db;