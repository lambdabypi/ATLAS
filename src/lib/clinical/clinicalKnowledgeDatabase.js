// src/lib/clinical/clinicalKnowledgeDatabase.js
// Comprehensive WHO Clinical Knowledge Base for ATLAS
// Supports hybrid AI decision support in resource-limited healthcare settings

/**
 * WHO Clinical Knowledge Database v2.0
 * 
 * Structure follows WHO SMART Guidelines framework:
 * - Evidence-based clinical protocols
 * - Resource-appropriate interventions  
 * - Comprehensive clinical terminology mapping
 * - Multi-language support preparation
 * 
 * @author ATLAS Development Team
 * @version 2.0.0
 * @lastUpdated 2024-11-09
 */

// Clinical Domain Classifications (WHO-aligned)
export const CLINICAL_DOMAINS = {
	EMERGENCY: 'emergency',
	MATERNAL_HEALTH: 'maternal_health',
	PEDIATRIC: 'pediatric',
	RESPIRATORY: 'respiratory',
	GASTROINTESTINAL: 'gastrointestinal',
	CARDIOVASCULAR: 'cardiovascular',
	INFECTIOUS_DISEASES: 'infectious_diseases',
	MENTAL_HEALTH: 'mental_health',
	CHRONIC_DISEASES: 'chronic_diseases',
	GENERAL_MEDICINE: 'general_medicine'
};

// Evidence Grading (WHO Standards)
export const EVIDENCE_GRADES = {
	HIGH: 'high',           // High confidence in effect estimate
	MODERATE: 'moderate',   // Moderate confidence in effect estimate  
	LOW: 'low',            // Low confidence in effect estimate
	VERY_LOW: 'very_low'   // Very low confidence in effect estimate
};

// Recommendation Strength (WHO Guidelines)
export const RECOMMENDATION_STRENGTH = {
	STRONG: 'strong',       // We recommend...
	CONDITIONAL: 'conditional', // We suggest...
	GOOD_PRACTICE: 'good_practice' // Good practice statement
};

// Resource Levels (WHO Health System Building Blocks)
export const RESOURCE_LEVELS = {
	BASIC: 'basic',         // Community health worker, basic equipment
	INTERMEDIATE: 'intermediate', // Health center, some diagnostic capability
	ADVANCED: 'advanced'    // District hospital, full diagnostic capability
};

// Priority Classifications
export const PRIORITY_LEVELS = {
	CRITICAL: 'critical',   // Life-threatening, immediate action
	HIGH: 'high',          // Urgent, same day
	MODERATE: 'moderate',   // Important, within days
	LOW: 'low'             // Routine, can wait
};

// ===============================================================
// COMPREHENSIVE CLINICAL TERMINOLOGY MAPPING
// ===============================================================

export const CLINICAL_SYNONYMS = {
	// General medicine terms
	'headache': [
		'head pain', 'cephalgia', 'migraine', 'head ache',
		'cranial pain', 'cephalalgia'
	],
	'pain': [
		'ache', 'discomfort', 'hurt', 'sore', 'tender',
		'painful', 'soreness', 'aching'
	],
	'fatigue': [
		'tired', 'weakness', 'exhaustion', 'lethargy',
		'malaise', 'weariness'
	],

	// Emergency terms
	'emergency': [
		'urgent', 'critical', 'danger', 'severe', 'acute',
		'crisis', 'life-threatening', 'immediate'
	],
	'unconscious': [
		'coma', 'unresponsive', 'collapsed', 'fainted',
		'loss of consciousness', 'syncope'
	],

	// Maternal health - only when context is appropriate
	'pregnant': [
		'pregnancy', 'antenatal', 'prenatal', 'gestational',
		'expecting', 'gravida'
	],
	'labor': [
		'labour', 'delivery', 'birth', 'parturition', 'contractions',
		'childbirth', 'partum', 'birthing', 'confinement'
	],
	'preeclampsia': [
		'pregnancy induced hypertension', 'pih', 'toxemia',
		'pregnancy toxemia', 'gestational hypertension'
	],

	// PEDIATRIC TERMS
	'child': [
		'pediatric', 'paediatric', 'infant', 'baby', 'toddler',
		'kid', 'youngster', 'minor', 'juvenile'
	],
	'infant': [
		'baby', 'newborn', 'neonate', 'child', 'pediatric',
		'nursling', 'suckling'
	],
	'immunization': [
		'vaccination', 'vaccine', 'immunisation', 'shot',
		'inoculation', 'prophylaxis'
	],

	// RESPIRATORY TERMS
	'breathing': [
		'respiratory', 'breathe', 'breath', 'dyspnea', 'dyspnoea',
		'respiration', 'ventilation', 'airway'
	],
	'cough': [
		'coughing', 'respiratory', 'chest', 'phlegm', 'sputum',
		'expectoration', 'tussis', 'hacking'
	],
	'pneumonia': [
		'chest infection', 'lung infection', 'respiratory infection',
		'pulmonary infection', 'lower respiratory tract infection'
	],
	'asthma': [
		'bronchial asthma', 'reactive airway disease', 'wheezing',
		'bronchospasm', 'airway obstruction'
	],

	// EMERGENCY TERMS
	'emergency': [
		'urgent', 'critical', 'danger', 'severe', 'acute',
		'crisis', 'life-threatening', 'immediate'
	],
	'unconscious': [
		'coma', 'unresponsive', 'collapsed', 'fainted',
		'loss of consciousness', 'syncope'
	],
	'convulsions': [
		'seizures', 'fits', 'epilepsy', 'spasms', 'convulsion'
	],

	// GASTROINTESTINAL TERMS
	'diarrhea': [
		'diarrhoea', 'loose stool', 'watery stool', 'stomach upset',
		'gastroenteritis', 'bowel movement', 'dysentery'
	],
	'vomiting': [
		'vomit', 'throw up', 'nausea', 'sick', 'emesis',
		'regurgitation', 'retching'
	],
	'dehydration': [
		'fluid loss', 'volume depletion', 'hypovolemia',
		'water loss', 'electrolyte imbalance'
	],

	// CARDIOVASCULAR TERMS  
	'hypertension': [
		'high blood pressure', 'bp', 'raised blood pressure',
		'elevated blood pressure', 'arterial hypertension'
	],
	'heart': [
		'cardiac', 'cardio', 'coronary', 'myocardial',
		'cardiovascular', 'circulatory'
	],

	// INFECTIOUS DISEASE TERMS
	'fever': [
		'temperature', 'febrile', 'hot', 'pyrexia',
		'hyperthermia', 'raised temperature'
	],
	'malaria': [
		'plasmodium', 'antimalarial', 'falciparum', 'vivax',
		'tropical fever', 'paludism'
	],
	'infection': [
		'sepsis', 'infectious', 'pathogen', 'bacteria',
		'virus', 'microbe', 'contamination'
	],

	// GENERAL MEDICAL TERMS
	'pain': [
		'ache', 'discomfort', 'hurt', 'sore', 'tender',
		'painful', 'soreness', 'aching'
	],
	'headache': [
		'head pain', 'cephalgia', 'migraine', 'head ache',
		'cranial pain', 'cephalalgia'
	],
	'fatigue': [
		'tired', 'weakness', 'exhaustion', 'lethargy',
		'malaise', 'weariness'
	],

	// MENTAL HEALTH TERMS
	'depression': [
		'depressed', 'sad', 'mood disorder', 'melancholy',
		'dejection', 'despondency'
	],
	'anxiety': [
		'anxious', 'worry', 'stress', 'nervous',
		'apprehension', 'unease'
	]
};

// ===============================================================
// CLINICAL DOMAIN KEYWORD MAPPING
// ===============================================================

export const DOMAIN_KEYWORDS = {
	[CLINICAL_DOMAINS.EMERGENCY]: [
		'danger', 'emergency', 'urgent', 'critical', 'severe', 'acute',
		'unconscious', 'bleeding', 'convulsion', 'collapse', 'shock',
		'life-threatening', 'immediate', 'crisis', 'trauma'
	],

	[CLINICAL_DOMAINS.MATERNAL_HEALTH]: [
		'pregnant', 'pregnancy', 'antenatal', 'maternal', 'prenatal',
		'obstetric', 'labor', 'delivery', 'postpartum', 'breastfeeding',
		'gestational', 'gravida', 'para', 'preeclampsia', 'eclampsia',
		'anc', 'birth', 'midwife', 'gestation', 'trimester'
	],

	[CLINICAL_DOMAINS.PEDIATRIC]: [
		'child', 'infant', 'baby', 'newborn', 'pediatric', 'paediatric',
		'toddler', 'immunization', 'growth', 'development', 'imci',
		'vaccination', 'formula', 'breastfeed'
	],

	[CLINICAL_DOMAINS.RESPIRATORY]: [
		'cough', 'breathing', 'pneumonia', 'asthma', 'chest', 'lung',
		'respiratory', 'dyspnea', 'wheeze', 'shortness of breath',
		'oxygen', 'ventilation', 'airway', 'sputum'
	],

	[CLINICAL_DOMAINS.GASTROINTESTINAL]: [
		'diarrhea', 'vomiting', 'stomach', 'abdominal', 'nausea',
		'dehydration', 'gastroenteritis', 'bowel', 'constipation',
		'ors', 'rehydration'
	],

	[CLINICAL_DOMAINS.CARDIOVASCULAR]: [
		'hypertension', 'blood pressure', 'heart', 'chest pain',
		'cardiac', 'bp', 'circulation', 'pulse', 'coronary'
	],

	[CLINICAL_DOMAINS.INFECTIOUS_DISEASES]: [
		'fever', 'malaria', 'infection', 'antibiotic', 'sepsis',
		'tuberculosis', 'hiv', 'hepatitis', 'typhoid', 'antimicrobial'
	],

	[CLINICAL_DOMAINS.MENTAL_HEALTH]: [
		'depression', 'anxiety', 'mental', 'psychological', 'stress',
		'mood', 'psychiatric', 'emotional', 'behavioral', 'counseling'
	],

	[CLINICAL_DOMAINS.CHRONIC_DISEASES]: [
		'diabetes', 'hypertension', 'chronic', 'long-term', 'lifestyle',
		'management', 'control', 'monitoring', 'compliance'
	],

	// FIXED: Enhanced general medicine domain with headache-specific terms
	[CLINICAL_DOMAINS.GENERAL_MEDICINE]: [
		'general', 'consultation', 'check-up', 'assessment', 'examination',
		'symptoms', 'diagnosis', 'treatment', 'management', 'follow-up',
		// ADDED: Specific terms for common general medicine complaints
		'headache', 'head ache', 'head pain', 'migraine', 'cephalgia',
		'pain', 'ache', 'discomfort', 'fatigue', 'tired', 'weakness',
		'dizziness', 'vertigo', 'rash', 'skin', 'joint pain', 'backache',
		'muscle pain', 'general malaise', 'unwell'
	]
};

// ===============================================================
// ICD-10 CODE MAPPINGS (WHO Standard)
// ===============================================================

export const ICD10_MAPPINGS = {
	// Pregnancy and Maternal Health (O00-O99)
	'Z34': 'Supervision of normal pregnancy',
	'O14': 'Preeclampsia',
	'O15': 'Eclampsia',
	'O72': 'Postpartum hemorrhage',
	'O80': 'Single spontaneous delivery',

	// Infectious Diseases (A00-B99)
	'B54': 'Unspecified malaria',
	'A09': 'Infectious gastroenteritis and colitis',
	'A15': 'Respiratory tuberculosis',
	'B20': 'Human immunodeficiency virus disease',

	// Respiratory System (J00-J99)
	'J18': 'Pneumonia, unspecified organism',
	'J45': 'Asthma',
	'J20': 'Acute bronchitis',
	'J44': 'Chronic obstructive pulmonary disease',

	// Cardiovascular System (I00-I99)
	'I10': 'Essential hypertension',
	'I20': 'Angina pectoris',
	'I21': 'Acute myocardial infarction',
	'I50': 'Heart failure',

	// Symptoms and General (R00-R99)
	'R50': 'Fever, unspecified',
	'R51': 'Headache',
	'R06': 'Abnormalities of breathing',
	'R10': 'Abdominal and pelvic pain',
	'R11': 'Nausea and vomiting',

	// Mental Health (F00-F99)
	'F32': 'Depressive episode',
	'F41': 'Anxiety disorders',
	'F20': 'Schizophrenia',

	// Endocrine (E00-E99)
	'E11': 'Type 2 diabetes mellitus',
	'E46': 'Unspecified protein-energy malnutrition'
};

// ===============================================================
// ESSENTIAL MEDICATIONS DATABASE (WHO Essential Medicines)
// ===============================================================

export const ESSENTIAL_MEDICATIONS = {
	// Antibiotics
	amoxicillin: {
		category: 'antibiotic',
		indications: ['pneumonia', 'respiratory infections', 'uti'],
		dosing: {
			adult: '500mg-1g every 8 hours',
			pediatric: '40-90mg/kg/day in 2-3 divided doses'
		},
		duration: '5-7 days',
		contraindications: ['penicillin allergy'],
		whoEssential: true
	},

	cotrimoxazole: {
		category: 'antibiotic',
		indications: ['pneumonia', 'uti', 'pcp prophylaxis'],
		dosing: {
			adult: '960mg twice daily',
			pediatric: '24mg/kg/day in 2 divided doses'
		},
		contraindications: ['sulfonamide allergy'],
		whoEssential: true
	},

	// Antimalarials
	artemether_lumefantrine: {
		category: 'antimalarial',
		indications: ['uncomplicated malaria'],
		dosing: {
			adult: '4 tablets twice daily for 3 days',
			pediatric: 'weight-based dosing'
		},
		administration: 'with fatty food',
		whoEssential: true
	},

	// Pain/Fever
	paracetamol: {
		category: 'analgesic_antipyretic',
		indications: ['fever', 'pain'],
		dosing: {
			adult: '500mg-1g every 6-8 hours (max 4g/day)',
			pediatric: '10-15mg/kg every 6-8 hours'
		},
		safety: 'very safe when used correctly',
		pregnancy: 'safe',
		whoEssential: true
	},

	// Maternal Health
	iron_folic_acid: {
		category: 'nutritional',
		indications: ['pregnancy', 'anemia prevention'],
		dosing: {
			pregnancy: '60mg iron + 400mcg folic acid daily'
		},
		administration: 'take with vitamin C, avoid tea/coffee',
		whoEssential: true
	},

	magnesium_sulfate: {
		category: 'obstetric',
		indications: ['severe preeclampsia', 'eclampsia'],
		dosing: 'loading dose 4g IV slowly, then 1-2g/hour',
		monitoring: 'reflexes, respiratory rate, urine output',
		antidote: 'calcium gluconate',
		whoEssential: true
	},

	// Pediatric
	ors: {
		category: 'rehydration',
		indications: ['diarrhea with dehydration'],
		preparation: '1 sachet in 1 liter clean water',
		administration: 'frequent small amounts',
		whoEssential: true
	},

	zinc_sulfate: {
		category: 'nutritional',
		indications: ['diarrhea in children'],
		dosing: {
			under6months: '10mg daily for 10-14 days',
			over6months: '20mg daily for 10-14 days'
		},
		evidence: '25% reduction in diarrhea duration',
		whoEssential: true
	}
};

// ===============================================================
// CLINICAL ASSESSMENT FRAMEWORKS
// ===============================================================

export const ASSESSMENT_FRAMEWORKS = {
	// WHO IMCI Assessment
	imci_assessment: {
		title: 'IMCI - Integrated Management of Childhood Illness',
		ageRange: { min: 2, max: 59, unit: 'months' },
		dangerSigns: [
			'Unable to drink or breastfeed',
			'Vomits everything',
			'Has had convulsions',
			'Lethargic or unconscious'
		],
		systematicAssessment: [
			'Check for danger signs first',
			'Assess main symptoms (cough, diarrhea, fever)',
			'Check nutritional status and feeding problems',
			'Assess immunization status'
		]
	},

	// Maternal Health Assessment  
	antenatal_assessment: {
		title: 'WHO Antenatal Care Assessment',
		visits: {
			first: 'up to 12 weeks',
			second: '20 weeks',
			third: '26 weeks',
			fourth: '30 weeks',
			fifth: '34 weeks',
			sixth: '36 weeks',
			seventh: '38 weeks',
			eighth: '40 weeks'
		},
		essentialInterventions: [
			'Blood pressure measurement',
			'Urine testing for proteinuria',
			'Fetal heart rate assessment',
			'Symphysis-fundal height measurement',
			'Iron and folic acid supplementation'
		]
	},

	// Emergency Triage
	emergency_triage: {
		title: 'WHO Emergency Triage Assessment',
		categories: {
			priority1: 'Immediate (Red) - Life-threatening',
			priority2: 'Urgent (Orange) - Potentially life-threatening',
			priority3: 'Less urgent (Yellow) - Urgent but stable',
			priority4: 'Non-urgent (Green) - Can wait'
		},
		assessmentTime: {
			priority1: 'immediate',
			priority2: 'within 10 minutes',
			priority3: 'within 60 minutes',
			priority4: 'within 120 minutes'
		}
	}
};

// ===============================================================
// CLINICAL GUIDELINES CONTENT STRUCTURE
// ===============================================================

export const GUIDELINE_TEMPLATE = {
	// Metadata
	id: '',
	title: '',
	version: '1.0.0',
	lastUpdated: '',
	reviewDate: '',

	// Classification
	domain: '', // from CLINICAL_DOMAINS
	category: '',
	subcategory: '',
	priority: '', // from PRIORITY_LEVELS

	// WHO Standards
	evidenceGrade: '', // from EVIDENCE_GRADES
	recommendationStrength: '', // from RECOMMENDATION_STRENGTH
	resourceLevel: '', // from RESOURCE_LEVELS
	whoStandard: true,

	// Clinical Content
	content: {
		overview: '',
		keywords: '',

		// Clinical Assessment
		assessment: {
			history: [],
			examination: [],
			investigations: [],
			dangerSigns: []
		},

		// Diagnosis and Classification
		diagnosis: {
			criteria: [],
			differential: [],
			classification: {}
		},

		// Management
		management: {
			immediate: [],
			specific: [],
			supportive: [],
			medications: []
		},

		// Follow-up and Monitoring
		followUp: {
			schedule: '',
			criteria: [],
			outcomes: []
		},

		// Referral Criteria
		referral: {
			urgent: [],
			routine: [],
			level: ''
		},

		// Prevention and Health Promotion
		prevention: [],

		// Resource Requirements
		resources: {
			essential: [],
			desirable: [],
			alternatives: []
		},

		// Quality Indicators
		qualityIndicators: [],

		// Evidence Base
		evidence: {
			sources: [],
			qualityAssessment: '',
			recommendations: []
		}
	}
};

// ===============================================================
// UTILITY FUNCTIONS
// ===============================================================

/**
 * Get clinical domain for a given query/symptoms
 * @param {string} query - Clinical query or symptoms
 * @returns {string|null} - Detected clinical domain
 */
export const detectClinicalDomain = (query) => {
	const queryLower = query.toLowerCase().trim();
	const domainScores = {};

	// Initialize scores
	Object.keys(DOMAIN_KEYWORDS).forEach(domain => {
		domainScores[domain] = 0;
	});

	// FIXED: Better scoring algorithm
	Object.entries(DOMAIN_KEYWORDS).forEach(([domain, keywords]) => {
		keywords.forEach(keyword => {
			// Exact word matching to prevent false positives
			const keywordRegex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'gi');
			const matches = queryLower.match(keywordRegex);

			if (matches) {
				// Score based on keyword length and relevance
				const baseScore = keyword.length > 4 ? 3 : 1;
				const matchCount = matches.length;
				domainScores[domain] += baseScore * matchCount;
			}
		});
	});

	// FIXED: Special handling for headache queries
	if (queryLower.includes('headache') || queryLower.includes('head ache') || queryLower.includes('head pain')) {
		console.log('🎯 Headache detected - boosting general medicine domain');
		domainScores[CLINICAL_DOMAINS.GENERAL_MEDICINE] += 20; // Strong boost for general medicine
	}

	// FIXED: Prevent maternal health false positives
	const hasPregnancyContext = queryLower.includes('pregnancy') || queryLower.includes('pregnant') ||
		queryLower.includes('antenatal') || queryLower.includes('maternal');

	if (!hasPregnancyContext) {
		// Reduce maternal health score if no pregnancy context
		domainScores[CLINICAL_DOMAINS.MATERNAL_HEALTH] *= 0.1;
	}

	// Find domain with highest score
	const sortedDomains = Object.entries(domainScores)
		.sort(([, a], [, b]) => b - a)
		.filter(([, score]) => score > 0);

	console.log('🏥 Domain Detection Scores:', domainScores);

	if (sortedDomains.length === 0) {
		console.log('🏥 No specific domain detected, defaulting to general medicine');
		return CLINICAL_DOMAINS.GENERAL_MEDICINE;
	}

	const topDomain = sortedDomains[0][0];
	const topScore = sortedDomains[0][1];

	console.log(`🏥 Selected domain: ${topDomain} (score: ${topScore})`);
	return topDomain;
};

/**
 * Expand query with clinical synonyms
 * @param {string} query - Original query
 * @returns {string} - Expanded query with synonyms
 */
export const expandQueryWithSynonyms = (query) => {
	const words = query.toLowerCase().split(/\s+/);
	const expandedWords = new Set(words);

	words.forEach(word => {
		if (CLINICAL_SYNONYMS[word]) {
			// FIXED: Only add highly relevant synonyms (first 3-5)
			const relevantSynonyms = CLINICAL_SYNONYMS[word].slice(0, 5);
			relevantSynonyms.forEach(synonym => {
				expandedWords.add(synonym);
			});
		}
	});

	const expandedQuery = Array.from(expandedWords).join(' ');

	// FIXED: Don't expand simple queries too much
	if (query.length < 50 && expandedQuery.length > query.length * 3) {
		console.log('🔍 Query expansion limited to prevent over-expansion');
		return query + ' ' + Array.from(expandedWords).slice(words.length, words.length + 10).join(' ');
	}

	return expandedQuery;
};

/**
 * Get ICD-10 code for condition
 * @param {string} condition - Clinical condition
 * @returns {Object|null} - ICD-10 code and description
 */
export const getICD10Code = (condition) => {
	const conditionLower = condition.toLowerCase();

	for (const [code, description] of Object.entries(ICD10_MAPPINGS)) {
		if (description.toLowerCase().includes(conditionLower) ||
			conditionLower.includes(description.toLowerCase().split(' ')[0])) {
			return { code, description };
		}
	}

	return null;
};

/**
 * Get essential medication information
 * @param {string} medicationName - Name of medication
 * @returns {Object|null} - Medication information
 */
export const getMedicationInfo = (medicationName) => {
	const medName = medicationName.toLowerCase().replace(/\s+/g, '_');
	return ESSENTIAL_MEDICATIONS[medName] || null;
};

/**
 * Get assessment framework for clinical domain
 * @param {string} domain - Clinical domain
 * @returns {Object|null} - Assessment framework
 */
export const getAssessmentFramework = (domain) => {
	const frameworkMap = {
		[CLINICAL_DOMAINS.PEDIATRIC]: 'imci_assessment',
		[CLINICAL_DOMAINS.MATERNAL_HEALTH]: 'antenatal_assessment',
		[CLINICAL_DOMAINS.EMERGENCY]: 'emergency_triage'
	};

	const frameworkKey = frameworkMap[domain];
	return frameworkKey ? ASSESSMENT_FRAMEWORKS[frameworkKey] : null;
};

// Export version information
export const VERSION_INFO = {
	version: '2.0.0',
	lastUpdated: '2024-11-09',
	author: 'ATLAS Development Team',
	description: 'Comprehensive WHO Clinical Knowledge Database',
	coverage: {
		domains: Object.keys(CLINICAL_DOMAINS).length,
		synonyms: Object.keys(CLINICAL_SYNONYMS).length,
		medications: Object.keys(ESSENTIAL_MEDICATIONS).length,
		icd10Codes: Object.keys(ICD10_MAPPINGS).length
	}
};