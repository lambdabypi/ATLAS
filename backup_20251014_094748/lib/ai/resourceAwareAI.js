// src/lib/ai/resourceAwareAI.js
import { getClinicalRecommendations } from './gemini';
import { medicalDb } from '../db';

// Resource availability profiles for different settings
export const RESOURCE_PROFILES = {
	LEVEL_1: {
		name: 'Basic Health Post',
		medications: ['paracetamol', 'amoxicillin', 'ors', 'zinc'],
		diagnostics: ['clinical_examination', 'basic_vitals'],
		referral_options: ['district_hospital'],
		equipment: ['thermometer', 'stethoscope', 'bp_cuff']
	},
	LEVEL_2: {
		name: 'Health Center',
		medications: ['paracetamol', 'amoxicillin', 'ors', 'zinc', 'artemether', 'cotrimoxazole', 'iron'],
		diagnostics: ['clinical_examination', 'basic_vitals', 'rdt_malaria', 'urine_dipstick'],
		referral_options: ['district_hospital', 'regional_hospital'],
		equipment: ['thermometer', 'stethoscope', 'bp_cuff', 'scales', 'height_measure']
	},
	LEVEL_3: {
		name: 'District Hospital',
		medications: ['comprehensive_who_essential'],
		diagnostics: ['clinical_examination', 'basic_vitals', 'rdt_malaria', 'urine_dipstick', 'basic_lab', 'xray'],
		referral_options: ['regional_hospital', 'tertiary_center'],
		equipment: ['full_basic_equipment', 'xray_machine', 'laboratory']
	}
};

/**
 * Generate context-aware clinical recommendations based on available resources
 */
export async function getResourceAwareRecommendations(
	query,
	patientData,
	relevantMedicalData,
	resourceLevel = 'LEVEL_2'
) {
	const resourceProfile = RESOURCE_PROFILES[resourceLevel];

	// Enhance the query with resource context
	const contextualQuery = `
HEALTHCARE SETTING: ${resourceProfile.name}
AVAILABLE MEDICATIONS: ${resourceProfile.medications.join(', ')}
AVAILABLE DIAGNOSTICS: ${resourceProfile.diagnostics.join(', ')}
REFERRAL OPTIONS: ${resourceProfile.referral_options.join(', ')}

${query}

Please provide recommendations that:
1. Use ONLY the medications listed above
2. Suggest ONLY the diagnostic tests available
3. Include clear referral criteria when local resources are insufficient
4. Prioritize interventions by effectiveness given resource constraints
5. Provide alternative approaches if first-line treatments aren't available
`;

	const result = await getClinicalRecommendations(
		contextualQuery,
		patientData,
		relevantMedicalData
	);

	// Post-process to ensure recommendations align with available resources
	return {
		...result,
		resourceLevel: resourceLevel,
		availableResources: resourceProfile,
		adaptedRecommendations: await adaptRecommendationsToResources(result.text, resourceProfile)
	};
}

/**
 * Adapt generic recommendations to specific resource availability
 */
async function adaptRecommendationsToResources(recommendations, resourceProfile) {
	// Implementation would analyze recommendations and substitute unavailable
	// medications/diagnostics with available alternatives
	const adaptations = [];

	// Check for medication availability and suggest alternatives
	const unavailableMedications = extractMentionedMedications(recommendations)
		.filter(med => !resourceProfile.medications.includes(med.toLowerCase()));

	for (const med of unavailableMedications) {
		const alternative = await findMedicationAlternative(med, resourceProfile.medications);
		if (alternative) {
			adaptations.push({
				type: 'medication',
				unavailable: med,
				alternative: alternative,
				reason: 'Not available at this facility level'
			});
		}
	}

	return adaptations;
}

/**
 * Find alternative medications from available list
 */
async function findMedicationAlternative(unavailableMed, availableMeds) {
	// Query local medication database for therapeutic alternatives
	const alternatives = await medicalDb.searchMedications(unavailableMed);

	return alternatives.find(alt =>
		availableMeds.some(available =>
			alt.name.toLowerCase().includes(available.toLowerCase())
		)
	);
}

function extractMentionedMedications(text) {
	// Simple regex to extract medication mentions
	// In production, this would use medical NLP
	const medRegex = /\b[A-Z][a-z]+(?:cillin|mycin|phen|zole|ide|ine)\b/g;
	return text.match(medRegex) || [];
}