// src/lib/ai/clinicalRAGSystem.js
// FIXED RAG implementation using embeddings + template generation
// No large language model needed - uses retrieval + structured responses

import { LightweightRAG } from '../rag/lightweightRAG';

export class ClinicalRAGSystem {
	constructor() {
		this.rag = new LightweightRAG();
		this.embedder = null;
		this.isInitialized = false;

		// Use embeddings model instead of full LLM
		this.modelConfig = {
			name: 'sentence-transformers/all-MiniLM-L6-v2',
			size: '23MB',
			type: 'embeddings',
			huggingFaceUrl: 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2'
		};

		this.responseTemplates = this.initializeResponseTemplates();

		console.log('🏥 Clinical RAG System initialized (embeddings-based)');
	}

	async initialize() {
		try {
			console.log('🔄 Initializing RAG system...');

			// Initialize the lightweight RAG
			await this.rag.initialize();

			// Try to load embeddings model (optional)
			await this.loadEmbeddingsModel();

			this.isInitialized = true;
			console.log('✅ Clinical RAG system ready');

			return { success: true, message: 'RAG system initialized successfully' };

		} catch (error) {
			console.error('❌ RAG initialization failed:', error);
			return { success: false, error: error.message };
		}
	}

	async loadEmbeddingsModel() {
		try {
			// Try to load ONNX embeddings model
			if (typeof window !== 'undefined' && window.ort) {
				console.log('🔄 Loading embeddings model...');

				// This would load the actual ONNX embeddings model
				// For now, we'll use the simple text similarity from LightweightRAG
				console.log('📝 Using text similarity embeddings (fallback)');

				this.embedder = {
					type: 'text-similarity',
					available: true
				};
			}
		} catch (error) {
			console.warn('⚠️ Embeddings model not available, using text similarity');
			this.embedder = {
				type: 'text-similarity',
				available: false
			};
		}
	}

	initializeResponseTemplates() {
		return {
			// Template for WHO guideline responses
			who_guideline: {
				header: "**WHO CLINICAL GUIDELINE**\n",
				sections: {
					assessment: "**CLINICAL ASSESSMENT:**\n{assessment}\n\n",
					management: "**MANAGEMENT:**\n{management}\n\n",
					followup: "**FOLLOW-UP:**\n{followup}\n\n",
					referral: "**REFERRAL CRITERIA:**\n{referral}\n\n"
				},
				footer: "\n---\n*Based on WHO Clinical Guidelines*"
			},

			// Template for emergency responses
			emergency: {
				header: "🚨 **EMERGENCY PROTOCOL**\n",
				sections: {
					immediate: "**IMMEDIATE ACTION:**\n{immediate}\n\n",
					assessment: "**RAPID ASSESSMENT:**\n{assessment}\n\n",
					treatment: "**EMERGENCY TREATMENT:**\n{treatment}\n\n",
					referral: "**URGENT REFERRAL:**\n{referral}\n\n"
				},
				footer: "\n---\n*EMERGENCY PROTOCOL - Time-critical*"
			},

			// Template for IMCI responses  
			imci: {
				header: "**IMCI PROTOCOL** (Integrated Management of Childhood Illness)\n",
				sections: {
					danger_signs: "**DANGER SIGNS CHECK:**\n{danger_signs}\n\n",
					assessment: "**AGE-APPROPRIATE ASSESSMENT:**\n{assessment}\n\n",
					treatment: "**IMCI TREATMENT:**\n{treatment}\n\n",
					followup: "**FOLLOW-UP:**\n{followup}\n\n"
				},
				footer: "\n---\n*WHO IMCI Guidelines*"
			},

			// Template for maternal health
			maternal: {
				header: "**MATERNAL HEALTH PROTOCOL**\n",
				sections: {
					assessment: "**ANTENATAL/POSTNATAL ASSESSMENT:**\n{assessment}\n\n",
					danger_signs: "**MATERNAL DANGER SIGNS:**\n{danger_signs}\n\n",
					management: "**CARE PLAN:**\n{management}\n\n",
					referral: "**REFERRAL INDICATIONS:**\n{referral}\n\n"
				},
				footer: "\n---\n*WHO Maternal Health Guidelines*"
			}
		};
	}

	async generateClinicalRecommendation(query, patientData = {}, options = {}) {
		const startTime = performance.now();

		if (!this.isInitialized) {
			await this.initialize();
		}

		try {
			console.log('🔍 Processing clinical query with RAG...');

			// Step 1: Retrieve relevant clinical content
			const retrievalResults = await this.rag.search(query, patientData);

			if (!retrievalResults || retrievalResults.length === 0) {
				return await this.generateFallbackResponse(query, patientData);
			}

			// Step 2: Analyze clinical context
			const clinicalContext = this.analyzeClinicalContext(query, patientData);

			// Step 3: Select appropriate response template
			const template = this.selectResponseTemplate(clinicalContext, retrievalResults);

			// Step 4: Generate structured clinical response
			const response = this.constructClinicalResponse(template, retrievalResults, clinicalContext);

			const responseTime = performance.now() - startTime;

			return {
				text: response.text,
				confidence: response.confidence,
				method: 'rag-clinical-retrieval',
				sources: response.sources,
				template: template.name,
				responseTime,
				timestamp: new Date(),
				offline: true,
				ragStats: {
					documentsRetrieved: retrievalResults.length,
					primarySource: retrievalResults[0]?.document?.title,
					matchScore: retrievalResults[0]?.score
				}
			};

		} catch (error) {
			console.error('❌ RAG generation failed:', error);
			return await this.generateFallbackResponse(query, patientData, error);
		}
	}

	analyzeClinicalContext(query, patientData) {
		const queryLower = query.toLowerCase();
		const symptoms = patientData?.symptoms?.toLowerCase() || '';
		const allText = `${queryLower} ${symptoms}`;

		// Determine clinical domain and urgency
		const context = {
			domain: 'general',
			urgency: 'routine',
			ageGroup: this.getAgeGroup(patientData.age),
			emergencyKeywords: []
		};

		// Domain detection
		if (patientData.pregnancy || allText.includes('pregnancy') || allText.includes('maternal')) {
			context.domain = 'maternal';
		} else if (context.ageGroup === 'pediatric') {
			context.domain = 'imci';
		} else if (allText.includes('emergency') || allText.includes('urgent') || allText.includes('critical')) {
			context.domain = 'emergency';
		}

		// Emergency detection
		const emergencyTerms = ['unconscious', 'convulsions', 'severe bleeding', 'difficulty breathing', 'shock'];
		const foundEmergency = emergencyTerms.filter(term => allText.includes(term));

		if (foundEmergency.length > 0) {
			context.urgency = 'emergency';
			context.emergencyKeywords = foundEmergency;
		}

		return context;
	}

	selectResponseTemplate(clinicalContext, retrievalResults) {
		// Select template based on clinical context
		if (clinicalContext.urgency === 'emergency') {
			return { name: 'emergency', template: this.responseTemplates.emergency };
		}

		if (clinicalContext.domain === 'imci') {
			return { name: 'imci', template: this.responseTemplates.imci };
		}

		if (clinicalContext.domain === 'maternal') {
			return { name: 'maternal', template: this.responseTemplates.maternal };
		}

		// Default to WHO guideline template
		return { name: 'who_guideline', template: this.responseTemplates.who_guideline };
	}

	constructClinicalResponse(templateInfo, retrievalResults, clinicalContext) {
		const { template } = templateInfo;
		const primaryResult = retrievalResults[0];

		// Extract content sections from retrieved documents
		const contentSections = this.extractContentSections(retrievalResults);

		// Build response using template
		let responseText = template.header;

		// Populate template sections with retrieved content
		Object.entries(template.sections).forEach(([sectionKey, sectionTemplate]) => {
			const sectionContent = contentSections[sectionKey] || contentSections.default || 'Refer to clinical guidelines';
			responseText += sectionTemplate.replace(`{${sectionKey}}`, sectionContent);
		});

		responseText += template.footer;

		// Add emergency context if needed
		if (clinicalContext.urgency === 'emergency') {
			responseText = `🚨 **EMERGENCY CASE DETECTED** 🚨\n\n${responseText}`;
		}

		// Determine confidence based on retrieval quality
		const confidence = this.calculateConfidence(retrievalResults, clinicalContext);

		return {
			text: responseText,
			confidence,
			sources: retrievalResults.map(r => r.document?.title || 'Clinical Guideline'),
			primaryGuideline: primaryResult?.document?.title
		};
	}

	extractContentSections(retrievalResults) {
		const sections = {};

		// Extract different types of clinical content from retrieved documents
		for (const result of retrievalResults.slice(0, 3)) { // Use top 3 results
			const content = result.document?.content || result.text || '';

			// Simple extraction based on common clinical section patterns
			if (content.includes('ASSESSMENT') || content.includes('Assessment')) {
				sections.assessment = this.extractSection(content, 'assessment');
			}

			if (content.includes('MANAGEMENT') || content.includes('Treatment')) {
				sections.management = this.extractSection(content, 'management');
			}

			if (content.includes('FOLLOW') || content.includes('Follow-up')) {
				sections.followup = this.extractSection(content, 'followup');
			}

			if (content.includes('REFER') || content.includes('Referral')) {
				sections.referral = this.extractSection(content, 'referral');
			}

			if (content.includes('DANGER') || content.includes('Emergency')) {
				sections.danger_signs = this.extractSection(content, 'danger_signs');
			}

			if (content.includes('IMMEDIATE') || content.includes('Urgent')) {
				sections.immediate = this.extractSection(content, 'immediate');
			}

			// Default content if no specific sections found
			if (!sections.default && content.length > 50) {
				sections.default = content.substring(0, 300) + '...';
			}
		}

		return sections;
	}

	extractSection(content, sectionType) {
		// Simple section extraction - this could be enhanced with better NLP
		const lines = content.split('\n');
		const relevantLines = [];

		let inSection = false;
		for (const line of lines) {
			if (line.toLowerCase().includes(sectionType) || inSection) {
				relevantLines.push(line);
				inSection = true;

				if (relevantLines.length >= 3 && line.trim() === '') {
					break; // End of section
				}
			}
		}

		return relevantLines.join('\n').trim().substring(0, 200) + '...';
	}

	calculateConfidence(retrievalResults, clinicalContext) {
		if (!retrievalResults || retrievalResults.length === 0) {
			return 'very-low';
		}

		const topScore = retrievalResults[0].score || 0;
		const resultCount = retrievalResults.length;

		if (topScore > 0.8 && resultCount >= 2 && clinicalContext.urgency !== 'emergency') {
			return 'high';
		} else if (topScore > 0.6 && resultCount >= 1) {
			return 'medium';
		} else if (topScore > 0.3) {
			return 'low';
		} else {
			return 'very-low';
		}
	}

	getAgeGroup(age) {
		if (!age) return 'adult';
		if (age < 5) return 'pediatric';
		if (age >= 15 && age <= 49) return 'reproductive';
		if (age > 65) return 'elderly';
		return 'adult';
	}

	async generateFallbackResponse(query, patientData, error = null) {
		// Fallback to rule-based system
		try {
			const { getPracticalLocalRecommendations } = await import('./practicalLocalAI');
			const ruleBasedResponse = await getPracticalLocalRecommendations(query, patientData);

			return {
				...ruleBasedResponse,
				method: 'rag-fallback-to-rules',
				fallbackReason: error?.message || 'RAG retrieval failed',
				confidence: 'medium' // Rule-based is reliable
			};

		} catch (fallbackError) {
			console.error('❌ Both RAG and rule-based failed:', fallbackError);

			return {
				text: `**Clinical Decision Support Unavailable**\n\nBoth RAG and rule-based systems encountered errors. Please refer to standard clinical protocols and use professional judgment.\n\n**Basic Approach:**\n• Complete systematic assessment\n• Apply standard care protocols\n• Consider patient safety and referral needs`,
				method: 'emergency-fallback',
				confidence: 'very-low',
				error: fallbackError.message
			};
		}
	}

	async getStatus() {
		return {
			initialized: this.isInitialized,
			ragAvailable: this.rag?.initialized || false,
			embeddingsModel: this.embedder?.type || 'none',
			method: 'clinical-rag-system',
			responseTemplates: Object.keys(this.responseTemplates).length,
			offline: true
		};
	}
}

// Export singleton
export const clinicalRAGSystem = new ClinicalRAGSystem();

// Main function
export async function getClinicalRAGRecommendations(query, patientData, options = {}) {
	return await clinicalRAGSystem.generateClinicalRecommendation(query, patientData, options);
}

// Initialize function
export async function initializeClinicalRAG() {
	return await clinicalRAGSystem.initialize();
}