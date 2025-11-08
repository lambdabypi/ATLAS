// src/lib/ai/smartOfflineQueries.js - Intelligent offline query management
import { offlineQueryDb } from '../db';

// Configuration for query processing decisions
const QUERY_PROCESSING_CONFIG = {
	// How long a query remains "fresh" and worth processing
	QUERY_FRESHNESS_HOURS: 24,

	// Maximum number of similar queries to process
	MAX_SIMILAR_QUERIES: 3,

	// Query types that should always be processed
	ALWAYS_PROCESS: ['medication_interaction', 'allergy_check', 'critical_symptoms'],

	// Query types that should never be processed after completion
	NEVER_PROCESS_LATE: ['acute_consultation', 'emergency_assessment', 'real_time_symptoms']
};

/**
 * Smart offline query processor that decides whether queries are worth processing
 */
export class SmartOfflineQueryManager {
	constructor() {
		this.processed = new Set();
		this.similarityThreshold = 0.8; // How similar queries need to be to be considered duplicates
	}

	/**
	 * Process offline queries intelligently
	 * @param {Object} options Configuration options
	 */
	async processQueriesIntelligently(options = {}) {
		const {
			forceProcessAll = false,
			maxQueries = 10,
			prioritizeRecent = true
		} = options;

		try {
			console.log('🧠 Starting intelligent offline query processing...');

			// Get all pending offline queries
			const allQueries = await offlineQueryDb.getAll();

			if (allQueries.length === 0) {
				return { processed: 0, skipped: 0, reasons: [] };
			}

			// Analyze and filter queries
			const queryAnalysis = await this.analyzeQueries(allQueries);
			const worth_processing = queryAnalysis.filter(q => q.shouldProcess || forceProcessAll);
			const to_skip = queryAnalysis.filter(q => !q.shouldProcess && !forceProcessAll);

			console.log(`📊 Query Analysis: ${worth_processing.length} worth processing, ${to_skip.length} will be skipped`);

			// Process the worthwhile queries
			let processed = 0;
			let errors = 0;
			const results = [];

			for (const queryInfo of worth_processing.slice(0, maxQueries)) {
				try {
					console.log(`🔄 Processing: ${queryInfo.query.query.substring(0, 50)}...`);
					console.log(`   Reason: ${queryInfo.reason}`);

					const result = await this.processIndividualQuery(queryInfo.query);

					if (result.success) {
						// Remove from offline queue
						await offlineQueryDb.delete(queryInfo.query.id);
						processed++;
						results.push({ id: queryInfo.query.id, status: 'processed', reason: queryInfo.reason });
					} else {
						errors++;
						results.push({ id: queryInfo.query.id, status: 'failed', error: result.error });
					}
				} catch (error) {
					console.error(`❌ Error processing query ${queryInfo.query.id}:`, error);
					errors++;
				}
			}

			// Clean up old/stale queries that aren't worth processing
			for (const queryInfo of to_skip) {
				console.log(`🗑️ Removing stale query: ${queryInfo.reason}`);
				await offlineQueryDb.delete(queryInfo.query.id);
			}

			return {
				processed,
				errors,
				skipped: to_skip.length,
				total_analyzed: allQueries.length,
				reasons: queryAnalysis.map(q => ({
					id: q.query.id,
					shouldProcess: q.shouldProcess,
					reason: q.reason,
					age_hours: q.ageInHours
				})),
				results
			};

		} catch (error) {
			console.error('❌ Error in intelligent query processing:', error);
			return { processed: 0, errors: 1, error: error.message };
		}
	}

	/**
	 * Analyze queries to determine which ones are worth processing
	 */
	async analyzeQueries(queries) {
		const analysis = [];

		for (const query of queries) {
			const ageInHours = this.getQueryAgeInHours(query);
			const queryType = this.classifyQuery(query);
			const similarity = await this.findSimilarProcessedQueries(query);

			let shouldProcess = false;
			let reason = '';

			// Decision logic for whether to process this query
			if (QUERY_PROCESSING_CONFIG.ALWAYS_PROCESS.includes(queryType)) {
				shouldProcess = true;
				reason = `Always process ${queryType} queries`;
			}
			else if (QUERY_PROCESSING_CONFIG.NEVER_PROCESS_LATE.includes(queryType)) {
				shouldProcess = false;
				reason = `${queryType} queries not processed after completion`;
			}
			else if (ageInHours > QUERY_PROCESSING_CONFIG.QUERY_FRESHNESS_HOURS) {
				shouldProcess = false;
				reason = `Query too old (${ageInHours.toFixed(1)} hours)`;
			}
			else if (similarity.count >= QUERY_PROCESSING_CONFIG.MAX_SIMILAR_QUERIES) {
				shouldProcess = false;
				reason = `Too many similar queries already processed (${similarity.count})`;
			}
			else if (this.isQueryStillRelevant(query)) {
				shouldProcess = true;
				reason = `Fresh and relevant query (${ageInHours.toFixed(1)} hours old)`;
			}
			else {
				shouldProcess = false;
				reason = 'Query no longer relevant or contextually useful';
			}

			analysis.push({
				query,
				shouldProcess,
				reason,
				ageInHours,
				queryType,
				similarityCount: similarity.count
			});
		}

		return analysis;
	}

	/**
	 * Get the age of a query in hours
	 */
	getQueryAgeInHours(query) {
		const queryTime = new Date(query.timestamp || query.date || Date.now());
		const now = new Date();
		return (now - queryTime) / (1000 * 60 * 60);
	}

	/**
	 * Classify the type of query
	 */
	classifyQuery(query) {
		const queryText = (query.query || '').toLowerCase();
		const patientData = query.patientData || {};

		// Check for emergency/acute scenarios
		if (queryText.includes('emergency') || queryText.includes('urgent') ||
			queryText.includes('severe') || queryText.includes('acute')) {
			return 'emergency_assessment';
		}

		// Check for medication interactions
		if (queryText.includes('medication') || queryText.includes('drug') ||
			queryText.includes('interaction')) {
			return 'medication_interaction';
		}

		// Check for allergy concerns
		if (queryText.includes('allergy') || queryText.includes('allergic') ||
			queryText.includes('reaction')) {
			return 'allergy_check';
		}

		// Check for ongoing consultations
		if (queryText.includes('consultation') || queryText.includes('assessment') ||
			queryText.includes('presents with')) {
			return 'acute_consultation';
		}

		// Default classification
		return 'general_inquiry';
	}

	/**
	 * Check if query is still contextually relevant
	 */
	isQueryStillRelevant(query) {
		const queryText = (query.query || '').toLowerCase();

		// Very vague or incomplete queries are likely not worth processing
		const vagueIndicators = ['presents with:', 'head che', 'symptoms:', 'examination:'];
		const isVague = vagueIndicators.some(indicator => queryText.includes(indicator.toLowerCase()));

		if (isVague) {
			return false;
		}

		// Queries with substantial clinical content are worth processing
		const clinicalTerms = ['diagnosis', 'treatment', 'management', 'follow-up', 'monitoring'];
		const hasClinicalContent = clinicalTerms.some(term => queryText.includes(term));

		return hasClinicalContent || queryText.length > 100;
	}

	/**
	 * Find similar queries that were already processed
	 */
	async findSimilarProcessedQueries(query) {
		// Simple similarity check based on query text
		const queryText = (query.query || '').toLowerCase();
		const words = queryText.split(/\s+/).filter(word => word.length > 3);

		// This would be more sophisticated in a real implementation
		// For now, we'll track processed queries in memory
		let similarCount = 0;

		for (const processedQuery of this.processed) {
			const similarity = this.calculateTextSimilarity(queryText, processedQuery);
			if (similarity > this.similarityThreshold) {
				similarCount++;
			}
		}

		return { count: similarCount };
	}

	/**
	 * Simple text similarity calculation
	 */
	calculateTextSimilarity(text1, text2) {
		const words1 = new Set(text1.split(/\s+/));
		const words2 = new Set(text2.split(/\s+/));

		const intersection = new Set([...words1].filter(word => words2.has(word)));
		const union = new Set([...words1, ...words2]);

		return intersection.size / union.size;
	}

	/**
	 * Process an individual query
	 */
	async processIndividualQuery(query) {
		try {
			// Import AI function dynamically
			const { getClinicalRecommendations } = await import('./gemini');

			let result;
			if (query.type === 'clinical') {
				result = await getClinicalRecommendations(
					query.query,
					query.patientData,
					query.relevantMedicalData
				);
			} else if (query.type === 'symptoms') {
				const { processClinicalSymptoms } = await import('./gemini');
				result = await processClinicalSymptoms(query.symptoms, query.patientData);
			} else {
				throw new Error(`Unknown query type: ${query.type}`);
			}

			// Track that we processed this query
			this.processed.add((query.query || '').toLowerCase());

			return { success: !result.error, result };

		} catch (error) {
			console.error('Error processing individual query:', error);
			return { success: false, error: error.message };
		}
	}
}

// Enhanced processOfflineQueries function
export async function processOfflineQueriesIntelligently(options = {}) {
	const manager = new SmartOfflineQueryManager();
	return await manager.processQueriesIntelligently(options);
}

// Utility functions for different processing strategies
export const OfflineQueryStrategies = {
	// Only process recent, high-value queries
	conservative: () => processOfflineQueriesIntelligently({
		maxQueries: 5,
		prioritizeRecent: true
	}),

	// Process more queries but still filter intelligently
	balanced: () => processOfflineQueriesIntelligently({
		maxQueries: 15,
		prioritizeRecent: true
	}),

	// Process everything (original behavior)
	comprehensive: () => processOfflineQueriesIntelligently({
		forceProcessAll: true,
		maxQueries: 50
	}),

	// Only process critical/safety queries
	critical_only: () => processOfflineQueriesIntelligently({
		maxQueries: 10,
		prioritizeRecent: true
	})
};