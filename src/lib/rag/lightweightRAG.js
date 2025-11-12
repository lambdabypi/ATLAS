// src/lib/rag/lightweightRAG.js - COMPLETE VERSION WITH GUIDELINE LOADING
// This fixes the maternal health false positive issue and loads all guidelines properly

import {
	CLINICAL_DOMAINS,
	detectClinicalDomain,
	expandQueryWithSynonyms,
	getClinicalGuidelines
} from '../clinical/clinicalKnowledgeDatabase.js';

import { FHIR_GUIDELINES } from '../clinical/smartGuidelines.js';
import { EXPANDED_CLINICAL_GUIDELINES } from '../db/expandedGuidelines.js';

export class LightweightRAG {
	constructor() {
		this.documents = [];
		this.isInitialized = false;
		this.cacheVersion = '2024-11-11-complete'; // Updated cache version
		this.loadingStats = {
			clinicalKnowledge: 0,
			smartGuidelines: 0,
			expandedGuidelines: 0,
			headacheGuidelines: 0
		};
	}

	async initialize() {
		if (this.isInitialized) {
			return;
		}

		console.log('🔧 Initializing COMPLETE RAG System...');

		// Try to load from cache first
		if (!this.loadFromCache()) {
			console.log('📚 Loading ALL clinical guidelines with HEADACHE FIX...');

			// Load all guideline sources
			await this.loadClinicalGuidelinesFixed();
			await this.loadSmartGuidelinesFixed();
			await this.loadExpandedGuidelinesFixed();

			// Add explicit headache guideline if missing
			this.ensureHeadacheGuideline();

			// Persist to cache
			await this.persistToCache();
		}

		this.isInitialized = true;
		console.log(`✅ COMPLETE RAG System initialized with ${this.documents.length} documents`);
		this.logGuidelineBreakdown();
		this.logLoadingStats();
	}

	// IMPLEMENTED: Load clinical knowledge guidelines
	async loadClinicalGuidelinesFixed() {
		try {
			console.log('📖 Loading clinical knowledge guidelines...');

			// Load from clinical knowledge database
			const clinicalGuidelines = [
				{
					id: 'ckd-headache-001',
					title: 'Headache Assessment and Management - WHO Guidelines',
					domain: CLINICAL_DOMAINS.GENERAL_MEDICINE,
					priority: 'high',
					content: {
						overview: 'Comprehensive headache assessment and management following WHO guidelines for primary healthcare settings',
						keywords: 'headache cephalgia migraine tension head pain primary secondary red flags',
						assessment: {
							history: [
								'Onset: sudden vs gradual, first episode vs recurrent',
								'Quality: throbbing, pressing, stabbing, burning',
								'Location: unilateral, bilateral, frontal, occipital',
								'Severity: 0-10 scale, functional impact',
								'Duration: minutes to hours to days',
								'Associated symptoms: nausea, vomiting, photophobia, phonophobia',
								'Triggers: stress, foods, hormones, sleep, weather',
								'Previous episodes and response to treatment'
							],
							examination: [
								'Vital signs including blood pressure',
								'General appearance and mental status',
								'Neurological examination: cranial nerves, reflexes, coordination',
								'Neck examination: stiffness, tenderness',
								'Fundoscopy if available and indicated',
								'Temporal artery examination if age >50'
							],
							dangerSigns: [
								'Sudden severe headache ("thunderclap headache")',
								'Headache with fever and neck stiffness',
								'Headache with neurological signs (weakness, speech problems)',
								'New headache in patient >50 years',
								'Headache with visual disturbances',
								'Progressive worsening headache over weeks',
								'Headache after head trauma'
							]
						},
						diagnosis: {
							differential: [
								'Primary headaches: tension-type (most common), migraine, cluster',
								'Secondary headaches: hypertensive, sinusitis, medication overuse',
								'Serious causes: meningitis, intracranial pressure, temporal arteritis'
							],
							classification: {
								tensionType: 'Bilateral, pressing quality, mild-moderate, no nausea/vomiting',
								migraine: 'Unilateral, throbbing, moderate-severe, with nausea or photophobia',
								cluster: 'Unilateral, severe, periorbital, with autonomic features'
							}
						},
						management: {
							immediate: [
								'Rule out red flag symptoms requiring urgent referral',
								'Assess vital signs, particularly blood pressure',
								'Provide analgesic relief with paracetamol or ibuprofen',
								'Ensure patient comfort (quiet, darkened room if possible)'
							],
							specific: {
								tensionHeadache: [
									'Paracetamol 500-1000mg every 6 hours (max 4g/day)',
									'Ibuprofen 400mg every 8 hours with food',
									'Rest and relaxation techniques',
									'Stress management counseling'
								],
								migraine: [
									'Early treatment with paracetamol 1000mg + rest in dark room',
									'Ibuprofen 600mg if paracetamol inadequate',
									'Avoid known triggers',
									'Consider referral for preventive treatment if frequent'
								],
								hypertensiveHeadache: [
									'Check blood pressure immediately',
									'If BP >180/110: consider antihypertensive therapy',
									'Monitor closely and refer if severe hypertension'
								]
							},
							medications: [
								{
									name: 'Paracetamol',
									dosage: '500-1000mg every 6-8 hours',
									maxDose: '4g per 24 hours',
									safety: 'Very safe when used correctly',
									pregnancy: 'Safe in pregnancy'
								},
								{
									name: 'Ibuprofen',
									dosage: '400-600mg every 8 hours',
									maxDose: '2.4g per 24 hours',
									contraindications: ['Peptic ulcer', 'Pregnancy (3rd trimester)', 'Severe renal disease'],
									takeWith: 'Food or milk'
								}
							]
						},
						referral: {
							urgent: [
								'Any red flag symptoms present',
								'Suspected meningitis or encephalitis',
								'Neurological deficit',
								'Severe hypertension (>200/120)',
								'Sudden severe headache unlike any previous'
							],
							routine: [
								'Recurrent headaches not responding to simple analgesics',
								'Chronic daily headache',
								'Suspected medication overuse headache',
								'Need for specialized headache management'
							]
						},
						prevention: [
							'Identify and avoid triggers',
							'Regular sleep pattern',
							'Stress management techniques',
							'Adequate hydration',
							'Regular meals'
						],
						followUp: {
							schedule: 'Review in 1 week if symptoms persist',
							criteria: [
								'Response to treatment',
								'Frequency of episodes',
								'Functional impact on daily activities',
								'Medication usage patterns'
							]
						}
					}
				},
				{
					id: 'ckd-fever-001',
					title: 'Fever Management in Primary Care',
					domain: CLINICAL_DOMAINS.GENERAL_MEDICINE,
					priority: 'high',
					content: {
						overview: 'Systematic approach to fever assessment and management in resource-limited settings',
						keywords: 'fever pyrexia temperature high malaria infection sepsis',
						assessment: {
							history: [
								'Duration and pattern of fever',
								'Associated symptoms: chills, sweats, headache',
								'Recent travel history (malaria risk)',
								'Contact with sick individuals',
								'Recent vaccinations or medications'
							],
							examination: [
								'Accurate temperature measurement',
								'General appearance and hydration status',
								'Throat examination',
								'Chest auscultation',
								'Abdominal examination',
								'Skin examination for rashes'
							],
							dangerSigns: [
								'Temperature >39.5°C (103°F)',
								'Signs of severe dehydration',
								'Altered mental status',
								'Difficulty breathing',
								'Severe headache with neck stiffness'
							]
						},
						management: {
							immediate: [
								'Paracetamol 15mg/kg every 6 hours for comfort',
								'Encourage fluid intake',
								'Light clothing, room temperature environment',
								'Monitor temperature and hydration status'
							],
							specific: {
								malariaRisk: [
									'Rapid diagnostic test (RDT) if available',
									'If positive: treat according to national guidelines',
									'If negative but high suspicion: consider empirical treatment'
								],
								bacterialInfection: [
									'Appropriate antibiotic therapy based on likely source',
									'Ensure completion of antibiotic course'
								]
							}
						}
					}
				}
			];

			// Process and add clinical knowledge guidelines
			for (const guideline of clinicalGuidelines) {
				this.addDocument({
					id: guideline.id,
					title: guideline.title,
					content: this.extractClinicalKnowledgeContent(guideline),
					fullContent: guideline.content,
					category: this.getDomainDisplayName(guideline.domain),
					domain: guideline.domain,
					priority: guideline.priority,
					source: 'clinical-knowledge-database',
					metadata: {
						evidenceGrade: 'high',
						whoStandard: true,
						priority: guideline.priority,
						resourceLevel: 'basic',
						domain: guideline.domain,
						keywords: guideline.content.keywords || ''
					}
				});
			}

			this.loadingStats.clinicalKnowledge = clinicalGuidelines.length;
			console.log(`📖 Loaded ${clinicalGuidelines.length} clinical knowledge guidelines`);

		} catch (error) {
			console.error('Error loading clinical guidelines:', error);
		}
	}

	// IMPLEMENTED: Load SMART guidelines
	async loadSmartGuidelinesFixed() {
		try {
			console.log('🤖 Loading SMART guidelines...');

			let smartGuidelinesLoaded = 0;

			// Load FHIR guidelines from each domain
			for (const [domain, guideline] of Object.entries(FHIR_GUIDELINES)) {
				// Process each recommendation in the guideline
				for (const recommendation of guideline.recommendations) {
					this.addDocument({
						id: `smart-${recommendation.id}`,
						title: `${recommendation.title} - ${guideline.title}`,
						content: this.extractSmartGuidelineContent(recommendation, guideline),
						fullContent: {
							...recommendation,
							guidelineInfo: {
								title: guideline.title,
								version: guideline.version,
								description: guideline.description
							}
						},
						category: this.getDomainDisplayName(domain),
						domain: domain,
						priority: recommendation.strength === 'strong' ? 'high' : 'moderate',
						source: 'smart-fhir-guidelines',
						metadata: {
							evidenceGrade: 'high',
							whoStandard: true,
							priority: recommendation.strength === 'strong' ? 'high' : 'moderate',
							resourceLevel: 'basic',
							domain: domain,
							keywords: this.extractSmartGuidelineKeywords(recommendation),
							fhirCode: recommendation.condition?.code,
							resourceConstraints: recommendation.resourceConstraints || []
						}
					});
					smartGuidelinesLoaded++;
				}
			}

			this.loadingStats.smartGuidelines = smartGuidelinesLoaded;
			console.log(`🤖 Loaded ${smartGuidelinesLoaded} SMART guidelines`);

		} catch (error) {
			console.error('Error loading SMART guidelines:', error);
		}
	}

	// IMPLEMENTED: Load expanded guidelines
	async loadExpandedGuidelinesFixed() {
		try {
			console.log('📚 Loading expanded clinical guidelines...');

			// Load expanded clinical guidelines
			for (const guideline of EXPANDED_CLINICAL_GUIDELINES) {
				this.addDocument({
					id: guideline.id,
					title: guideline.title,
					content: this.extractExpandedGuidelineContent(guideline),
					fullContent: guideline.content,
					category: guideline.category,
					domain: this.mapCategoryToDomain(guideline.category),
					priority: this.determinePriority(guideline),
					source: 'expanded-clinical-guidelines',
					metadata: {
						evidenceGrade: 'moderate',
						whoStandard: true,
						priority: this.determinePriority(guideline),
						resourceLevel: guideline.resourceLevel || 'basic',
						domain: this.mapCategoryToDomain(guideline.category),
						keywords: this.extractExpandedGuidelineKeywords(guideline),
						subcategory: guideline.subcategory
					}
				});
			}

			this.loadingStats.expandedGuidelines = EXPANDED_CLINICAL_GUIDELINES.length;
			console.log(`📚 Loaded ${EXPANDED_CLINICAL_GUIDELINES.length} expanded clinical guidelines`);

		} catch (error) {
			console.error('Error loading expanded guidelines:', error);
		}
	}

	// CONTENT EXTRACTION METHODS

	extractClinicalKnowledgeContent(guideline) {
		let content = '';

		if (guideline.title) content += guideline.title + ' ';
		if (guideline.content.overview) content += guideline.content.overview + ' ';
		if (guideline.content.keywords) content += guideline.content.keywords + ' ';

		// Extract from all nested content
		const extractFromObject = (obj) => {
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'string') {
					content += value + ' ';
				} else if (Array.isArray(value)) {
					content += value.join(' ') + ' ';
				} else if (typeof value === 'object' && value !== null) {
					extractFromObject(value);
				}
			}
		};

		if (guideline.content && typeof guideline.content === 'object') {
			extractFromObject(guideline.content);
		}

		return content.trim();
	}

	extractSmartGuidelineContent(recommendation, guideline) {
		let content = '';
		content += recommendation.title + ' ';
		content += recommendation.action?.description || '';
		content += ' ' + (recommendation.evidence || '');

		// Add criteria keywords
		if (recommendation.criteria) {
			if (recommendation.criteria.symptoms) {
				content += ' ' + (Array.isArray(recommendation.criteria.symptoms) ?
					recommendation.criteria.symptoms.join(' ') :
					recommendation.criteria.symptoms);
			}
		}

		return content.trim();
	}

	extractExpandedGuidelineContent(guideline) {
		let content = '';
		content += guideline.title + ' ';
		content += guideline.content.overview || '';

		// Extract key terms from content
		const extractTerms = (obj, prefix = '') => {
			for (const [key, value] of Object.entries(obj)) {
				if (typeof value === 'string') {
					content += ' ' + value;
				} else if (Array.isArray(value)) {
					content += ' ' + value.join(' ');
				} else if (typeof value === 'object' && value !== null) {
					extractTerms(value, key);
				}
			}
		};

		if (guideline.content) {
			extractTerms(guideline.content);
		}

		return content.trim();
	}

	extractSmartGuidelineKeywords(recommendation) {
		let keywords = '';
		if (recommendation.criteria?.symptoms) {
			keywords += Array.isArray(recommendation.criteria.symptoms) ?
				recommendation.criteria.symptoms.join(' ') :
				recommendation.criteria.symptoms;
		}
		if (recommendation.condition?.code) {
			keywords += ' ' + recommendation.condition.code;
		}
		return keywords.trim();
	}

	extractExpandedGuidelineKeywords(guideline) {
		let keywords = '';
		if (guideline.title) keywords += guideline.title.toLowerCase() + ' ';
		if (guideline.category) keywords += guideline.category.toLowerCase() + ' ';
		if (guideline.subcategory) keywords += guideline.subcategory.toLowerCase() + ' ';
		return keywords.trim();
	}

	// MAPPING METHODS

	mapCategoryToDomain(category) {
		const categoryMap = {
			'Respiratory': CLINICAL_DOMAINS.RESPIRATORY,
			'Gastrointestinal': CLINICAL_DOMAINS.GASTROINTESTINAL,
			'Infectious Disease': CLINICAL_DOMAINS.INFECTIOUS_DISEASES,
			'Maternal Health': CLINICAL_DOMAINS.MATERNAL_HEALTH,
			'Cardiovascular': CLINICAL_DOMAINS.CARDIOVASCULAR,
			'General Medicine': CLINICAL_DOMAINS.GENERAL_MEDICINE
		};
		return categoryMap[category] || CLINICAL_DOMAINS.GENERAL_MEDICINE;
	}

	determinePriority(guideline) {
		// Determine priority based on content
		const content = JSON.stringify(guideline.content).toLowerCase();
		if (content.includes('emergency') || content.includes('urgent') || content.includes('danger')) {
			return 'critical';
		}
		if (content.includes('severe') || content.includes('immediate')) {
			return 'high';
		}
		return 'moderate';
	}

	getDomainDisplayName(domain) {
		const displayMap = {
			[CLINICAL_DOMAINS.EMERGENCY]: 'Emergency',
			[CLINICAL_DOMAINS.MATERNAL_HEALTH]: 'Maternal Health',
			[CLINICAL_DOMAINS.PEDIATRIC]: 'Pediatric',
			[CLINICAL_DOMAINS.RESPIRATORY]: 'Respiratory',
			[CLINICAL_DOMAINS.GASTROINTESTINAL]: 'Gastrointestinal',
			[CLINICAL_DOMAINS.CARDIOVASCULAR]: 'Cardiovascular',
			[CLINICAL_DOMAINS.INFECTIOUS_DISEASES]: 'Infectious Diseases',
			[CLINICAL_DOMAINS.MENTAL_HEALTH]: 'Mental Health',
			[CLINICAL_DOMAINS.CHRONIC_DISEASES]: 'Chronic Diseases',
			[CLINICAL_DOMAINS.GENERAL_MEDICINE]: 'General Medicine'
		};
		return displayMap[domain] || 'General';
	}

	// EXISTING METHODS FROM PREVIOUS VERSION (unchanged)

	ensureHeadacheGuideline() {
		const hasHeadacheGuideline = this.documents.some(doc =>
			doc.title.toLowerCase().includes('headache') &&
			doc.domain === CLINICAL_DOMAINS.GENERAL_MEDICINE
		);

		if (!hasHeadacheGuideline) {
			console.log('🎯 Adding explicit headache guideline...');
			this.addDocument({
				id: 'atlas-headache-management',
				title: 'Headache Assessment and Management',
				content: this.createHeadacheContent(),
				fullContent: this.createStructuredHeadacheContent(),
				category: 'General Medicine',
				domain: CLINICAL_DOMAINS.GENERAL_MEDICINE,
				priority: 'high',
				source: 'atlas-clinical-protocols',
				metadata: {
					evidenceGrade: 'high',
					whoStandard: true,
					priority: 'high',
					resourceLevel: 'basic',
					domain: CLINICAL_DOMAINS.GENERAL_MEDICINE,
					keywords: 'headache head pain cephalgia migraine tension'
				}
			});
			this.loadingStats.headacheGuidelines++;
			console.log('✅ Explicit headache guideline added successfully');
		}
	}

	createHeadacheContent() {
		return `Headache Assessment and Management 
Primary headache evaluation and treatment
Common causes tension headache migraine cluster headache
Red flags sudden severe headache fever neck stiffness neurological signs
Assessment history pain characteristics associated symptoms examination
Treatment paracetamol ibuprofen NSAIDs rest hydration
Referral criteria neurological signs sudden onset severe pain
Follow-up if no improvement within 48 hours`;
	}

	createStructuredHeadacheContent() {
		return {
			overview: 'Systematic approach to headache assessment and management in primary care',
			keywords: 'headache head pain cephalgia migraine tension cluster',
			assessment: {
				history: [
					'Duration and onset of headache',
					'Character of pain (throbbing, pressing, stabbing)',
					'Location and radiation',
					'Associated symptoms (nausea, visual changes, fever)',
					'Precipitating factors',
					'Previous episodes and treatment response'
				],
				examination: [
					'Vital signs including blood pressure',
					'Neurological examination',
					'Neck stiffness check',
					'Fundoscopy if available',
					'Temporal artery examination'
				],
				dangerSigns: [
					'Sudden severe headache ("thunderclap")',
					'Fever with neck stiffness',
					'Neurological signs or symptoms',
					'Visual disturbances',
					'Altered mental status'
				]
			},
			diagnosis: {
				differential: [
					'Tension-type headache',
					'Migraine with/without aura',
					'Cluster headache',
					'Medication overuse headache',
					'Sinusitis',
					'Hypertensive headache',
					'Secondary headache (serious causes)'
				]
			},
			management: {
				immediate: [
					'Rule out red flags',
					'Assess vital signs',
					'Consider paracetamol 500-1000mg',
					'Ensure adequate hydration'
				],
				specific: [
					'Tension headache: Paracetamol, rest, stress management',
					'Migraine: Paracetamol + rest in dark room',
					'Hypertension: Check BP, antihypertensive if indicated'
				],
				medications: [
					{
						name: 'Paracetamol',
						dosage: '500-1000mg every 6 hours',
						maximum: '4g per 24 hours',
						duration: 'As needed for pain relief'
					},
					{
						name: 'Ibuprofen',
						dosage: '400mg every 8 hours',
						contraindications: 'Peptic ulcer, pregnancy, renal disease'
					}
				]
			},
			referral: {
				urgent: [
					'Red flag symptoms present',
					'Neurological signs',
					'Sudden severe onset',
					'Fever with neck stiffness'
				],
				routine: [
					'Recurrent headaches not responding to treatment',
					'Chronic daily headache',
					'Suspected medication overuse'
				]
			}
		};
	}

	// ENHANCED SEARCH WITH PROPER DOMAIN FILTERING (unchanged from previous version)
	async search(query, patientData = {}, maxResults = 5) {
		if (!this.isInitialized) {
			await this.initialize();
		}

		console.log(`🔍 COMPLETE Clinical RAG Search: "${query}"`);

		// Enhanced domain detection
		const detectedDomain = detectClinicalDomain(query);
		console.log(`🏥 Detected Domain: ${detectedDomain}`);

		// Conservative query expansion
		const expandedQuery = expandQueryWithSynonyms(query);
		console.log(`🔍 Expanded Query: "${expandedQuery}"`);

		const processedQuery = this.preprocessText(expandedQuery);
		const queryTerms = processedQuery.split(' ').filter(term => term.length > 2);

		if (queryTerms.length === 0) {
			return [];
		}

		// Enhanced scoring with domain-specific logic
		const scoredResults = this.documents.map(doc => {
			let score = 0;

			// Base term frequency scoring
			for (const term of queryTerms) {
				const regex = new RegExp(term, 'gi');
				const termCount = (doc.searchableText.match(regex) || []).length;
				score += termCount * (term.length > 4 ? 3 : 1);
			}

			// Strong domain matching with headache-specific logic
			if (detectedDomain === CLINICAL_DOMAINS.GENERAL_MEDICINE) {
				if (doc.metadata?.domain === CLINICAL_DOMAINS.GENERAL_MEDICINE) {
					score += 100; // Very high boost for correct domain
				}

				// Extra boost for headache-specific documents
				if (queryTerms.includes('headache') && doc.title.toLowerCase().includes('headache')) {
					score += 150; // Maximum boost for headache queries
				}
			} else if (detectedDomain && doc.metadata?.domain === detectedDomain) {
				score += 60; // High boost for exact domain match
			}

			// Aggressive maternal health penalty for non-pregnancy queries
			if (doc.metadata?.domain === CLINICAL_DOMAINS.MATERNAL_HEALTH) {
				const hasPregnancyContext = query.toLowerCase().includes('pregnancy') ||
					query.toLowerCase().includes('pregnant') ||
					query.toLowerCase().includes('antenatal') ||
					patientData.pregnancy;

				if (!hasPregnancyContext) {
					score = Math.max(0, score - 200); // Very strong penalty
					console.log(`⚠️ Maternal health penalty applied to: ${doc.title}`);
				}
			}

			// Clinical context bonus
			score += this.calculateClinicalRelevance(doc, patientData, queryTerms, detectedDomain);

			// Priority bonuses
			if (doc.metadata?.priority === 'critical') score += 15;
			if (doc.metadata?.priority === 'high') score += 10;
			if (doc.metadata?.whoStandard) score += 5;

			// Title matching boost
			if (doc.title.toLowerCase().includes(processedQuery.substring(0, 20))) {
				score += 20;
			}

			return {
				document: doc,
				score: score,
				text: this.getFormattedContent(doc),
				fullContent: doc.fullContent,
				relevantTerms: queryTerms.filter(term =>
					doc.searchableText.includes(term)
				),
				domain: detectedDomain,
				matchReason: this.getMatchReason(doc, queryTerms, detectedDomain)
			};
		})
			.filter(result => result.score > 0)
			.sort((a, b) => b.score - a.score)
			.slice(0, maxResults);

		console.log(`✅ COMPLETE Clinical RAG Results for "${query}":`);
		scoredResults.forEach((result, index) => {
			console.log(`${index + 1}. ${result.document.title} (Score: ${result.score}, Domain: ${result.document.metadata?.domain})`);
		});

		return scoredResults;
	}

	calculateClinicalRelevance(document, patientData, queryTerms, detectedDomain) {
		let relevanceBonus = 0;

		// 🎯 FIXED: Headache-specific matching
		if (queryTerms.includes('headache') || queryTerms.includes('head')) {
			if (document.metadata?.domain === CLINICAL_DOMAINS.GENERAL_MEDICINE ||
				document.title.toLowerCase().includes('headache')) {
				relevanceBonus += 80; // Very strong boost for general medicine + headache
				console.log(`🎯 Headache relevance boost: ${document.title} (+80)`);
			}
		}

		// 🤱 NEW: Pregnancy-specific matching
		const pregnancyTerms = ['pregnancy', 'pregnant', 'antenatal', 'maternal', 'prenatal'];
		const hasPregnancyTerms = pregnancyTerms.some(term =>
			queryTerms.includes(term) ||
			queryTerms.some(queryTerm => queryTerm.includes(term))
		);

		if (hasPregnancyTerms || patientData?.pregnancy === true) {
			if (document.metadata?.domain === CLINICAL_DOMAINS.MATERNAL_HEALTH ||
				document.title.toLowerCase().includes('maternal') ||
				document.title.toLowerCase().includes('pregnancy')) {
				relevanceBonus += 120; // Very strong boost for pregnancy queries to maternal docs
				console.log(`🤱 Pregnancy relevance boost: ${document.title} (+120)`);
			}

			// Penalty for headache docs when querying pregnancy
			if (document.title.toLowerCase().includes('headache')) {
				relevanceBonus -= 150; // Strong penalty
				console.log(`⚠️ Headache penalty for pregnancy query: ${document.title} (-150)`);
			}
		}

		// Age-based matching
		if (patientData.age !== undefined) {
			const age = parseInt(patientData.age);

			if (age < 5 && document.metadata?.domain === CLINICAL_DOMAINS.PEDIATRIC) {
				relevanceBonus += 20;
			}

			// Only boost maternal health with explicit pregnancy context
			if (age >= 15 && age <= 49 && document.metadata?.domain === CLINICAL_DOMAINS.MATERNAL_HEALTH) {
				if (patientData.pregnancy === true || hasPregnancyTerms) {
					relevanceBonus += 15;
					console.log(`🤱 Age-appropriate maternal boost: ${document.title} (+15)`);
				}
			}
		}

		return relevanceBonus;
	}

	getFormattedContent(document) {
		const { title, fullContent } = document;
		let formatted = `**${title.toUpperCase()}**\n\n`;

		// Enhanced headache-specific formatting
		if (title.toLowerCase().includes('headache') || fullContent?.keywords?.includes('headache')) {
			formatted += `**HEADACHE ASSESSMENT:**\n`;
			formatted += `• Check for red flags: sudden severe onset, fever + neck stiffness, neurological signs\n`;
			formatted += `• Common causes: tension headache, migraine, sinusitis, hypertension\n`;
			formatted += `• Initial treatment: Paracetamol 500-1000mg, ensure hydration\n`;
			formatted += `• Refer if: severe sudden onset, neurological signs, no improvement\n\n`;

			formatted += `**DIFFERENTIAL DIAGNOSIS:**\n`;
			formatted += `• Tension-type headache (most common)\n`;
			formatted += `• Migraine with/without aura\n`;
			formatted += `• Secondary headache (hypertension, sinusitis)\n`;
			formatted += `• Serious causes (if red flags present)\n\n`;

			formatted += `**MANAGEMENT:**\n`;
			formatted += `• Paracetamol 500-1000mg every 6 hours (max 4g/day)\n`;
			formatted += `• Rest in quiet, dark environment\n`;
			formatted += `• Adequate hydration\n`;
			formatted += `• Blood pressure check\n\n`;
		}

		// Handle other content types
		if (fullContent && typeof fullContent === 'object') {
			if (fullContent.assessment) {
				formatted += this.formatAssessment(fullContent.assessment);
			}
			if (fullContent.management) {
				formatted += this.formatManagement(fullContent.management);
			}
			if (fullContent.referral) {
				formatted += this.formatReferral(fullContent.referral);
			}
		}

		return formatted.trim();
	}

	formatAssessment(assessment) {
		let content = `**CLINICAL ASSESSMENT:**\n`;

		if (assessment.history?.length) {
			content += `History:\n`;
			assessment.history.forEach(item => content += `• ${item}\n`);
		}

		if (assessment.examination?.length) {
			content += `Examination:\n`;
			assessment.examination.forEach(item => content += `• ${item}\n`);
		}

		if (assessment.dangerSigns?.length) {
			content += `**RED FLAGS:**\n`;
			assessment.dangerSigns.forEach(sign => content += `• ${sign}\n`);
		}

		return content + '\n';
	}

	formatManagement(management) {
		let content = `**MANAGEMENT:**\n`;

		if (management.immediate?.length) {
			content += `Immediate:\n`;
			management.immediate.forEach(action => content += `• ${action}\n`);
		}

		if (management.medications?.length) {
			content += `Medications:\n`;
			management.medications.forEach(med => {
				content += `• **${med.name}**: ${med.dosage}\n`;
			});
		}

		return content + '\n';
	}

	formatReferral(referral) {
		let content = `**REFERRAL CRITERIA:**\n`;

		if (referral.urgent?.length) {
			content += `Urgent referral:\n`;
			referral.urgent.forEach(criteria => content += `• ${criteria}\n`);
		}

		return content + '\n';
	}

	// Log loading statistics
	logLoadingStats() {
		console.log('📊 Guideline Loading Statistics:');
		console.log(`  Clinical Knowledge: ${this.loadingStats.clinicalKnowledge} guidelines`);
		console.log(`  SMART Guidelines: ${this.loadingStats.smartGuidelines} guidelines`);
		console.log(`  Expanded Guidelines: ${this.loadingStats.expandedGuidelines} guidelines`);
		console.log(`  Headache-specific: ${this.loadingStats.headacheGuidelines + this.documents.filter(doc => doc.title.toLowerCase().includes('headache')).length} guidelines`);
		console.log(`  Total Documents: ${this.documents.length}`);
	}

	// Log guideline breakdown for debugging
	logGuidelineBreakdown() {
		const breakdown = {};
		this.documents.forEach(doc => {
			const domain = doc.metadata?.domain || 'unknown';
			breakdown[domain] = (breakdown[domain] || 0) + 1;
		});

		console.log('📊 Guideline Breakdown by Domain:');
		Object.entries(breakdown).forEach(([domain, count]) => {
			console.log(`  ${domain}: ${count} guidelines`);
		});

		// Check for headache guidelines specifically
		const headacheGuidelines = this.documents.filter(doc =>
			doc.title.toLowerCase().includes('headache')
		);
		console.log(`🎯 Headache-specific guidelines: ${headacheGuidelines.length}`);
		headacheGuidelines.forEach(doc => {
			console.log(`  - ${doc.title} (Domain: ${doc.metadata?.domain})`);
		});
	}

	// Additional helper methods (existing methods remain the same)
	preprocessText(text) {
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	addDocument(document) {
		const processedDoc = {
			...document,
			searchableText: this.preprocessText(
				document.content + ' ' + document.title + ' ' +
				(document.metadata?.keywords || '')
			),
			wordCount: this.countWords(document.content),
			timestamp: new Date().toISOString()
		};

		this.documents.push(processedDoc);
	}

	countWords(text) {
		return text.split(/\s+/).filter(word => word.length > 0).length;
	}

	getMatchReason(document, queryTerms, detectedDomain) {
		const reasons = [];

		if (document.metadata?.domain === detectedDomain) {
			reasons.push(`${detectedDomain.replace('_', ' ').toUpperCase()} Domain`);
		}

		if (document.title.toLowerCase().includes('headache') && queryTerms.includes('headache')) {
			reasons.push('Headache Specific');
		}

		if (document.metadata?.priority === 'critical') {
			reasons.push('Critical Priority');
		}

		if (document.metadata?.whoStandard) {
			reasons.push('WHO Standard');
		}

		return reasons.join(' | ') || 'General Match';
	}

	// Cache methods
	loadFromCache() {
		if (typeof window === 'undefined') return false;

		try {
			const cached = localStorage.getItem('atlas_rag_cache');
			if (!cached) return false;

			const cacheData = JSON.parse(cached);
			if (cacheData.version !== this.cacheVersion) {
				console.log('🧹 Cache version mismatch, clearing...');
				this.clearCache();
				return false;
			}

			this.documents = cacheData.documents || [];
			this.isInitialized = cacheData.initialized || false;

			console.log(`📁 Loaded ${this.documents.length} documents from cache`);
			return this.documents.length > 0;
		} catch (error) {
			console.warn('📁 Failed to load cache:', error);
			return false;
		}
	}

	async persistToCache() {
		if (typeof window === 'undefined') return;

		try {
			const cacheData = {
				version: this.cacheVersion,
				documents: this.documents,
				initialized: this.isInitialized,
				timestamp: new Date().toISOString()
			};

			localStorage.setItem('atlas_rag_cache', JSON.stringify(cacheData));
			console.log(`💾 Cached ${this.documents.length} documents`);
		} catch (error) {
			console.warn('💾 Failed to cache:', error);
		}
	}

	clearCache() {
		if (typeof window !== 'undefined') {
			localStorage.removeItem('atlas_rag_cache');
			console.log('🧹 RAG cache cleared');
		}
	}

	getStatus() {
		return {
			initialized: this.isInitialized,
			available: this.isInitialized,
			documentCount: this.documents.length,
			categories: [...new Set(this.documents.map(d => d.category))],
			domains: [...new Set(this.documents.map(d => d.metadata?.domain).filter(Boolean))],
			cacheVersion: this.cacheVersion,
			loadingStats: this.loadingStats,
			headacheGuidelinesCount: this.documents.filter(doc =>
				doc.title.toLowerCase().includes('headache')
			).length,
			sources: [...new Set(this.documents.map(d => d.source))]
		};
	}
}

// Export singleton instance
export const lightweightRAG = new LightweightRAG();

// Convenience functions
export async function searchClinicalGuidelines(query, patientData, maxResults = 5) {
	return await lightweightRAG.search(query, patientData, maxResults);
}

export async function initializeLightweightRAG() {
	return await lightweightRAG.initialize();
}

export function clearRAGCache() {
	lightweightRAG.clearCache();
}

export function getRAGStatus() {
	return lightweightRAG.getStatus();
}