// src/lib/ai/clinicalRAGSystem.js
// Complete fixed version with real embeddings and proper content extraction

import { WorkingSemanticRAG } from './workingSemanticRAG';

export class ClinicalRAGSystem {
	constructor() {
		this.semanticRAG = new WorkingSemanticRAG();
		this.isInitialized = false;
		this.responseTemplates = this.initializeResponseTemplates();

		console.log('🏥 Clinical RAG System (Real Embeddings) initialized');
	}

	async initialize() {
		try {
			console.log('🔄 Initializing REAL semantic clinical RAG...');

			// Show initialization progress
			const progressInterval = setInterval(() => {
				console.log('⏳ Still loading embeddings model...');
			}, 5000);

			const result = await this.semanticRAG.initialize();
			clearInterval(progressInterval);

			if (result.success) {
				this.isInitialized = true;
				console.log('✅ COMPLETE REAL SEMANTIC Clinical RAG system ready');

				// Test the embeddings are working
				await this.testEmbeddings();

				return { success: true, message: 'Real semantic RAG system initialized successfully' };
			} else {
				throw new Error(result.error);
			}

		} catch (error) {
			console.error('❌ Real semantic RAG initialization failed:', error);
			return { success: false, error: error.message };
		}
	}

	async testEmbeddings() {
		try {
			console.log('🧪 Testing real embeddings...');

			const testResults = await this.semanticRAG.semanticSearch('headache pain', {
				age: 30,
				gender: 'female'
			}, 2);

			if (testResults.length > 0) {
				console.log('✅ Embeddings test passed!');
				console.log(`   Top result: ${testResults[0].document.title}`);
				console.log(`   Similarity: ${testResults[0].similarity.toFixed(4)}`);
			} else {
				console.warn('⚠️ Embeddings test returned no results');
			}

		} catch (error) {
			console.error('❌ Embeddings test failed:', error);
		}
	}

	async getClinicalRecommendations(query, patientData = {}, options = {}) {
		try {
			console.log(`🔍 Getting REAL semantic clinical recommendations for: "${query}"`);

			if (!this.isInitialized) {
				await this.initialize();
			}

			// Use REAL semantic search with embeddings
			const semanticResults = await this.semanticRAG.semanticSearch(
				query,
				patientData,
				options.maxResults || 3
			);

			if (semanticResults.length === 0) {
				return this.generateFallbackResponse(query, patientData, 'No semantically relevant documents found');
			}

			// Generate structured response using REAL semantic results
			const response = this.generateStructuredResponse(semanticResults, query, patientData);

			return {
				...response,
				method: 'real-semantic-clinical-rag',
				embeddingType: 'transformers-js',
				searchResults: semanticResults.map(r => ({
					title: r.document.title,
					realSimilarity: r.similarity, // This is now REAL cosine similarity
					boostedScore: r.boostedScore,
					domain: r.document.domain,
					relevantKeywords: r.relevantKeywords
				})),
				confidence: this.calculateSemanticConfidence(semanticResults)
			};

		} catch (error) {
			console.error('🚨 Real semantic RAG error:', error);
			return this.generateFallbackResponse(query, patientData, error);
		}
	}

	generateStructuredResponse(semanticResults, query, patientData) {
		const primaryResult = semanticResults[0];
		const doc = primaryResult.document;

		// Use REAL similarity scores for better response type detection
		const responseType = this.detectResponseType(doc, query, primaryResult.similarity);
		const template = this.responseTemplates[responseType] || this.responseTemplates.general_clinical;

		const sections = this.extractSemanticSections(doc, query, patientData);

		let response = template.header;

		// Add confidence indicator based on REAL similarity
		if (primaryResult.similarity > 0.8) {
			response += "*High confidence match*\n\n";
		} else if (primaryResult.similarity > 0.6) {
			response += "*Good semantic match*\n\n";
		}

		for (const [sectionKey, sectionTemplate] of Object.entries(template.sections)) {
			if (sections[sectionKey]) {
				response += sectionTemplate.replace(`{${sectionKey}}`, sections[sectionKey]);
			}
		}

		// Add supporting information from other high-similarity results
		if (semanticResults.length > 1) {
			response += "\n**Additional Clinical Context:**\n";
			semanticResults.slice(1, 3).forEach((result, idx) => {
				if (result.similarity > 0.5) { // Only include high-quality matches
					const snippet = this.extractKeySnippet(result.document, query);
					response += `${idx + 1}. ${snippet} (similarity: ${result.similarity.toFixed(3)})\n`;
				}
			});
		}

		return {
			text: response.trim(),
			primarySource: {
				title: doc.title,
				domain: doc.domain,
				realSimilarity: primaryResult.similarity,
				embeddingBased: true
			},
			additionalSources: semanticResults.slice(1).map(r => ({
				title: r.document.title,
				realSimilarity: r.similarity,
				embeddingBased: true
			}))
		};
	}

	detectResponseType(doc, query, similarity) {
		const content = doc.content.toLowerCase();
		const queryLower = query.toLowerCase();

		// Use REAL similarity thresholds for better detection
		if (similarity > 0.85) { // Very high similarity
			if (content.includes('emergency') || content.includes('urgent') || queryLower.includes('emergency')) {
				return 'emergency_clinical';
			}
			if (content.includes('maternal') || content.includes('pregnancy')) {
				return 'maternal_health';
			}
			if (content.includes('who guideline') || content.includes('who standard')) {
				return 'who_guideline';
			}
		}

		if (similarity > 0.7) {
			return 'general_clinical';
		}

		if (similarity > 0.5) {
			return 'basic_guidance';
		}

		return 'low_confidence';
	}

	calculateSemanticConfidence(results) {
		if (results.length === 0) return 'very-low';

		const topSimilarity = results[0].similarity;
		const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length;

		// Use REAL similarity thresholds
		if (topSimilarity > 0.85 && avgSimilarity > 0.7) return 'very-high';
		if (topSimilarity > 0.75 && avgSimilarity > 0.6) return 'high';
		if (topSimilarity > 0.6 && avgSimilarity > 0.4) return 'medium';
		if (topSimilarity > 0.4) return 'low';
		return 'very-low';
	}

	// FIXED: Content extraction methods that handle both strings and objects
	extractSemanticSections(doc, query, patientData) {
		// FIXED: Handle both object and string content
		let content = '';

		if (typeof doc.fullContent === 'string') {
			content = doc.fullContent;
		} else if (typeof doc.fullContent === 'object' && doc.fullContent !== null) {
			// Extract text from object structure
			content = this.extractTextFromObject(doc.fullContent);
		} else if (typeof doc.content === 'string') {
			content = doc.content;
		} else {
			content = doc.title || 'No content available';
		}

		const sections = {};
		const queryIntent = this.getQueryIntent(query);

		if (queryIntent.needsAssessment) {
			sections.assessment = this.extractAssessmentGuidance(content, patientData);
		}

		if (queryIntent.needsManagement) {
			sections.management = this.extractManagementGuidance(content, patientData);
		}

		if (queryIntent.needsFollowup) {
			sections.followup = this.extractFollowupGuidance(content);
		}

		if (queryIntent.needsReferral) {
			sections.referral = this.extractReferralGuidance(content);
		}

		return sections;
	}

	// FIXED: Helper method to extract text from object structures
	extractTextFromObject(obj) {
		let text = '';

		if (typeof obj === 'string') {
			return obj;
		}

		if (Array.isArray(obj)) {
			return obj.map(item => this.extractTextFromObject(item)).join(' ');
		}

		if (typeof obj === 'object' && obj !== null) {
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'string') {
					text += value + ' ';
				} else if (Array.isArray(value)) {
					text += value.join(' ') + ' ';
				} else if (typeof value === 'object' && value !== null) {
					text += this.extractTextFromObject(value) + ' ';
				}
			}
		}

		return text.trim();
	}

	getQueryIntent(query) {
		const queryLower = query.toLowerCase();

		return {
			needsAssessment: queryLower.includes('assess') || queryLower.includes('diagnose') || queryLower.includes('evaluate'),
			needsManagement: queryLower.includes('treat') || queryLower.includes('manage') || queryLower.includes('therapy'),
			needsFollowup: queryLower.includes('follow') || queryLower.includes('monitor') || queryLower.includes('next'),
			needsReferral: queryLower.includes('refer') || queryLower.includes('specialist') || queryLower.includes('hospital')
		};
	}

	// FIXED: Assessment guidance extraction with proper string handling
	extractAssessmentGuidance(content, patientData) {
		// Ensure content is a string
		const contentStr = typeof content === 'string' ? content : this.extractTextFromObject(content);

		if (!contentStr) {
			return 'Conduct comprehensive clinical assessment based on presenting complaint.';
		}

		const lines = contentStr.split('\n');
		const assessmentLines = lines.filter(line =>
			line.toLowerCase().includes('assess') ||
			line.toLowerCase().includes('examination') ||
			line.toLowerCase().includes('symptom') ||
			line.toLowerCase().includes('sign') ||
			line.toLowerCase().includes('history') ||
			line.toLowerCase().includes('vital')
		);

		if (assessmentLines.length > 0) {
			return assessmentLines.slice(0, 4).join('\n');
		}

		// Fallback for headache-specific assessment
		if (contentStr.toLowerCase().includes('headache')) {
			return `Clinical Assessment:
• Detailed headache history: onset, character, location, severity
• Associated symptoms: nausea, vomiting, visual changes, fever
• Neurological examination including fundoscopy if available
• Vital signs with particular attention to blood pressure
• Check for red flag symptoms requiring urgent referral`;
		}

		return 'Conduct systematic clinical assessment including history, examination, and vital signs.';
	}

	// FIXED: Management guidance extraction
	extractManagementGuidance(content, patientData) {
		const contentStr = typeof content === 'string' ? content : this.extractTextFromObject(content);

		if (!contentStr) {
			return 'Follow standard clinical management protocols for the presenting condition.';
		}

		const lines = contentStr.split('\n');
		const managementLines = lines.filter(line =>
			line.toLowerCase().includes('treatment') ||
			line.toLowerCase().includes('manage') ||
			line.toLowerCase().includes('medication') ||
			line.toLowerCase().includes('therapy') ||
			line.toLowerCase().includes('paracetamol') ||
			line.toLowerCase().includes('ibuprofen')
		);

		if (managementLines.length > 0) {
			return managementLines.slice(0, 4).join('\n');
		}

		// Fallback for headache-specific management
		if (contentStr.toLowerCase().includes('headache')) {
			return `Management Approach:
• First-line: Paracetamol 500-1000mg every 6 hours (max 4g/24h)
• Alternative: Ibuprofen 400mg every 8 hours with food
• Rest in quiet, darkened environment
• Adequate hydration and regular meals
• Address underlying causes (hypertension, sinusitis)`;
		}

		return 'Implement appropriate management based on clinical assessment findings and established protocols.';
	}

	// FIXED: Follow-up guidance extraction
	extractFollowupGuidance(content) {
		const contentStr = typeof content === 'string' ? content : this.extractTextFromObject(content);

		if (!contentStr) {
			return 'Schedule appropriate follow-up based on clinical response and patient needs.';
		}

		const lines = contentStr.split('\n');
		const followupLines = lines.filter(line =>
			line.toLowerCase().includes('follow') ||
			line.toLowerCase().includes('monitor') ||
			line.toLowerCase().includes('review') ||
			line.toLowerCase().includes('return')
		);

		if (followupLines.length > 0) {
			return followupLines.slice(0, 3).join('\n');
		}

		return 'Review patient in 48-72 hours if symptoms persist or worsen. Advise patient to return immediately if red flag symptoms develop.';
	}

	// FIXED: Referral guidance extraction
	extractReferralGuidance(content) {
		const contentStr = typeof content === 'string' ? content : this.extractTextFromObject(content);

		if (!contentStr) {
			return 'Consider referral to appropriate specialist if symptoms persist or concerning features develop.';
		}

		const lines = contentStr.split('\n');
		const referralLines = lines.filter(line =>
			line.toLowerCase().includes('refer') ||
			line.toLowerCase().includes('specialist') ||
			line.toLowerCase().includes('hospital') ||
			line.toLowerCase().includes('urgent') ||
			line.toLowerCase().includes('emergency')
		);

		if (referralLines.length > 0) {
			return referralLines.slice(0, 3).join('\n');
		}

		// Fallback for headache-specific referral criteria
		if (contentStr.toLowerCase().includes('headache')) {
			return `Referral Criteria:
• URGENT: Sudden severe headache, fever with neck stiffness, neurological signs
• ROUTINE: Recurrent headaches not responding to simple analgesics
• Consider neurology referral for chronic daily headache or suspected migraine`;
		}

		return 'Refer if symptoms are severe, persistent, or concerning features are present.';
	}

	extractKeySnippet(doc, query) {
		const content = doc.content;
		const sentences = content.split(/[.!?]+/);

		const queryTerms = query.toLowerCase().split(/\s+/);
		let bestSentence = sentences[0];
		let maxRelevance = 0;

		for (const sentence of sentences) {
			const sentenceLower = sentence.toLowerCase();
			const relevance = queryTerms.reduce((count, term) =>
				count + (sentenceLower.includes(term) ? 1 : 0), 0
			);

			if (relevance > maxRelevance) {
				maxRelevance = relevance;
				bestSentence = sentence;
			}
		}

		return bestSentence.trim().substring(0, 150) + '...';
	}

	initializeResponseTemplates() {
		return {
			who_guideline: {
				header: "**WHO CLINICAL GUIDELINE**\n\n",
				sections: {
					assessment: "**CLINICAL ASSESSMENT:**\n{assessment}\n\n",
					management: "**MANAGEMENT:**\n{management}\n\n",
					followup: "**FOLLOW-UP:**\n{followup}\n\n",
					referral: "**REFERRAL CRITERIA:**\n{referral}\n\n"
				}
			},
			emergency_clinical: {
				header: "**🚨 EMERGENCY CLINICAL GUIDANCE**\n\n",
				sections: {
					assessment: "**IMMEDIATE ASSESSMENT:**\n{assessment}\n\n",
					management: "**URGENT MANAGEMENT:**\n{management}\n\n",
					referral: "**IMMEDIATE REFERRAL:**\n{referral}\n\n"
				}
			},
			maternal_health: {
				header: "**MATERNAL HEALTH GUIDANCE**\n\n",
				sections: {
					assessment: "**MATERNAL ASSESSMENT:**\n{assessment}\n\n",
					management: "**CARE MANAGEMENT:**\n{management}\n\n",
					followup: "**ANTENATAL/POSTNATAL FOLLOW-UP:**\n{followup}\n\n"
				}
			},
			general_clinical: {
				header: "**CLINICAL GUIDANCE**\n\n",
				sections: {
					assessment: "**ASSESSMENT:**\n{assessment}\n\n",
					management: "**MANAGEMENT:**\n{management}\n\n",
					followup: "**FOLLOW-UP:**\n{followup}\n\n"
				}
			},
			basic_guidance: {
				header: "**BASIC CLINICAL GUIDANCE**\n\n",
				sections: {
					assessment: "**CONSIDER:**\n{assessment}\n\n",
					management: "**GENERAL APPROACH:**\n{management}\n\n"
				}
			},
			low_confidence: {
				header: "**CLINICAL GUIDANCE** *(Lower Confidence)*\n\n",
				sections: {
					assessment: "**GENERAL CONSIDERATIONS:**\n{assessment}\n\n",
					management: "**SUGGESTED APPROACH:**\n{management}\n\n"
				}
			}
		};
	}

	async generateFallbackResponse(query, patientData, error = null) {
		try {
			const { getPracticalLocalRecommendations } = await import('./practicalLocalAI');
			const ruleBasedResponse = await getPracticalLocalRecommendations(query, patientData);

			return {
				...ruleBasedResponse,
				method: 'real-semantic-rag-fallback-to-rules',
				fallbackReason: error?.message || 'Real semantic RAG retrieval failed',
				confidence: 'medium'
			};

		} catch (fallbackError) {
			console.error('❌ Both real semantic RAG and rule-based failed:', fallbackError);

			return {
				text: `**Clinical Decision Support Unavailable**\n\nBoth real semantic RAG and rule-based systems encountered errors. Please consult local clinical guidelines or specialist.\n\n**Query**: ${query}\n**Error**: ${error?.message || 'System unavailable'}`,
				method: 'emergency-fallback',
				confidence: 'very-low',
				error: true
			};
		}
	}

	// ADDED: Status method for system monitoring
	getStatus() {
		return {
			initialized: this.isInitialized,
			available: this.isInitialized,
			embeddingBased: true,
			embeddingModel: 'Xenova/all-MiniLM-L6-v2',
			documentCount: this.semanticRAG?.documents?.length || 0,
			guidelineCount: this.semanticRAG?.documents?.length || 0,
			responseTemplates: Object.keys(this.responseTemplates).length,
			semanticRAGInitialized: this.semanticRAG?.isInitialized || false,
			type: 'real-semantic-clinical-rag',
			dependencies: ['transformers-js', 'lightweight-rag'],
			version: 'v2-real-embeddings'
		};
	}
}

// Export functions for compatibility
export async function initializeClinicalRAG() {
	const system = new ClinicalRAGSystem();
	const result = await system.initialize();

	return {
		success: result.success,
		message: result.message,
		system: result.success ? system : null
	};
}

export async function getClinicalRAGRecommendations(query, patientData = {}, options = {}) {
	const system = new ClinicalRAGSystem();

	if (!system.isInitialized) {
		await system.initialize();
	}

	return system.getClinicalRecommendations(query, patientData, options);
}