// src/lib/ai/prompts.js

/**
 * This file contains prompt templates for the Gemini API
 * These templates are designed to improve the quality and consistency of LLM responses
 * for clinical decision support in resource-limited settings
 */

// Base system prompt for all clinical interactions
export const BASE_CLINICAL_PROMPT = `
You are a clinical decision support assistant for healthcare providers in resource-limited settings.
Your role is to provide evidence-based recommendations based on WHO guidelines and protocols suitable for low-resource settings.
Always prioritize practical, resource-appropriate interventions and clearly indicate when referral to higher-level care is necessary.
Focus on what can be reasonably done with limited diagnostic equipment, medications, and specialists.

IMPORTANT GUIDELINES:
1. Always acknowledge limitations in the data provided and suggest additional information that would be helpful.
2. Clearly indicate your level of certainty for each recommendation.
3. Suggest alternatives when first-line treatments or diagnostics may not be available.
4. Prioritize interventions based on their impact and feasibility in resource-limited settings.
5. When suggesting medications, consider the WHO Essential Medicines List as a guide.
6. Format your responses clearly with distinct sections.
7. Use simple, clear language that can be quickly understood in emergency situations.
8. Always provide follow-up recommendations and warning signs that require urgent action.
9. Be respectful of local healthcare providers' expertise and challenging conditions.
`;

// Differential diagnosis prompt
export const DIFFERENTIAL_DIAGNOSIS_PROMPT = `
Based on the provided symptoms and patient information, provide a prioritized list of potential differential diagnoses appropriate for a resource-limited setting.

For each potential diagnosis, include:
1. Key supporting features from the case presentation
2. Simple investigations that might be available in low-resource settings
3. Red flags that would indicate need for urgent referral if available
4. Brief management guidance assuming limited resources

Limit your differential to the 3-5 most likely conditions, ordered by probability.
Focus on conditions that are both common and important to recognize in this context.
`;

// Treatment recommendation prompt
export const TREATMENT_RECOMMENDATION_PROMPT = `
Based on the provided diagnosis and patient information, recommend a treatment plan appropriate for a resource-limited setting.

Include:
1. First-line treatments that are likely to be available (with dosing if medications)
2. Alternative options if first-line treatments are unavailable
3. Non-pharmacological interventions that can be implemented
4. Patient education points for the healthcare provider to communicate
5. Follow-up recommendations and monitoring
6. Clear indications for when the patient should return urgently or be referred

Format your response with clear headers and bullet points for easy reference during a consultation.
`;

// Guideline summary prompt
export const GUIDELINE_SUMMARY_PROMPT = `
Summarize the key points from the WHO or other evidence-based guidelines for managing this condition in resource-limited settings.

Focus on:
1. Essential diagnostic criteria when laboratory testing is limited
2. Treatment recommendations with consideration for the WHO Essential Medicines List
3. Adaptations for settings without advanced equipment
4. Key decision points for referral
5. Important preventive measures to reduce recurrence or spread

Provide a concise, practical summary that can guide clinical decision-making with limited resources.
`;

// Emergency management prompt
export const EMERGENCY_MANAGEMENT_PROMPT = `
Provide urgent management recommendations for this emergency condition in a resource-limited setting.

Prioritize:
1. Immediate life-saving interventions with available resources
2. Assessment steps to determine severity
3. Essential treatments that should be administered while arranging transfer (if needed)
4. Alternative approaches when ideal equipment/medications are unavailable
5. Clear criteria for when urgent referral/transfer is absolutely necessary

Format your response in a clear, step-by-step approach that can be quickly referenced in an emergency.
`;

// Maternal health prompt
export const MATERNAL_HEALTH_PROMPT = `
Provide recommendations for this maternal health issue in a resource-limited setting.

Include:
1. Essential assessment steps with minimal equipment
2. Warning signs that require urgent intervention
3. Safe management options considering limited resources
4. Adaptations of standard protocols for low-resource environments
5. Guidance on when referral to higher-level care is necessary
6. Follow-up care recommendations

Focus on interventions that can significantly improve outcomes with limited resources.
`;

// Pediatric care prompt
export const PEDIATRIC_CARE_PROMPT = `
Provide recommendations for managing this pediatric condition in a resource-limited setting.

Include:
1. Age-appropriate assessment strategies
2. Dosing recommendations based on weight/age as appropriate
3. Warning signs that indicate severe disease requiring urgent care
4. Practical guidance for caregivers given local constraints
5. Nutritional considerations if relevant
6. Follow-up care schedule and milestones

Ensure all recommendations are adapted for settings with minimal pediatric-specific resources.
`;

// Infectious disease prompt
export const INFECTIOUS_DISEASE_PROMPT = `
Provide guidance on managing this infectious condition in a resource-limited setting.

Include:
1. Case definition and diagnosis with minimal laboratory support
2. Treatment recommendations with consideration for local antimicrobial resistance patterns
3. Infection control measures appropriate for the setting
4. Public health implications and reporting requirements
5. Indications for isolation or other containment strategies
6. Prevention strategies for contacts and the community

Focus on pragmatic approaches that can reduce transmission and improve outcomes with limited resources.
`;

// Chronic disease management prompt
export const CHRONIC_DISEASE_MANAGEMENT_PROMPT = `
Provide recommendations for managing this chronic condition in a resource-limited setting.

Include:
1. Essential monitoring parameters that can be assessed with minimal equipment
2. Medication options from the WHO Essential Medicines List
3. Strategies for maintaining treatment continuity with limited supply chains
4. Key lifestyle and self-management guidance for patients
5. Task-shifting opportunities for follow-up by non-physician providers
6. When to refer for specialist evaluation if available

Focus on sustainable approaches that can be maintained long-term with limited resources.
`;

// Function to generate a clinical query prompt
export function generateClinicalQueryPrompt(query, patientInfo, relevantGuidelines) {
	return `
${BASE_CLINICAL_PROMPT}

PATIENT INFORMATION:
${formatPatientInfo(patientInfo)}

${relevantGuidelines ? `RELEVANT GUIDELINES:
${formatGuidelines(relevantGuidelines)}` : ''}

QUERY:
${query}

Please provide a structured response with clear recommendations appropriate for this resource-limited setting.
`;
}

// Helper function to format patient information
function formatPatientInfo(patientInfo) {
	if (!patientInfo) return 'No patient information provided.';

	let formatted = '';

	if (patientInfo.name) formatted += `Name: ${patientInfo.name}\n`;
	if (patientInfo.age) formatted += `Age: ${patientInfo.age}\n`;
	if (patientInfo.gender) formatted += `Gender: ${patientInfo.gender}\n`;
	if (patientInfo.chiefComplaint) formatted += `Chief Complaint: ${patientInfo.chiefComplaint}\n`;
	if (patientInfo.symptoms) formatted += `Symptoms: ${patientInfo.symptoms}\n`;
	if (patientInfo.vitals) formatted += `Vitals: ${patientInfo.vitals}\n`;
	if (patientInfo.examination) formatted += `Examination Findings: ${patientInfo.examination}\n`;
	if (patientInfo.medicalHistory) formatted += `Medical History: ${patientInfo.medicalHistory}\n`;
	if (patientInfo.allergies) formatted += `Allergies: ${patientInfo.allergies}\n`;
	if (patientInfo.currentMedications) formatted += `Current Medications: ${patientInfo.currentMedications}\n`;

	return formatted;
}

// Helper function to format guidelines
function formatGuidelines(guidelines) {
	if (!guidelines || guidelines.length === 0) return 'No specific guidelines available.';

	let formatted = '';

	guidelines.forEach(guideline => {
		formatted += `${guideline.title}:\n`;

		try {
			const content = typeof guideline.content === 'string'
				? JSON.parse(guideline.content)
				: guideline.content;

			if (content.overview) formatted += `Overview: ${content.overview}\n`;

			if (content.assessment && Array.isArray(content.assessment)) {
				formatted += 'Assessment:\n';
				content.assessment.forEach(item => formatted += `- ${item}\n`);
			}

			if (content.management && Array.isArray(content.management)) {
				formatted += 'Management:\n';
				content.management.forEach(item => formatted += `- ${item}\n`);
			}

			if (content.followUp) formatted += `Follow-up: ${content.followUp}\n`;
		} catch (error) {
			console.error('Error parsing guideline content:', error);
			formatted += `Content: ${guideline.content}\n`;
		}

		formatted += '\n';
	});

	return formatted;
}