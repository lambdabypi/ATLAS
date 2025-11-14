// lib/ai/gemini.js - Enhanced with model fallback and rate limit handling
import { GoogleGenAI } from '@google/genai';
import { offlineQueryDb } from '../db';

// Initialize with your API key
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const ai = API_KEY ? new GoogleGenAI({}) : null;

// Model fallback hierarchy based on your available models
const MODEL_FALLBACK_HIERARCHY = [
	'gemini-2.0-flash-exp',        // Latest experimental model
	'gemini-2.5-flash',            // Primary model (currently rate limited)
	'gemini-2.0-flash',            // Backup model
	'gemini-2.5-flash-lite',       // Lighter version
	'gemini-2.0-flash-lite',       // Another lite option
	'learnlm-2.0-flash-experimental', // Alternative experimental model
];

// Track which models are currently rate limited
const rateLimitedModels = new Map();

// Check for online status
const isOnline = () => {
	return typeof navigator !== 'undefined' && navigator.onLine;
};

// Clear rate limit tracking after specified time
function clearRateLimit(model, timeoutMs = 60000) {
	setTimeout(() => {
		rateLimitedModels.delete(model);
		console.log(`✅ Rate limit cleared for ${model}`);
	}, timeoutMs);
}

// Get next available model
function getNextAvailableModel(excludeModels = []) {
	const now = Date.now();

	for (const model of MODEL_FALLBACK_HIERARCHY) {
		// Skip if explicitly excluded
		if (excludeModels.includes(model)) {
			continue;
		}

		// Skip if rate limited (within the last 5 minutes)
		const rateLimitInfo = rateLimitedModels.get(model);
		if (rateLimitInfo && (now - rateLimitInfo.timestamp) < 300000) {
			console.log(`⏸️ Skipping ${model} - rate limited until ${new Date(rateLimitInfo.resetTime).toLocaleTimeString()}`);
			continue;
		}

		return model;
	}

	// If all models are rate limited, return the first one (oldest rate limit)
	return MODEL_FALLBACK_HIERARCHY[0];
}

// Mark model as rate limited
function markModelRateLimited(model, error) {
	const resetTimeMs = 60000; // Assume 1 minute reset time
	const resetTime = Date.now() + resetTimeMs;

	rateLimitedModels.set(model, {
		timestamp: Date.now(),
		resetTime: resetTime,
		error: error.message
	});

	console.warn(`🚫 Model ${model} rate limited until ${new Date(resetTime).toLocaleTimeString()}`);
	clearRateLimit(model, resetTimeMs);
}

// Enhanced error classification
function classifyError(error, model) {
	const message = error.message?.toLowerCase() || '';
	const status = error.status || error.code;

	if (status === 429 || message.includes('quota') || message.includes('rate limit') || message.includes('overloaded')) {
		return {
			type: 'RATE_LIMIT',
			retryable: true,
			switchModel: true,
			userMessage: `${model} is rate limited. Trying alternative model...`,
			suggestion: 'Automatically switching to backup model.'
		};
	}

	if (status === 503 || message.includes('overloaded') || message.includes('unavailable')) {
		return {
			type: 'SERVICE_UNAVAILABLE',
			retryable: true,
			switchModel: true,
			userMessage: `${model} is temporarily unavailable. Switching to backup model...`,
			suggestion: 'Using alternative Gemini model.'
		};
	}

	if (message.includes('api_key') || message.includes('unauthorized') || status === 401) {
		return {
			type: 'AUTH_ERROR',
			retryable: false,
			switchModel: false,
			userMessage: 'API authentication issue.',
			suggestion: 'Please check your NEXT_PUBLIC_GEMINI_API_KEY configuration.'
		};
	}

	if (message.includes('invalid') || message.includes('bad request') || status === 400) {
		return {
			type: 'INVALID_REQUEST',
			retryable: false,
			switchModel: false,
			userMessage: 'Invalid request format.',
			suggestion: 'Request format may need adjustment.'
		};
	}

	return {
		type: 'UNKNOWN',
		retryable: true,
		switchModel: true,
		userMessage: `Temporary issue with ${model}.`,
		suggestion: 'Trying alternative model.'
	};
}

// Enhanced retry logic with model fallback
async function retryWithModelFallback(createRequestFn, maxAttempts = 3) {
	const attemptedModels = [];
	let lastError;

	for (let attempt = 0; attempt < maxAttempts; attempt++) {
		// Get next available model
		const model = getNextAvailableModel(attemptedModels);
		attemptedModels.push(model);

		try {
			console.log(`🤖 Attempt ${attempt + 1}: Using model ${model}`);

			const result = await createRequestFn(model);

			if (result && result.text && result.text.length > 0) {
				console.log(`✅ Success with ${model} on attempt ${attempt + 1}`);
				return {
					...result,
					model: model,
					attempt: attempt + 1,
					attemptedModels: attemptedModels
				};
			}
		} catch (error) {
			console.warn(`⚠️ ${model} failed on attempt ${attempt + 1}:`, error.message);
			lastError = error;

			const errorInfo = classifyError(error, model);

			// Mark model as rate limited if appropriate
			if (errorInfo.type === 'RATE_LIMIT' || errorInfo.type === 'SERVICE_UNAVAILABLE') {
				markModelRateLimited(model, error);
			}

			// Don't retry if it's not a retryable error
			if (!errorInfo.retryable) {
				throw error;
			}

			// Add delay before next attempt
			if (attempt < maxAttempts - 1) {
				const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
				console.log(`⏳ Waiting ${delay}ms before next attempt...`);
				await new Promise(resolve => setTimeout(resolve, delay));
			}
		}
	}

	throw lastError || new Error('All model fallback attempts failed');
}

// Generate enhanced context from patient and medical data
async function generateEnhancedContext(patientData, relevantMedicalData) {
	let context = '=== CLINICAL CONTEXT ===\n';

	if (patientData) {
		context += `PATIENT PROFILE:\n`;
		context += `- Age: ${patientData.age || 'Unknown'} years\n`;
		context += `- Gender: ${patientData.gender || 'Not specified'}\n`;

		if (patientData.medicalHistory) {
			context += `- Medical History: ${patientData.medicalHistory}\n`;
		}

		if (patientData.currentMedications) {
			context += `- Current Medications: ${patientData.currentMedications}\n`;
		}

		if (patientData.allergies && patientData.allergies !== 'NKDA') {
			context += `- Allergies: ${patientData.allergies}\n`;
		}

		if (patientData.symptoms) {
			context += `- Presenting Symptoms: ${patientData.symptoms}\n`;
		}

		if (patientData.chiefComplaint) {
			context += `- Chief Complaint: ${patientData.chiefComplaint}\n`;
		}

		context += '\n';
	}

	if (relevantMedicalData?.guidelines && relevantMedicalData.guidelines.length > 0) {
		context += 'RELEVANT CLINICAL GUIDELINES:\n';
		relevantMedicalData.guidelines.forEach((guideline, index) => {
			context += `${index + 1}. ${guideline.title || 'Clinical Guideline'}\n`;
			if (guideline.content) {
				context += `   ${guideline.content.substring(0, 200)}...\n\n`;
			}
		});
	}

	return context;
}

// Create system prompt
function createSystemPrompt(query, context) {
	return `You are ATLAS Clinical Decision Support - an AI assistant for healthcare providers in resource-limited settings.

CORE INSTRUCTIONS:
- Provide evidence-based clinical guidance following WHO protocols and best practices
- Focus on resource-appropriate interventions suitable for low-resource settings
- Always prioritize patient safety and indicate when referral to higher-level care is necessary
- Format responses clearly with sections: ASSESSMENT, DIFFERENTIAL DIAGNOSIS, MANAGEMENT, FOLLOW-UP
- Include specific medication dosages and administration guidelines when appropriate
- Consider resource limitations and suggest alternatives when first-line treatments may not be available
- State your confidence level and highlight any limitations or uncertainties

${context}

CLINICAL QUERY: ${query}

Please provide a comprehensive clinical analysis and evidence-based recommendations:`;
}

// Main function to get clinical recommendations with model fallback
export async function getClinicalRecommendations(query, patientData, relevantMedicalData) {
	// Check if offline
	if (!isOnline() || !ai) {
		await offlineQueryDb.add({
			query,
			patientData,
			relevantMedicalData,
			type: 'clinical'
		});

		return {
			text: "You're currently offline. Your query has been saved and will be processed when you're back online. Please refer to the clinical guidelines available in the system.",
			fromCache: true,
			offline: true
		};
	}

	// Check API configuration
	if (!API_KEY) {
		return {
			text: "Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.",
			fromCache: true,
			error: "API key missing"
		};
	}

	try {
		console.log('🚀 Starting Gemini API request with model fallback...');

		// Generate enhanced context
		const context = await generateEnhancedContext(patientData, relevantMedicalData);
		const systemPrompt = createSystemPrompt(query, context);

		// Create request function for retry logic
		const createRequest = async (model) => {
			console.log(`📤 Sending request to ${model}...`);

			const response = await ai.models.generateContent({
				model: model,
				contents: systemPrompt,
				generationConfig: {
					temperature: 0.1,  // Low temperature for medical accuracy
					maxOutputTokens: 2048,
					topK: 1,
					topP: 0.8,
				}
			});

			if (!response?.text || typeof response.text !== 'string') {
				throw new Error('No valid response received from API');
			}

			return {
				text: response.text,
				model: model
			};
		};

		// Execute with model fallback
		const result = await retryWithModelFallback(createRequest, MODEL_FALLBACK_HIERARCHY.length);

		console.log(`✅ Successfully received response from ${result.model}`);
		console.log(`📊 Attempted models: ${result.attemptedModels.join(', ')}`);

		return {
			...result,
			fromCache: false,
			confidence: result.text.length > 200 ? 'high' : 'medium',
			fallbackUsed: result.attemptedModels.length > 1,
			rateLimitInfo: Object.fromEntries(rateLimitedModels)
		};

	} catch (error) {
		console.error('❌ All Gemini models failed:', error);

		const errorInfo = classifyError(error, 'all-models');

		// Store query for later if retryable
		if (errorInfo.retryable) {
			try {
				await offlineQueryDb.add({
					query,
					patientData,
					relevantMedicalData,
					type: 'clinical',
					error: error.message,
					timestamp: new Date().toISOString()
				});
			} catch (storeError) {
				console.warn('⚠️ Could not store query for later:', storeError);
			}
		}

		return {
			text: `${errorInfo.userMessage}

${errorInfo.suggestion}

You can continue with the consultation using the clinical guidelines available in the system. The query has been saved and will be processed when service is restored.

**Available Models Status:**
${MODEL_FALLBACK_HIERARCHY.map(model => {
				const rateLimited = rateLimitedModels.get(model);
				if (rateLimited) {
					return `• ${model}: Rate limited (resets ${new Date(rateLimited.resetTime).toLocaleTimeString()})`;
				}
				return `• ${model}: Available`;
			}).join('\n')}`,
			fromCache: true,
			error: errorInfo.type,
			allModelsFailed: true,
			rateLimitInfo: Object.fromEntries(rateLimitedModels)
		};
	}
}

// Function to process clinical symptoms with model fallback
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
2. Simple investigations available in low-resource settings
3. Red flags indicating urgent referral

${context}

Symptoms: ${Array.isArray(symptoms) ? symptoms.join(', ') : symptoms}`;

		const createRequest = async (model) => {
			const response = await ai.models.generateContent({
				model: model,
				contents: systemPrompt,
			});

			if (!response?.text) {
				throw new Error('No valid response received');
			}

			return { text: response.text, model: model };
		};

		const result = await retryWithModelFallback(createRequest);

		return {
			...result,
			fromCache: false,
			confidence: result.text.length > 100 ? 'high' : 'medium'
		};

	} catch (error) {
		console.error('Error processing symptoms:', error);

		await offlineQueryDb.add({
			symptoms,
			patientData,
			type: 'symptoms',
			error: error.message
		});

		return {
			text: `Symptom analysis temporarily unavailable: ${error.message}. Your query has been saved for later processing.`,
			fromCache: true,
			error: error.message
		};
	}
}

// Health check function
export async function checkGeminiHealth() {
	if (!ai || !API_KEY) {
		return { healthy: false, reason: 'API not configured' };
	}

	try {
		const startTime = Date.now();
		const model = getNextAvailableModel();

		const response = await ai.models.generateContent({
			model: model,
			contents: "Health check - respond with 'OK'",
		});

		const latency = Date.now() - startTime;

		return {
			healthy: true,
			latency: latency,
			model: model,
			availableModels: MODEL_FALLBACK_HIERARCHY.filter(m => !rateLimitedModels.has(m)),
			rateLimitedModels: Array.from(rateLimitedModels.keys())
		};
	} catch (error) {
		const errorInfo = classifyError(error, 'health-check');
		return {
			healthy: false,
			reason: error.message,
			type: errorInfo.type,
			retryable: errorInfo.retryable
		};
	}
}

// Get current model status
export function getModelStatus() {
	return {
		availableModels: MODEL_FALLBACK_HIERARCHY.filter(model => {
			const rateLimited = rateLimitedModels.get(model);
			return !rateLimited || (Date.now() - rateLimited.timestamp) > 300000;
		}),
		rateLimitedModels: Object.fromEntries(rateLimitedModels),
		nextAvailableModel: getNextAvailableModel(),
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

			await offlineQueryDb.delete(query.id);
			processed++;
		} catch (error) {
			console.error(`Error processing offline query ${query.id}:`, error);
			errors++;
		}
	}

	return { processed, errors };
}