// src/lib/ai/practicalLocalAI.js
// Practical local AI solution for ATLAS thesis - no heavy dependencies
// Combines rule-based clinical logic with cached model responses

export class PracticalLocalAI {
	constructor() {
		this.isReady = true; // Always ready since no downloads needed
		this.responseCache = new Map();
		this.clinicalPatterns = this.initializeClinicalPatterns();
		this.treatmentProtocols = this.initializeTreatmentProtocols();

		this.stats = {
			totalQueries: 0,
			cacheHits: 0,
			ruleBasedResponses: 0,
			averageResponseTime: 0,
			lastUsed: null
		};

		console.log('🏥 Practical Local AI initialized');
		console.log('✅ Clinical knowledge base loaded');
	}

	initializeClinicalPatterns() {
		return {
			// Symptom pattern recognition
			fever_patterns: {
				high_fever_danger: {
					keywords: ['fever', 'temperature', '>39', '>102', 'high fever'],
					age_specific: {
						pediatric: ['lethargy', 'poor feeding', 'irritability', 'convulsions'],
						adult: ['confusion', 'severe headache', 'neck stiffness', 'photophobia'],
						elderly: ['confusion', 'falls', 'weakness']
					},
					urgency: 'high',
					protocols: ['fever_management', 'danger_sign_assessment']
				},

				fever_with_respiratory: {
					keywords: ['fever', 'cough', 'breathing', 'pneumonia', 'chest'],
					conditions: ['pneumonia', 'bronchitis', 'tuberculosis'],
					protocols: ['respiratory_assessment', 'antibiotic_consideration']
				},

				fever_with_gi: {
					keywords: ['fever', 'diarrhea', 'vomiting', 'abdominal', 'dehydration'],
					conditions: ['gastroenteritis', 'typhoid', 'dysentery'],
					protocols: ['hydration_assessment', 'gi_management']
				}
			},

			respiratory_patterns: {
				difficulty_breathing: {
					keywords: ['difficulty breathing', 'shortness of breath', 'fast breathing', 'chest pain'],
					age_specific: {
						pediatric: ['fast breathing', 'chest indrawing', 'unable to feed'],
						adult: ['dyspnea', 'chest pain', 'productive cough'],
						elderly: ['confusion', 'reduced mobility', 'fatigue']
					},
					urgency: 'high',
					protocols: ['respiratory_emergency', 'oxygen_assessment']
				}
			},

			maternal_patterns: {
				pregnancy_danger: {
					keywords: ['pregnancy', 'pregnant', 'bleeding', 'headache', 'vision', 'swelling'],
					conditions: ['preeclampsia', 'hemorrhage', 'preterm_labor'],
					urgency: 'high',
					protocols: ['maternal_emergency', 'bp_assessment', 'fetal_assessment']
				}
			},

			pediatric_patterns: {
				imci_danger: {
					keywords: ['unable to feed', 'vomits everything', 'convulsions', 'lethargic'],
					age_range: [0, 5],
					urgency: 'critical',
					protocols: ['imci_danger_signs', 'immediate_referral']
				}
			}
		};
	}

	initializeTreatmentProtocols() {
		return {
			fever_management: {
				assessment: [
					'Check temperature, pulse, blood pressure',
					'Assess for danger signs',
					'Look for source of fever'
				],
				treatment: [
					'Paracetamol 15mg/kg every 6 hours (pediatric) or 500-1000mg every 6 hours (adult)',
					'Encourage fluid intake',
					'Light clothing and tepid sponging if needed',
					'Monitor for deterioration'
				],
				follow_up: [
					'Return if fever persists >3 days',
					'Return immediately if danger signs develop',
					'Complete course of any prescribed antibiotics'
				]
			},

			respiratory_assessment: {
				assessment: [
					'Count respiratory rate',
					'Check for chest indrawing',
					'Assess oxygen saturation if available',
					'Listen to chest if possible'
				],
				treatment: {
					pneumonia_suspected: [
						'Amoxicillin 25-50mg/kg/day in 3 divided doses (pediatric)',
						'Amoxicillin 500mg three times daily (adult)',
						'Continue for 5-7 days',
						'Supportive care with fluids and rest'
					],
					severe_pneumonia: [
						'Refer immediately for injectable antibiotics',
						'Support breathing and circulation',
						'Monitor for deterioration'
					]
				}
			},

			hydration_assessment: {
				assessment: [
					'Check for signs of dehydration',
					'Assess ability to drink',
					'Check skin pinch test',
					'Monitor urine output'
				],
				treatment: {
					mild_dehydration: [
						'ORS solution - 75ml/kg over 4 hours',
						'Continue normal feeding',
						'Give small frequent amounts'
					],
					moderate_dehydration: [
						'ORS solution - 75ml/kg over 4 hours',
						'Additional fluid for ongoing losses',
						'Monitor closely'
					],
					severe_dehydration: [
						'Refer immediately for IV fluids',
						'Give ORS if able to drink during transport'
					]
				}
			},

			maternal_emergency: {
				assessment: [
					'Check blood pressure',
					'Test urine for protein if possible',
					'Check for headache, visual disturbances',
					'Assess fetal movements if >20 weeks'
				],
				treatment: {
					preeclampsia: [
						'Refer immediately if severe features',
						'Methyldopa if mild hypertension',
						'Monitor blood pressure closely',
						'Advise rest and follow-up'
					],
					hemorrhage: [
						'Refer immediately',
						'Start IV line if possible',
						'Monitor vital signs',
						'Prepare for emergency delivery if needed'
					]
				}
			}
		};
	}

	async generateClinicalRecommendation(query, patientData = {}, options = {}) {
		const startTime = performance.now();
		this.stats.totalQueries++;

		try {
			console.log('🔍 Analyzing with practical local AI...');

			// Check cache first
			const cacheKey = this.generateCacheKey(query, patientData);
			if (this.responseCache.has(cacheKey)) {
				this.stats.cacheHits++;
				const cachedResponse = this.responseCache.get(cacheKey);

				return {
					...cachedResponse,
					responseTime: performance.now() - startTime,
					fromCache: true,
					timestamp: new Date()
				};
			}

			// Analyze the clinical case
			const analysis = this.analyzeCase(query, patientData);

			// Generate structured response
			const response = this.generateStructuredResponse(analysis, patientData);

			const result = {
				text: response,
				confidence: this.calculateConfidence(analysis),
				responseTime: performance.now() - startTime,
				method: 'practical-local-ai',
				modelUsed: 'ATLAS-Clinical-Rules-Engine',
				timestamp: new Date(),
				queryId: this.generateQueryId(),
				offline: true,
				analysis: {
					matchedPatterns: analysis.matchedPatterns.length,
					urgencyLevel: analysis.urgency,
					protocols: analysis.protocols
				},
				rulesBased: true
			};

			// Cache the response
			this.cacheResponse(cacheKey, result);
			this.stats.ruleBasedResponses++;

			// Update stats
			this.updateStats(true, result.responseTime);

			return result;

		} catch (error) {
			console.error('Practical Local AI error:', error);

			const responseTime = performance.now() - startTime;
			this.updateStats(false, responseTime);

			return {
				text: this.generateFallbackResponse(query, patientData, error),
				confidence: 'low',
				responseTime,
				method: 'practical-local-fallback',
				error: error.message,
				offline: true
			};
		}
	}

	analyzeCase(query, patientData) {
		const analysis = {
			matchedPatterns: [],
			urgency: 'routine',
			protocols: [],
			conditions: [],
			ageGroup: this.getAgeGroup(patientData.age),
			riskFactors: this.extractRiskFactors(patientData)
		};

		const allText = `${query} ${patientData.symptoms || ''} ${patientData.chiefComplaint || ''} ${patientData.examination || ''}`.toLowerCase();

		// Pattern matching
		Object.entries(this.clinicalPatterns).forEach(([category, patterns]) => {
			Object.entries(patterns).forEach(([patternName, patternData]) => {
				const matches = this.checkPatternMatch(allText, patternData, analysis.ageGroup);

				if (matches.score > 0) {
					analysis.matchedPatterns.push({
						category,
						pattern: patternName,
						score: matches.score,
						data: patternData
					});

					// Update urgency
					if (patternData.urgency === 'critical' && analysis.urgency !== 'critical') {
						analysis.urgency = 'critical';
					} else if (patternData.urgency === 'high' && analysis.urgency === 'routine') {
						analysis.urgency = 'high';
					}

					// Add protocols
					if (patternData.protocols) {
						analysis.protocols.push(...patternData.protocols);
					}

					// Add conditions
					if (patternData.conditions) {
						analysis.conditions.push(...patternData.conditions);
					}
				}
			});
		});

		// Remove duplicates
		analysis.protocols = [...new Set(analysis.protocols)];
		analysis.conditions = [...new Set(analysis.conditions)];

		// Sort patterns by score
		analysis.matchedPatterns.sort((a, b) => b.score - a.score);

		return analysis;
	}

	checkPatternMatch(text, patternData, ageGroup) {
		let score = 0;

		// Check keywords
		if (patternData.keywords) {
			patternData.keywords.forEach(keyword => {
				if (text.includes(keyword.toLowerCase())) {
					score += 10;
				}
			});
		}

		// Age-specific matching
		if (patternData.age_specific && patternData.age_specific[ageGroup]) {
			patternData.age_specific[ageGroup].forEach(symptom => {
				if (text.includes(symptom.toLowerCase())) {
					score += 15; // Higher weight for age-specific symptoms
				}
			});
		}

		// Age range matching
		if (patternData.age_range) {
			// This would need actual age checking logic
		}

		return { score };
	}

	generateStructuredResponse(analysis, patientData) {
		let response = '**CLINICAL ASSESSMENT (ATLAS Local AI)**\n\n';

		// Urgency header
		if (analysis.urgency === 'critical') {
			response += '🚨 **CRITICAL CASE - IMMEDIATE ACTION REQUIRED**\n\n';
		} else if (analysis.urgency === 'high') {
			response += '⚠️ **HIGH PRIORITY CASE**\n\n';
		}

		// Primary assessment
		response += '**PRIMARY ASSESSMENT:**\n';

		if (analysis.matchedPatterns.length > 0) {
			const topPattern = analysis.matchedPatterns[0];
			response += `• Pattern identified: ${topPattern.pattern.replace(/_/g, ' ')}\n`;
			response += `• Clinical priority: ${analysis.urgency.toUpperCase()}\n`;
		} else {
			response += '• General clinical assessment required\n';
		}

		if (analysis.conditions.length > 0) {
			response += `• Conditions to consider: ${analysis.conditions.join(', ')}\n`;
		}

		response += '\n';

		// Management recommendations
		response += '**MANAGEMENT RECOMMENDATIONS:**\n';

		if (analysis.protocols.length > 0) {
			analysis.protocols.forEach(protocolName => {
				const protocol = this.treatmentProtocols[protocolName];
				if (protocol) {
					response += `\n*${protocolName.replace(/_/g, ' ').toUpperCase()}:*\n`;

					if (protocol.assessment) {
						response += '• Assessment: ' + protocol.assessment.join(', ') + '\n';
					}

					if (protocol.treatment) {
						if (Array.isArray(protocol.treatment)) {
							response += '• Treatment: ' + protocol.treatment.join('; ') + '\n';
						} else if (typeof protocol.treatment === 'object') {
							Object.entries(protocol.treatment).forEach(([condition, treatments]) => {
								response += `• ${condition.replace(/_/g, ' ')}: ${treatments.join('; ')}\n`;
							});
						}
					}
				}
			});
		} else {
			response += '• Complete systematic clinical assessment\n';
			response += '• Apply standard care protocols appropriate for presentation\n';
			response += '• Monitor patient response to initial interventions\n';
		}

		// Age-specific considerations
		if (analysis.ageGroup === 'pediatric') {
			response += '\n**PEDIATRIC CONSIDERATIONS:**\n';
			response += '• Use weight-based dosing for medications\n';
			response += '• Monitor for IMCI danger signs\n';
			response += '• Ensure caregiver education\n';
		} else if (analysis.ageGroup === 'elderly') {
			response += '\n**ELDERLY CARE CONSIDERATIONS:**\n';
			response += '• Consider drug interactions and comorbidities\n';
			response += '• Assess functional status and mobility\n';
			response += '• Monitor for atypical presentations\n';
		} else if (analysis.ageGroup === 'reproductive' && patientData.gender?.toLowerCase() === 'female') {
			response += '\n**REPRODUCTIVE HEALTH CONSIDERATIONS:**\n';
			response += '• Consider pregnancy possibility\n';
			response += '• Ensure medication safety if pregnant\n';
		}

		// Follow-up and referral
		response += '\n**FOLLOW-UP & REFERRAL:**\n';

		if (analysis.urgency === 'critical') {
			response += '• **REFER IMMEDIATELY** to higher level of care\n';
			response += '• Provide supportive care during transport\n';
			response += '• Communicate urgency to receiving facility\n';
		} else if (analysis.urgency === 'high') {
			response += '• Arrange urgent referral if no improvement in 2-4 hours\n';
			response += '• Monitor closely for deterioration\n';
			response += '• Ensure follow-up within 24 hours\n';
		} else {
			response += '• Follow up in 2-3 days if no improvement\n';
			response += '• Return immediately if symptoms worsen\n';
			response += '• Complete any prescribed treatment course\n';
		}

		// Add disclaimer
		response += '\n---\n*This assessment was generated by ATLAS local clinical decision support system. Always use clinical judgment and refer when uncertain.*';

		return response;
	}

	getAgeGroup(age) {
		if (!age) return 'adult';

		if (age < 5) return 'pediatric';
		if (age >= 15 && age <= 49) return 'reproductive';
		if (age > 65) return 'elderly';
		return 'adult';
	}

	extractRiskFactors(patientData) {
		const riskFactors = [];
		const history = (patientData.medicalHistory || '').toLowerCase();

		if (history.includes('diabetes')) riskFactors.push('diabetes');
		if (history.includes('hypertension')) riskFactors.push('hypertension');
		if (history.includes('hiv')) riskFactors.push('immunocompromised');
		if (history.includes('heart')) riskFactors.push('cardiovascular');
		if (patientData.pregnancy) riskFactors.push('pregnancy');

		return riskFactors;
	}

	calculateConfidence(analysis) {
		if (analysis.matchedPatterns.length === 0) {
			return 'low';
		}

		const topScore = analysis.matchedPatterns[0].score;

		if (topScore >= 30) return 'high';
		if (topScore >= 20) return 'medium';
		return 'low';
	}

	generateCacheKey(query, patientData) {
		const keyData = {
			query: query.toLowerCase().substring(0, 100),
			age: patientData.age,
			symptoms: patientData.symptoms?.toLowerCase().substring(0, 50),
			gender: patientData.gender
		};

		return btoa(JSON.stringify(keyData)).substring(0, 32);
	}

	cacheResponse(key, response) {
		// Limit cache size
		if (this.responseCache.size >= 50) {
			const firstKey = this.responseCache.keys().next().value;
			this.responseCache.delete(firstKey);
		}

		this.responseCache.set(key, response);
	}

	generateFallbackResponse(query, patientData, error) {
		return `**Clinical Decision Support - System Status**

Local clinical AI system encountered an issue: ${error.message}

**Recommended Approach:**
1. Complete systematic patient assessment
2. Apply standard clinical protocols for the presenting condition
3. Use available clinical guidelines and references
4. Consider patient safety and appropriate referral thresholds
5. Document findings and management plan

**General Principles:**
• Treat the patient, not just the symptoms
• When in doubt, err on the side of caution
• Ensure appropriate follow-up arrangements
• Maintain clear documentation

The system will continue to provide basic clinical guidance offline.`;
	}

	updateStats(success, responseTime) {
		this.stats.lastUsed = new Date().toISOString();

		const previousAvg = this.stats.averageResponseTime;
		const count = this.stats.totalQueries;
		this.stats.averageResponseTime = (previousAvg * (count - 1) + responseTime) / count;
	}

	generateQueryId() {
		return `practical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	getStatus() {
		return {
			available: this.isReady,
			method: 'practical-local-ai',
			stats: this.stats,
			cacheSize: this.responseCache.size,
			patternsLoaded: Object.keys(this.clinicalPatterns).length,
			protocolsLoaded: Object.keys(this.treatmentProtocols).length,
			offline: true,
			dependencies: 'none'
		};
	}
}

// Export singleton instance
export const practicalLocalAI = new PracticalLocalAI();

// Main export functions
export async function getPracticalLocalRecommendations(query, patientData, options = {}) {
	return await practicalLocalAI.generateClinicalRecommendation(query, patientData, options);
}

export function getPracticalLocalStatus() {
	return practicalLocalAI.getStatus();
}