// src/lib/ai/enhancedHybridAI.js - SSR-SAFE FIXED OFFLINE RAG USAGE
// Updated to properly use RAG system when offline with SSR-safe network detection

import { getPracticalLocalRecommendations, getPracticalLocalStatus } from './practicalLocalAI';
import { getClinicalRecommendations as getGeminiRecommendations, getModelStatus } from './gemini';
import { getClinicalRAGRecommendations, initializeClinicalRAG } from './clinicalRAGSystem';
import { getRelevantGuidelines } from '../db/expandedGuidelines';
import { isOnline, addNetworkListener } from '../utils/networkDetection';

// FIXED: Updated configuration prioritizing RAG when offline
const HYBRID_CONFIG = {
	// Model selection thresholds
	complexQueryMinLength: 500,
	simpleQueryMaxLength: 50,

	emergencyKeywords: [
		'emergency', 'urgent', 'critical', 'severe', 'unconscious',
		'bleeding', 'chest pain', 'difficulty breathing', 'convulsions',
		'shock', 'collapse', 'poisoning', 'overdose'
	],

	// Performance settings
	maxResponseTime: 15000,
	preferredResponseTime: 5000,
	localAIConfidenceThreshold: 0.7,

	// FIXED: Offline-first RAG configuration
	prioritizeGeminiWhenOnline: true,
	prioritizeRAGWhenOffline: true,    // NEW: Use RAG as primary offline system
	enableFallbackChain: true,
	enableRAG: true,
	ragAsPreferred: true,              // NEW: Prefer RAG over rule-based when available
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
				'clinical-rag-offline': 0,  // NEW: Track offline RAG usage
				'local-emergency': 0,
				'gemini-simple': 0,
				'gemini-complex': 0,
				'gemini-preferred': 0,
				'offline-fallback': 0,
				'error-recovery': 0
			}
		};

		this.lastSelection = null;
		this.ragInitialized = false;
		this.ragInitializing = false;
		this.ragSystemInstance = null;
		this.networkUnsubscribe = null;

		// SSR-safe initialization
		this.isOnline = isOnline();
		this.isBrowser = typeof window !== 'undefined';

		if (this.isBrowser) {
			// Only set up network listeners in browser
			this.networkUnsubscribe = addNetworkListener((online) => {
				this.isOnline = online;
				if (online) {
					console.log('🌐 Network restored - Gemini now preferred');
				} else {
					console.log('📱 Network lost - RAG system now preferred');
				}
			});

			// Auto-initialize RAG system in browser
			this.autoInitializeRAG();
		} else {
			// Server-side: assume online and don't auto-initialize
			console.log('🤖 Enhanced Hybrid Manager initialized (server-side)');
		}

		console.log('🤖 Enhanced Hybrid Manager initialized (RAG-first when offline)');
	}

	async autoInitializeRAG() {
		if (this.ragInitializing || this.ragInitialized || !this.isBrowser) {
			return;
		}

		this.ragInitializing = true;
		console.log('🔄 Auto-initializing RAG system...');

		try {
			await new Promise(resolve => setTimeout(resolve, 2000));

			const result = await this.initializeRAGSystem();
			if (result.success) {
				console.log('✅ RAG system auto-initialized successfully - available for offline use');
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
				console.log('✅ Clinical RAG system ready - can provide offline clinical support');

				if (this.isBrowser && typeof window !== 'undefined') {
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
			console.log(`📶 Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

			const systemStatus = await this.getSystemStatus();

			console.log('System status:', {
				online: this.isOnline,
				geminiAvailable: systemStatus.models.gemini.available,
				ragAvailable: systemStatus.models.clinicalRAG.available,
				ragInitialized: this.ragInitialized,
				ruleBasedLocal: systemStatus.models.localAI.available
			});

			// FIXED: Enhanced model selection with proper offline RAG priority
			const selection = await this.selectOptimalModelWithOfflineRAG(query, patientData, options, systemStatus);
			console.log('🎯 Model selection:', selection);

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

			// FIXED: Try RAG system before falling back to rule-based
			const systemStatus = await this.getSystemStatus();
			if (this.ragInitialized && systemStatus?.models?.clinicalRAG?.available) {
				console.log('🔄 Trying RAG system as final fallback...');
				try {
					const ragFallback = await getClinicalRAGRecommendations(query, patientData, options);
					this.stats.ragQueries++;

					return {
						...ragFallback,
						selectedModel: 'clinical-rag-emergency',
						selectionReason: 'system-error-rag-fallback',
						error: error.message,
						responseTime: performance.now() - startTime,
						hybridCapable: true
					};
				} catch (ragError) {
					console.warn('RAG fallback also failed:', ragError);
				}
			}

			// Final fallback to rule-based
			const fallbackResult = await getPracticalLocalRecommendations(query, patientData, options);
			this.stats.fallbackQueries++;

			return {
				...fallbackResult,
				selectedModel: 'emergency-fallback',
				selectionReason: 'all-systems-failed',
				error: error.message,
				responseTime: performance.now() - startTime,
				hybridCapable: true
			};
		}
	}

	// FIXED: Model selection logic that prioritizes RAG when offline
	async selectOptimalModelWithOfflineRAG(query, patientData, options, systemStatus) {
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
				console.warn('RAG requested but not available');
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

			if (this.isOnline && systemStatus.models.gemini.available) {
				this.stats.modelSelectionReasons['gemini-complex']++;
				return { model: 'gemini', reason: 'emergency-gemini-preferred', confidence: 'high' };
			} else if (systemStatus.models.clinicalRAG.available) {
				console.log('🏥 Using RAG for emergency case (offline)');
				this.stats.modelSelectionReasons['clinical-rag-offline']++;
				return { model: 'clinical-rag', reason: 'emergency-rag-offline', confidence: 'high' };
			} else {
				this.stats.modelSelectionReasons['rule-based-local']++;
				return { model: 'rule-based-local', reason: 'emergency-rules-only', confidence: 'medium' };
			}
		}

		// ONLINE LOGIC - Prefer Gemini when online
		if (this.isOnline) {
			if (systemStatus.models.gemini.available) {
				if (clinicalAnalysis.isSimple) {
					console.log('📝 Simple query - using Gemini (online)');
					this.stats.modelSelectionReasons['gemini-simple']++;
					return { model: 'gemini', reason: 'simple-gemini-preferred', confidence: 'high' };
				} else if (clinicalAnalysis.isComplex) {
					console.log('🧠 Complex case - using Gemini (online)');
					this.stats.modelSelectionReasons['gemini-complex']++;
					return { model: 'gemini', reason: 'complex-gemini-preferred', confidence: 'high' };
				} else {
					console.log('🌐 Default - using Gemini (online)');
					this.stats.modelSelectionReasons['gemini-preferred']++;
					return { model: 'gemini', reason: 'online-gemini-preferred', confidence: 'high' };
				}
			}
		}

		// OFFLINE LOGIC - Prefer RAG over rule-based when available
		if (!this.isOnline) {
			console.log('📱 Offline mode - selecting best local system');

			if (systemStatus.models.clinicalRAG.available && this.ragInitialized) {
				console.log('📚 Using Clinical RAG system (offline preferred)');
				this.stats.modelSelectionReasons['clinical-rag-offline']++;
				return {
					model: 'clinical-rag',
					reason: 'offline-rag-preferred',
					confidence: 'high',
					offline: true
				};
			} else if (systemStatus.models.clinicalRAG.initializing) {
				console.log('⏳ RAG system still initializing, using rules temporarily');
				this.stats.modelSelectionReasons['rule-based-local']++;
				return {
					model: 'rule-based-local',
					reason: 'rag-initializing-rules-temporary',
					confidence: 'medium',
					offline: true
				};
			} else {
				console.log('📋 RAG unavailable, using rule-based system (offline)');
				this.stats.modelSelectionReasons['rule-based-local']++;
				return {
					model: 'rule-based-local',
					reason: 'offline-rules-only',
					confidence: 'medium',
					offline: true
				};
			}
		}

		// Fallback - should not reach here normally
		console.warn('⚠️ Unexpected condition in model selection, defaulting to rule-based');
		this.stats.modelSelectionReasons['rule-based-local']++;
		return { model: 'rule-based-local', reason: 'unexpected-fallback', confidence: 'low' };
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

		// FIXED: Better fallback chain that considers offline RAG
		if (HYBRID_CONFIG.enableFallbackChain && selection.model !== 'rule-based-local') {
			if (selection.model === 'gemini') {
				// If Gemini fails, try RAG first, then rules
				if (await this.getSystemStatus().then(s => s.models.clinicalRAG.available)) {
					models.push('clinical-rag');
				}
				models.push('rule-based-local');
			} else if (selection.model === 'clinical-rag') {
				// If RAG fails, try Gemini if online, otherwise rules
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
				console.log('📚 Executing Clinical RAG system...');
				const ragResult = await getClinicalRAGRecommendations(query, patientData, options);
				this.stats.ragQueries++;
				return {
					...ragResult,
					method: 'clinical-rag-system',
					offline: !this.isOnline  // Flag offline usage
				};

			case 'gemini':
				console.log('🌐 Executing Gemini API...');
				const geminiResult = await getGeminiRecommendations(query, patientData, { guidelines });
				this.stats.geminiQueries++;
				return { ...geminiResult, method: 'google-gemini-multi-model' };

			default:
				throw new Error(`Unknown model: ${modelName}`);
		}
	}

	async executeEmergencyFallback(query, patientData, guidelines, originalError) {
		console.log('🆘 Executing emergency fallback...');

		// FIXED: Try RAG first in emergency fallback if available
		if (this.ragInitialized) {
			try {
				console.log('🏥 Trying RAG system as emergency fallback...');
				const ragResult = await getClinicalRAGRecommendations(query, patientData);
				this.stats.ragQueries++;
				return {
					...ragResult,
					selectedModel: 'clinical-rag-emergency',
					selectionReason: 'emergency-rag-fallback',
					originalError: originalError.message,
					method: 'clinical-rag-emergency'
				};
			} catch (ragError) {
				console.warn('RAG emergency fallback failed:', ragError);
			}
		}

		// Final fallback to rule-based
		try {
			console.log('📋 Using rule-based emergency fallback...');
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
				offline: !this.isOnline,
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
			hybridCapable: true,
			systemStatus: {
				ruleBasedLocal: getPracticalLocalStatus(),
				clinicalRAG: {
					available: this.ragInitialized,
					initialized: this.ragInitialized,
					offlineCapable: true
				},
				gemini: {
					available: this.isOnline && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
					...getModelStatus()
				},
				online: this.isOnline,
				hybridVersion: 'enhanced-v3-offline-rag-priority'
			},
			responseTime: performance.now() - startTime,
			guidelines: guidelines.slice(0, 3).map(g => ({
				title: g.title,
				category: g.category
			})),
			timestamp: new Date(),
			offline: !this.isOnline,
			ragUsed: selection.model === 'clinical-rag'
		};
	}

	updateStats(result, selection) {
		this.lastSelection = {
			model: selection.model,
			reason: selection.reason,
			timestamp: new Date(),
			responseTime: result.responseTime,
			confidence: result.confidence,
			offline: selection.offline || !this.isOnline
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
			embeddingBased: false,
			offlineCapable: this.ragInitialized
		};

		// Get detailed RAG status if available
		if (this.ragSystemInstance && typeof this.ragSystemInstance.getStatus === 'function') {
			try {
				const detailedStatus = this.ragSystemInstance.getStatus();
				ragStatus = {
					...ragStatus,
					...detailedStatus,
					available: detailedStatus.initialized || detailedStatus.available || this.ragInitialized,
					embeddingBased: true,
					offlineCapable: true
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
				embeddingBased: true,
				offlineCapable: true
			};
		}

		// Get Gemini model status
		const geminiModelStatus = getModelStatus();

		return {
			hybrid: {
				enabled: true,
				version: 'enhanced-v3-offline-rag-priority',
				prioritizeGeminiWhenOnline: HYBRID_CONFIG.prioritizeGeminiWhenOnline,
				prioritizeRAGWhenOffline: HYBRID_CONFIG.prioritizeRAGWhenOffline,
				ragEnabled: HYBRID_CONFIG.enableRAG,
				embeddingsEnabled: true
			},
			models: {
				localAI: {
					available: true,
					name: 'ATLAS-Rule-Based-AI',
					type: 'rule-based',
					dependencies: 'none',
					offlineCapable: true,
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
					offlineCapable: true,
					priorityWhenOffline: true,  // NEW: Flag to indicate priority offline
					...ragStatus
				},
				gemini: {
					available: this.isOnline && !!process.env.NEXT_PUBLIC_GEMINI_API_KEY &&
						geminiModelStatus.availableModels.length > 0,
					name: 'gemini-multi-model',
					type: 'api',
					requiresNetwork: true,
					priority: this.isOnline ? 'high' : 'unavailable',
					offlineCapable: false,
					...geminiModelStatus
				}
			},
			stats: this.stats,
			online: this.isOnline,
			lastSelection: this.lastSelection,
			ragInitialized: this.ragInitialized,
			ragInitializing: this.ragInitializing,
			embeddingsSupported: true,
			offlineMode: !this.isOnline
		};
	}

	// Cleanup method
	destroy() {
		if (this.networkUnsubscribe) {
			this.networkUnsubscribe();
		}
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