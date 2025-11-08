// src/lib/rag/lightweightRAG.js - FIXED VERSION with proper AI integration
/**
 * Lightweight RAG system using only basic dependencies
 * Designed specifically for ATLAS offline clinical decision support
 */

import { openDB } from 'idb';

// Simple text similarity calculation using cosine similarity
class SimpleTextEmbedder {
	constructor() {
		// Common medical/clinical terms for weighting
		this.clinicalTerms = new Set([
			'fever', 'cough', 'diarrhea', 'vomiting', 'headache', 'pneumonia',
			'malaria', 'pregnancy', 'child', 'adult', 'emergency', 'danger',
			'treatment', 'management', 'assessment', 'diagnosis', 'medication',
			'referral', 'urgent', 'severe', 'mild', 'symptoms', 'signs'
		]);
	}

	// Create simple term frequency vector
	createVector(text) {
		const words = text.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.split(/\s+/)
			.filter(word => word.length > 2);

		const termFreq = {};
		const totalWords = words.length;

		// Count word frequencies
		for (const word of words) {
			termFreq[word] = (termFreq[word] || 0) + 1;
		}

		// Apply clinical term boosting
		for (const word of words) {
			if (this.clinicalTerms.has(word)) {
				termFreq[word] *= 2; // Boost clinical terms
			}
		}

		// Normalize by document length
		for (const word in termFreq) {
			termFreq[word] = termFreq[word] / totalWords;
		}

		return termFreq;
	}

	// Calculate cosine similarity between two vectors
	calculateSimilarity(vector1, vector2) {
		const allTerms = new Set([...Object.keys(vector1), ...Object.keys(vector2)]);

		let dotProduct = 0;
		let norm1 = 0;
		let norm2 = 0;

		for (const term of allTerms) {
			const v1 = vector1[term] || 0;
			const v2 = vector2[term] || 0;

			dotProduct += v1 * v2;
			norm1 += v1 * v1;
			norm2 += v2 * v2;
		}

		if (norm1 === 0 || norm2 === 0) return 0;

		return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
	}
}

export class LightweightRAG {
	constructor() {
		this.initialized = false;
		this.db = null;
		this.embedder = new SimpleTextEmbedder();
		this.documents = [];
		this.queryCache = new Map();

		// Configuration
		this.config = {
			maxCacheSize: 50,
			minSimilarityScore: 0.1,
			maxResults: 5
		};

		this.stats = {
			documentsLoaded: 0,
			queriesProcessed: 0,
			cacheHits: 0,
			averageResponseTime: 0
		};
	}

	// Initialize the RAG system
	async initialize() {
		if (this.initialized) return;

		console.log('🚀 Initializing Lightweight RAG System...');

		try {
			// Initialize IndexedDB
			this.db = await openDB('atlas-lightweight-rag', 1, {
				upgrade(db) {
					if (!db.objectStoreNames.contains('guidelines')) {
						const store = db.createObjectStore('guidelines', { keyPath: 'id' });
						store.createIndex('category', 'category');
						store.createIndex('priority', 'priority');
					}

					if (!db.objectStoreNames.contains('cache')) {
						const cacheStore = db.createObjectStore('cache', { keyPath: 'queryHash' });
						cacheStore.createIndex('timestamp', 'timestamp');
					}
				}
			});

			// Load critical clinical guidelines
			await this.loadCriticalGuidelines();

			this.initialized = true;
			console.log(`✅ Lightweight RAG initialized with ${this.stats.documentsLoaded} documents`);

		} catch (error) {
			console.error('❌ RAG initialization failed:', error);
			throw error;
		}
	}

	// Load essential clinical guidelines
	async loadCriticalGuidelines() {
		const criticalGuidelines = [
			{
				id: 'danger-signs',
				title: 'Emergency Danger Signs',
				category: 'emergency',
				priority: 'critical',
				keywords: ['danger', 'emergency', 'urgent', 'unconscious', 'convulsions', 'bleeding'],
				content: `IMMEDIATE DANGER SIGNS - REFER URGENTLY:

**CHILDREN (2-59 months):**
• Unable to drink or breastfeed
• Vomits everything eaten
• Has had convulsions
• Is lethargic or unconscious
• Fast breathing: >50/min (2-11m), >40/min (12-59m)
• Chest indrawing
• Signs of severe dehydration

**NEWBORNS (0-2 months):**
• Not feeding well
• Convulsions or abnormal movements
• Fast breathing >60/min
• Chest indrawing
• Temperature >37.5°C or <35.5°C
• Yellow palms/soles after day 3

**ADULTS:**
• Unconscious or altered mental state
• Severe difficulty breathing
• Shock (weak pulse, cold extremities)
• Severe bleeding that won't stop
• Severe chest pain
• Temperature >39°C with severe illness

**PREGNANCY:**
• Any vaginal bleeding
• Severe headache with visual changes
• Convulsions (eclampsia)
• High fever >38°C
• Severe abdominal pain
• Leaking fluid from vagina
• No fetal movements (after 20 weeks)

**ACTION**: If ANY danger sign present → REFER IMMEDIATELY`
			},
			{
				id: 'fever-management',
				title: 'Fever Management Protocol',
				category: 'symptoms',
				priority: 'high',
				keywords: ['fever', 'temperature', 'malaria', 'child', 'adult'],
				content: `FEVER MANAGEMENT:

**IMMEDIATE ASSESSMENT:**
• Measure temperature accurately
• Look for source of infection
• Check for danger signs
• Assess hydration status

**GENERAL MANAGEMENT:**
• Remove excess clothing
• Give fluids frequently
• Paracetamol if temp >38.5°C:
  - Adult: 500mg-1g every 6 hours
  - Child: 10-15mg/kg every 6 hours
• Tepid sponging if very high fever

**MALARIA ASSESSMENT (Endemic Areas):**
• Test with RDT if available
• Treat with ACT if positive
• If no RDT and high malaria risk: treat presumptively
• Artemether-lumefantrine dosing:
  - Adult: 4 tablets twice daily × 3 days
  - Child: Weight-based dosing

**RED FLAGS - REFER URGENTLY:**
• Temperature >40°C (104°F)
• Febrile convulsions
• Stiff neck (meningitis signs)
• Severe headache with vomiting
• Rash that doesn't fade when pressed
• Signs of severe dehydration
• Looks very unwell despite treatment

**FOLLOW-UP:**
• Review in 24 hours if fever persists
• Return immediately if worsening`
			},
			{
				id: 'diarrhea-dehydration',
				title: 'Diarrhea and Dehydration',
				category: 'symptoms',
				priority: 'high',
				keywords: ['diarrhea', 'dehydration', 'ORS', 'fluid', 'child'],
				content: `DIARRHEA MANAGEMENT:

**ASSESS DEHYDRATION:**
• No dehydration: Alert, normal thirst, tears present, moist mouth
• Some dehydration: Restless/irritable, thirsty, few tears, dry mouth
• Severe dehydration: Lethargic, drinks poorly, no tears, very dry

**TREATMENT PLANS:**

**Plan A (No dehydration):**
• Continue normal feeding/breastfeeding
• Give extra fluids (ORS preferred)
• Give zinc: <6m: 10mg daily, ≥6m: 20mg daily × 10-14 days
• Teach when to return

**Plan B (Some dehydration):**
• Give ORS 75ml/kg over 4 hours
• Continue breastfeeding
• Give zinc as above
• Reassess after 4 hours

**Plan C (Severe dehydration):**
• REFER URGENTLY for IV fluids
• If referral delayed: ORS by NG tube
• Monitor closely

**ORS PREPARATION:**
• 1 sachet in 1 liter clean water
• Give frequently in small amounts
• Discard after 24 hours

**DANGER SIGNS:**
• Blood in stool with fever
• Persistent vomiting (can't keep fluids down)
• High fever >39°C
• Severe dehydration signs`
			},
			{
				id: 'pregnancy-care',
				title: 'Pregnancy and Maternal Care',
				category: 'maternal',
				priority: 'critical',
				keywords: ['pregnancy', 'pregnant', 'antenatal', 'maternal', 'delivery'],
				content: `PREGNANCY CARE:

**ROUTINE ANTENATAL CARE:**
• Iron/folic acid: 60mg iron + 400mcg folic acid daily
• Tetanus toxoid: 2 doses minimum
• Blood pressure monitoring every visit
• Urine testing for protein (after 20 weeks)
• Fetal movement monitoring (after 20 weeks)

**DANGER SIGNS - IMMEDIATE REFERRAL:**
• Vaginal bleeding (any amount)
• Severe headache with visual changes
• Convulsions
• High fever >38°C
• Severe abdominal pain
• Leaking fluid from vagina
• Absent fetal movements
• Swelling of face/hands with headache

**PREECLAMPSIA ASSESSMENT:**
• Blood pressure ≥140/90 mmHg
• Protein in urine
• Severe headache
• Visual disturbances
• Upper abdominal pain
• Sudden swelling

**BIRTH PREPAREDNESS:**
• Identify skilled birth attendant
• Save money for delivery expenses
• Arrange transportation to facility
• Identify potential blood donor
• Prepare clean delivery supplies

**POSTPARTUM DANGER SIGNS:**
• Heavy bleeding (soaking pad in <1 hour)
• Severe headache
• High fever
• Fits/convulsions
• Difficulty breathing`
			},
			{
				id: 'medications-basic',
				title: 'Essential Medications',
				category: 'pharmacology',
				priority: 'high',
				keywords: ['medication', 'drug', 'dosage', 'treatment'],
				content: `ESSENTIAL MEDICATIONS:

**PARACETAMOL (Acetaminophen):**
• Adult: 500mg-1g every 6 hours (max 4g/day)
• Child: 10-15mg/kg every 6-8 hours
• Safe in pregnancy and breastfeeding
• Can take with or without food

**AMOXICILLIN:**
• Adult: 500mg every 8 hours × 5-7 days
• Child: 40-90mg/kg/day in 2-3 divided doses
• Take with food to reduce stomach upset
• Complete full course even if feeling better
• Avoid if penicillin allergy

**ORS (Oral Rehydration Salts):**
• Mix 1 sachet in 1L clean water
• Give frequently in small amounts
• Continue until diarrhea stops
• Discard unused solution after 24 hours

**COTRIMOXAZOLE:**
• Adult: 960mg (2 tablets) twice daily
• Child: 24mg/kg twice daily
• Used for pneumonia, UTI
• Take with plenty of water

**ARTEMETHER-LUMEFANTRINE (Malaria):**
• Adult: 4 tablets twice daily × 3 days
• Take with fatty food for better absorption
• Complete full course even if feeling better

**IRON/FOLIC ACID:**
• Pregnancy: 60mg iron + 400mcg folic acid daily
• Take with vitamin C to improve absorption
• Avoid tea/coffee within 2 hours`
			}
		];

		for (const guideline of criticalGuidelines) {
			await this.addDocument(guideline);
		}
	}

	// Add document to the system
	async addDocument(doc) {
		try {
			// Create text vector
			const vector = this.embedder.createVector(doc.content);

			const document = {
				...doc,
				vector,
				chunks: this.chunkText(doc.content),
				lastUpdated: new Date().toISOString()
			};

			// Store in IndexedDB
			await this.db.put('guidelines', document);

			// Add to memory for fast access
			this.documents.push(document);

			this.stats.documentsLoaded++;

		} catch (error) {
			console.error(`Error adding document ${doc.id}:`, error);
		}
	}

	// Chunk text for better retrieval
	chunkText(text, maxSize = 300) {
		const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
		const chunks = [];
		let currentChunk = '';

		for (const sentence of sentences) {
			if ((currentChunk + sentence).length > maxSize && currentChunk.length > 0) {
				chunks.push(currentChunk.trim());
				currentChunk = sentence.trim();
			} else {
				currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
			}
		}

		if (currentChunk.length > 0) {
			chunks.push(currentChunk);
		}

		return chunks;
	}

	// Search for relevant documents
	async search(query, options = {}) {
		const startTime = performance.now();

		try {
			const {
				maxResults = this.config.maxResults,
				minScore = this.config.minSimilarityScore,
				category = null,
				priority = null
			} = options;

			// Check cache first
			const cacheKey = this.hashQuery(query, options);
			if (this.queryCache.has(cacheKey)) {
				this.stats.cacheHits++;
				return {
					...this.queryCache.get(cacheKey),
					fromCache: true,
					responseTime: performance.now() - startTime
				};
			}

			// Create query vector
			const queryVector = this.embedder.createVector(query);

			// Search documents
			const results = [];

			for (const doc of this.documents) {
				// Filter by category/priority if specified
				if (category && doc.category !== category) continue;
				if (priority && doc.priority !== priority) continue;

				// Calculate similarity
				const similarity = this.embedder.calculateSimilarity(queryVector, doc.vector);

				if (similarity >= minScore) {
					results.push({
						document: doc,
						score: similarity,
						relevantChunks: this.findRelevantChunks(query, doc.chunks)
					});
				}
			}

			// Sort by relevance and priority
			results.sort((a, b) => {
				// First by priority (critical > high > medium > low)
				const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
				const priorityDiff = (priorityOrder[b.document.priority] || 1) - (priorityOrder[a.document.priority] || 1);
				if (priorityDiff !== 0) return priorityDiff;

				// Then by similarity score
				return b.score - a.score;
			});

			const searchResult = {
				query,
				results: results.slice(0, maxResults),
				totalFound: results.length,
				responseTime: performance.now() - startTime,
				fromCache: false
			};

			// Cache result
			this.cacheResult(cacheKey, searchResult);

			this.stats.queriesProcessed++;
			this.stats.averageResponseTime =
				(this.stats.averageResponseTime + searchResult.responseTime) / 2;

			return searchResult;

		} catch (error) {
			console.error('Search error:', error);
			return {
				query,
				results: [],
				error: error.message,
				responseTime: performance.now() - startTime
			};
		}
	}

	// Find most relevant chunks from document
	findRelevantChunks(query, chunks) {
		const queryTerms = query.toLowerCase().split(/\s+/);
		const scoredChunks = chunks.map(chunk => {
			const chunkLower = chunk.toLowerCase();
			let score = 0;

			// Count query term matches
			for (const term of queryTerms) {
				if (chunkLower.includes(term)) {
					score += 1;
					// Boost for clinical terms
					if (this.embedder.clinicalTerms.has(term)) {
						score += 1;
					}
				}
			}

			return { chunk, score };
		});

		return scoredChunks
			.filter(item => item.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, 3)
			.map(item => item.chunk);
	}

	// Generate clinical recommendations
	async getClinicalRecommendations(query, patientContext = {}) {
		const startTime = performance.now();

		try {
			// Enhance query with patient context
			const enhancedQuery = this.enhanceQuery(query, patientContext);

			// Search for relevant guidelines
			const searchResult = await this.search(enhancedQuery, {
				maxResults: 3
			});

			if (searchResult.results.length === 0) {
				return this.getEmergencyFallback(query, patientContext);
			}

			// Generate structured response
			const response = this.generateClinicalResponse(
				query,
				patientContext,
				searchResult.results
			);

			return {
				...response,
				searchStats: {
					documentsFound: searchResult.totalFound,
					searchTime: searchResult.responseTime
				},
				totalResponseTime: performance.now() - startTime,
				method: 'lightweight-rag'
			};

		} catch (error) {
			console.error('Clinical recommendations error:', error);
			return this.getEmergencyFallback(query, patientContext, error);
		}
	}

	// Enhance query with patient context
	enhanceQuery(query, patientContext) {
		let enhanced = query;

		// Add age context
		if (patientContext.age !== undefined) {
			if (patientContext.age < 0.08) enhanced += ' newborn infant';
			else if (patientContext.age < 5) enhanced += ' child pediatric';
			else if (patientContext.age > 65) enhanced += ' elderly';
		}

		// Add pregnancy context
		if (patientContext.pregnancy) {
			enhanced += ' pregnancy pregnant maternal';
		}

		// Add gender context for specific conditions
		if (patientContext.gender === 'female' && patientContext.age > 15) {
			enhanced += ' women reproductive';
		}

		return enhanced;
	}

	// Generate structured clinical response
	generateClinicalResponse(query, patientContext, searchResults) {
		const primaryResult = searchResults[0];
		let confidence = 'medium';

		// Determine confidence
		if (primaryResult.score > 0.7 && primaryResult.document.priority === 'critical') {
			confidence = 'high';
		} else if (primaryResult.score < 0.3) {
			confidence = 'low';
		}

		// Build response from most relevant content
		let responseText = `**CLINICAL GUIDANCE** (${primaryResult.document.title}):\n\n`;

		// Add most relevant chunks
		if (primaryResult.relevantChunks.length > 0) {
			responseText += primaryResult.relevantChunks.slice(0, 2).join('\n\n');
		} else {
			// Fallback to first chunk
			responseText += primaryResult.document.chunks[0];
		}

		// Add supporting information
		if (searchResults.length > 1) {
			responseText += '\n\n**ADDITIONAL CONSIDERATIONS**:\n';
			for (let i = 1; i < Math.min(3, searchResults.length); i++) {
				const result = searchResults[i];
				if (result.score > 0.2 && result.relevantChunks.length > 0) {
					responseText += `\n• ${result.relevantChunks[0].substring(0, 200)}...`;
				}
			}
		}

		// Add offline notice
		responseText += '\n\n**📱 OFFLINE GUIDANCE**: Based on WHO clinical protocols. ';
		responseText += 'Professional judgment required for implementation.';

		return {
			text: responseText,
			confidence,
			sources: searchResults.map(r => r.document.title),
			primarySource: primaryResult.document,
			matchScore: primaryResult.score
		};
	}

	// Emergency fallback response
	getEmergencyFallback(query, patientContext, error = null) {
		return {
			text: `**EMERGENCY CLINICAL PROTOCOL**:

1. **IMMEDIATE ASSESSMENT**:
   • Check vital signs (pulse, BP, temperature, respirations)
   • Assess consciousness level (AVPU scale)
   • Look for obvious danger signs

2. **DANGER SIGNS - REFER URGENTLY**:
   • Unconscious or confused
   • Severe difficulty breathing
   • Severe bleeding
   • Convulsions/fits
   • High fever with severe illness

3. **BASIC MANAGEMENT**:
   • Maintain airway if unconscious
   • Give oxygen if available and needed
   • Control bleeding with direct pressure
   • Start IV fluids if shocked
   • Give paracetamol for fever >38.5°C

4. **WHEN IN DOUBT**: Always refer to higher level of care

**NOTE**: Specific clinical guidelines temporarily unavailable. Use basic protocols and clinical judgment.`,
			confidence: 'low',
			method: 'emergency-fallback',
			sources: ['Basic Emergency Protocols'],
			error: error?.message
		};
	}

	// Cache management
	cacheResult(key, result) {
		if (this.queryCache.size >= this.config.maxCacheSize) {
			const firstKey = this.queryCache.keys().next().value;
			this.queryCache.delete(firstKey);
		}
		this.queryCache.set(key, result);
	}

	hashQuery(query, options) {
		const optionsStr = JSON.stringify(options);
		return btoa(query + optionsStr).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
	}

	// Get system statistics
	getStats() {
		return {
			...this.stats,
			initialized: this.initialized,
			cacheSize: this.queryCache.size,
			cacheHitRate: this.stats.cacheHits / Math.max(1, this.stats.queriesProcessed)
		};
	}
}

// Create singleton instance
export const lightweightRAG = new LightweightRAG();

// Main function for integration with existing ATLAS code
export async function getSmartClinicalRecommendations(query, patientData, options = {}) {
	if (!lightweightRAG.initialized) {
		await lightweightRAG.initialize();
	}

	return await lightweightRAG.getClinicalRecommendations(query, patientData);
}

// 🎯 FIXED: This function is now REMOVED - it was causing the duplication
// The consultation form now calls enhancedGeminiWithSMART directly from enhancedGemini.js