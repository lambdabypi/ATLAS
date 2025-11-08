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
	NCDS: 'non-communicable-diseases',
	GENERAL_MEDICINE: 'general-medicine' // Added missing domain
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
			},
			{
				id: 'anc-03',
				title: 'Preeclampsia Management',
				condition: {
					code: 'O14.9', // Preeclampsia, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['severe headache', 'visual disturbances', 'epigastric pain'],
					bloodPressure: '>140/90'
				},
				action: {
					title: 'Urgent Preeclampsia Care',
					description: 'Immediate assessment, blood pressure control with methyldopa, prepare magnesium sulfate, urgent referral required',
					type: 'urgent-referral',
					resource: 'ServiceRequest'
				},
				trigger: 'preeclampsia-symptoms',
				strength: 'strong',
				evidence: 'WHO Strong Recommendation - Maternal Health',
				resourceConstraints: ['blood-pressure-monitor', 'antihypertensive-medications', 'referral-capability']
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
			},
			{
				id: 'imci-malaria',
				title: 'Malaria Management',
				condition: {
					code: 'B54', // Unspecified malaria
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['fever', 'headache', 'body aches', 'chills'],
					testResult: 'rdt-positive'
				},
				action: {
					title: 'Antimalarial Treatment',
					description: 'Artemether-lumefantrine for uncomplicated malaria, complete full course',
					medication: {
						code: 'P01BF01',
						system: 'http://www.whocc.no/atc',
						display: 'Artemether-lumefantrine'
					}
				},
				evidence: 'High quality evidence (WHO Strong Recommendation)',
				resourceConstraints: ['basic-infrastructure', 'antimalarial-availability']
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
	},

	// ADD THE MISSING GENERAL MEDICINE DOMAIN
	[CLINICAL_DOMAINS.GENERAL_MEDICINE]: {
		id: 'who-general-medicine-2024',
		title: 'WHO General Medicine Guidelines',
		version: '1.0.0',
		status: 'active',
		description: 'WHO recommendations for general medical conditions in primary care',
		recommendations: [
			{
				id: 'gm-01',
				title: 'Fever Management',
				condition: {
					code: 'R50.9', // Fever, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['fever', 'temperature', 'hot']
				},
				action: {
					title: 'Fever Assessment and Management',
					description: 'Assess for danger signs, provide paracetamol for comfort, ensure adequate fluid intake',
					type: 'assessment',
					resource: 'ClinicalImpression'
				},
				trigger: 'fever-complaint',
				strength: 'strong',
				evidence: 'WHO Clinical Guidelines',
				resourceConstraints: ['thermometer', 'paracetamol']
			},
			{
				id: 'gm-02',
				title: 'Headache Assessment',
				condition: {
					code: 'R51', // Headache
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['headache', 'head pain', 'severe headache']
				},
				action: {
					title: 'Headache Evaluation',
					description: 'Rule out secondary causes, provide symptomatic treatment, assess for red flags',
					type: 'assessment',
					resource: 'ClinicalImpression'
				},
				trigger: 'headache-complaint',
				strength: 'strong',
				evidence: 'Clinical best practice',
				resourceConstraints: ['basic-clinical-assessment']
			},
			{
				id: 'gm-03',
				title: 'Visual Disturbances Assessment',
				condition: {
					code: 'H53.9', // Visual disturbance, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['visual disturbances', 'blurred vision', 'vision problems']
				},
				action: {
					title: 'Vision Assessment',
					description: 'Check visual acuity, assess for urgent causes, refer if neurological signs',
					type: 'assessment',
					resource: 'ClinicalImpression'
				},
				trigger: 'vision-complaint',
				strength: 'strong',
				evidence: 'Clinical guidelines',
				resourceConstraints: ['basic-eye-examination']
			},
			{
				id: 'gm-04',
				title: 'Blood Pressure Assessment',
				condition: {
					code: 'R03.0', // Elevated blood pressure reading
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['blood pressure', 'bp', 'hypertension']
				},
				action: {
					title: 'Blood Pressure Evaluation',
					description: 'Repeat BP measurement, assess cardiovascular risk, lifestyle counseling',
					type: 'assessment',
					resource: 'Observation'
				},
				trigger: 'bp-complaint',
				strength: 'strong',
				evidence: 'WHO guidelines',
				resourceConstraints: ['bp-monitor', 'cardiovascular-assessment']
			},
			{
				id: 'gm-05',
				title: 'Abdominal Pain Assessment',
				condition: {
					code: 'R10.9', // Abdominal pain, unspecified
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['abdominal pain', 'stomach pain', 'epigastric pain']
				},
				action: {
					title: 'Abdominal Pain Evaluation',
					description: 'Systematic examination, assess for surgical conditions, provide supportive care',
					type: 'assessment',
					resource: 'ClinicalImpression'
				},
				trigger: 'abdominal-pain-complaint',
				strength: 'strong',
				evidence: 'Clinical guidelines',
				resourceConstraints: ['clinical-examination']
			},
			{
				id: 'gm-06',
				title: 'General Clinical Assessment',
				condition: {
					code: 'Z00.00', // General adult medical examination
					system: 'http://hl7.org/fhir/sid/icd-10'
				},
				criteria: {
					symptoms: ['general', 'consultation', 'check-up']
				},
				action: {
					title: 'Comprehensive Assessment',
					description: 'Complete history and examination, vital signs, basic investigations as indicated',
					type: 'assessment',
					resource: 'ClinicalImpression'
				},
				trigger: 'general-consultation',
				strength: 'moderate',
				evidence: 'Clinical practice standards',
				resourceConstraints: ['basic-clinical-assessment']
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
  `,

	// Add general medicine CQL rules
	generalMedicineRules: `
    library GeneralMedicineGuidelines version '1.0.0'
    
    using FHIR version '4.0.1'
    
    define "Adult Patient":
      [Patient] P
        where AgeInYears() >= 18
    
    define "Has Fever":
      exists([Observation: "Body Temperature"] T 
        where T.value > 38.0 and T.status = 'final')
    
    define "Has Headache":
      exists([Condition: "Headache"] H 
        where H.clinicalStatus = 'active')
    
    define "Elevated Blood Pressure":
      exists([Observation: "Blood Pressure"] BP
        where (BP.component[0].value > 140 or BP.component[1].value > 90)
          and BP.status = 'final')
    
    define "General Assessment Needed":
      "Adult Patient"
        and ("Has Fever" or "Has Headache" or "Elevated Blood Pressure")
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
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('cough') && (symptoms.includes('fever') || symptoms.includes('breathing'));
			}

			if (condition.code === 'K59.1') {
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('diarrhea') || symptoms.includes('diarrhoea');
			}

			if (condition.code === 'O14.9') { // Preeclampsia
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();

				const hasHeadache = symptoms.includes('headache');
				const hasVisual = symptoms.includes('visual');
				const hasEpigastric = symptoms.includes('epigastric');

				// Check blood pressure
				const vitals = patientData.vitalSigns || patientData.vitals || {};
				const bpString = vitals.bp || '';
				const bpMatch = bpString.match ? bpString.match(/(\d+)\/(\d+)/) : null;

				let highBP = false;
				if (bpMatch) {
					const systolic = parseInt(bpMatch[1]);
					const diastolic = parseInt(bpMatch[2]);
					highBP = systolic >= 140 || diastolic >= 90;
				}

				// Preeclampsia if severe symptoms + high BP
				return (hasHeadache && hasVisual) || (hasEpigastric && highBP);
			}

			// ADD THIS: Malaria condition matching
			if (condition.code === 'B54') { // Malaria
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				const hasRDT = patientData.examination?.rdt === 'positive';
				const hasFever = symptoms.includes('fever');
				return hasFever && hasRDT;
			}

			if (condition.code === 'I10') {
				const vitals = patientData.vitals || patientData.vitalSigns || '';
				const bpMatch = vitals.match ? vitals.match(/(\d+)\/(\d+)/) : null;
				if (bpMatch) {
					const systolic = parseInt(bpMatch[1]);
					const diastolic = parseInt(bpMatch[2]);
					return systolic > 140 || diastolic > 90;
				}
			}

			// Enhanced general medicine conditions
			if (condition.code === 'R50.9') { // Fever
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('fever') || symptoms.includes('temperature');
			}

			if (condition.code === 'R51') { // Headache
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('headache') || symptoms.includes('head pain');
			}

			if (condition.code === 'H53.9') { // Visual disturbances
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('visual') || symptoms.includes('vision') || symptoms.includes('blurred');
			}

			if (condition.code === 'R10.9') { // Abdominal pain
				const symptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();
				return symptoms.includes('abdominal') || symptoms.includes('stomach') || symptoms.includes('epigastric');
			}

			// Generic symptom matching with proper type handling
			if (criteria && criteria.symptoms) {
				const patientSymptoms = Array.isArray(patientData.symptoms)
					? patientData.symptoms.join(' ').toLowerCase()
					: (patientData.symptoms || '').toLowerCase();

				const criteriaSymptoms = Array.isArray(criteria.symptoms)
					? criteria.symptoms
					: [criteria.symptoms];

				return criteriaSymptoms.some(symptom =>
					patientSymptoms.includes(symptom.toLowerCase())
				);
			}

			return false;
		} catch (error) {
			console.error('Error evaluating condition:', error);
			console.error('Patient data type:', typeof patientData.symptoms, patientData.symptoms);
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
			'pen-hypertension': 'High quality evidence (WHO Strong Recommendation)',
			// Add general medicine evidence levels
			'gm-01': 'WHO Clinical Guidelines (Strong Recommendation)',
			'gm-02': 'Clinical best practice (Moderate Recommendation)',
			'gm-03': 'Clinical guidelines (Strong Recommendation)',
			'gm-04': 'WHO guidelines (Strong Recommendation)',
			'gm-05': 'Clinical guidelines (Strong Recommendation)',
			'gm-06': 'Clinical practice standards (Moderate Recommendation)'
		};

		return evidenceLevels[recommendationId] || 'Moderate quality evidence';
	}

	// Assess resource constraints for recommendation
	assessResourceConstraints(action) {
		const resourceMap = {
			'MedicationRequest': ['pharmacy', 'medication-availability'],
			'Immunization': ['vaccine-cold-chain', 'trained-staff'],
			'Observation': ['basic-equipment'],
			'ClinicalImpression': ['trained-healthcare-provider']
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