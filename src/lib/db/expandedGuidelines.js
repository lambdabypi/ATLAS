// src/lib/db/expandedGuidelines.js
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
				uncompilcated: {
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

	{
		id: 'inf_002',
		title: 'Tuberculosis Screening and Management',
		category: 'Infectious Disease',
		subcategory: 'Adult',
		resourceLevel: 'intermediate',
		content: {
			overview: 'Screening, diagnosis, and initial management of pulmonary tuberculosis.',
			screeningCriteria: [
				'Cough for >2 weeks',
				'Weight loss',
				'Night sweats',
				'Fever',
				'Contact with TB case'
			],
			diagnosis: [
				'Sputum microscopy for AFB',
				'GeneXpert if available',
				'Chest X-ray if available',
				'Clinical diagnosis if investigations unavailable'
			],
			treatment: {
				newCases: {
					intensivePhase: [
						'2 months: Isoniazid + Rifampin + Ethambutol + Pyrazinamide',
						'Weight-based dosing',
						'Daily or 3x weekly DOT'
					],
					continuationPhase: [
						'4 months: Isoniazid + Rifampin',
						'Daily or 3x weekly DOT',
						'Monthly monitoring'
					]
				}
			},
			sideEffects: [
				'Hepatitis (watch for jaundice)',
				'Peripheral neuropathy (give pyridoxine)',
				'Visual changes (ethambutol)',
				'Skin rash'
			],
			monitoring: [
				'Monthly weight and symptom assessment',
				'Sputum conversion at 2 months',
				'Treatment completion documentation'
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

	{
		id: 'mch_002',
		title: 'Integrated Management of Childhood Illness (IMCI)',
		category: 'Maternal Health',
		subcategory: 'Pediatric',
		resourceLevel: 'basic',
		content: {
			overview: 'Systematic approach to child health focusing on major killers of children under 5.',
			ageGroups: {
				youngInfant: '0-2 months',
				infant: '2-11 months',
				child: '12-59 months'
			},
			assessmentSequence: [
				'1. Check for danger signs',
				'2. Assess main symptoms',
				'3. Check nutritional status',
				'4. Check immunization status',
				'5. Assess feeding practices'
			],
			dangerSigns: {
				general: [
					'Unable to drink/breastfeed',
					'Vomits everything',
					'Convulsions',
					'Lethargic or unconscious'
				],
				youngInfant: [
					'Fast breathing >60/min',
					'Severe chest indrawing',
					'Temperature >37.5°C or <35.5°C'
				]
			},
			mainSymptoms: {
				cough: 'Assess for pneumonia',
				diarrhea: 'Assess for dehydration and dysentery',
				fever: 'Assess for malaria and other causes',
				earProblem: 'Assess for ear infection'
			},
			nutritionalAssessment: [
				'Weight for age (underweight)',
				'Visible severe wasting',
				'Edema of both feet',
				'MUAC if >6 months'
			],
			treatment: {
				antibiotics: 'For pneumonia and some other infections',
				ors: 'For diarrhea with dehydration',
				antimalarials: 'For fever in malaria endemic areas',
				vitamin: 'Vitamin A every 6 months'
			}
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
	},

	// MENTAL HEALTH
	{
		id: 'mh_001',
		title: 'Depression Screening and Management',
		category: 'Mental Health',
		subcategory: 'Adult',
		resourceLevel: 'basic',
		content: {
			overview: 'Recognition and basic management of depression in primary care.',
			screening: {
				phq2: [
					'Little interest or pleasure in activities',
					'Feeling down, depressed, or hopeless'
				],
				phq9: 'Full 9-question assessment if PHQ-2 positive'
			},
			symptoms: [
				'Depressed mood most of the day',
				'Loss of interest in activities',
				'Weight loss or gain',
				'Sleep disturbances',
				'Fatigue',
				'Feelings of worthlessness',
				'Difficulty concentrating',
				'Recurrent thoughts of death'
			],
			severity: {
				mild: '2-4 symptoms, minimal functional impairment',
				moderate: '5+ symptoms, moderate functional impairment',
				severe: 'Most symptoms, severe functional impairment'
			},
			management: {
				mild: [
					'Psychoeducation about depression',
					'Lifestyle interventions (exercise, sleep hygiene)',
					'Brief counseling if trained',
					'Regular follow-up'
				],
				moderate: [
					'Structured psychological intervention',
					'Antidepressant medication consideration',
					'Social support mobilization',
					'Monitor for suicidal thoughts'
				],
				severe: [
					'Antidepressant medication',
					'Intensive psychological support',
					'Consider referral to specialist',
					'Risk assessment for suicide'
				]
			},
			medications: [
				{
					name: 'Fluoxetine',
					dosage: '20mg daily',
					notes: 'First-line SSRI, good safety profile'
				},
				{
					name: 'Amitriptyline',
					dosage: '25-75mg daily',
					notes: 'Alternative if SSRI unavailable, more side effects'
				}
			],
			suicideAssessment: [
				'Ask directly about suicidal thoughts',
				'Assess plan and means',
				'Evaluate protective factors',
				'Ensure safety plan if at risk'
			]
		},
		lastUpdated: new Date().toISOString()
	},

	// EMERGENCY CONDITIONS
	{
		id: 'emg_001',
		title: 'Shock Recognition and Management',
		category: 'Emergency',
		subcategory: 'All Ages',
		resourceLevel: 'intermediate',
		content: {
			overview: 'Recognition and initial management of shock in resource-limited settings.',
			types: {
				hypovolemic: 'Blood/fluid loss - trauma, dehydration, bleeding',
				septic: 'Infection - pneumonia, UTI, intra-abdominal',
				cardiogenic: 'Heart failure - MI, arrhythmia',
				anaphylactic: 'Severe allergic reaction'
			},
			recognition: [
				'Altered mental status',
				'Tachycardia >100 bpm',
				'Hypotension <90 mmHg systolic',
				'Poor peripheral perfusion',
				'Decreased urine output'
			],
			assessment: [
				'ABC approach - Airway, Breathing, Circulation',
				'Vital signs including pulse quality',
				'Level of consciousness',
				'Skin temperature and capillary refill',
				'Look for source of problem'
			],
			management: {
				general: [
					'Ensure patent airway',
					'Give oxygen if available',
					'IV access with large bore cannula',
					'Fluid resuscitation if hypovolemic'
				],
				hypovolemic: [
					'Crystalloid fluid bolus 20ml/kg',
					'Control bleeding if external',
					'Consider blood transfusion if severe anemia'
				],
				septic: [
					'Broad-spectrum antibiotics early',
					'Fluid resuscitation',
					'Source control if possible',
					'Monitor for organ dysfunction'
				],
				cardiogenic: [
					'Careful fluid management',
					'Treat underlying cause',
					'Consider inotropes if available',
					'Position upright if pulmonary edema'
				]
			},
			monitoring: [
				'Vital signs every 15-30 minutes',
				'Urine output hourly',
				'Level of consciousness',
				'Response to treatment'
			]
		},
		lastUpdated: new Date().toISOString()
	}
];

// Function to seed expanded guidelines
export async function seedExpandedGuidelines(db) {
	try {
		const existingCount = await db.guidelines.count();

		if (existingCount < 10) { // Only seed if we have fewer than 10 guidelines
			await db.guidelines.bulkPut(EXPANDED_CLINICAL_GUIDELINES);
			console.log(`Seeded ${EXPANDED_CLINICAL_GUIDELINES.length} clinical guidelines`);
		}

		return EXPANDED_CLINICAL_GUIDELINES.length;
	} catch (error) {
		console.error('Error seeding expanded guidelines:', error);
		throw error;
	}
}

// Helper function to get guidelines by resource level
export function getGuidelinesByResourceLevel(guidelines, level) {
	return guidelines.filter(g => g.resourceLevel === level);
}

// Helper function to get relevant guidelines for symptoms
export function getRelevantGuidelines(guidelines, symptoms, patientAge) {
	const symptomKeywords = symptoms.toLowerCase().split(/[,\s]+/);

	return guidelines.filter(guideline => {
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
}