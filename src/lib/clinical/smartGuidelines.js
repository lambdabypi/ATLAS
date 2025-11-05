// lib/clinical/smartGuidelines.js
/**
 * WHO SMART Guidelines Implementation for ATLAS
 * Implements L0-L4 transformation framework
 */

import { db } from '../db/index.js';

// WHO SMART Guidelines Layers
export const SMART_LAYERS = {
	L0: 'NARRATIVE', // Original clinical guidelines
	L1: 'SEMI_STRUCTURED', // Data dictionaries
	L2: 'MACHINE_READABLE', // FHIR resources
	L3: 'EXECUTABLE', // Clinical Quality Language (CQL)
	L4: 'DEPLOYED' // Deployed decision support
};

// Clinical domains from your thesis
export const CLINICAL_DOMAINS = {
	MATERNAL_HEALTH: 'maternal-health',
	INFECTIOUS_DISEASES: 'infectious-diseases',
	NCDS: 'non-communicable-diseases'
};

// L2: FHIR-based Machine-Readable Guidelines
export const FHIR_GUIDELINES = {
	[CLINICAL_DOMAINS.MATERNAL_HEALTH]: {
		id: 'who-anc-2016',
		title: 'WHO Antenatal Care Recommendations',
		version: '2.0.0',
		status: 'active',
		description: 'WHO recommendations on antenatal care for a positive pregnancy experience',
		recommendations: [
			{
				id: 'anc-01',
				title: 'Iron and Folic Acid Supplementation',
				condition: {
					code: 'Z34', // Supervision of normal pregnancy
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				action: {
					title: 'Prescribe Iron/Folic Acid',
					description: 'Daily oral iron (30-60mg elemental) and folic acid (400μg)',
					type: 'create',
					resource: 'MedicationRequest'
				},
				trigger: 'first-anc-visit',
				strength: 'strong',
				evidence: 'High quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['pharmacy', 'medication-availability']
			},
			{
				id: 'anc-02',
				title: 'Tetanus Toxoid Immunization',
				condition: {
					code: 'Z23', // Need for immunization
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				action: {
					title: 'Administer TT Vaccine',
					description: 'Two doses TT vaccine if not previously immunized',
					type: 'create',
					resource: 'Immunization'
				},
				trigger: 'immunization-history-check',
				evidence: 'Moderate quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['vaccine-cold-chain', 'trained-staff']
			}
		]
	},

	[CLINICAL_DOMAINS.INFECTIOUS_DISEASES]: {
		id: 'who-imci-2014',
		title: 'WHO IMCI Guidelines',
		version: '2014',
		status: 'active',
		description: 'Integrated Management of Childhood Illness',
		recommendations: [
			{
				id: 'imci-pneumonia',
				title: 'Pneumonia Management',
				condition: {
					code: 'J18.9', // Pneumonia, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					ageRange: { min: 2, max: 59, unit: 'months' },
					symptoms: ['cough', 'fast-breathing'],
					excludes: ['danger-signs']
				},
				action: {
					title: 'Antibiotic Treatment',
					description: 'Amoxicillin 250mg twice daily for 3 days (2-11 months) or 500mg twice daily (12-59 months)',
					medication: {
						code: '27242',
						system: 'http://www.whocc.no/atc',
						display: 'Amoxicillin'
					}
				},
				evidence: 'High quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['basic-infrastructure', 'antibiotic-availability']
			},
			{
				id: 'imci-diarrhea',
				title: 'Diarrhea Management',
				condition: {
					code: 'K59.1', // Diarrhea, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					ageRange: { min: 2, max: 59, unit: 'months' },
					symptoms: ['diarrhea'],
					duration: 'acute'
				},
				action: {
					title: 'ORS and Zinc Treatment',
					description: 'ORS 75ml/kg over 4 hours if some dehydration, plus zinc supplementation',
					medication: {
						code: 'A07CA',
						system: 'http://www.whocc.no/atc',
						display: 'ORS and Zinc'
					}
				},
				evidence: 'High quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['basic-infrastructure', 'ors-availability']
			}
		]
	},

	[CLINICAL_DOMAINS.NCDS]: {
		id: 'who-pen-2020',
		title: 'WHO PEN Protocol',
		version: '2020',
		status: 'active',
		description: 'Package of Essential NCD interventions',
		recommendations: [
			{
				id: 'pen-hypertension',
				title: 'Hypertension Management',
				condition: {
					code: 'I10', // Essential hypertension
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					ageRange: { min: 18, max: 100, unit: 'years' },
					bloodPressure: { systolic: '>140', diastolic: '>90' }
				},
				action: {
					title: 'Antihypertensive Treatment',
					description: 'Start ACE inhibitor or thiazide diuretic, lifestyle counseling',
					medication: {
						code: 'C09A',
						system: 'http://www.whocc.no/atc',
						display: 'ACE inhibitors'
					}
				},
				evidence: 'High quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['basic-infrastructure', 'bp-monitor', 'medication-availability']
			}
		]
	}
};

// L3: Clinical Quality Language (CQL) Logic
export const CQL_RULES = {
	maternalHealthRules: `
    library MaternalHealthGuidelines version '1.0.0'
    
    using FHIR version '4.0.1'
    
    define "Pregnant Woman":
      [Condition: "Pregnancy"] P
        where P.clinicalStatus = 'active'
    
    define "First ANC Visit":
      "Pregnant Woman" P
        with [Encounter: "Antenatal Care"] E
          such that E.status = 'finished'
            and not exists([Encounter: "Antenatal Care"] Prior
              where Prior.period.start < E.period.start)
    
    define "Iron Folic Acid Indicated":
      "Pregnant Woman" P
        where not exists([MedicationRequest: "Iron Supplement"] M
          where M.status = 'active')
    
    define "Recommendation Iron Folic Acid":
      "First ANC Visit"
        and "Iron Folic Acid Indicated"
  `,

	imciRules: `
    library IMCIGuidelines version '1.0.0'
    
    using FHIR version '4.0.1'
    
    define "Child 2-59 Months":
      [Patient] P
        where AgeInMonths() >= 2 and AgeInMonths() <= 59
    
    define "Has Cough":
      exists([Condition: "Cough"] C where C.clinicalStatus = 'active')
    
    define "Fast Breathing":
      exists([Observation: "Respiratory Rate"] RR
        where RR.value > 50 and AgeInMonths() < 12)
          or exists([Observation: "Respiratory Rate"] RR
            where RR.value > 40 and AgeInMonths() >= 12)
    
    define "Danger Signs Present":
      exists([Condition: "Unable to drink or breastfeed"])
        or exists([Condition: "Vomits everything"])
        or exists([Condition: "Convulsions"])
        or exists([Condition: "Lethargy"])
    
    define "Pneumonia Diagnosis":
      "Child 2-59 Months"
        and "Has Cough"
        and "Fast Breathing"
        and not "Danger Signs Present"
  `
};

// L4: Deployed Decision Support Functions
export class SMARTGuidelinesEngine {
	constructor() {
		this.guidelines = FHIR_GUIDELINES;
		this.rules = CQL_RULES;
	}

	// Execute clinical decision logic
	async executeGuideline(domain, patientData, encounterData = {}) {
		try {
			const guideline = this.guidelines[domain];
			if (!guideline) {
				console.warn(`Guideline not found for domain: ${domain}`);
				return null;
			}

			const recommendations = [];

			for (const rec of guideline.recommendations) {
				const applicable = await this.evaluateCondition(rec.condition, rec.criteria, patientData);

				if (applicable) {
					recommendations.push({
						id: rec.id,
						title: rec.title,
						description: rec.action.description,
						strength: rec.strength || 'strong',
						evidence: rec.evidence || this.getEvidenceLevel(rec.id),
						resourceConstraints: rec.resourceConstraints || this.assessResourceConstraints(rec.action),
						localAdaptation: await this.getLocalAdaptation(rec.id)
					});
				}
			}

			return {
				domain,
				guidelines: guideline.title,
				version: guideline.version,
				recommendations,
				timestamp: new Date().toISOString(),
				evidence: 'WHO Clinical Guidelines'
			};
		} catch (error) {
			console.error('SMART Guidelines execution error:', error);
			return null;
		}
	}

	// Enhanced condition evaluation
	async evaluateCondition(condition, criteria, patientData) {
		try {
			// Basic FHIR code matching
			if (condition.code === 'Z34' && (patientData.pregnancy?.status === 'active' || patientData.pregnancy)) {
				return true;
			}

			if (condition.code === 'J18.9') {
				const symptoms = (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('cough') && (symptoms.includes('fever') || symptoms.includes('breathing'));
			}

			if (condition.code === 'K59.1') {
				const symptoms = (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('diarrhea') || symptoms.includes('diarrhoea');
			}

			if (condition.code === 'I10') {
				const vitals = patientData.vitals || '';
				const bpMatch = vitals.match(/(\d+)\/(\d+)/);
				if (bpMatch) {
					const systolic = parseInt(bpMatch[1]);
					const diastolic = parseInt(bpMatch[2]);
					return systolic > 140 || diastolic > 90;
				}
			}

			// Age-based criteria evaluation
			if (criteria?.ageRange) {
				const age = patientData.age;
				if (!age) return false;

				if (criteria.ageRange.unit === 'months') {
					const ageInMonths = age * 12; // Assuming age is in years, convert to months
					return ageInMonths >= criteria.ageRange.min && ageInMonths <= criteria.ageRange.max;
				} else {
					return age >= criteria.ageRange.min && age <= criteria.ageRange.max;
				}
			}

			return false;
		} catch (error) {
			console.error('Error evaluating condition:', error);
			return false;
		}
	}

	// Get evidence level for recommendation
	getEvidenceLevel(recommendationId) {
		const evidenceLevels = {
			'anc-01': 'High quality evidence (WHO Strong Recommendation)',
			'anc-02': 'Moderate quality evidence (WHO Strong Recommendation)',
			'imci-pneumonia': 'High quality evidence (WHO Strong Recommendation)',
			'imci-diarrhea': 'High quality evidence (WHO Strong Recommendation)',
			'pen-hypertension': 'High quality evidence (WHO Strong Recommendation)'
		};

		return evidenceLevels[recommendationId] || 'Moderate quality evidence';
	}

	// Assess resource constraints for recommendation
	assessResourceConstraints(action) {
		const resourceMap = {
			'MedicationRequest': ['pharmacy', 'medication-availability'],
			'Immunization': ['vaccine-cold-chain', 'trained-staff'],
			'Observation': ['basic-equipment']
		};

		return resourceMap[action.resource] || ['basic-infrastructure'];
	}

	// Get local adaptations (placeholder for future implementation)
	async getLocalAdaptation(recommendationId) {
		// This would connect to local adaptation database
		return {
			available: true,
			modifications: [],
			localProtocol: null
		};
	}

	// Transform L0 narrative to L1 semi-structured
	static parseNarrativeGuideline(narrativeText) {
		// NLP-based extraction of clinical rules from narrative text
		// This is a simplified implementation

		const extractedRules = {
			conditions: [],
			actions: [],
			contraindications: [],
			dosing: []
		};

		// Pattern matching for common clinical patterns
		const conditionPatterns = [
			/if.*patient.*has.*(\w+)/gi,
			/when.*(\w+).*is present/gi,
			/in cases of.*(\w+)/gi
		];

		conditionPatterns.forEach(pattern => {
			const matches = narrativeText.match(pattern);
			if (matches) {
				extractedRules.conditions.push(...matches);
			}
		});

		return extractedRules;
	}

	// Validate CQL syntax (simplified)
	static validateCQL(cqlText) {
		const requiredElements = ['library', 'using', 'define'];
		const validationResults = {
			isValid: true,
			errors: [],
			warnings: []
		};

		requiredElements.forEach(element => {
			if (!cqlText.includes(element)) {
				validationResults.isValid = false;
				validationResults.errors.push(`Missing required element: ${element}`);
			}
		});

		return validationResults;
	}
}

// Initialize SMART Guidelines in database
export async function initializeSMARTGuidelines() {
	try {
		const engine = new SMARTGuidelinesEngine();

		// Store FHIR guidelines in database
		for (const [domain, guideline] of Object.entries(FHIR_GUIDELINES)) {
			await db.guidelines.put({
				id: guideline.id,
				domain,
				title: guideline.title,
				version: guideline.version,
				type: 'SMART-L2-FHIR',
				content: guideline,
				lastUpdated: new Date().toISOString()
			});
		}

		// Store CQL rules
		for (const [ruleSet, cql] of Object.entries(CQL_RULES)) {
			await db.guidelines.put({
				id: `cql-${ruleSet}`,
				domain: ruleSet.replace('Rules', ''),
				title: `CQL Rules - ${ruleSet}`,
				type: 'SMART-L3-CQL',
				content: { cql },
				lastUpdated: new Date().toISOString()
			});
		}

		console.log('WHO SMART Guidelines initialized successfully');
		return engine;
	} catch (error) {
		console.error('Failed to initialize SMART Guidelines:', error);
		throw error;
	}
}