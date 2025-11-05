// src/lib/db/index.js - FIXED VERSION with proper exports
import Dexie from 'dexie';

// Create Dexie database
const db = new Dexie('ClinicalSupportDB');

// FIXED: Single version with all required fields from the start
db.version(1).stores({
	patients: '++id, name, age, gender, lastVisit',
	consultations: '++id, patientId, date, symptoms, diagnosis, plan, *tags, aiRecommendations, finalDiagnosis, providerNotes',
	medications: 'id, name, category, dosages, indications, contraindications, sideEffects',
	conditions: 'id, name, symptoms, diagnostics, treatments, *keywords',
	guidelines: '++id, title, category, subcategory, resourceLevel, content, lastUpdated',
	offlineQueries: '++id, query, timestamp, priority, error',
	syncQueue: '++id, table, recordId, operation, data, timestamp',
	// Additional tables for monitoring
	performanceMetrics: '++id, operation, duration, timestamp, additionalData',
	biasReports: '++id, queryId, overallSeverity, detectedBiases, timestamp',
	aiErrors: '++id, errorType, timestamp, query, attempt',
	crdtDocuments: '++id, type, nodeId, vectorClock, operations, state',
	testResults: '++id, testSuite, timestamp, results, overallScore'
});

// Database open event handler to handle migration issues
db.on('ready', function () {
	console.log('ClinicalSupportDB is ready');
	return Promise.resolve();
});

db.on('versionchange', function () {
	console.log('Database version changed - reloading page');
	window.location.reload();
});

// Enhanced seed function
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
					},
					{
						title: 'Management of Acute Diarrhea',
						category: 'Gastrointestinal',
						subcategory: 'Infectious Disease',
						resourceLevel: 'LEVEL_2',
						content: JSON.stringify({
							overview: 'Assessment and management of acute diarrhea, focusing on preventing dehydration.',
							assessment: [
								'Assess for dehydration: sunken eyes, skin pinch, decreased urination',
								'Check for blood in stool, fever, duration of symptoms'
							],
							management: [
								'Rehydration: ORS for mild to moderate dehydration',
								'Zinc supplementation for 10-14 days for all children with diarrhea',
								'Continue feeding during illness'
							],
							redFlags: [
								'Severe dehydration',
								'Persistent vomiting',
								'High fever with bloody diarrhea'
							],
							followUp: 'Return immediately if unable to drink or signs worsen'
						}),
						lastUpdated: new Date().toISOString()
					},
					{
						title: 'Hypertension Management',
						category: 'Cardiovascular',
						subcategory: 'Chronic Disease',
						resourceLevel: 'LEVEL_3',
						content: JSON.stringify({
							overview: 'Simplified guideline for hypertension management in resource-limited settings.',
							diagnosis: [
								'BP ≥140/90 mmHg on at least two separate occasions',
								'Basic risk assessment: smoking, diabetes, age, previous cardiovascular events'
							],
							management: [
								'Lifestyle modifications for all patients',
								'First-line medications: thiazide diuretic, calcium channel blocker, or ACE inhibitor',
								'Start with single drug and low dose, titrate upward if needed'
							],
							monitoring: [
								'BP check every 1-3 months until target reached',
								'Target BP <140/90 mmHg for most patients'
							]
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
		// If there's a schema error, we might need to delete and recreate the database
		if (error.name === 'UpgradeError' || error.name === 'DatabaseClosedError') {
			console.log('Database schema error detected. Clearing database for fresh start.');
			await db.delete();
			window.location.reload();
		}
	}
}

// Helper functions for database operations
export const patientDb = {
	async add(patient) {
		try {
			return await db.patients.add({
				...patient,
				lastVisit: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding patient:', error);
			throw error;
		}
	},

	async getAll() {
		try {
			return await db.patients.toArray();
		} catch (error) {
			console.error('Error getting all patients:', error);
			throw error;
		}
	},

	// FIXED: Updated getById function with proper ID handling
	async getById(id) {
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

			const patient = await db.patients.get(patientId);

			if (!patient) {
				console.log('Patient not found with ID:', patientId);
				return null;
			}

			return patient;
		} catch (error) {
			console.error('Error getting patient by ID:', error);
			return null; // Return null instead of throwing to avoid breaking the UI
		}
	},

	async update(id, updates) {
		try {
			// Use same ID normalization logic
			let patientId = id;
			if (typeof id === 'string') {
				patientId = parseInt(id, 10);
				if (isNaN(patientId)) {
					throw new Error('Invalid patient ID provided for update');
				}
			}

			return await db.patients.update(patientId, updates);
		} catch (error) {
			console.error('Error updating patient:', error);
			throw error;
		}
	},

	async delete(id) {
		try {
			// Use same ID normalization logic
			let patientId = id;
			if (typeof id === 'string') {
				patientId = parseInt(id, 10);
				if (isNaN(patientId)) {
					throw new Error('Invalid patient ID provided for deletion');
				}
			}

			return await db.patients.delete(patientId);
		} catch (error) {
			console.error('Error deleting patient:', error);
			throw error;
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

// Medical reference operations
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

// Enhanced consultation operations
export const consultationDb = {
	async add(consultation) {
		try {
			const consultationId = await db.consultations.add({
				...consultation,
				date: consultation.date || new Date().toISOString()
			});

			// Update patient's last visit date
			if (consultation.patientId) {
				await patientDb.update(consultation.patientId, {
					lastVisit: new Date().toISOString()
				});
			}

			return consultationId;
		} catch (error) {
			console.error('Error adding consultation:', error);
			throw error;
		}
	},

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

	async update(id, updates) {
		try {
			return await db.consultations.update(id, updates);
		} catch (error) {
			console.error('Error updating consultation:', error);
			throw error;
		}
	},

	async delete(id) {
		try {
			return await db.consultations.delete(id);
		} catch (error) {
			console.error('Error deleting consultation:', error);
			throw error;
		}
	}
};

// Queue operations for offline-to-online synchronization
export const syncQueueDb = {
	async addToQueue(table, recordId, operation, data) {
		try {
			return await db.syncQueue.add({
				table,
				recordId,
				operation, // 'add', 'update', or 'delete'
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

// Store LLM queries made while offline to process when online
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

// Performance monitoring database operations
export const performanceDb = {
	async addMetric(metric) {
		try {
			return await db.performanceMetrics.add({
				...metric,
				timestamp: new Date().toISOString()
			});
		} catch (error) {
			console.error('Error adding performance metric:', error);
			// Don't throw for performance metrics - just log
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

// Bias reporting database operations  
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

// CRITICAL FIX: Export both named and default exports
export { db }; // Named export for import { db }
export default db; // Default export for import db