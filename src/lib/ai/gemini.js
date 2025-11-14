// src/lib/ai/gemini.js - Minimal update to add model fallback to your existing working code
import { GoogleGenAI } from '@google/genai';
import { offlineQueryDb } from '../db';

// Initialize with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// Model fallback hierarchy - ADD THIS
const MODEL_FALLBACK_HIERARCHY = [
	'gemini-2.0-flash-exp',        // Latest experimental model (should work)
	'gemini-2.5-flash',            // Your current rate-limited model
	'gemini-2.0-flash',            // Backup model
	'gemini-2.5-flash-lite',       // Lighter version
	'gemini-2.0-flash-lite',       // Another lite option
];

// Track rate limited models - ADD THIS
const rateLimitedModels = new Set();

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

// Get next available model - ADD THIS FUNCTION
const getAvailableModel = () => {
	for (const model of MODEL_FALLBACK_HIERARCHY) {
		if (!rateLimitedModels.has(model)) {
			return model;
		}
	}
	// If all are rate limited, return the first one and hope it's reset
	return MODEL_FALLBACK_HIERARCHY[0];
};

// Mark model as rate limited - ADD THIS FUNCTION
const markRateLimited = (model) => {
	rateLimitedModels.add(model);
	console.warn(`🚫 Model ${model} marked as rate limited`);

	// Clear after 2 minutes
	setTimeout(() => {
		rateLimitedModels.delete(model);
		console.log(`✅ Rate limit cleared for ${model}`);
	}, 120000);
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

// UPDATED: Function to get clinical recommendations from Gemini with model fallback
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

	// NEW: Try multiple models with fallback
	const modelsToTry = MODEL_FALLBACK_HIERARCHY.filter(model => !rateLimitedModels.has(model));

	if (modelsToTry.length === 0) {
		// All models are rate limited, try the first one anyway
		modelsToTry.push(MODEL_FALLBACK_HIERARCHY[0]);
	}

	let lastError;

	for (const model of modelsToTry) {
		try {
			console.log(`🤖 Trying Gemini model: ${model}`);

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

			// Use the @google/genai API with the current model
			const response = await ai.models.generateContent({
				model: model, // Use the current model from fallback
				contents: systemPrompt,
			});

			console.log(`✅ Success with ${model}:`, response);

			// With @google/genai, response.text is directly available as a property
			if (!response.text || typeof response.text !== 'string') {
				console.error('Invalid response structure:', response);
				throw new Error('No valid text content found in response');
			}

			console.log(`✅ Successfully extracted text from ${model}, length:`, response.text.length);

			return {
				text: response.text,
				fromCache: false,
				confidence: response.text.length > 100 ? 'high' : 'medium',
				model: model, // Include which model was used
				fallbackUsed: model !== MODEL_FALLBACK_HIERARCHY[0]
			};

		} catch (error) {
			console.error(`❌ Error with ${model}:`, error);
			lastError = error;

			// Check if it's a rate limit error
			if (error.message.includes('quota') ||
				error.message.includes('rate limit') ||
				error.message.includes('overloaded') ||
				error.status === 429 ||
				error.status === 503) {

				console.warn(`🚫 ${model} is rate limited, marking and trying next model`);
				markRateLimited(model);
				continue; // Try next model
			}

			// For other errors, provide specific error messages
			let errorMessage = error.message;
			if (error.message.includes('API_KEY') || error.message.includes('key')) {
				errorMessage = 'Invalid API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY in .env.local';
				break; // Don't try other models for API key errors
			} else if (error.message.includes('network') || error.message.includes('fetch')) {
				errorMessage = 'Network error. Please check your internet connection.';
				break; // Don't try other models for network errors
			}

			// For other errors, continue to next model
		}
	}

	// If we get here, all models failed
	console.error('❌ All Gemini models failed. Last error:', lastError);

	// Store the query for later processing
	await offlineQueryDb.add({
		query,
		patientData,
		relevantMedicalData,
		type: 'clinical',
		error: lastError?.message || 'All models failed'
	});

	return {
		text: `Unable to get AI recommendations from any available model. ${lastError?.message || 'All models are currently unavailable.'}

Available models status:
${MODEL_FALLBACK_HIERARCHY.map(model =>
			`• ${model}: ${rateLimitedModels.has(model) ? 'Rate limited' : 'Available'}`
		).join('\n')}

You can still complete the consultation using the clinical guidelines available in the system. The query has been saved and will be processed when the issue is resolved.`,
		fromCache: true,
		error: lastError?.message || 'All models failed',
		allModelsFailed: true,
		rateLimitedModels: Array.from(rateLimitedModels)
	};
}

// UPDATED: Function to process clinical symptoms with model fallback
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

	const modelsToTry = MODEL_FALLBACK_HIERARCHY.filter(model => !rateLimitedModels.has(model));
	if (modelsToTry.length === 0) {
		modelsToTry.push(MODEL_FALLBACK_HIERARCHY[0]);
	}

	let lastError;

	for (const model of modelsToTry) {
		try {
			console.log(`🤖 Trying ${model} for symptom analysis`);

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
				model: model,
				contents: systemPrompt,
			});

			if (!response.text || typeof response.text !== 'string') {
				throw new Error('No valid text content found in response');
			}

			return {
				text: response.text,
				fromCache: false,
				confidence: response.text.length > 100 ? 'high' : 'medium',
				model: model
			};

		} catch (error) {
			console.error(`Error processing symptoms with ${model}:`, error);
			lastError = error;

			if (error.message.includes('quota') ||
				error.message.includes('rate limit') ||
				error.message.includes('overloaded') ||
				error.status === 429 ||
				error.status === 503) {
				markRateLimited(model);
				continue;
			}

			if (error.message.includes('API_KEY') || error.message.includes('key')) {
				break;
			}
		}
	}

	await offlineQueryDb.add({
		symptoms,
		patientData,
		type: 'symptoms',
		error: lastError?.message || 'All models failed'
	});

	return {
		text: `An error occurred while processing symptoms: ${lastError?.message || 'All models failed'}. Your query has been saved for later processing.`,
		fromCache: true,
		error: lastError?.message || 'All models failed'
	};
}

// ADD: New function to get model status
export function getModelStatus() {
	return {
		availableModels: MODEL_FALLBACK_HIERARCHY.filter(model => !rateLimitedModels.has(model)),
		rateLimitedModels: Array.from(rateLimitedModels),
		nextAvailableModel: getAvailableModel(),
		fallbackHierarchy: MODEL_FALLBACK_HIERARCHY
	};
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