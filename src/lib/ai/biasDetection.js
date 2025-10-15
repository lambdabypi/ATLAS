// src/lib/ai/biasDetection.js
import { syncQueueDb } from '../db';

// Bias categories to monitor
export const BIAS_CATEGORIES = {
	GENDER: 'gender',
	AGE: 'age',
	SOCIOECONOMIC: 'socioeconomic',
	GEOGRAPHIC: 'geographic',
	RACIAL_ETHNIC: 'racial_ethnic',
	LANGUAGE: 'language',
	DISABILITY: 'disability'
};

// Severity levels for bias detection
export const BIAS_SEVERITY = {
	NONE: 'none',
	LOW: 'low',
	MEDIUM: 'medium',
	HIGH: 'high',
	CRITICAL: 'critical'
};

export class BiasDetectionSystem {
	constructor() {
		this.biasPatterns = new Map();
		this.initializeBiasPatterns();
		this.detectionHistory = new Map();
	}

	// Initialize known bias patterns
	initializeBiasPatterns() {
		// Gender bias patterns
		this.biasPatterns.set(BIAS_CATEGORIES.GENDER, {
			keywords: {
				female: ['woman', 'female', 'she', 'her', 'lady', 'girl'],
				male: ['man', 'male', 'he', 'him', 'gentleman', 'boy'],
				assumptions: [
					'hysteria', 'overreacting', 'emotional', 'dramatic', // Female bias
					'tough it out', 'man up', 'strong', 'stoic' // Male bias
				]
			},
			problematicPatterns: [
				/women.*more likely.*anxiety/i,
				/men.*less likely.*seek help/i,
				/female.*hormonal/i,
				/male.*stronger.*pain tolerance/i
			]
		});

		// Age bias patterns  
		this.biasPatterns.set(BIAS_CATEGORIES.AGE, {
			keywords: {
				elderly: ['elderly', 'old', 'senior', 'aged', 'geriatric'],
				young: ['young', 'teenager', 'adolescent', 'child'],
				assumptions: [
					'senile', 'confused', 'frail', // Elderly bias
					'drug seeking', 'partying', 'reckless' // Young bias
				]
			},
			problematicPatterns: [
				/elderly.*confused.*dementia/i,
				/old.*probably.*normal aging/i,
				/young.*drug.*seeking/i,
				/teenager.*exaggerating/i
			]
		});

		// Socioeconomic bias patterns
		this.biasPatterns.set(BIAS_CATEGORIES.SOCIOECONOMIC, {
			keywords: {
				lowSES: ['poor', 'unemployed', 'homeless', 'uninsured', 'medicaid'],
				assumptions: [
					'non-compliant', 'drug seeking', 'unreliable', 'uneducated'
				]
			},
			problematicPatterns: [
				/poor.*non.?compliant/i,
				/homeless.*drug.*seeking/i,
				/uninsured.*less priority/i
			]
		});

		// Geographic/cultural bias patterns
		this.biasPatterns.set(BIAS_CATEGORIES.GEOGRAPHIC, {
			keywords: {
				rural: ['rural', 'village', 'remote', 'countryside'],
				urban: ['urban', 'city', 'metropolitan'],
				cultural: ['traditional', 'cultural beliefs', 'superstitious']
			},
			problematicPatterns: [
				/rural.*less educated/i,
				/traditional.*beliefs.*ignore/i,
				/cultural.*barriers.*non.?compliance/i
			]
		});
	}

	// Analyze AI response for potential bias
	async analyzeBias(aiResponse, patientData, query) {
		const biasReport = {
			timestamp: new Date().toISOString(),
			queryId: this.generateId(),
			overallSeverity: BIAS_SEVERITY.NONE,
			detectedBiases: [],
			patientDemographics: this.extractDemographics(patientData),
			responseLength: aiResponse.length
		};

		// Run bias detection for each category
		for (const [category, patterns] of this.biasPatterns) {
			const categoryBias = this.detectCategoryBias(aiResponse, category, patterns, patientData);

			if (categoryBias.severity !== BIAS_SEVERITY.NONE) {
				biasReport.detectedBiases.push(categoryBias);
			}
		}

		// Calculate overall severity
		biasReport.overallSeverity = this.calculateOverallSeverity(biasReport.detectedBiases);

		// Store bias report for analysis
		await this.storeBiasReport(biasReport);

		// Generate mitigation suggestions if bias detected
		if (biasReport.overallSeverity !== BIAS_SEVERITY.NONE) {
			biasReport.mitigationSuggestions = this.generateMitigationSuggestions(biasReport);
		}

		return biasReport;
	}

	// Detect bias for specific category
	detectCategoryBias(response, category, patterns, patientData) {
		const bias = {
			category,
			severity: BIAS_SEVERITY.NONE,
			confidence: 0,
			evidence: [],
			concerningPhrases: []
		};

		const responseText = response.toLowerCase();

		// Check for problematic patterns
		if (patterns.problematicPatterns) {
			for (const pattern of patterns.problematicPatterns) {
				const matches = response.match(pattern);
				if (matches) {
					bias.evidence.push({
						type: 'problematic_pattern',
						pattern: pattern.source,
						matches: matches
					});
					bias.concerningPhrases.push(...matches);
				}
			}
		}

		// Check for assumption keywords
		if (patterns.keywords?.assumptions) {
			for (const assumption of patterns.keywords.assumptions) {
				if (responseText.includes(assumption.toLowerCase())) {
					bias.evidence.push({
						type: 'biased_assumption',
						assumption,
						context: this.getContextAround(response, assumption)
					});
					bias.concerningPhrases.push(assumption);
				}
			}
		}

		// Calculate severity and confidence
		if (bias.evidence.length > 0) {
			bias.confidence = Math.min(bias.evidence.length * 0.3, 1.0);

			if (bias.evidence.length >= 3) {
				bias.severity = BIAS_SEVERITY.HIGH;
			} else if (bias.evidence.length >= 2) {
				bias.severity = BIAS_SEVERITY.MEDIUM;
			} else {
				bias.severity = BIAS_SEVERITY.LOW;
			}

			// Escalate severity if patient matches bias target
			if (this.patientMatchesBiasTarget(patientData, category, patterns)) {
				bias.severity = this.escalateSeverity(bias.severity);
				bias.targetedBias = true;
			}
		}

		return bias;
	}

	// Check if patient demographics match bias target
	patientMatchesBiasTarget(patientData, category, patterns) {
		if (!patientData) return false;

		const age = parseInt(patientData.age) || 0;
		const gender = patientData.gender?.toLowerCase() || '';

		switch (category) {
			case BIAS_CATEGORIES.GENDER:
				return gender === 'female' || gender === 'male';

			case BIAS_CATEGORIES.AGE:
				return age > 65 || age < 25;

			case BIAS_CATEGORIES.SOCIOECONOMIC:
				// Check for socioeconomic indicators in patient data
				const history = (patientData.medicalHistory || '').toLowerCase();
				return history.includes('unemployed') || history.includes('homeless') ||
					history.includes('uninsured');

			default:
				return false;
		}
	}

	// Calculate overall bias severity
	calculateOverallSeverity(detectedBiases) {
		if (detectedBiases.length === 0) return BIAS_SEVERITY.NONE;

		const severityScores = {
			[BIAS_SEVERITY.LOW]: 1,
			[BIAS_SEVERITY.MEDIUM]: 2,
			[BIAS_SEVERITY.HIGH]: 3,
			[BIAS_SEVERITY.CRITICAL]: 4
		};

		const maxScore = Math.max(...detectedBiases.map(b => severityScores[b.severity] || 0));
		const totalBiases = detectedBiases.length;

		// Critical if multiple high-severity biases or any critical bias
		if (maxScore >= 4 || (maxScore >= 3 && totalBiases >= 2)) {
			return BIAS_SEVERITY.CRITICAL;
		}

		if (maxScore >= 3) return BIAS_SEVERITY.HIGH;
		if (maxScore >= 2 || totalBiases >= 3) return BIAS_SEVERITY.MEDIUM;
		return BIAS_SEVERITY.LOW;
	}

	// Generate mitigation suggestions
	generateMitigationSuggestions(biasReport) {
		const suggestions = [];

		for (const bias of biasReport.detectedBiases) {
			switch (bias.category) {
				case BIAS_CATEGORIES.GENDER:
					suggestions.push({
						category: bias.category,
						suggestion: 'Review recommendations to ensure they are not influenced by gender stereotypes. Consider if the same advice would be given regardless of patient gender.',
						action: 'Revise language to be gender-neutral and evidence-based'
					});
					break;

				case BIAS_CATEGORIES.AGE:
					suggestions.push({
						category: bias.category,
						suggestion: 'Ensure recommendations are based on clinical evidence rather than age-based assumptions. Avoid age-related stereotypes.',
						action: 'Focus on individual patient presentation and functional status'
					});
					break;

				case BIAS_CATEGORIES.SOCIOECONOMIC:
					suggestions.push({
						category: bias.category,
						suggestion: 'Consider socioeconomic barriers to care without making assumptions about patient compliance or motivation.',
						action: 'Provide practical, resource-appropriate recommendations'
					});
					break;

				default:
					suggestions.push({
						category: bias.category,
						suggestion: 'Review response for potential bias and ensure recommendations are equitable.',
						action: 'Revise to eliminate biased assumptions'
					});
			}
		}

		return suggestions;
	}

	// Apply bias mitigation to AI response
	async mitigateBias(originalResponse, biasReport) {
		if (biasReport.overallSeverity === BIAS_SEVERITY.NONE) {
			return {
				mitigatedResponse: originalResponse,
				changesApplied: [],
				confidence: 1.0
			};
		}

		let mitigatedResponse = originalResponse;
		const changesApplied = [];

		// Apply specific mitigations based on detected biases
		for (const bias of biasReport.detectedBiases) {
			for (const phrase of bias.concerningPhrases) {
				const mitigation = this.getMitigationForPhrase(phrase, bias.category);
				if (mitigation) {
					mitigatedResponse = mitigatedResponse.replace(
						new RegExp(phrase, 'gi'),
						mitigation.replacement
					);
					changesApplied.push({
						original: phrase,
						replacement: mitigation.replacement,
						reason: mitigation.reason
					});
				}
			}
		}

		// Add disclaimer if significant bias was detected
		if (biasReport.overallSeverity === BIAS_SEVERITY.HIGH ||
			biasReport.overallSeverity === BIAS_SEVERITY.CRITICAL) {

			const disclaimer = `\n\n**Clinical Note:** This recommendation has been reviewed for potential bias. Please ensure clinical decisions are based on individual patient presentation and evidence-based guidelines, not demographic assumptions.`;

			mitigatedResponse += disclaimer;
			changesApplied.push({
				type: 'disclaimer_added',
				reason: `High bias severity detected (${biasReport.overallSeverity})`
			});
		}

		return {
			mitigatedResponse,
			changesApplied,
			confidence: this.calculateMitigationConfidence(changesApplied)
		};
	}

	// Get mitigation for specific biased phrase
	getMitigationForPhrase(phrase, category) {
		const mitigations = {
			[BIAS_CATEGORIES.GENDER]: {
				'hysteria': {
					replacement: 'anxiety symptoms',
					reason: 'Removed gendered historical term'
				},
				'overreacting': {
					replacement: 'experiencing significant distress',
					reason: 'Removed dismissive language'
				},
				'man up': {
					replacement: 'seek appropriate support',
					reason: 'Removed gendered expectation'
				}
			},
			[BIAS_CATEGORIES.AGE]: {
				'senile': {
					replacement: 'cognitive changes',
					reason: 'Removed ageist terminology'
				},
				'drug seeking': {
					replacement: 'reporting pain symptoms',
					reason: 'Removed judgmental assumption'
				}
			}
		};

		return mitigations[category]?.[phrase.toLowerCase()];
	}

	// Store bias report for analysis
	async storeBiasReport(biasReport) {
		try {
			await syncQueueDb.addToQueue('bias_reports', biasReport.queryId, 'add', biasReport);

			// Update detection history
			this.detectionHistory.set(biasReport.queryId, biasReport);

			// Limit history size
			if (this.detectionHistory.size > 1000) {
				const oldestKey = this.detectionHistory.keys().next().value;
				this.detectionHistory.delete(oldestKey);
			}
		} catch (error) {
			console.error('Error storing bias report:', error);
		}
	}

	// Generate bias analytics report
	async generateBiasAnalytics(timeframe = 30) { // Last 30 days
		const cutoffDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

		const analytics = {
			timeframe: `${timeframe} days`,
			totalQueries: 0,
			biasedQueries: 0,
			biasRate: 0,
			categoriesBreakdown: {},
			severityBreakdown: {},
			trends: [],
			recommendations: []
		};

		// Analyze detection history
		for (const [queryId, report] of this.detectionHistory) {
			const reportDate = new Date(report.timestamp);
			if (reportDate >= cutoffDate) {
				analytics.totalQueries++;

				if (report.overallSeverity !== BIAS_SEVERITY.NONE) {
					analytics.biasedQueries++;

					// Count by severity
					analytics.severityBreakdown[report.overallSeverity] =
						(analytics.severityBreakdown[report.overallSeverity] || 0) + 1;

					// Count by category
					for (const bias of report.detectedBiases) {
						analytics.categoriesBreakdown[bias.category] =
							(analytics.categoriesBreakdown[bias.category] || 0) + 1;
					}
				}
			}
		}

		analytics.biasRate = analytics.totalQueries > 0 ?
			(analytics.biasedQueries / analytics.totalQueries) * 100 : 0;

		// Generate recommendations based on findings
		analytics.recommendations = this.generateAnalyticsRecommendations(analytics);

		return analytics;
	}

	// Utility methods
	generateId() {
		return 'bias_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	extractDemographics(patientData) {
		if (!patientData) return {};

		return {
			age: patientData.age,
			gender: patientData.gender,
			hasHistoryIndicators: !!(patientData.medicalHistory),
			hasAllergyInfo: !!(patientData.allergies),
			hasMedicationInfo: !!(patientData.currentMedications)
		};
	}

	getContextAround(text, phrase, contextLength = 50) {
		const index = text.toLowerCase().indexOf(phrase.toLowerCase());
		if (index === -1) return '';

		const start = Math.max(0, index - contextLength);
		const end = Math.min(text.length, index + phrase.length + contextLength);

		return text.substring(start, end);
	}

	escalateSeverity(currentSeverity) {
		const escalationMap = {
			[BIAS_SEVERITY.LOW]: BIAS_SEVERITY.MEDIUM,
			[BIAS_SEVERITY.MEDIUM]: BIAS_SEVERITY.HIGH,
			[BIAS_SEVERITY.HIGH]: BIAS_SEVERITY.CRITICAL
		};

		return escalationMap[currentSeverity] || currentSeverity;
	}

	calculateMitigationConfidence(changesApplied) {
		if (changesApplied.length === 0) return 1.0;

		// Confidence decreases with more changes needed
		return Math.max(0.3, 1.0 - (changesApplied.length * 0.1));
	}

	generateAnalyticsRecommendations(analytics) {
		const recommendations = [];

		if (analytics.biasRate > 10) {
			recommendations.push({
				priority: 'high',
				message: `Bias detection rate is ${analytics.biasRate.toFixed(1)}%. Consider reviewing AI training or prompting strategies.`
			});
		}

		// Category-specific recommendations
		const topCategory = Object.entries(analytics.categoriesBreakdown)
			.sort(([, a], [, b]) => b - a)[0];

		if (topCategory && topCategory[1] > 5) {
			recommendations.push({
				priority: 'medium',
				message: `${topCategory[0]} bias is most common. Focus mitigation efforts on this category.`
			});
		}

		return recommendations;
	}
}

// Singleton instance
const biasDetectionSystem = new BiasDetectionSystem();

export default biasDetectionSystem;

// Utility functions for easy use
export const analyzeBias = (response, patientData, query) =>
	biasDetectionSystem.analyzeBias(response, patientData, query);

export const mitigateBias = (response, biasReport) =>
	biasDetectionSystem.mitigateBias(response, biasReport);

export const getBiasAnalytics = (timeframe) =>
	biasDetectionSystem.generateBiasAnalytics(timeframe);