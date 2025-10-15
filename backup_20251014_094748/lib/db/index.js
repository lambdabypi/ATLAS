// src/lib/db/index.js
import Dexie from 'dexie';

// Create Dexie database
const db = new Dexie('ClinicalSupportDB');

// Define database schema with versioning for future updates
db.version(1).stores({
	patients: '++id, name, age, gender, lastVisit', // Patient demographics
	consultations: '++id, patientId, date, symptoms, diagnosis, plan, *tags', // Clinical consultations
	medications: 'id, name, category, dosages, indications, contraindications, sideEffects', // Medication reference
	conditions: 'id, name, symptoms, diagnostics, treatments, *keywords', // Clinical conditions
	guidelines: 'id, title, category, content, lastUpdated', // Clinical guidelines
	offlineQueries: '++id, query, timestamp', // Store offline LLM queries for processing when online
	syncQueue: '++id, table, recordId, operation, data, timestamp' // Queue for data sync when online
});

// Seed initial data function - to be called during app initialization
export async function seedInitialData() {
	// Only seed if tables are empty
	const medicationCount = await db.medications.count();
	const conditionCount = await db.conditions.count();
	const guidelineCount = await db.guidelines.count();

	if (medicationCount === 0) {
		try {
			// Seed essential medications (minimal example)
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
				// Add more essential medications based on WHO Essential Medicines List
			]);
			console.log('Essential medications seeded');
		} catch (error) {
			console.error('Error seeding medications:', error);
		}
	}

	if (conditionCount === 0) {
		try {
			// Seed common conditions (minimal example)
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
				// Add more common conditions
			]);
			console.log('Common conditions seeded');
		} catch (error) {
			console.error('Error seeding conditions:', error);
		}
	}

	if (guidelineCount === 0) {
		try {
			// Seed basic guidelines (minimal example)
			await db.guidelines.bulkPut([
				{
					id: 'guide1',
					title: 'Management of Acute Respiratory Infections',
					category: 'Respiratory',
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
				// Add more guidelines
			]);
			console.log('Basic guidelines seeded');
		} catch (error) {
			console.error('Error seeding guidelines:', error);
		}
	}
}

// Helper functions for database operations

// Patient operations
export const patientDb = {
	async add(patient) {
		return await db.patients.add({
			...patient,
			lastVisit: new Date().toISOString()
		});
	},

	async getAll() {
		return await db.patients.toArray();
	},

	async getById(id) {
		return await db.patients.get(id);
	},

	async update(id, updates) {
		return await db.patients.update(id, updates);
	},

	async delete(id) {
		return await db.patients.delete(id);
	},

	async searchByName(name) {
		return await db.patients
			.filter(patient => patient.name.toLowerCase().includes(name.toLowerCase()))
			.toArray();
	}
};

// Consultation operations
export const consultationDb = {
	async add(consultation) {
		const consultationId = await db.consultations.add({
			...consultation,
			date: new Date().toISOString()
		});

		// Update patient's last visit date
		await db.patients.update(consultation.patientId, {
			lastVisit: new Date().toISOString()
		});

		return consultationId;
	},

	async getByPatientId(patientId) {
		return await db.consultations
			.where('patientId')
			.equals(patientId)
			.sortBy('date'); // Sort by date ascending
	},

	async getById(id) {
		return await db.consultations.get(id);
	},

	async update(id, updates) {
		return await db.consultations.update(id, updates);
	}
};

// Medical reference operations
export const medicalDb = {
	async searchMedications(query) {
		return await db.medications
			.filter(med =>
				med.name.toLowerCase().includes(query.toLowerCase()) ||
				med.indications.some(i => i.toLowerCase().includes(query.toLowerCase()))
			)
			.toArray();
	},

	async searchConditions(query) {
		return await db.conditions
			.filter(condition =>
				condition.name.toLowerCase().includes(query.toLowerCase()) ||
				condition.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
			)
			.toArray();
	},

	async getGuidelinesByCategory(category) {
		return await db.guidelines
			.where('category')
			.equals(category)
			.toArray();
	},

	async searchGuidelines(query) {
		return await db.guidelines
			.filter(guide =>
				guide.title.toLowerCase().includes(query.toLowerCase()) ||
				guide.content.toLowerCase().includes(query.toLowerCase())
			)
			.toArray();
	}
};

// Queue operations for offline-to-online synchronization
export const syncQueueDb = {
	async addToQueue(table, recordId, operation, data) {
		return await db.syncQueue.add({
			table,
			recordId,
			operation, // 'add', 'update', or 'delete'
			data,
			timestamp: new Date().toISOString()
		});
	},

	async getQueue() {
		return await db.syncQueue.toArray();
	},

	async removeFromQueue(id) {
		return await db.syncQueue.delete(id);
	}
};

// Store LLM queries made while offline to process when online
export const offlineQueryDb = {
	async add(query) {
		return await db.offlineQueries.add({
			query,
			timestamp: new Date().toISOString()
		});
	},

	async getAll() {
		return await db.offlineQueries.toArray();
	},

	async delete(id) {
		return await db.offlineQueries.delete(id);
	}
};

export default db;