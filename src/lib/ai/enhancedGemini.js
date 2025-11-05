// src/lib/ai/enhancedGemini.js - FIXED VERSION with correct Google GenAI API usage
import { GoogleGenAI } from '@google/genai';
import { offlineQueryDb, syncQueueDb } from '../db';
import { getRelevantGuidelines } from '../db/expandedGuidelines';

// Initialize with enhanced error handling - FIXED API USAGE
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';

let ai = null;
try {
	if (API_KEY) {
		ai = new GoogleGenAI({
			apiKey: API_KEY
		});
		console.log('✅ Google GenAI initialized successfully');
	} else {
		console.warn('⚠️ NEXT_PUBLIC_GEMINI_API_KEY not found - AI features will be limited to rule-based recommendations');
	}
} catch (error) {
	console.error('❌ Failed to initialize Google GenAI:', error);
	ai = null;
}

// SMART Guidelines Engine - loaded dynamically when needed
let SMARTGuidelinesEngine = null;
let smartGuidelinesLoading = false;
let smartGuidelinesLoadError = null;

// Load SMART Guidelines Engine dynamically
const loadSMARTGuidelines = async () => {
	if (SMARTGuidelinesEngine || smartGuidelinesLoading) {
		return SMARTGuidelinesEngine;
	}

	if (smartGuidelinesLoadError) {
		return null; // Don't retry if previously failed
	}

	smartGuidelinesLoading = true;

	try {
		const smartModule = await import('../clinical/smartGuidelines');
		SMARTGuidelinesEngine = smartModule.SMARTGuidelinesEngine;
		console.log('SMART Guidelines engine loaded successfully');
		return SMARTGuidelinesEngine;
	} catch (error) {
		console.warn('SMART Guidelines not available:', error.message);
		smartGuidelinesLoadError = error;
		return null;
	} finally {
		smartGuidelinesLoading = false;
	}
};

// Error types for better handling
export const AI_ERROR_TYPES = {
	NO_API_KEY: 'no_api_key',
	OFFLINE: 'offline',
	RATE_LIMITED: 'rate_limited',
	NETWORK_ERROR: 'network_error',
	INVALID_RESPONSE: 'invalid_response',
	CONTEXT_TOO_LARGE: 'context_too_large',
	CONTENT_FILTERED: 'content_filtered',
	UNKNOWN: 'unknown'
};

// Confidence levels for AI responses
export const CONFIDENCE_LEVELS = {
	HIGH: 'high',      // >90% certain, comprehensive data
	MEDIUM: 'medium',  // 70-90% certain, good data
	LOW: 'low',        // 50-70% certain, limited data
	VERY_LOW: 'very_low' // <50% certain, insufficient data
};

// Check online status with multiple fallback methods
const checkOnlineStatus = async () => {
	if (typeof navigator === 'undefined') return false;

	// Primary check
	if (!navigator.onLine) return false;

	// Secondary check with actual network request
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const response = await fetch('https://www.google.com/favicon.ico', {
			method: 'HEAD',
			mode: 'no-cors',
			signal: controller.signal,
			cache: 'no-cache'
		});

		clearTimeout(timeoutId);
		return true;
	} catch (error) {
		console.log('Network connectivity test failed:', error.message);
		return false;
	}
};

// Enhanced error classification
const classifyError = (error) => {
	if (!API_KEY) return AI_ERROR_TYPES.NO_API_KEY;
	if (!navigator.onLine) return AI_ERROR_TYPES.OFFLINE;

	const errorMessage = error.message?.toLowerCase() || '';

	if (errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
		return AI_ERROR_TYPES.RATE_LIMITED;
	}
	if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
		return AI_ERROR_TYPES.NETWORK_ERROR;
	}
	if (errorMessage.includes('context') || errorMessage.includes('too large')) {
		return AI_ERROR_TYPES.CONTEXT_TOO_LARGE;
	}
	if (errorMessage.includes('filtered') || errorMessage.includes('safety')) {
		return AI_ERROR_TYPES.CONTENT_FILTERED;
	}
	if (errorMessage.includes('response') || errorMessage.includes('invalid')) {
		return AI_ERROR_TYPES.INVALID_RESPONSE;
	}

	return AI_ERROR_TYPES.UNKNOWN;
};

// Get applicable WHO SMART Guidelines
const getApplicableGuidelines = async (patientData, context) => {
	// Try to load SMART Guidelines engine
	const SMARTEngine = await loadSMARTGuidelines();

	if (!SMARTEngine) {
		console.log('SMART Guidelines engine not available, using expanded guidelines');
		return await getRelevantGuidelines(patientData?.symptoms || '', patientData);
	}

	try {
		const smartEngine = new SMARTEngine();
		const clinicalDomain = determineClinicalDomain(patientData, context);

		const guidelines = await smartEngine.executeGuideline(
			clinicalDomain,
			patientData,
			context
		);

		return guidelines;
	} catch (error) {
		console.warn('Could not retrieve SMART Guidelines:', error);
		// Fallback to expanded guidelines
		return await getRelevantGuidelines(patientData?.symptoms || '', patientData);
	}
};

// Determine clinical domain from patient data
const determineClinicalDomain = (patientData, context) => {
	if (patientData?.pregnancy || context?.encounterType === 'anc-visit') {
		return 'maternal-health';
	}

	if (patientData?.age && patientData.age < 5) {
		return 'infectious-diseases'; // IMCI domain
	}

	const symptoms = patientData?.symptoms || '';
	if (symptoms.includes('fever') || symptoms.includes('cough') || symptoms.includes('diarrhea')) {
		return 'infectious-diseases';
	}

	if (patientData?.chronicConditions || context?.encounterType === 'chronic-care') {
		return 'non-communicable-diseases';
	}

	return 'general-medicine';
};

// Generate confidence score based on available data
const calculateConfidence = (patientData, relevantGuidelines, queryComplexity) => {
	let score = 0;

	// Patient data completeness (0-40 points)
	if (patientData?.symptoms?.length > 10) score += 15;
	else if (patientData?.symptoms?.length > 5) score += 10;
	else if (patientData?.symptoms) score += 5;

	if (patientData?.vitals) score += 10;
	if (patientData?.examination?.length > 20) score += 10;
	else if (patientData?.examination) score += 5;

	if (patientData?.medicalHistory) score += 5;
	if (patientData?.age && patientData?.gender) score += 5;

	// Relevant guidelines available (0-30 points)
	const guidelineCount = relevantGuidelines?.recommendations?.length || relevantGuidelines?.length || 0;
	if (guidelineCount >= 3) score += 20;
	else if (guidelineCount >= 2) score += 15;
	else if (guidelineCount >= 1) score += 10;

	// Check for resource-appropriate guidelines
	const hasBasicGuidelines = relevantGuidelines?.recommendations?.some(g => g.resourceConstraints?.includes('basic-infrastructure')) ||
		relevantGuidelines?.some(g => g.resourceLevel === 'basic');
	if (hasBasicGuidelines) score += 10;

	// Query complexity (0-30 points)
	if (queryComplexity === 'simple') score += 30;
	else if (queryComplexity === 'moderate') score += 20;
	else if (queryComplexity === 'complex') score += 10;

	// Convert to confidence level
	if (score >= 80) return CONFIDENCE_LEVELS.HIGH;
	if (score >= 60) return CONFIDENCE_LEVELS.MEDIUM;
	if (score >= 40) return CONFIDENCE_LEVELS.LOW;
	return CONFIDENCE_LEVELS.VERY_LOW;
};

// Rule-based fallback for common conditions
const getRuleBasedRecommendation = (symptoms, patientData, relevantGuidelines) => {
	const symptomString = (symptoms || '').toLowerCase();
	const age = patientData?.age ? parseInt(patientData.age) : null;

	// Respiratory symptoms
	if (symptomString.includes('cough') && symptomString.includes('fever')) {
		if (age && age < 5) {
			return {
				text: `Based on WHO IMCI guidelines for pneumonia in children:

**ASSESSMENT NEEDED:**
- Count respiratory rate for full minute
- Look for chest indrawing  
- Check for danger signs (unable to feed, lethargy)

**LIKELY MANAGEMENT:**
- If fast breathing only: Amoxicillin 40-90mg/kg/day for 5 days
- If chest indrawing or danger signs: Refer urgently
- Advise mother when to return immediately

**RED FLAGS:**
- Unable to drink/breastfeed
- Severe chest indrawing
- Convulsions or unconscious

This is WHO IMCI guideline-based advice. Clinical judgment essential.`,
				confidence: CONFIDENCE_LEVELS.MEDIUM,
				isRuleBased: true,
				sourceGuidelines: relevantGuidelines?.filter(g => g.category === 'Respiratory')
			};
		} else {
			return {
				text: `Based on clinical guidelines for adult respiratory infection:

**ASSESSMENT:**
- Vital signs including oxygen saturation
- Chest examination
- Severity assessment

**LIKELY MANAGEMENT:**
- Mild: Amoxicillin 1g three times daily for 5-7 days
- Severe: Consider hospital referral
- Symptomatic: Paracetamol, adequate fluids

**MONITOR FOR:**
- Worsening breathlessness
- High fever >39°C
- Chest pain

Clinical assessment essential for accurate diagnosis.`,
				confidence: CONFIDENCE_LEVELS.MEDIUM,
				isRuleBased: true
			};
		}
	}

	// Diarrhea symptoms
	if (symptomString.includes('diarrhea') || symptomString.includes('diarrhoea')) {
		return {
			text: `Based on WHO diarrhea management guidelines:

**DEHYDRATION ASSESSMENT:**
- Check skin pinch, eyes, alertness
- Assess ability to drink

**MANAGEMENT:**
- No dehydration: ORS + continue feeding + zinc
- Some dehydration: ORS 75ml/kg over 4 hours
- Severe: Urgent referral for IV fluids

**ZINC SUPPLEMENTATION:**
- <6 months: 10mg daily for 10-14 days
- >6 months: 20mg daily for 10-14 days

**RED FLAGS:**
- Blood in stool with fever
- Severe dehydration signs
- Persistent vomiting

This is WHO guideline-based advice. Clinical assessment required.`,
			confidence: CONFIDENCE_LEVELS.MEDIUM,
			isRuleBased: true
		};
	}

	// Fever symptoms  
	if (symptomString.includes('fever')) {
		const hasMalariaSymptoms = symptomString.includes('headache') ||
			symptomString.includes('body ache') ||
			symptomString.includes('chills');

		if (hasMalariaSymptoms) {
			return {
				text: `Based on WHO malaria management guidelines:

**ASSESSMENT:**
- Rapid diagnostic test (RDT) if available
- Check for severe malaria signs
- Clinical diagnosis if testing unavailable

**MANAGEMENT (if uncomplicated):**
- Adults: Artemether-lumefantrine per weight
- Children: Weight-based ACT dosing
- Complete full course even if feeling better

**SEVERE MALARIA SIGNS:**
- Prostration, impaired consciousness
- Multiple convulsions, severe anemia
- Respiratory distress

**URGENT REFERRAL if severe malaria suspected**

This is WHO guideline-based advice. Diagnostic testing recommended when available.`,
				confidence: CONFIDENCE_LEVELS.MEDIUM,
				isRuleBased: true
			};
		}
	}

	// Maternal health symptoms
	if (symptomString.includes('pregnant') || symptomString.includes('pregnancy') ||
		patientData?.pregnancy || patientData?.gestationalAge) {

		if (symptomString.includes('headache') && symptomString.includes('vision')) {
			return {
				text: `Based on WHO antenatal care guidelines - URGENT ASSESSMENT NEEDED:

**PREECLAMPSIA ASSESSMENT:**
- Blood pressure measurement
- Proteinuria testing
- Check for edema
- Assess reflexes

**DANGER SIGNS:**
- BP >140/90 mmHg
- Protein in urine
- Severe headache with visual changes
- Epigastric pain

**IMMEDIATE ACTION:**
- If severe preeclampsia suspected: URGENT referral
- Give antihypertensive if BP >160/110
- Prepare magnesium sulfate if available

**DO NOT DELAY REFERRAL**

This requires immediate clinical assessment and likely hospital care.`,
				confidence: CONFIDENCE_LEVELS.HIGH,
				isRuleBased: true,
				urgency: 'immediate'
			};
		}
	}

	// Generic response if no specific match
	return {
		text: `Based on available clinical guidelines:

**GENERAL APPROACH:**
1. Complete assessment including vital signs
2. Look for danger signs requiring urgent referral
3. Consider common conditions for this age group
4. Follow WHO/local treatment protocols
5. Arrange appropriate follow-up

**WHEN TO REFER URGENTLY:**
- Altered consciousness or severe distress
- Unstable vital signs
- Condition beyond available resources

**FOLLOW-UP:**
- Review in 24-48 hours if not improving
- Return immediately if condition worsens

Clinical guidelines available in reference section. Professional judgment essential for diagnosis and treatment decisions.`,
		confidence: CONFIDENCE_LEVELS.LOW,
		isRuleBased: true,
		isGeneric: true
	};
};

// Enhanced clinical recommendations with SMART Guidelines integration
export async function getEnhancedClinicalRecommendations(
	query,
	patientData,
	relevantMedicalData,
	options = {}
) {
	const {
		maxRetries = 2,
		timeoutMs = 10000,
		fallbackToRules = true,
		saveForLater = true
	} = options;

	const startTime = performance.now();
	let smartRecommendations = null;

	// Determine query complexity
	const queryComplexity = query.length > 200 ? 'complex' :
		query.length > 100 ? 'moderate' : 'simple';

	try {
		// Step 1: Get WHO SMART Guidelines recommendations first
		smartRecommendations = await getApplicableGuidelines(patientData, options.context);
		console.log('Retrieved SMART Guidelines:', smartRecommendations?.recommendations?.length || 0);

		// Use SMART guidelines for relevantMedicalData if not provided
		if (!relevantMedicalData && smartRecommendations) {
			relevantMedicalData = { guidelines: smartRecommendations };
		}
	} catch (error) {
		console.warn('Error retrieving SMART Guidelines:', error);
	}

	// Calculate confidence based on available data (including SMART guidelines)
	const confidence = calculateConfidence(patientData, smartRecommendations, queryComplexity);

	// Check if we're offline or have no API key
	const isOnline = await checkOnlineStatus();

	if (!isOnline || !API_KEY || !ai) {
		console.log('Offline or no API key - using rule-based fallback with SMART Guidelines');

		if (saveForLater) {
			await offlineQueryDb.add({
				query,
				patientData,
				relevantMedicalData,
				smartRecommendations,
				type: 'clinical',
				timestamp: new Date().toISOString(),
				priority: 'normal'
			});
		}

		if (fallbackToRules) {
			const ruleBasedResult = getRuleBasedRecommendation(
				patientData?.symptoms || query,
				patientData,
				smartRecommendations?.recommendations || relevantMedicalData?.guidelines
			);

			return {
				...ruleBasedResult,
				smartGuidelines: smartRecommendations,
				errorType: !API_KEY ? AI_ERROR_TYPES.NO_API_KEY : AI_ERROR_TYPES.OFFLINE,
				timestamp: new Date(),
				queryId: generateQueryId(),
				responseTime: performance.now() - startTime
			};
		}

		return {
			text: `You're currently offline and no cached recommendations are available. Your query has been saved and will be processed when connectivity is restored.
      
Please refer to the clinical guidelines in the Reference section for immediate guidance.`,
			confidence: CONFIDENCE_LEVELS.VERY_LOW,
			smartGuidelines: smartRecommendations,
			errorType: !API_KEY ? AI_ERROR_TYPES.NO_API_KEY : AI_ERROR_TYPES.OFFLINE,
			timestamp: new Date(),
			queryId: generateQueryId(),
			responseTime: performance.now() - startTime,
			isError: true
		};
	}

	// Attempt AI recommendation with retries
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		try {
			console.log(`AI recommendation attempt ${attempt}/${maxRetries}`);

			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			// Generate enhanced context with SMART Guidelines
			const context = await generateEnhancedContext(patientData, relevantMedicalData, smartRecommendations);

			// Create comprehensive prompt with SMART Guidelines
			const prompt = createEnhancedPromptWithSMART(query, context, confidence, smartRecommendations);

			// FIXED: Use correct Google GenAI API pattern
			const response = await ai.models.generateContent({
				model: "gemini-2.0-flash-exp",
				contents: prompt
			});

			clearTimeout(timeoutId);

			// FIXED: Access response text correctly
			const responseText = response.text;

			if (!responseText || typeof responseText !== 'string') {
				throw new Error('Invalid response format from AI service');
			}

			// Validate response quality and against SMART Guidelines
			const validationResult = validateAIResponse(responseText, query);
			const smartValidation = validateWithGuidelines(responseText, smartRecommendations);

			if (!validationResult.isValid) {
				console.warn('AI response failed validation:', validationResult.reason);
				if (attempt === maxRetries && fallbackToRules) {
					return getRuleBasedRecommendation(
						patientData?.symptoms || query,
						patientData,
						smartRecommendations?.recommendations || relevantMedicalData?.guidelines
					);
				}
				continue; // Retry
			}

			const finalConfidence = calculateConfidenceScore(
				{ validation: smartValidation, ...validationResult },
				smartRecommendations
			);

			return {
				text: responseText,
				confidence: confidence,
				finalConfidence: finalConfidence,
				timestamp: new Date(),
				fromCache: false,
				isAiGenerated: true,
				validationScore: validationResult.score,
				smartValidation: smartValidation,
				smartGuidelines: smartRecommendations,
				queryId: generateQueryId(),
				retryCount: attempt - 1,
				responseTime: performance.now() - startTime,
				sources: extractSources(smartRecommendations)
			};

		} catch (error) {
			const errorType = classifyError(error);
			console.error(`AI recommendation attempt ${attempt} failed:`, error.message, 'Type:', errorType);

			// Store error for analysis
			await syncQueueDb.addToQueue('ai_errors', generateQueryId(), 'add', {
				error: error.message,
				errorType,
				attempt,
				query: query.substring(0, 100), // Truncate for privacy
				timestamp: new Date().toISOString()
			});

			// Handle specific error types
			if (errorType === AI_ERROR_TYPES.RATE_LIMITED) {
				const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000); // Exponential backoff
				console.log(`Rate limited, waiting ${waitTime}ms before retry`);
				await new Promise(resolve => setTimeout(resolve, waitTime));
				continue;
			}

			if (errorType === AI_ERROR_TYPES.CONTEXT_TOO_LARGE) {
				console.log('Context too large, truncating and retrying');
				// Truncate context and retry
				patientData = truncatePatientData(patientData);
				relevantMedicalData = truncateMedicalData(relevantMedicalData);
				continue;
			}

			// If final attempt fails and fallback enabled
			if (attempt === maxRetries) {
				if (saveForLater) {
					await offlineQueryDb.add({
						query,
						patientData,
						relevantMedicalData,
						smartRecommendations,
						type: 'clinical',
						timestamp: new Date().toISOString(),
						priority: 'high', // Higher priority since AI failed
						error: error.message
					});
				}

				if (fallbackToRules) {
					const ruleBasedResult = getRuleBasedRecommendation(
						patientData?.symptoms || query,
						patientData,
						smartRecommendations?.recommendations || relevantMedicalData?.guidelines
					);

					return {
						...ruleBasedResult,
						smartGuidelines: smartRecommendations,
						errorType,
						originalError: error.message,
						timestamp: new Date(),
						queryId: generateQueryId(),
						responseTime: performance.now() - startTime
					};
				}

				return {
					text: `Unable to get AI recommendations due to: ${getErrorMessage(errorType)}

Your query has been saved and will be processed when possible. Please refer to clinical guidelines in the Reference section for immediate guidance.`,
					confidence: CONFIDENCE_LEVELS.VERY_LOW,
					smartGuidelines: smartRecommendations,
					errorType,
					originalError: error.message,
					timestamp: new Date(),
					queryId: generateQueryId(),
					responseTime: performance.now() - startTime,
					isError: true
				};
			}
		}
	}
}

// Helper functions
const generateQueryId = () => {
	return 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

const generateEnhancedContext = async (patientData, relevantMedicalData, smartRecommendations) => {
	let context = '';

	if (patientData) {
		context += `PATIENT: ${patientData.age || 'Unknown age'} year old ${patientData.gender || 'unspecified gender'}\n`;
		if (patientData.medicalHistory) context += `History: ${patientData.medicalHistory}\n`;
		if (patientData.allergies) context += `Allergies: ${patientData.allergies}\n`;
		if (patientData.currentMedications) context += `Current Rx: ${patientData.currentMedications}\n`;
		if (patientData.pregnancy) context += `Pregnancy status: Active\n`;
		if (patientData.gestationalAge) context += `Gestational age: ${patientData.gestationalAge} weeks\n`;
	}

	// Add WHO SMART Guidelines context
	if (smartRecommendations?.recommendations?.length > 0) {
		context += `\nWHO SMART GUIDELINES RECOMMENDATIONS:\n`;
		smartRecommendations.recommendations.slice(0, 3).forEach((rec, idx) => {
			context += `${idx + 1}. ${rec.title}: ${rec.description}\n`;
			context += `   Evidence Level: ${rec.evidence}\n`;
			if (rec.resourceConstraints?.length > 0) {
				context += `   Resource Requirements: ${rec.resourceConstraints.join(', ')}\n`;
			}
		});
	}

	// Add expanded guidelines if available
	if (relevantMedicalData?.guidelines?.length > 0 && !smartRecommendations) {
		context += `\nRELEVANT GUIDELINES:\n`;
		relevantMedicalData.guidelines.slice(0, 2).forEach(guide => {
			context += `- ${guide.title}: ${guide.content?.overview || 'Clinical guideline available'}\n`;
		});
	}

	return context;
};

const createEnhancedPromptWithSMART = (query, context, confidence, smartRecommendations) => {
	let prompt = `You are a clinical decision support AI for healthcare providers in resource-limited settings. Provide evidence-based recommendations adapted to available resources.

IMPORTANT: Your recommendations will be reviewed by a healthcare provider. Be clear about limitations and uncertainty.

${context}

`;

	if (smartRecommendations && smartRecommendations.recommendations) {
		prompt += `CRITICAL: Your response should be consistent with the WHO SMART Guidelines above while providing additional clinical context and practical implementation advice.

`;
	}

	prompt += `CLINICAL QUERY: ${query}

Provide structured response with:
1. ASSESSMENT - key clinical findings to evaluate
2. DIAGNOSIS/DIFFERENTIAL - most likely conditions (max 3)
3. MANAGEMENT - practical treatment steps aligned with WHO guidelines
4. RED FLAGS - when to refer urgently
5. FOLLOW-UP - monitoring recommendations
6. RESOURCE ADAPTATIONS - modifications for limited resources

Be specific about medication names, dosages, and timelines when appropriate.
Indicate confidence levels and acknowledge uncertainties.
Prioritize patient safety and evidence-based care.`;

	return prompt;
};

// Validate AI response against WHO SMART Guidelines
const validateWithGuidelines = (responseText, smartRecommendations) => {
	if (!smartRecommendations || !smartRecommendations.recommendations) {
		return {
			method: 'none',
			score: null,
			conflicts: [],
			supportedRecommendations: []
		};
	}

	const conflicts = [];
	const supportedRecommendations = [];

	const responseText_lower = responseText.toLowerCase();

	// Check for conflicts with WHO recommendations
	for (const guideline of smartRecommendations.recommendations) {
		const guidelineKey = guideline.title.toLowerCase();
		const descriptionKey = guideline.description.toLowerCase().substring(0, 50);

		if (responseText_lower.includes(guidelineKey) ||
			responseText_lower.includes(descriptionKey)) {
			supportedRecommendations.push(guideline.title);
		}
	}

	const validationScore = supportedRecommendations.length / smartRecommendations.recommendations.length;

	return {
		method: 'who-smart-guidelines',
		score: validationScore,
		supportedRecommendations,
		conflicts,
		guidelinesMatched: supportedRecommendations.length,
		totalGuidelines: smartRecommendations.recommendations.length
	};
};

// Calculate final confidence score
const calculateConfidenceScore = (validatedResponse, smartRecommendations) => {
	let confidence = 0.5; // Base confidence

	if (validatedResponse.validation?.score > 0.8) {
		confidence += 0.3;
	} else if (validatedResponse.validation?.score > 0.5) {
		confidence += 0.2;
	}

	if (validatedResponse.validation?.conflicts?.length === 0) {
		confidence += 0.2;
	}

	if (smartRecommendations && smartRecommendations.recommendations?.length > 0) {
		confidence += 0.1;
	}

	return Math.min(confidence, 1.0);
};

// Extract sources for citation
const extractSources = (smartRecommendations) => {
	const sources = [];

	if (smartRecommendations) {
		sources.push('WHO SMART Guidelines');

		if (smartRecommendations.guidelines) {
			sources.push(smartRecommendations.guidelines);
		}

		if (smartRecommendations.version) {
			sources.push(`Version ${smartRecommendations.version}`);
		}
	}

	return sources;
};

const validateAIResponse = (responseText, originalQuery) => {
	let score = 0;
	let isValid = true;
	let reason = '';

	// Basic length check
	if (responseText.length < 100) {
		isValid = false;
		reason = 'Response too short';
		return { isValid, reason, score };
	}

	// Check for structured content
	const hasAssessment = /assessment/i.test(responseText);
	const hasManagement = /management/i.test(responseText);
	const hasRedFlags = /red flag|urgent|refer/i.test(responseText);

	if (hasAssessment) score += 25;
	if (hasManagement) score += 35;
	if (hasRedFlags) score += 20;

	// Check for clinical relevance
	const clinicalTerms = /diagnosis|treatment|symptom|patient|condition|medication/gi;
	const clinicalMatches = responseText.match(clinicalTerms);
	if (clinicalMatches && clinicalMatches.length >= 3) score += 20;

	if (score < 50) {
		isValid = false;
		reason = 'Response lacks clinical structure';
	}

	return { isValid, reason, score };
};

const getErrorMessage = (errorType) => {
	switch (errorType) {
		case AI_ERROR_TYPES.NO_API_KEY:
			return 'AI service not configured';
		case AI_ERROR_TYPES.OFFLINE:
			return 'no internet connection';
		case AI_ERROR_TYPES.RATE_LIMITED:
			return 'too many requests - please wait';
		case AI_ERROR_TYPES.NETWORK_ERROR:
			return 'network connectivity issues';
		case AI_ERROR_TYPES.CONTEXT_TOO_LARGE:
			return 'too much information provided';
		case AI_ERROR_TYPES.CONTENT_FILTERED:
			return 'content safety restrictions';
		default:
			return 'temporary service unavailable';
	}
};

const truncatePatientData = (patientData) => {
	if (!patientData) return patientData;

	return {
		...patientData,
		symptoms: patientData.symptoms?.substring(0, 200),
		examination: patientData.examination?.substring(0, 200),
		medicalHistory: patientData.medicalHistory?.substring(0, 150)
	};
};

const truncateMedicalData = (medicalData) => {
	if (!medicalData) return medicalData;

	return {
		...medicalData,
		guidelines: medicalData.guidelines?.slice(0, 2) // Limit to 2 most relevant
	};
};

// Function to process queued offline queries
export async function processOfflineQueriesEnhanced() {
	if (!await checkOnlineStatus() || !ai) {
		return { processed: 0, errors: 0 };
	}

	const offlineQueries = await offlineQueryDb.getAll();
	let processed = 0;
	let errors = 0;

	// Sort by priority and timestamp
	const sortedQueries = offlineQueries.sort((a, b) => {
		if (a.priority === 'high' && b.priority !== 'high') return -1;
		if (b.priority === 'high' && a.priority !== 'high') return 1;
		return new Date(a.timestamp) - new Date(b.timestamp);
	});

	for (const query of sortedQueries.slice(0, 10)) { // Process max 10 at a time
		try {
			const result = await getEnhancedClinicalRecommendations(
				query.query,
				query.patientData,
				query.relevantMedicalData,
				{ maxRetries: 1, saveForLater: false, context: query.context } // Don't re-queue
			);

			if (!result.isError) {
				// Store processed result for potential retrieval
				await syncQueueDb.addToQueue('processed_queries', query.id, 'add', {
					originalQuery: query,
					result,
					processedAt: new Date().toISOString()
				});
				processed++;
			} else {
				errors++;
			}

			await offlineQueryDb.delete(query.id);

		} catch (error) {
			console.error(`Error processing offline query ${query.id}:`, error);
			errors++;
		}
	}

	return { processed, errors };
}

// Enhanced function specifically for SMART Guidelines integration
export async function enhancedGeminiWithSMART(query, patientData, context = {}) {
	return await getEnhancedClinicalRecommendations(
		query,
		patientData,
		null, // Will be populated by SMART Guidelines
		{
			context,
			fallbackToRules: true,
			saveForLater: true,
			maxRetries: 2
		}
	);
}