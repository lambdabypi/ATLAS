// src/lib/clinical/whoGuidelines.js
import { medicalDb } from '../db';

// WHO-aligned clinical protocols for resource-limited settings
export const WHO_PROTOCOLS = {
	// WHO Integrated Management of Childhood Illness (IMCI)
	IMCI: {
		ageGroups: ['2_months_to_5_years'],
		conditions: {
			pneumonia: {
				assessment: {
					dangerSigns: ['inability_to_drink', 'vomiting_everything', 'convulsions', 'lethargic_unconscious'],
					classification: {
						severe: ['general_danger_signs', 'chest_indrawing'],
						pneumonia: ['fast_breathing'],
						cough_cold: ['cough_runny_nose_no_other_signs']
					}
				},
				management: {
					severe: {
						treatment: 'refer_urgently',
						preReferralTreatment: ['first_dose_antibiotic', 'prevent_hypoglycemia'],
						antibiotics: ['amoxicillin_50mg_per_kg', 'cotrimoxazole_if_amoxicillin_unavailable']
					},
					pneumonia: {
						treatment: ['amoxicillin_40mg_per_kg_twice_daily_5_days'],
						advice: ['return_in_2_days', 'return_immediately_if_worse', 'follow_up_care']
					},
					cough_cold: {
						treatment: 'home_care',
						advice: ['soothe_throat', 'clear_blocked_nose', 'return_in_2_days_if_not_improving']
					}
				}
			},

			diarrhea: {
				assessment: {
					dangerSigns: ['general_danger_signs'],
					dehydration: {
						severe: ['lethargic_unconscious', 'sunken_eyes', 'skin_pinch_very_slow'],
						some: ['restless_irritable', 'sunken_eyes', 'drinks_eagerly_thirsty', 'skin_pinch_slow'],
						no: ['alert', 'eyes_normal', 'drinks_normally', 'skin_pinch_normal']
					},
					persistent: ['diarrhea_14_days_or_more']
				},
				management: {
					severe_dehydration: {
						treatment: 'refer_urgently',
						preReferralTreatment: ['give_ors_frequently', 'zinc_20mg_daily_10_days']
					},
					some_dehydration: {
						treatment: ['ors_75ml_per_kg_4_hours', 'zinc_20mg_daily_10_days'],
						reassess: 'after_4_hours'
					},
					no_dehydration: {
						treatment: ['zinc_20mg_daily_10_days', 'continue_feeding'],
						advice: ['give_extra_fluids', 'return_immediately_if_danger_signs']
					},
					persistent: {
						treatment: ['zinc_20mg_daily_14_days', 'multivitamin_14_days'],
						feeding: ['continue_breastfeeding', 'nutritious_food']
					}
				}
			}
		}
	},

	// WHO Package of Essential NCD Interventions (PEN)
	PEN: {
		conditions: {
			hypertension: {
				risk_assessment: {
					factors: ['age_over_40', 'diabetes', 'smoking', 'family_history', 'obesity'],
					cardiovascular_risk: 'use_who_ish_risk_charts'
				},
				management: {
					lifestyle: ['salt_reduction', 'healthy_diet', 'physical_activity', 'tobacco_cessation'],
					medication: {
						first_line: ['thiazide_diuretic', 'calcium_channel_blocker', 'ace_inhibitor'],
						combination_therapy: 'if_bp_not_controlled_single_drug',
						target: 'bp_less_than_140_90'
					},
					monitoring: ['monthly_until_controlled', 'every_3_months_when_stable']
				}
			},

			diabetes: {
				diagnosis: {
					criteria: ['fasting_glucose_126', 'random_glucose_200_symptoms', 'hba1c_6_5'],
					screening: 'adults_over_40_risk_factors'
				},
				management: {
					lifestyle: ['healthy_diet', 'regular_exercise', 'weight_management'],
					medication: {
						first_line: 'metformin',
						insulin: 'if_uncontrolled_oral_medications',
						monitoring: 'glucose_hba1c_regular_intervals'
					},
					complications: {
						screening: ['foot_examination', 'eye_examination', 'kidney_function'],
						prevention: ['good_glucose_control', 'bp_control', 'lipid_management']
					}
				}
			}
		}
	},

	// WHO Mental Health Gap Action Programme (mhGAP)
	MHGAP: {
		conditions: {
			depression: {
				assessment: {
					core_symptoms: ['depressed_mood', 'loss_of_interest', 'fatigue'],
					additional_symptoms: ['guilt_worthlessness', 'concentration_problems', 'appetite_changes', 'sleep_disturbance', 'psychomotor_changes', 'suicidal_thoughts'],
					severity: {
						mild: 'few_symptoms_minimal_impairment',
						moderate: 'symptoms_impairment_functioning',
						severe: 'many_symptoms_marked_impairment'
					}
				},
				management: {
					psychosocial: ['problem_solving', 'behavioral_activation', 'interpersonal_therapy'],
					medication: {
						first_line: ['fluoxetine', 'sertraline', 'citalopram'],
						duration: 'minimum_6_months_after_improvement'
					},
					suicide_risk: 'assess_all_patients_safety_planning'
				}
			}
		}
	}
};

/**
 * Get WHO-compliant clinical recommendations based on patient presentation
 */
export async function getWHOGuidedRecommendations(symptoms, demographics, resourceLevel) {
	const recommendations = [];

	// Determine applicable WHO protocols based on age and symptoms
	const applicableProtocols = identifyProtocols(symptoms, demographics);

	for (const protocol of applicableProtocols) {
		const guidance = await generateProtocolGuidance(protocol, symptoms, demographics, resourceLevel);
		if (guidance) {
			recommendations.push(guidance);
		}
	}

	return {
		protocols: applicableProtocols.map(p => p.name),
		recommendations,
		resourceAdaptations: await adaptToResourceLevel(recommendations, resourceLevel)
	};
}

function identifyProtocols(symptoms, demographics) {
	const protocols = [];

	// IMCI for children under 5
	if (demographics.age && parseAge(demographics.age) < 5) {
		protocols.push({ name: 'IMCI', protocol: WHO_PROTOCOLS.IMCI });
	}

	// PEN for adults with NCD risk factors or symptoms
	if (demographics.age && parseAge(demographics.age) >= 18) {
		const ncdSymptoms = ['chest_pain', 'shortness_of_breath', 'frequent_urination', 'excessive_thirst'];
		if (symptoms.some(s => ncdSymptoms.includes(s.toLowerCase().replace(/\s+/g, '_')))) {
			protocols.push({ name: 'PEN', protocol: WHO_PROTOCOLS.PEN });
		}
	}

	// mhGAP for mental health presentations
	const mentalHealthSymptoms = ['sadness', 'depression', 'anxiety', 'sleep_problems', 'concentration_problems'];
	if (symptoms.some(s => mentalHealthSymptoms.includes(s.toLowerCase().replace(/\s+/g, '_')))) {
		protocols.push({ name: 'mhGAP', protocol: WHO_PROTOCOLS.MHGAP });
	}

	return protocols;
}

async function generateProtocolGuidance(protocolInfo, symptoms, demographics, resourceLevel) {
	const { name, protocol } = protocolInfo;

	switch (name) {
		case 'IMCI':
			return generateIMCIGuidance(protocol, symptoms, demographics, resourceLevel);
		case 'PEN':
			return generatePENGuidance(protocol, symptoms, demographics, resourceLevel);
		case 'mhGAP':
			return generateMhGAPGuidance(protocol, symptoms, demographics, resourceLevel);
		default:
			return null;
	}
}

function generateIMCIGuidance(protocol, symptoms, demographics, resourceLevel) {
	const age = parseAge(demographics.age);

	if (age < 0.17) { // Less than 2 months
		return {
			protocol: 'IMCI',
			message: 'Child under 2 months - refer to specialized newborn care protocols',
			classification: 'young_infant',
			action: 'refer_specialized_care'
		};
	}

	// Check for respiratory symptoms (pneumonia protocol)
	const respiratorySymptoms = ['cough', 'difficulty_breathing', 'fast_breathing'];
	if (symptoms.some(s => respiratorySymptoms.includes(s.toLowerCase().replace(/\s+/g, '_')))) {
		return classifyPneumonia(protocol.conditions.pneumonia, symptoms, age, resourceLevel);
	}

	// Check for diarrhea
	if (symptoms.some(s => s.toLowerCase().includes('diarrhea'))) {
		return classifyDiarrhea(protocol.conditions.diarrhea, symptoms, age, resourceLevel);
	}

	return null;
}

function classifyPneumonia(pneumoniaProtocol, symptoms, age, resourceLevel) {
	const classification = pneumoniaProtocol.assessment.classification;
	const management = pneumoniaProtocol.management;

	// Check for danger signs
	if (hasAnySymptom(symptoms, pneumoniaProtocol.assessment.dangerSigns)) {
		return {
			protocol: 'IMCI',
			condition: 'Severe pneumonia or very severe disease',
			classification: 'severe',
			action: management.severe.treatment,
			treatment: management.severe.preReferralTreatment,
			urgency: 'immediate_referral'
		};
	}

	// Check for chest indrawing
	if (hasAnySymptom(symptoms, ['chest_indrawing'])) {
		return {
			protocol: 'IMCI',
			condition: 'Pneumonia',
			classification: 'pneumonia',
			treatment: management.pneumonia.treatment,
			followUp: management.pneumonia.advice,
			urgency: 'treat_locally'
		};
	}

	// Check for fast breathing
	const hasRapidBreathing = checkRapidBreathing(symptoms, age);
	if (hasRapidBreathing) {
		return {
			protocol: 'IMCI',
			condition: 'Pneumonia',
			classification: 'pneumonia',
			treatment: management.pneumonia.treatment,
			followUp: management.pneumonia.advice,
			urgency: 'treat_locally'
		};
	}

	return {
		protocol: 'IMCI',
		condition: 'Cough or cold',
		classification: 'cough_cold',
		treatment: management.cough_cold.treatment,
		advice: management.cough_cold.advice,
		urgency: 'home_care'
	};
}

function classifyDiarrhea(diarrheaProtocol, symptoms, age, resourceLevel) {
	const assessment = diarrheaProtocol.assessment;
	const management = diarrheaProtocol.management;

	// Check for danger signs
	if (hasAnySymptom(symptoms, assessment.dangerSigns)) {
		return {
			protocol: 'IMCI',
			condition: 'Severe dehydration',
			classification: 'severe_dehydration',
			treatment: management.severe_dehydration.treatment,
			preReferralTreatment: management.severe_dehydration.preReferralTreatment,
			urgency: 'immediate_referral'
		};
	}

	// Assess dehydration level based on symptoms
	if (hasAnySymptom(symptoms, assessment.dehydration.severe)) {
		return {
			protocol: 'IMCI',
			condition: 'Severe dehydration',
			classification: 'severe_dehydration',
			treatment: management.severe_dehydration.treatment,
			urgency: 'immediate_referral'
		};
	}

	if (hasAnySymptom(symptoms, assessment.dehydration.some)) {
		return {
			protocol: 'IMCI',
			condition: 'Some dehydration',
			classification: 'some_dehydration',
			treatment: management.some_dehydration.treatment,
			reassessment: management.some_dehydration.reassess,
			urgency: 'treat_locally_monitor'
		};
	}

	return {
		protocol: 'IMCI',
		condition: 'No dehydration',
		classification: 'no_dehydration',
		treatment: management.no_dehydration.treatment,
		advice: management.no_dehydration.advice,
		urgency: 'home_care_with_monitoring'
	};
}

// Helper functions
function parseAge(ageString) {
	if (!ageString) return 0;
	const match = ageString.match(/(\d+)/);
	return match ? parseInt(match[1]) : 0;
}

function hasAnySymptom(symptoms, targetSymptoms) {
	return symptoms.some(symptom =>
		targetSymptoms.some(target =>
			symptom.toLowerCase().includes(target.replace(/_/g, ' ')) ||
			target.replace(/_/g, ' ').includes(symptom.toLowerCase())
		)
	);
}

function checkRapidBreathing(symptoms, age) {
	// WHO criteria for fast breathing by age
	const fastBreathingCriteria = {
		'2_11_months': 50, // breaths per minute
		'12_59_months': 40  // breaths per minute
	};

	// Look for respiratory rate in symptoms
	const respiratoryRate = extractRespiratoryRate(symptoms);
	if (respiratoryRate) {
		const threshold = age < 1 ? fastBreathingCriteria['2_11_months'] : fastBreathingCriteria['12_59_months'];
		return respiratoryRate >= threshold;
	}

	// If no specific rate, check for descriptive terms
	return hasAnySymptom(symptoms, ['fast_breathing', 'rapid_breathing', 'difficulty_breathing']);
}

function extractRespiratoryRate(symptoms) {
	// Extract respiratory rate from symptoms text
	for (const symptom of symptoms) {
		const match = symptom.match(/(\d+)\s*(?:breaths?|respirations?)/i);
		if (match) {
			return parseInt(match[1]);
		}
	}
	return null;
}

async function adaptToResourceLevel(recommendations, resourceLevel) {
	const adaptations = [];

	for (const rec of recommendations) {
		if (rec.treatment) {
			const unavailableTreatments = await checkTreatmentAvailability(rec.treatment, resourceLevel);
			for (const unavailable of unavailableTreatments) {
				const alternative = await findAlternativeTreatment(unavailable, resourceLevel);
				if (alternative) {
					adaptations.push({
						original: unavailable,
						alternative: alternative,
						reason: 'Resource availability'
					});
				}
			}
		}
	}

	return adaptations;
}

async function checkTreatmentAvailability(treatments, resourceLevel) {
	// Check against resource-level formulary
	const unavailable = [];
	// Implementation would check against actual resource database
	return unavailable;
}

async function findAlternativeTreatment(treatment, resourceLevel) {
	// Find therapeutic alternatives available at resource level
	// Implementation would query medication database
	return null;
}