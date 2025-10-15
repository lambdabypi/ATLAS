// src/lib/ai/gemini.js - Complete updated version using @google/genai
import { GoogleGenAI } from '@google/genai';
import { offlineQueryDb } from '../db';

// Initialize with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

// Generate context from patient and medical data for the LLM
const generateContext = async (patientData, relevantMedicalData) => {
	let context = '';

	if (patientData) {
		context += `PATIENT INFORMATION:\n`;
		context += `Name: ${patientData.name}\n`;
		context += `Age: ${patientData.age}\n`;
		context += `Gender: ${patientData.gender}\n`;

		if (patientData.medicalHistory) {
			context += `Medical History: ${patientData.medicalHistory}\n`;
		}

		if (patientData.allergies) {
			context += `Allergies: ${patientData.allergies}\n`;
		}

		if (patientData.currentMedications) {
			context += `Current Medications: ${patientData.currentMedications}\n`;
		}
	}

	if (relevantMedicalData) {
		if (relevantMedicalData.conditions && relevantMedicalData.conditions.length > 0) {
			context += `\nRELEVANT CONDITIONS:\n`;
			relevantMedicalData.conditions.forEach(condition => {
				context += `- ${condition.name}: ${condition.symptoms.join(', ')}\n`;
			});
		}

		if (relevantMedicalData.medications && relevantMedicalData.medications.length > 0) {
			context += `\nRELEVANT MEDICATIONS:\n`;
			relevantMedicalData.medications.forEach(med => {
				context += `- ${med.name} (${med.category}): ${med.indications.join(', ')}\n`;
			});
		}

		if (relevantMedicalData.guidelines && relevantMedicalData.guidelines.length > 0) {
			context += `\nRELEVANT GUIDELINES:\n`;
			relevantMedicalData.guidelines.forEach(guide => {
				context += `- ${guide.title}\n`;
				try {
					const content = typeof guide.content === 'string'
						? JSON.parse(guide.content)
						: guide.content;
					if (content.overview) {
						context += `  Overview: ${content.overview}\n`;
					}
					if (content.management) {
						const mgmtList = Array.isArray(content.management)
							? content.management
							: [content.management];
						context += `  Management: ${mgmtList.join('; ')}\n`;
					}
				} catch (e) {
					console.error('Error parsing guideline content:', e);
				}
			});
		}
	}

	return context;
};

// Function to get clinical recommendations from Gemini
export async function getClinicalRecommendations(query, patientData, relevantMedicalData) {
	// If offline, store query for later processing
	if (!isOnline() || !ai) {
		await offlineQueryDb.add({
			query,
			patientData,
			relevantMedicalData,
			type: 'clinical'
		});

		return {
			text: "You're currently offline. Your query has been saved and will be processed when you're back online. In the meantime, please refer to the downloaded clinical guidelines.",
			fromCache: true
		};
	}

	if (!API_KEY) {
		return {
			text: "Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.",
			fromCache: true,
			error: "API key missing"
		};
	}

	try {
		console.log('Sending request to Gemini with query:', query);

		// Generate context from patient and medical data
		const context = await generateContext(patientData, relevantMedicalData);

		// Construct the prompt with system instructions
		const systemPrompt = `You are a clinical decision support assistant for healthcare providers in resource-limited settings. 
Your role is to provide evidence-based guidance and recommendations based on WHO guidelines and protocols for low-resource settings.
Always prioritize resource-appropriate interventions and clearly indicate when referral to higher-level care is necessary.
Focus on practical, actionable advice that can be implemented in settings with limited equipment, medications, and diagnostic capabilities.
Format your responses clearly with headers for ASSESSMENT, DIFFERENTIAL DIAGNOSIS, MANAGEMENT, and FOLLOW-UP.
Indicate certainty levels and always suggest alternatives when first-line treatments may not be available.

${context}

Respond only with clinically relevant information based on the context provided. If there is insufficient information to make a recommendation, indicate what additional information would be helpful.

Query: ${query}`;

		// Use the @google/genai API
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: systemPrompt,
		});

		console.log('Received Gemini response:', response);

		// With @google/genai, response.text is directly available as a property
		if (!response.text || typeof response.text !== 'string') {
			console.error('Invalid response structure:', response);
			throw new Error('No valid text content found in response');
		}

		console.log('Successfully extracted text, length:', response.text.length);

		return {
			text: response.text,
			fromCache: false,
			confidence: response.text.length > 100 ? 'high' : 'medium'
		};

	} catch (error) {
		console.error('Error getting recommendations from Gemini:', error);

		// Provide more specific error messages
		let errorMessage = error.message;
		if (error.message.includes('API_KEY') || error.message.includes('key')) {
			errorMessage = 'Invalid API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local';
		} else if (error.message.includes('quota') || error.message.includes('limit')) {
			errorMessage = 'API quota exceeded. Please check your Gemini API usage limits.';
		} else if (error.message.includes('network') || error.message.includes('fetch')) {
			errorMessage = 'Network error. Please check your internet connection.';
		}

		// Store the query for later processing
		await offlineQueryDb.add({
			query,
			patientData,
			relevantMedicalData,
			type: 'clinical',
			error: error.message
		});

		return {
			text: `Unable to get AI recommendations: ${errorMessage}

You can still complete the consultation using the clinical guidelines available in the system. The query has been saved and will be processed when the issue is resolved.`,
			fromCache: true,
			error: error.message
		};
	}
}

// Function to process clinical symptoms and generate differential diagnoses
export async function processClinicalSymptoms(symptoms, patientData) {
	if (!isOnline() || !ai) {
		await offlineQueryDb.add({
			symptoms,
			patientData,
			type: 'symptoms'
		});

		return {
			text: "You're currently offline. Your symptom analysis has been saved and will be processed when you're back online.",
			fromCache: true
		};
	}

	if (!API_KEY) {
		return {
			text: "Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.",
			fromCache: true,
			error: "API key missing"
		};
	}

	try {
		// Create a basic context from patient data
		let context = '';
		if (patientData) {
			context = `Patient: ${patientData.age} year old ${patientData.gender}\n`;
			if (patientData.medicalHistory) {
				context += `Medical History: ${patientData.medicalHistory}\n`;
			}
		}

		const systemPrompt = `You are a clinical decision support assistant for healthcare providers in resource-limited settings.
Based on the symptoms provided, generate a prioritized list of potential differential diagnoses appropriate for the setting.
For each potential diagnosis, provide:
1. Key diagnostic criteria
2. Simple investigations that might be available in low-resource settings
3. Red flags that would indicate need for urgent referral if available

${context}

Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}`;

		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: systemPrompt,
		});

		if (!response.text || typeof response.text !== 'string') {
			throw new Error('No valid text content found in response');
		}

		return {
			text: response.text,
			fromCache: false,
			confidence: response.text.length > 100 ? 'high' : 'medium'
		};

	} catch (error) {
		console.error('Error processing symptoms with Gemini:', error);

		await offlineQueryDb.add({
			symptoms,
			patientData,
			type: 'symptoms',
			error: error.message
		});

		return {
			text: `An error occurred while processing symptoms: ${error.message}. Your query has been saved for later processing.`,
			fromCache: true,
			error: error.message
		};
	}
}

// Process offline queries when back online
export async function processOfflineQueries() {
	if (!isOnline() || !ai) {
		return { processed: 0, errors: 0 };
	}

	const offlineQueries = await offlineQueryDb.getAll();
	let processed = 0;
	let errors = 0;

	for (const query of offlineQueries) {
		try {
			if (query.type === 'clinical') {
				await getClinicalRecommendations(query.query, query.patientData, query.relevantMedicalData);
			} else if (query.type === 'symptoms') {
				await processClinicalSymptoms(query.symptoms, query.patientData);
			}

			// Delete the processed query
			await offlineQueryDb.delete(query.id);
			processed++;
		} catch (error) {
			console.error(`Error processing offline query ${query.id}:`, error);
			errors++;
		}
	}

	return { processed, errors };
}