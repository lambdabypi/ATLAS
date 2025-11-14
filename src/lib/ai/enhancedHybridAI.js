// src/lib/ai/enhancedHybridAI.js - Updated for new Gemini API structure
import { getPracticalLocalRecommendations, getPracticalLocalStatus } from './practicalLocalAI';
import { getClinicalRecommendations as getGeminiRecommendations, getModelStatus } from './gemini';
import { getClinicalRAGRecommendations, initializeClinicalRAG } from './clinicalRAGSystem';
import { getRelevantGuidelines } from '../db/expandedGuidelines';

// Updated configuration
const HYBRID_CONFIG = {
	complexQueryMinLength: 500,
	simpleQueryMaxLength: 50,

	emergencyKeywords: [
		'emergency', 'urgent', 'critical', 'severe', 'unconscious',
		'bleeding', 'chest pain', 'difficulty breathing', 'convulsions',
		'shock', 'collapse', 'poisoning', 'overdose'
	],

	maxResponseTime: 15000,
	preferredResponseTime: 5000,
	localAIConfidenceThreshold: 0.7,

	prioritizeGeminiWhenOnline: true,
	prioritizeOffline: false,
	enableFallbackChain: true,
	enableRAG: true,
	ragAsPreferred: false,
};

class EnhancedHybridManager {
	constructor() {
		this.stats = {
			totalQueries: 0,
			localAIQueries: 0,
			ragQueries: 0,
			geminiQueries: 0,
			fallbackQueries: 0,
			averageResponseTime: 0,
			modelSelectionReasons: {
				'rule-based-local': 0,
				'clinical-rag': 0,
				'local-emergency': 0,
				'gemini-simple': 0,
				'gemini-complex': 0,
				'gemini-preferred': 0,
				'offline-fallback': 0,
				'error-recovery': 0
			}
		};

		this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
		this.lastSelection = null;
		this.ragInitialized = false;
		this.ragInitializing = false;
		this.ragSystemInstance = null;

		// Listen for connectivity changes
		if (typeof window !== 'undefined') {
			window.addEventListener('online', () => {
				this.isOnline = true;
				console.log('🌐 Connection restored - Gemini now preferred');
			});
			window.addEventListener('offline', () => {
				this.isOnline = false;
				console.log('📱 Offline mode - Using local systems');
			});

			this.autoInitializeRAG();
		}

		console.log('🤖 Enhanced Hybrid Manager initialized with multi-model Gemini support');
	}

	async autoInitializeRAG() {
		if (this.ragInitializing || this.ragInitialized) {
			return;
		}

		this.ragInitializing = true;
		console.log('🔄 Auto-initializing RAG system...');

		try {
			await new Promise(resolve => setTimeout(resolve, 2000));

			const result = await this.initializeRAGSystem();
			if (result.success) {
				console.log('✅ RAG system auto-initialized successfully');
			} else {
				console.warn('⚠️ RAG auto-initialization failed:', result.message);
			}
		} catch (error) {
			console.warn('⚠️ RAG auto-initialization error:', error);
		} finally {
			this.ragInitializing = false;
		}
	}

	async initializeRAGSystem(options = {}) {
		if (this.ragInitialized) {
			return { success: true, message: 'RAG system already initialized' };
		}

		try {
			console.log('📚 Initializing Clinical RAG system...');

			const result = await initializeClinicalRAG();

			if (result.success) {
				this.ragInitialized = true;
				this.ragSystemInstance = result.system;
				console.log('✅ Clinical RAG system ready');

				if (typeof window !== 'undefined') {
					window.dispatchEvent(new CustomEvent('atlas:rag-initialized', {
						detail: { success: true }
					}));
				}
			} else {
				console.warn('⚠️ RAG system initialization failed, falling back to rule-based');
			}

			return result;

		} catch (error) {
			console.error('❌ RAG system initialization error:', error);
			return {
				success: false,
				message: `RAG initialization failed: ${error.message}`,
				error: error.message
			};
		}
	}

	async getEnhancedClinicalRecommendations(query, patientData, relevantMedicalData, options = {}) {
		const startTime = performance.now();
		this.stats.totalQueries++;

		try {
			console.log('🤖 Starting enhanced hybrid AI analysis...');

			const systemStatus = await this.getSystemStatus();

			console.log('System status:', {
				online: this.isOnline,
				geminiAvailable: systemStatus.models.gemini.available,
				geminiModels: systemStatus.models.gemini.availableModels,
				ragAvailable: systemStatus.models.clinicalRAG.available,
				ruleBasedLocal: systemStatus.models.localAI.available
			});

			// Enhanced model selection
			const selection = await this.selectOptimalModelEnhanced(query, patientData, options, systemStatus);
			console.log('Model selection:', selection);

			// Get relevant guidelines for context
			const guidelines = relevantMedicalData?.guidelines ||
				await getRelevantGuidelines(patientData?.symptoms || query, patientData);

			let result;

			// Execute selected model with fallback chain
			try {
				result = await this.executeWithFallback(
					selection,
					query,
					patientData,
					guidelines,
					options
				);
			} catch (error) {
				console.warn('Primary model failed, using emergency fallback:', error);
				result = await this.executeEmergencyFallback(query, patientData, guidelines, error);
			}

			// Enhance result with hybrid metadata
			const finalResult = this.enhanceResult(result, selection, guidelines, startTime);

			// Update statistics
			this.updateStats(finalResult, selection);

			return finalResult;

		} catch (error) {
			console.error('Enhanced hybrid AI system error:', error);

			const fallbackResult = await getPracticalLocalRecommendations(query, patientData, options);
			this.stats.fallbackQueries++;

			return {
				...fallbackResult,
				selectedModel: 'emergency-fallback',
				selectionReason: 'system-error-recovery',
				error: error.message,
				responseTime: performance.now() - startTime,
				hybridCapable: true
			};
		}
	}

	async selectOptimalModelEnhanced(query, patientData, options, systemStatus) {
		// User preference override (with availability check)
		if (options.modelPreference === 'rule-based' || options.modelPreference === 'local-rules') {
			this.stats.modelSelectionReasons['rule-based-local']++;
			return { model: 'rule-based-local', reason: 'user-preference-rules', confidence: 'high' };
		}

		if (options.modelPreference === 'clinical-rag' || options.modelPreference === 'rag') {
			if (systemStatus.models.clinicalRAG.available) {
				this.stats.modelSelectionReasons['clinical-rag']++;
				return { model: 'clinical-rag', reason: 'user-preference-rag', confidence: 'high' };
			} else {
				console.warn('RAG requested but not available, falling back to Gemini');
				if (systemStatus.models.gemini.available && this.isOnline) {
					this.stats.modelSelectionReasons['gemini-preferred']++;
					return { model: 'gemini', reason: 'rag-unavailable-gemini-fallback', confidence: 'high' };
				} else {
					this.stats.modelSelectionReasons['rule-based-local']++;
					return { model: 'rule-based-local', reason: 'rag-unavailable-offline', confidence: 'medium' };
				}
			}
		}

		if (options.forceAPI || options.modelPreference === 'gemini') {
			if (systemStatus.models.gemini.available && this.isOnline) {
				this.stats.modelSelectionReasons['gemini-preferred']++;
				return { model: 'gemini', reason: 'user-preference-gemini', confidence: 'high' };
			}
		}

		// Intelligent auto-selection based on clinical context
		const clinicalAnalysis = this.analyzeClinicalContext(query, patientData);

		console.log('📊 Clinical Analysis:', clinicalAnalysis);

		// Emergency/critical cases - prioritize best available AI
		if (clinicalAnalysis.isEmergency || clinicalAnalysis.isCritical) {
			console.log('🚨 Emergency case detected');

			// Check Gemini availability (now with model status awareness)
			if (systemStatus.models.gemini.available &&
				systemStatus.models.gemini.availableModels &&
				systemStatus.models.gemini.availableModels.length > 0 &&
				this.isOnline) {
				this.stats.modelSelectionReasons['gemini-complex']++;
				return {
					model: 'gemini',
					reason: 'emergency-gemini-preferred',
					confidence: 'high',
					preferredGeminiModel: systemStatus.models.gemini.nextAvailableModel
				};
			} else if (systemStatus.models.clinicalRAG.available) {
				this.stats.modelSelectionReasons['clinical-rag']++;
				return { model: 'clinical-rag', reason: 'emergency-rag-available', confidence: 'high' };
			} else {
				this.stats.modelSelectionReasons['rule-based-local']++;
				return { model: 'rule-based-local', reason: 'emergency-rules-only', confidence: 'medium' };
			}
		}

		// Simple queries - prefer Gemini when online and available
		if (clinicalAnalysis.isSimple) {
			console.log('📝 Simple query detected');

			if (systemStatus.models.gemini.available &&
				systemStatus.models.gemini.availableModels &&
				systemStatus.models.gemini.availableModels.length > 0 &&
				this.isOnline) {
				this.stats.modelSelectionReasons['gemini-simple']++;
				return {
					model: 'gemini',
					reason: 'simple-gemini-preferred',
					confidence: 'high',
					preferredGeminiModel: systemStatus.models.gemini.nextAvailableModel
				};
			} else if (systemStatus.models.clinicalRAG.available) {
				this.stats.modelSelectionReasons['clinical-rag']++;
				return { model: 'clinical-rag', reason: 'simple-rag-available', confidence: 'medium' };
			} else {
				this.stats.modelSelectionReasons['rule-based-local']++;
				return { model: 'rule-based-local', reason: 'simple-rules-fallback', confidence: 'medium' };
			}
		}

		// Complex clinical cases - prefer Gemini when online
		if (clinicalAnalysis.isComplex) {
			console.log('🧠 Complex case detected');

			if (systemStatus.models.gemini.available &&
				systemStatus.models.gemini.availableModels &&
				systemStatus.models.gemini.availableModels.length > 0 &&
				this.isOnline) {
				this.stats.modelSelectionReasons['gemini-complex']++;
				return {
					model: 'gemini',
					reason: 'complex-gemini-preferred',
					confidence: 'high',
					preferredGeminiModel: systemStatus.models.gemini.nextAvailableModel
				};
			} else if (systemStatus.models.clinicalRAG.available) {
				this.stats.modelSelectionReasons['clinical-rag']++;
				return { model: 'clinical-rag', reason: 'complex-rag-offline', confidence: 'medium' };
			} else {
				this.stats.modelSelectionReasons['rule-based-local']++;
				return { model: 'rule-based-local', reason: 'complex-rules-only', confidence: 'low' };
			}
		}

		// Default strategy - prefer Gemini when online and models available
		if (this.isOnline && systemStatus.models.gemini.available &&
			systemStatus.models.gemini.availableModels &&
			systemStatus.models.gemini.availableModels.length > 0) {
			console.log('🌐 Online - defaulting to Gemini with available models');
			this.stats.modelSelectionReasons['gemini-preferred']++;
			return {
				model: 'gemini',
				reason: 'online-gemini-preferred',
				confidence: 'high',
				preferredGeminiModel: systemStatus.models.gemini.nextAvailableModel
			};
		}

		// Offline fallback strategy
		if (systemStatus.models.clinicalRAG.available) {
			this.stats.modelSelectionReasons['clinical-rag']++;
			return { model: 'clinical-rag', reason: 'offline-rag-priority', confidence: 'medium' };
		} else {
			this.stats.modelSelectionReasons['rule-based-local']++;
			return { model: 'rule-based-local', reason: 'offline-rules-only', confidence: 'medium' };
		}
	}

	analyzeClinicalContext(query, patientData) {
		const allText = `${query} ${patientData?.symptoms || ''} ${patientData?.chiefComplaint || ''}`.toLowerCase();

		// Emergency detection
		const isEmergency = HYBRID_CONFIG.emergencyKeywords.some(keyword =>
			allText.includes(keyword)
		);

		// Critical detection
		const isCritical = (
			allText.includes('unconscious') ||
			allText.includes('convulsions') ||
			allText.includes('severe bleeding') ||
			allText.includes('shock') ||
			allText.includes('chest pain')
		);

		// Simple query detection
		const isSimple = (
			query.length < HYBRID_CONFIG.simpleQueryMaxLength &&
			!patientData?.medicalHistory &&
			!patientData?.currentMedications &&
			(!patientData?.symptoms || patientData.symptoms.length < 100)
		);

		// Complex detection with higher threshold
		const isComplex = !isSimple && (
			query.length > HYBRID_CONFIG.complexQueryMinLength ||
			patientData?.medicalHistory?.length > 200 ||
			patientData?.currentMedications?.split(',').length > 3 ||
			(patientData?.age && (patientData.age < 2 || patientData.age > 75)) ||
			patientData?.pregnancy ||
			allText.includes('multiple') ||
			allText.includes('chronic') ||
			allText.includes('complication')
		);

		return {
			isEmergency,
			isComplex,
			isCritical,
			isSimple,
			queryLength: query.length,
			hasComplexMedicalHistory: patientData?.medicalHistory?.length > 200
		};
	}

	async executeWithFallback(selection, query, patientData, guidelines, options) {
		const models = [selection.model];

		// Add fallback models if enabled
		if (HYBRID_CONFIG.enableFallbackChain && selection.model !== 'rule-based-local') {
			if (selection.model === 'gemini') {
				if (await this.getSystemStatus().then(s => s.models.clinicalRAG.available)) {
					models.push('clinical-rag');
				}
				models.push('rule-based-local');
			} else if (selection.model === 'clinical-rag') {
				if (this.isOnline && await this.getSystemStatus().then(s => s.models.gemini.available)) {
					models.push('gemini');
				}
				models.push('rule-based-local');
			}
		}

		for (const modelName of models) {
			try {
				console.log(`🔄 Attempting ${modelName} model...`);

				const result = await this.executeModel(modelName, query, patientData, guidelines, options);

				if (result && result.text && result.text.length > 50) {
					return { ...result, attemptedModels: models.slice(0, models.indexOf(modelName) + 1) };
				}
			} catch (error) {
				console.warn(`Model ${modelName} failed:`, error);
				if (modelName === models[models.length - 1]) {
					throw error;
				}
			}
		}

		throw new Error('All models in fallback chain failed');
	}

	async executeModel(modelName, query, patientData, guidelines, options) {
		switch (modelName) {
			case 'rule-based-local':
				const localResult = await getPracticalLocalRecommendations(query, patientData, options);
				this.stats.localAIQueries++;
				return { ...localResult, method: 'rule-based-local-ai' };

			case 'clinical-rag':
				const ragResult = await getClinicalRAGRecommendations(query, patientData, options);
				this.stats.ragQueries++;
				return { ...ragResult, method: 'clinical-rag-system' };

			case 'gemini':
				const geminiResult = await getGeminiRecommendations(query, patientData, { guidelines });
				this.stats.geminiQueries++;
				return { ...geminiResult, method: 'google-gemini-multi-model' };

			default:
				throw new Error(`Unknown model: ${modelName}`);
		}
	}

	async executeEmergencyFallback(query, patientData, guidelines, originalError) {
		console.log('🆘 Executing emergency fallback to rule-based AI...');

		try {
			const result = await getPracticalLocalRecommendations(query, patientData);
			return {
				...result,
				selectedModel: 'rule-based-emergency',
				selectionReason: 'emergency-fallback',
				originalError: originalError.message
			};
		} catch (fallbackError) {
			console.error('Emergency fallback also failed:', fallbackError);

			return {
				text: `**Emergency Clinical Guidance**

All AI systems are temporarily unavailable. Please follow basic clinical principles:

**For General Assessment:**
• Check vital signs and patient stability
• Assess for danger signs requiring immediate attention
• Follow systematic approach: history, examination, assessment, plan

**Basic Management:**
• Ensure patient safety and comfort
• Provide symptomatic relief as appropriate
• Use evidence-based clinical guidelines

**When to Refer:**
• Any unstable vital signs
• Severe or worsening symptoms
• Uncertainty about diagnosis or management
• Patient or family concerns

Please refer to available clinical guidelines and use your professional judgment.`,
				selectedModel: 'basic-emergency-protocol',
				selectionReason: 'all-systems-failed',
				confidence: 'low',
				method: 'emergency-protocol',
				offline: true,
				allSystemsFailed: true
			};
		}
	}

	enhanceResult(result, selection, guidelines, startTime) {
		return {
			...result,
			selectedModel: selection.model,
			selectionReason: selection.reason,
			selectionConfidence: selection.confidence,
			preferredGeminiModel: selection.preferredGeminiModel,
			hybridCapable: true,
			systemStatus: {
				ruleBasedLocal: getPracticalLocalStatus(),
				clinicalRAG: { available: this.ragInitialized },
				gemini: {
					available: this.isOnline && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
					...getModelStatus()
				},
				online: this.isOnline,
				hybridVersion: 'enhanced-v2-multi-model-gemini'
			},
			responseTime: performance.now() - startTime,
			guidelines: guidelines.slice(0, 3).map(g => ({
				title: g.title,
				category: g.category
			})),
			timestamp: new Date()
		};
	}

	updateStats(result, selection) {
		this.lastSelection = {
			model: selection.model,
			reason: selection.reason,
			timestamp: new Date(),
			responseTime: result.responseTime,
			confidence: result.confidence
		};

		this.stats.averageResponseTime =
			(this.stats.averageResponseTime * (this.stats.totalQueries - 1) + result.responseTime) /
			this.stats.totalQueries;
	}

	async getSystemStatus() {
		let ragStatus = {
			available: this.ragInitialized,
			initializing: this.ragInitializing,
			initialized: this.ragInitialized,
			documentCount: 0,
			guidelineCount: 0,
			embeddingBased: false
		};

		// Get detailed RAG status if available
		if (this.ragSystemInstance && typeof this.ragSystemInstance.getStatus === 'function') {
			try {
				const detailedStatus = this.ragSystemInstance.getStatus();
				ragStatus = {
					...ragStatus,
					...detailedStatus,
					available: detailedStatus.initialized || detailedStatus.available || this.ragInitialized,
					embeddingBased: true
				};
			} catch (error) {
				console.warn('Could not get detailed RAG status:', error);
			}
		} else if (this.ragInitialized) {
			ragStatus = {
				...ragStatus,
				available: true,
				initialized: true,
				documentCount: 21,
				guidelineCount: 21,
				embeddingBased: true
			};
		}

		// Get Gemini model status
		const geminiModelStatus = getModelStatus();

		return {
			hybrid: {
				enabled: true,
				version: 'enhanced-v2-multi-model-gemini',
				prioritizeGeminiWhenOnline: HYBRID_CONFIG.prioritizeGeminiWhenOnline,
				ragEnabled: HYBRID_CONFIG.enableRAG,
				embeddingsEnabled: true
			},
			models: {
				localAI: {
					available: true,
					name: 'ATLAS-Rule-Based-AI',
					type: 'rule-based',
					dependencies: 'none',
					...getPracticalLocalStatus()
				},
				clinicalRAG: {
					available: ragStatus.available,
					initializing: ragStatus.initializing,
					name: 'Clinical-RAG-System-With-Real-Embeddings',
					type: 'semantic-retrieval-augmented',
					dependencies: 'transformers-js',
					initialized: ragStatus.initialized,
					embeddingBased: ragStatus.embeddingBased,
					embeddingModel: ragStatus.embeddingBased ? 'Xenova/all-MiniLM-L6-v2' : 'fallback',
					...ragStatus
				},
				gemini: {
					available: this.isOnline && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY &&
						geminiModelStatus.availableModels.length > 0,
					name: 'gemini-multi-model',
					type: 'api',
					requiresNetwork: true,
					priority: this.isOnline ? 'high' : 'unavailable',
					...geminiModelStatus
				}
			},
			stats: this.stats,
			online: this.isOnline,
			lastSelection: this.lastSelection,
			ragInitialized: this.ragInitialized,
			ragInitializing: this.ragInitializing,
			embeddingsSupported: true
		};
	}
}

// Export singleton instance
export const enhancedHybridManager = new EnhancedHybridManager();

// Main export function
export async function getEnhancedClinicalRecommendations(query, patientData, relevantMedicalData, options = {}) {
	return await enhancedHybridManager.getEnhancedClinicalRecommendations(
		query,
		patientData,
		relevantMedicalData,
		options
	);
}

// Status export
export async function getEnhancedSystemStatus() {
	return await enhancedHybridManager.getSystemStatus();
}

// RAG initialization export
export async function initializeRAGSystem(options = {}) {
	return await enhancedHybridManager.initializeRAGSystem(options);
}