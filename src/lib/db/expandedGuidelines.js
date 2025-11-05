// src/lib/db/expandedGuidelines.js - FIXED VERSION
// Comprehensive WHO Clinical Guidelines for Resource-Limited Settings

export const EXPANDED_CLINICAL_GUIDELINES = [
	// RESPIRATORY CONDITIONS
	{
		id: 'resp_001',
		title: 'Acute Respiratory Infections in Children',
		category: 'Respiratory',
		subcategory: 'Pediatric',
		resourceLevel: 'basic',
		content: {
			overview: 'Management of acute respiratory infections in children under 5 years in resource-limited settings.',
			dangerSigns: [
				'Unable to drink or breastfeed',
				'Severe chest indrawing',
				'Stridor in calm child',
				'Fast breathing: 50+ breaths/min (2-11 months), 40+ breaths/min (12-59 months)'
			],
			assessment: [
				'Check for general danger signs',
				'Count respiratory rate for full minute',
				'Look for chest indrawing',
				'Listen for stridor',
				'Assess feeding ability'
			],
			classification: {
				pneumonia: 'Fast breathing without danger signs',
				severePneumonia: 'Chest indrawing OR any danger sign',
				noRespDisease: 'No fast breathing, no danger signs'
			},
			management: {
				pneumonia: [
					'Amoxicillin: 40-90mg/kg/day divided 2-3 times for 3-5 days',
					'Advise mother when to return immediately',
					'Follow up in 2 days',
					'Continue feeding and fluids'
				],
				severePneumonia: [
					'Refer urgently to hospital',
					'Give first dose antibiotic if referral delayed >6 hours',
					'Keep child warm during transport',
					'If oxygen available, give if SpO2 <90%'
				]
			},
			medications: [
				{
					name: 'Amoxicillin',
					dosage: '40-90mg/kg/day',
					duration: '3-5 days',
					alternatives: ['Cotrimoxazole if amoxicillin unavailable']
				}
			],
			followUp: 'Return immediately if unable to feed, breathing worse, or fever develops'
		},
		lastUpdated: new Date().toISOString()
	},

	{
		id: 'resp_002',
		title: 'Adult Community-Acquired Pneumonia',
		category: 'Respiratory',
		subcategory: 'Adult',
		resourceLevel: 'intermediate',
		content: {
			overview: 'Diagnosis and management of community-acquired pneumonia in adults.',
			riskFactors: ['Age >65', 'Chronic diseases', 'Immunocompromised', 'Smoking'],
			assessment: [
				'Temperature, respiratory rate, blood pressure',
				'Chest examination for dullness, crepitations',
				'Assess severity using clinical judgment',
				'Chest X-ray if available'
			],
			severityAssessment: {
				mild: 'Alert, no respiratory distress, stable vitals',
				moderate: 'Some respiratory distress, stable vitals',
				severe: 'Respiratory distress, unstable vitals, confusion'
			},
			management: {
				outpatient: [
					'Amoxicillin 1g three times daily for 5-7 days',
					'Or doxycycline 100mg twice daily if penicillin allergy',
					'Paracetamol for fever and pain',
					'Adequate fluid intake'
				],
				inpatient: [
					'Amoxicillin 1g IV/oral every 8 hours',
					'Plus clarithromycin 500mg twice daily if atypical suspected',
					'Oxygen if SpO2 <90%',
					'Monitor vital signs'
				]
			},
			complications: ['Pleural effusion', 'Sepsis', 'Respiratory failure'],
			followUp: 'Review in 48-72 hours if outpatient, sooner if deteriorating'
		},
		lastUpdated: new Date().toISOString()
	},

	// GASTROINTESTINAL CONDITIONS  
	{
		id: 'gi_001',
		title: 'Acute Diarrhea Management',
		category: 'Gastrointestinal',
		subcategory: 'All Ages',
		resourceLevel: 'basic',
		content: {
			overview: 'Assessment and management of acute diarrhea focusing on dehydration prevention.',
			assessment: [
				'Duration and frequency of diarrhea',
				'Presence of blood or mucus in stool',
				'Vomiting frequency',
				'Signs of dehydration',
				'Feeding tolerance'
			],
			dehydrationSigns: {
				noDehydration: 'Alert, normal eyes, tears present, normal skin pinch',
				someDehydration: 'Restless/irritable, sunken eyes, few tears, slow skin pinch',
				severeDehydration: 'Lethargic/unconscious, very sunken eyes, no tears, very slow skin pinch'
			},
			management: {
				noDehydration: [
					'Give extra fluids (ORS, breast milk, clean water)',
					'Continue normal feeding',
					'Zinc supplementation: <6 months: 10mg daily, >6 months: 20mg daily for 10-14 days'
				],
				someDehydration: [
					'Give ORS 75ml/kg over 4 hours',
					'Give extra fluids for ongoing losses',
					'Reassess hourly for first 4 hours',
					'Start feeding as soon as tolerated'
				],
				severeDehydration: [
					'Refer urgently for IV fluids',
					'If referral not possible: give ORS 100ml/kg over 6 hours',
					'Monitor closely'
				]
			},
			medications: [
				{
					name: 'ORS Solution',
					preparation: '1 sachet in 1 liter clean water',
					administration: 'Small frequent sips'
				},
				{
					name: 'Zinc',
					dosage: '10mg (<6m), 20mg (>6m) daily',
					duration: '10-14 days'
				}
			],
			redFlags: [
				'Blood in stool with fever',
				'Signs of severe dehydration',
				'Persistent vomiting',
				'No improvement after 24 hours ORS'
			]
		},
		lastUpdated: new Date().toISOString()
	},

	// INFECTIOUS DISEASES
	{
		id: 'inf_001',
		title: 'Malaria Case Management',
		category: 'Infectious Disease',
		subcategory: 'All Ages',
		resourceLevel: 'basic',
		content: {
			overview: 'Diagnosis and treatment of malaria in endemic areas.',
			clinicalFeatures: [
				'Fever or history of fever',
				'Headache, body aches',
				'Nausea, vomiting',
				'Fatigue, weakness'
			],
			diagnosis: [
				'RDT (Rapid Diagnostic Test) if available',
				'Microscopy if laboratory facilities available',
				'Clinical diagnosis in high transmission areas if testing unavailable'
			],
			severeMalariaFeatures: [
				'Prostration (unable to sit)',
				'Impaired consciousness',
				'Multiple convulsions',
				'Severe anemia (Hb <5g/dl)',
				'Respiratory distress',
				'Hypoglycemia',
				'Jaundice'
			],
			treatment: {
				uncomplicated: {
					adults: [
						'Artemether-lumefantrine: 4 tablets at 0, 8, 24, 36, 48, 60 hours',
						'OR Dihydroartemisinin-piperaquine: 3-4 tablets daily for 3 days'
					],
					children: [
						'Weight-based dosing of ACT',
						'<5kg: Artesunate + amodiaquine pediatric formulation',
						'>5kg: Artemether-lumefantrine pediatric tablets'
					]
				},
				severe: [
					'IV Artesunate 2.4mg/kg at 0, 12, 24 hours then daily',
					'OR IM Artemether 3.2mg/kg loading, then 1.6mg/kg daily',
					'Refer urgently to hospital',
					'Treat complications (hypoglycemia, seizures)'
				]
			},
			prevention: [
				'Use of insecticide-treated nets',
				'Indoor residual spraying where appropriate',
				'Intermittent preventive treatment in pregnancy'
			]
		},
		lastUpdated: new Date().toISOString()
	},

	// MATERNAL AND CHILD HEALTH
	{
		id: 'mch_001',
		title: 'Antenatal Care Essentials',
		category: 'Maternal Health',
		subcategory: 'Pregnancy',
		resourceLevel: 'basic',
		content: {
			overview: 'Essential antenatal care for healthy pregnancy outcomes.',
			visitSchedule: [
				'First visit: <12 weeks',
				'Second visit: 20-24 weeks',
				'Third visit: 28-32 weeks',
				'Fourth visit: 36 weeks',
				'Additional visits if complications'
			],
			assessmentEachVisit: [
				'Weight gain monitoring',
				'Blood pressure measurement',
				'Fundal height after 20 weeks',
				'Fetal heart rate after 20 weeks',
				'Urinalysis if available',
				'Edema assessment'
			],
			interventions: {
				routine: [
					'Iron and folic acid supplementation',
					'Tetanus toxoid immunization',
					'Intermittent preventive treatment for malaria (IPTp)',
					'HIV testing and counseling',
					'Nutritional counseling'
				],
				conditional: [
					'Treatment of anemia if Hb <11g/dl',
					'Antihypertensive if BP >140/90',
					'Antiretroviral therapy if HIV positive'
				]
			},
			dangerSigns: [
				'Vaginal bleeding',
				'Severe headache with blurred vision',
				'Convulsions',
				'Severe abdominal pain',
				'Fever with chills',
				'Reduced fetal movements'
			],
			birthPreparation: [
				'Identify skilled birth attendant',
				'Plan place of delivery',
				'Arrange transport for emergency',
				'Prepare clean delivery kit'
			]
		},
		lastUpdated: new Date().toISOString()
	},

	// CARDIOVASCULAR CONDITIONS
	{
		id: 'cv_001',
		title: 'Hypertension Management in Adults',
		category: 'Cardiovascular',
		subcategory: 'Adult',
		resourceLevel: 'intermediate',
		content: {
			overview: 'Diagnosis and management of hypertension in resource-limited settings.',
			diagnosis: [
				'BP ≥140/90 mmHg on at least 2 separate occasions',
				'Use appropriate cuff size',
				'Patient should be seated, relaxed for 5 minutes',
				'Take average of 2-3 readings'
			],
			classification: {
				normal: '<120/80 mmHg',
				elevated: '120-129/<80 mmHg',
				stage1: '130-139/80-89 mmHg',
				stage2: '≥140/90 mmHg',
				crisis: '≥180/120 mmHg'
			},
			riskAssessment: [
				'Age (men >45, women >55)',
				'Family history of CVD',
				'Smoking',
				'Diabetes',
				'Dyslipidemia',
				'Obesity'
			],
			nonPharmacological: [
				'Salt reduction <5g/day',
				'Weight loss if obese',
				'Regular physical activity',
				'Limit alcohol',
				'Smoking cessation'
			],
			pharmacological: {
				firstLine: [
					'Thiazide diuretic (hydrochlorothiazide 25mg daily)',
					'ACE inhibitor (lisinopril 10mg daily)',
					'Calcium channel blocker (amlodipine 5mg daily)'
				],
				targets: {
					general: '<140/90 mmHg',
					diabetes: '<130/80 mmHg',
					elderly: '<150/90 mmHg'
				}
			},
			monitoring: [
				'BP check every 1-3 months until target',
				'Annual creatinine and potassium if on ACE inhibitor',
				'Cardiovascular risk assessment annually'
			]
		},
		lastUpdated: new Date().toISOString()
	}
];

// FIXED: Function to seed expanded guidelines with proper error handling
export async function seedExpandedGuidelines(medicalDb) {
	try {
		// FIXED: Check if medicalDb is provided and has the required methods
		if (!medicalDb || typeof medicalDb !== 'object') {
			console.warn('Medical database not provided to seedExpandedGuidelines');
			return 0;
		}

		// FIXED: Import the actual database if medicalDb doesn't have the right structure
		let db = medicalDb;

		// If medicalDb doesn't have guidelines property, try to get it from main db
		if (!medicalDb.guidelines) {
			try {
				const { db: mainDb } = await import('./index.js');
				db = mainDb;
			} catch (importError) {
				console.warn('Could not import main database:', importError);
				return 0;
			}
		}

		// FIXED: Check if db.guidelines exists and has count method
		if (!db.guidelines || typeof db.guidelines.count !== 'function') {
			console.warn('Database guidelines table not available');
			return 0;
		}

		const existingCount = await db.guidelines.count();

		if (existingCount < 10) { // Only seed if we have fewer than 10 guidelines
			await db.guidelines.bulkPut(EXPANDED_CLINICAL_GUIDELINES);
			console.log(`✅ Seeded ${EXPANDED_CLINICAL_GUIDELINES.length} clinical guidelines`);
		} else {
			console.log(`ℹ️ Guidelines already seeded (${existingCount} existing)`);
		}

		return EXPANDED_CLINICAL_GUIDELINES.length;
	} catch (error) {
		console.error('Error seeding expanded guidelines:', error);
		// Don't throw error, just return 0 to prevent breaking the app
		return 0;
	}
}

// FIXED: Function that works without requiring a database parameter  
export async function getRelevantGuidelines(symptoms, patientData = {}) {
	try {
		// Try to get guidelines from the database first
		try {
			const { db } = await import('./index.js');
			const dbGuidelines = await db.guidelines.toArray();

			if (dbGuidelines.length > 0) {
				return searchGuidelinesArray(dbGuidelines, symptoms, patientData.age);
			}
		} catch (dbError) {
			console.warn('Database not available, using static guidelines:', dbError);
		}

		// Fallback to static guidelines array
		return searchGuidelinesArray(EXPANDED_CLINICAL_GUIDELINES, symptoms, patientData.age);
	} catch (error) {
		console.error('Error getting relevant guidelines:', error);
		return [];
	}
}

// Helper function to search guidelines array
function searchGuidelinesArray(guidelines, symptoms, patientAge) {
	if (!symptoms || symptoms.trim() === '') {
		return guidelines.slice(0, 3); // Return first 3 if no symptoms
	}

	const symptomKeywords = symptoms.toLowerCase().split(/[,\s]+/).filter(s => s.length > 2);

	const relevantGuidelines = guidelines.filter(guideline => {
		// Check if any symptom keywords match guideline content
		const content = JSON.stringify(guideline.content).toLowerCase();
		const titleMatch = guideline.title.toLowerCase();

		const hasSymptomMatch = symptomKeywords.some(symptom =>
			content.includes(symptom) || titleMatch.includes(symptom)
		);

		// Age-appropriate filtering
		let ageAppropriate = true;
		if (patientAge !== undefined) {
			const age = parseInt(patientAge);
			if (guideline.subcategory === 'Pediatric' && age >= 18) {
				ageAppropriate = false;
			} else if (guideline.subcategory === 'Adult' && age < 18) {
				ageAppropriate = false;
			}
		}

		return hasSymptomMatch && ageAppropriate;
	});

	// Return relevant guidelines, or first few if none match
	return relevantGuidelines.length > 0 ? relevantGuidelines : guidelines.slice(0, 2);
}

// Helper function to get guidelines by resource level
export function getGuidelinesByResourceLevel(guidelines, level) {
	return guidelines.filter(g => g.resourceLevel === level);
}