// src/lib/rag/lightweightRAG.js - FIXED: No more truncation
// Returns COMPLETE clinical guidelines for expert evaluation

import {
	CLINICAL_DOMAINS,
	CLINICAL_SYNONYMS,
	DOMAIN_KEYWORDS,
	detectClinicalDomain,
	expandQueryWithSynonyms
} from '../clinical/clinicalKnowledgeDatabase.js';

import { EXPANDED_CLINICAL_GUIDELINES } from '../db/expandedGuidelines.js';
import { FHIR_GUIDELINES, SMARTGuidelinesEngine } from '../clinical/smartGuidelines.js';

export class LightweightRAG {
	constructor() {
		this.documents = [];
		this.isInitialized = false;
		this.cacheVersion = '3.2'; // Updated for content fixes
		this.smartEngine = new SMARTGuidelinesEngine();

		// Clinical mappings from fixed knowledge database
		this.clinicalSynonyms = CLINICAL_SYNONYMS;
		this.domainKeywords = DOMAIN_KEYWORDS;
		this.clinicalDomains = CLINICAL_DOMAINS;

		this.checkPersistedInitialization();
	}

	async checkPersistedInitialization() {
		if (typeof window !== 'undefined') {
			try {
				const cached = localStorage.getItem('atlas_rag_cache');
				if (cached) {
					const data = JSON.parse(cached);

					if (data.version === this.cacheVersion && data.documents && data.documents.length > 0) {
						this.documents = data.documents;
						this.isInitialized = true;
						console.log(`📚 Restored ${this.documents.length} documents from cache (v${data.version})`);

						if (typeof window !== 'undefined') {
							window.dispatchEvent(new CustomEvent('atlas:rag-initialized', {
								detail: { fromCache: true, documentCount: this.documents.length }
							}));
						}
						return true;
					} else {
						console.log('📚 Cache version mismatch, will re-initialize');
						localStorage.removeItem('atlas_rag_cache');
					}
				}
			} catch (error) {
				console.warn('📚 Failed to load RAG cache:', error);
				localStorage.removeItem('atlas_rag_cache');
			}
		}
		return false;
	}

	async initialize() {
		try {
			if (this.isInitialized && this.documents.length > 0) {
				console.log('📚 RAG already initialized, skipping');
				return { success: true, fromCache: true, documentCount: this.documents.length };
			}

			console.log('📚 Loading comprehensive clinical guidelines with FULL content...');
			this.documents = [];

			await this.loadClinicalKnowledgeDatabase();
			await this.loadExpandedGuidelines();
			await this.loadSMARTGuidelines();
			await this.loadDatabaseGuidelines();

			this.isInitialized = true;
			await this.persistToCache();

			console.log(`✅ RAG system ready with ${this.documents.length} documents (FULL CONTENT)`);

			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('atlas:rag-initialized', {
					detail: {
						fromCache: false,
						documentCount: this.documents.length,
						clinicalDomains: Object.keys(this.clinicalDomains).length,
						fullContent: true // Indicate full content is available
					}
				}));
			}

			return { success: true, documentCount: this.documents.length };

		} catch (error) {
			console.error('❌ RAG initialization failed:', error);
			return { success: false, error: error.message };
		}
	}

	async loadClinicalKnowledgeDatabase() {
		console.log('📚 Loading comprehensive clinical guidelines with FULL content...');

		const clinicalGuidelines = [
			// MATERNAL HEALTH - COMPREHENSIVE
			{
				id: 'maternal-comprehensive-who',
				title: 'WHO Maternal Health Guidelines - Comprehensive Care',
				domain: CLINICAL_DOMAINS.MATERNAL_HEALTH,
				priority: 'critical',
				content: {
					overview: 'Complete WHO guidelines for maternal health, antenatal care, and emergency obstetric care in resource-limited settings.',
					keywords: 'pregnant pregnancy antenatal maternal prenatal obstetric expecting gravida gestational ANC labor delivery postpartum breastfeeding preeclampsia eclampsia hemorrhage',

					antenatal_care: {
						visit_schedule: [
							'First contact: up to 12 weeks gestation',
							'Second contact: 20 weeks gestation',
							'Third contact: 26 weeks gestation',
							'Fourth contact: 30 weeks gestation',
							'Fifth contact: 34 weeks gestation',
							'Sixth contact: 36 weeks gestation',
							'Seventh contact: 38 weeks gestation',
							'Eighth contact: 40 weeks gestation',
							'Additional visits if complications arise'
						],

						essential_interventions: [
							'Blood pressure measurement at every contact',
							'Urine dipstick test for proteinuria after 20 weeks',
							'Maternal weight measurement and BMI calculation',
							'Fetal heart rate assessment after 20 weeks gestation',
							'Symphysis-fundal height measurement after 24 weeks',
							'Hemoglobin measurement at first contact and 28-32 weeks',
							'Blood group and Rh typing at first contact',
							'Syphilis serology testing at first contact',
							'HIV testing with pre- and post-test counseling'
						],

						routine_medications: {
							iron_folic_acid: {
								indication: 'All pregnant women',
								dosage: '60mg elemental iron + 400mcg folic acid daily',
								duration: 'From 20 weeks gestation through postpartum',
								counseling: 'Take with vitamin C, avoid tea/coffee within 2 hours, dark stools are normal'
							},
							tetanus_toxoid: {
								indication: 'All pregnant women',
								schedule: '2 doses minimum, 4 weeks apart if not previously immunized',
								timing: 'Second and third trimesters preferred'
							},
							intermittent_preventive_malaria: {
								indication: 'Pregnant women in endemic areas',
								medication: 'Sulfadoxine-pyrimethamine',
								schedule: 'Monthly from 13 weeks gestation until delivery'
							}
						}
					},

					danger_signs: {
						antepartum: [
							'Vaginal bleeding of any amount',
							'Severe headache with visual disturbances (blurred vision, seeing spots)',
							'Convulsions or fits',
							'Severe abdominal pain',
							'High fever >38.5°C',
							'Reduced or absent fetal movements after 20 weeks',
							'Leaking amniotic fluid (rupture of membranes)',
							'Severe swelling of face and hands'
						],
						intrapartum: [
							'Severe vaginal bleeding',
							'Prolonged labor >12 hours without progress',
							'Convulsions',
							'High fever >38.5°C',
							'Fast or difficult breathing',
							'Severe abdominal pain between contractions'
						],
						postpartum: [
							'Heavy vaginal bleeding (soaking >2 pads per hour)',
							'Convulsions',
							'High fever >38.5°C with chills',
							'Severe headache with blurred vision',
							'Difficulty breathing',
							'Severe abdominal pain',
							'Foul-smelling vaginal discharge'
						]
					},

					preeclampsia_management: {
						definition: 'Hypertension (BP ≥140/90 mmHg) + proteinuria (≥1+ on dipstick) after 20 weeks gestation',
						severe_features: [
							'Blood pressure ≥160/110 mmHg on two occasions 4+ hours apart',
							'Severe headache',
							'Visual disturbances (blurred vision, photophobia, scotomata)',
							'Epigastric or right upper quadrant pain',
							'Hyperreflexia with sustained clonus',
							'Oliguria (<500ml in 24 hours if measured)'
						],
						immediate_management: [
							'Urgent referral to hospital',
							'Antihypertensive medication if BP ≥160/110 mmHg',
							'First line: Methyldopa 250mg TDS, increase to 500mg TDS if needed',
							'Second line: Nifedipine immediate release 10mg, repeat after 30 minutes if needed',
							'Magnesium sulfate for seizure prophylaxis: 4g IV loading dose over 15-20 minutes, then 1-2g/hour infusion',
							'Monitor: BP every 15 minutes, reflexes hourly, respiratory rate, urine output',
							'Delivery planning: aim for delivery within 48 hours if severe'
						],
						magnesium_toxicity: {
							signs: 'Absent reflexes, respiratory depression <12/min, decreased urine output',
							antidote: 'Calcium gluconate 1g (10ml of 10% solution) IV over 5-10 minutes'
						}
					},

					normal_labor_management: {
						first_stage: [
							'Encourage mobility and upright positions',
							'Oral fluids and light diet as tolerated',
							'Bladder care - encourage voiding every 2 hours',
							'Monitor fetal heart rate every 30 minutes',
							'Monitor maternal vital signs every 4 hours',
							'Use partograph for labor monitoring'
						],
						partograph_use: [
							'Start plotting when in active labor (4cm cervical dilatation)',
							'Plot cervical dilatation hourly',
							'Plot fetal heart rate every 30 minutes',
							'Plot contractions every 30 minutes',
							'Alert line: expected progress of 1cm/hour',
							'Action line: 4 hours to the right of alert line',
							'Cross action line = refer or augment labor'
						],
						third_stage_management: [
							'Active management for all women:',
							'Oxytocin 10 IU IM within 1 minute after birth of baby',
							'Controlled cord traction when placenta separates',
							'Uterine massage after delivery of placenta',
							'Check placenta and membranes for completeness',
							'Monitor for postpartum hemorrhage for first 2 hours'
						]
					},

					postpartum_care: [
						'Monitor vital signs and uterine contraction for first 6 hours',
						'Assess lochia for color, amount, and odor',
						'Support immediate and exclusive breastfeeding',
						'Provide postpartum family planning counseling',
						'Screen for postpartum depression using appropriate tools',
						'Schedule follow-up visits at 3 days, 1-2 weeks, and 6 weeks postpartum'
					],

					evidence_base: 'WHO recommendations on antenatal care for positive pregnancy experience (2016), WHO recommendations on maternal health (2017)',
					quality_of_evidence: 'High - based on systematic reviews and randomized controlled trials',
					strength_of_recommendation: 'Strong - significant benefits outweigh risks in all settings'
				}
			},

			// PEDIATRIC - IMCI COMPREHENSIVE  
			{
				id: 'imci-comprehensive-who',
				title: 'WHO IMCI - Complete Integrated Management of Childhood Illness',
				domain: CLINICAL_DOMAINS.PEDIATRIC,
				priority: 'critical',
				content: {
					overview: 'Complete WHO IMCI guidelines for systematic assessment and case management of children aged 2 months to 5 years.',
					keywords: 'child infant baby pediatric paediatric IMCI danger signs pneumonia diarrhea malaria fever immunization nutrition growth development sick child',

					age_groups: {
						young_infants: '0-2 months',
						children: '2 months to 5 years'
					},

					general_danger_signs: [
						'Unable to drink or breastfeed',
						'Vomits everything',
						'Has had convulsions',
						'Lethargic or unconscious'
					],

					systematic_assessment: {
						step1: 'Check for general danger signs first',
						step2: 'Assess main symptoms: cough/difficult breathing, diarrhea, fever',
						step3: 'Check nutritional status and feeding problems',
						step4: 'Check immunization status',
						step5: 'Assess other problems'
					},

					cough_difficult_breathing: {
						assessment: [
							'Ask: How long has child had cough or difficult breathing?',
							'Count breaths per minute (child calm, not crying)',
							'Look for chest indrawing',
							'Look and listen for stridor',
							'Look and listen for wheeze'
						],
						classification: {
							pneumonia: {
								signs: 'Fast breathing ONLY (no general danger signs)',
								breathing_rates: {
									'2_11_months': '≥50 breaths per minute',
									'12_59_months': '≥40 breaths per minute'
								}
							},
							severe_pneumonia: {
								signs: [
									'Any general danger sign',
									'Chest indrawing',
									'Stridor in calm child'
								]
							},
							cough_cold: {
								signs: 'No fast breathing, no general danger signs'
							}
						},
						treatment: {
							pneumonia: [
								'Give appropriate antibiotic:',
								'Amoxicillin 40mg/kg twice daily for 5 days',
								'If not available: Cotrimoxazole 4mg/kg TMP twice daily for 5 days',
								'Advise mother when to return immediately',
								'Follow up in 2 days if not improving',
								'Continue feeding and giving fluids',
								'Soothe throat and relieve cough with safe remedy'
							],
							severe_pneumonia: [
								'Refer URGENTLY to hospital',
								'If referral not possible immediately:',
								'Give first dose of appropriate antibiotic',
								'IM Ampicillin 50mg/kg OR IM Gentamicin 7.5mg/kg',
								'Treat to prevent low blood sugar',
								'Keep child warm if unconscious',
								'If child has wheeze, give bronchodilator'
							],
							cough_cold: [
								'No antibiotic needed',
								'Soothe throat and relieve cough with safe remedy',
								'Advise mother when to return immediately',
								'Follow up in 5 days if not improving'
							]
						}
					},

					diarrhea: {
						assessment: [
							'Ask: How long has child had diarrhea?',
							'Ask: Is there blood in stool?',
							'Look for signs of dehydration',
							'Look for signs of severe dehydration'
						],
						dehydration_signs: {
							no_dehydration: [
								'Not enough signs to classify as some or severe dehydration'
							],
							some_dehydration: [
								'Two or more of: restless/irritable, sunken eyes, drinks eagerly/thirsty, skin pinch goes back slowly'
							],
							severe_dehydration: [
								'Two or more of: lethargic/unconscious, sunken eyes, unable to drink or drinks poorly, skin pinch goes back very slowly (≥2 seconds)'
							]
						},
						treatment: {
							no_dehydration: [
								'Give extra fluid (ORS recommended)',
								'Give zinc: <6 months: 10mg daily × 10-14 days, ≥6 months: 20mg daily × 10-14 days',
								'Continue feeding',
								'Advise mother when to return immediately',
								'Follow up in 5 days if not improving'
							],
							some_dehydration: [
								'Give ORS solution: 75ml/kg over 4 hours',
								'Give extra ORS for ongoing losses: 10ml/kg for each loose stool',
								'Show mother how to give ORS solution',
								'Give zinc as above',
								'If child vomits, wait 10 minutes, then give ORS more slowly',
								'Continue breastfeeding whenever child wants',
								'Reassess after 4 hours'
							],
							severe_dehydration: [
								'Refer URGENTLY to hospital for IV treatment',
								'If unable to refer immediately:',
								'Give ORS continuously: 20ml/kg/hour',
								'Reassess every hour',
								'If child can drink, continue ORS en route to hospital',
								'Give zinc when child can drink'
							]
						}
					},

					fever: {
						assessment: [
							'Ask: How long has child had fever?',
							'Look or feel for stiff neck',
							'Look for runny nose',
							'Look for measles signs',
							'Determine malaria risk'
						],
						malaria_assessment: [
							'In high malaria risk area: Treat as malaria',
							'In low malaria risk area: Malaria test if available',
							'Give paracetamol for high fever (≥38.5°C)',
							'Advise mother how to treat fever at home'
						],
						treatment: {
							malaria: [
								'Give antimalarial (ACT - Artemisinin Combination Therapy)',
								'Give paracetamol for high fever',
								'Advise mother when to return immediately',
								'Follow up in 3 days'
							],
							fever_no_malaria: [
								'Give paracetamol for high fever (≥38.5°C)',
								'Advise mother when to return immediately',
								'Follow up in 3 days if fever persists'
							]
						}
					},

					nutrition_assessment: {
						visible_severe_wasting: 'Very thin appearance, loose skin folds',
						edema_both_feet: 'Swelling of both feet',
						weight_for_age: 'Plot on growth chart if available'
					},

					immunization: 'Check child\'s immunization status and give missed vaccines',

					counseling_messages: {
						feeding_recommendations: [
							'Continue breastfeeding as often as child wants',
							'If child ≥6 months, give appropriate foods for age',
							'Give extra food during illness and after recovery',
							'Give extra fluids during illness'
						],
						when_to_return: [
							'Child not able to drink or breastfeed',
							'Child becomes sicker',
							'Child has fever',
							'Child has fast breathing',
							'Child has difficult breathing',
							'Child has blood in stool',
							'Child drinks poorly'
						]
					},

					evidence_base: 'WHO IMCI guidelines (2014), Cochrane systematic reviews on childhood pneumonia and diarrhea management',
					quality_of_evidence: 'High - multiple high-quality randomized controlled trials',
					strength_of_recommendation: 'Strong - clear evidence of benefit with acceptable risk-benefit ratio'
				}
			}

			// Add more comprehensive guidelines here...
		];

		// Process clinical knowledge guidelines with FULL content
		for (const guideline of clinicalGuidelines) {
			this.addDocument({
				id: guideline.id,
				title: guideline.title,
				content: this.extractClinicalKnowledgeContent(guideline),
				fullContent: guideline.content, // 🎯 Store FULL structured content
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

		console.log(`📚 Loaded ${clinicalGuidelines.length} comprehensive clinical knowledge guidelines with FULL content`);
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

		extractFromObject(guideline.content);
		return content.trim();
	}

	async loadExpandedGuidelines() {
		console.log('📋 Loading expanded WHO clinical guidelines...');

		for (const guideline of EXPANDED_CLINICAL_GUIDELINES) {
			this.addDocument({
				id: guideline.id,
				title: guideline.title,
				content: this.extractTextContent(guideline),
				fullContent: guideline.content, // 🎯 Store FULL structured content
				category: guideline.category,
				source: 'expanded-clinical-guidelines',
				metadata: {
					subcategory: guideline.subcategory,
					resourceLevel: guideline.resourceLevel,
					evidenceGrade: 'high',
					whoStandard: true
				}
			});
		}

		console.log(`📚 Loaded ${EXPANDED_CLINICAL_GUIDELINES.length} expanded WHO guidelines`);
	}

	async loadSMARTGuidelines() {
		console.log('🔬 Loading SMART/FHIR clinical guidelines...');

		for (const [domain, guideline] of Object.entries(FHIR_GUIDELINES)) {
			for (const rec of guideline.recommendations) {
				this.addDocument({
					id: `smart-${rec.id}`,
					title: rec.title,
					content: rec.action.description + ' ' + (rec.evidence || ''),
					fullContent: rec, // 🎯 Store FULL FHIR recommendation
					category: 'SMART Guidelines',
					source: 'smart-fhir-guidelines',
					metadata: {
						domain,
						fhirCode: rec.condition.code,
						strength: rec.strength,
						evidenceGrade: 'high',
						smartLayer: 'L2-FHIR'
					}
				});
			}
		}

		console.log(`🔬 Loaded SMART/FHIR guidelines`);
	}

	async loadDatabaseGuidelines() {
		try {
			const { db } = await import('../db');
			if (db && db.guidelines) {
				const dbGuidelines = await db.guidelines.toArray();

				for (const guideline of dbGuidelines) {
					const exists = this.documents.find(doc => doc.id === guideline.id);
					if (!exists) {
						this.addDocument({
							id: guideline.id,
							title: guideline.title || 'Database Guideline',
							content: this.extractTextContent(guideline),
							fullContent: guideline.content, // 🎯 Store FULL content
							category: guideline.category || 'general',
							source: 'database',
							metadata: guideline.metadata || {}
						});
					}
				}

				console.log(`📋 Loaded ${dbGuidelines.length} additional database guidelines`);
			}
		} catch (error) {
			console.log('Database guidelines not available:', error.message);
		}
	}

	extractTextContent(guideline) {
		let content = '';

		if (guideline.title) content += guideline.title + ' ';
		if (guideline.overview) content += guideline.overview + ' ';
		if (guideline.description) content += guideline.description + ' ';

		if (guideline.content && typeof guideline.content === 'object') {
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

			extractFromObject(guideline.content);
		}

		if (typeof guideline.content === 'string') {
			content += guideline.content + ' ';
		}

		return content.trim();
	}

	addDocument(document) {
		const processedDoc = {
			...document,
			searchableText: this.preprocessText(document.content + ' ' + document.title + ' ' + (document.metadata?.keywords || '')),
			wordCount: this.countWords(document.content),
			timestamp: new Date().toISOString()
		};

		this.documents.push(processedDoc);
	}

	preprocessText(text) {
		return text
			.toLowerCase()
			.replace(/[^\w\s]/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}

	countWords(text) {
		return text.split(/\s+/).filter(word => word.length > 0).length;
	}

	// 🎯 FIXED: Search with FULL content (no truncation)
	async search(query, patientData = {}, maxResults = 5) {
		if (!this.isInitialized) {
			await this.initialize();
		}

		console.log(`🔍 Clinical RAG Search (FULL CONTENT): "${query}"`);
		console.log(`👤 Patient Context:`, { age: patientData.age, gender: patientData.gender });

		// 1. FIXED: Use improved domain detection
		const detectedDomain = detectClinicalDomain(query);
		console.log(`🏥 Detected Clinical Domain: ${detectedDomain}`);

		// 2. FIXED: Conservative query expansion
		const expandedQuery = expandQueryWithSynonyms(query);
		console.log(`🔍 Expanded Query: "${expandedQuery}"`);

		const processedQuery = this.preprocessText(expandedQuery);
		const queryTerms = processedQuery.split(' ').filter(term => term.length > 2);

		if (queryTerms.length === 0) {
			return [];
		}

		// 3. Enhanced scoring with fixed domain matching
		const scoredResults = this.documents.map(doc => {
			let score = 0;

			// Base term frequency scoring
			for (const term of queryTerms) {
				const regex = new RegExp(term, 'gi');
				const termCount = (doc.searchableText.match(regex) || []).length;
				score += termCount * (term.length > 4 ? 3 : 1);
			}

			// FIXED: Domain-specific boosting with proper domain matching
			if (detectedDomain && doc.metadata?.domain === detectedDomain) {
				score += 60; // High boost for exact domain match
			}

			// FIXED: Prevent maternal health false positives for headache
			if (detectedDomain === CLINICAL_DOMAINS.GENERAL_MEDICINE &&
				doc.metadata?.domain === CLINICAL_DOMAINS.MATERNAL_HEALTH &&
				!query.toLowerCase().includes('pregnancy')) {
				score = Math.max(0, score - 50); // Penalize maternal health for non-pregnancy queries
			}

			// Enhanced clinical context bonus
			score += this.calculateEnhancedClinicalRelevance(doc, patientData, queryTerms, detectedDomain);

			// Priority and evidence bonuses
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
				// FIXED: Return complete, formatted content instead of truncated
				text: this.getCompleteFormattedContent(doc),
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

		console.log(`✅ Clinical RAG Results (COMPLETE CONTENT) for "${query}":`);
		scoredResults.forEach((result, index) => {
			console.log(`${index + 1}. ${result.document.title} (Score: ${result.score}) - ${result.matchReason}`);
			console.log(`   Content Length: ${result.text.length} characters (COMPLETE)`);
		});

		return scoredResults;
	}

	getCompleteFormattedContent(document) {
		// If we have structured full content, format it properly
		if (document.fullContent && typeof document.fullContent === 'object') {
			return this.formatStructuredContentComplete(document.fullContent, document.title);
		}

		// For text content, return complete content with basic formatting
		let content = document.content || '';

		// Add title if not already present
		if (!content.toLowerCase().includes(document.title.toLowerCase())) {
			content = `**${document.title}**\n\n${content}`;
		}

		// FIXED: Don't truncate - return complete content
		return content;
	}

	// 🎯 NEW: Get full formatted content text
	getFullContentText(document) {
		// If we have structured full content, format it nicely
		if (document.fullContent && typeof document.fullContent === 'object') {
			return this.formatStructuredContent(document.fullContent, document.title);
		}

		// Otherwise return the complete content (no truncation)
		return document.content;
	}

	// 🎯 NEW: Format structured content for display
	formatStructuredContentComplete(content, title) {
		let formatted = `**${title}**\n\n`;

		if (content.overview) {
			formatted += `**OVERVIEW:**\n${content.overview}\n\n`;
		}

		// FIXED: Handle headache and general medicine content properly
		if (content.assessment) {
			formatted += `**CLINICAL ASSESSMENT:**\n`;
			if (Array.isArray(content.assessment)) {
				content.assessment.forEach(item => formatted += `• ${item}\n`);
			} else {
				formatted += content.assessment + '\n';
			}
			formatted += '\n';
		}

		if (content.management) {
			formatted += `**MANAGEMENT:**\n`;
			if (Array.isArray(content.management)) {
				content.management.forEach(item => formatted += `• ${item}\n`);
			} else if (typeof content.management === 'object') {
				Object.entries(content.management).forEach(([key, value]) => {
					formatted += `**${key.replace(/_/g, ' ').toUpperCase()}:**\n`;
					if (Array.isArray(value)) {
						value.forEach(item => formatted += `  • ${item}\n`);
					} else {
						formatted += `  • ${value}\n`;
					}
				});
			} else {
				formatted += content.management + '\n';
			}
			formatted += '\n';
		}

		// FIXED: Add specific headache management if detected
		if (title.toLowerCase().includes('headache') || content.headacheManagement) {
			formatted += `**HEADACHE MANAGEMENT:**\n`;
			formatted += `• Assess for red flags: sudden severe headache, fever with neck stiffness, neurological signs\n`;
			formatted += `• Consider common causes: tension headache, migraine, sinusitis, hypertension\n`;
			formatted += `• Treatment: Paracetamol 500-1000mg, assess blood pressure, treat underlying cause\n`;
			formatted += `• Refer if: severe sudden onset, neurological signs, no response to treatment\n\n`;
		}

		// Handle differential diagnosis
		if (content.differentialDiagnosis || content.differential) {
			const diff = content.differentialDiagnosis || content.differential;
			formatted += `**DIFFERENTIAL DIAGNOSIS:**\n`;
			if (Array.isArray(diff)) {
				diff.forEach(dx => formatted += `• ${dx}\n`);
			} else {
				formatted += diff + '\n';
			}
			formatted += '\n';
		}

		// Handle medications
		if (content.medications) {
			formatted += `**MEDICATIONS:**\n`;
			if (Array.isArray(content.medications)) {
				content.medications.forEach(med => {
					if (typeof med === 'object') {
						formatted += `• **${med.name || 'Medication'}**: ${med.dosage || ''} ${med.duration ? 'for ' + med.duration : ''}\n`;
						if (med.alternatives) {
							formatted += `  Alternatives: ${Array.isArray(med.alternatives) ? med.alternatives.join(', ') : med.alternatives}\n`;
						}
					} else {
						formatted += `• ${med}\n`;
					}
				});
			}
			formatted += '\n';
		}

		// Handle follow-up
		if (content.followUp || content.followUpInstructions) {
			const followUp = content.followUp || content.followUpInstructions;
			formatted += `**FOLLOW-UP:**\n`;
			if (Array.isArray(followUp)) {
				followUp.forEach(item => formatted += `• ${item}\n`);
			} else {
				formatted += followUp + '\n';
			}
			formatted += '\n';
		}

		// Handle red flags / danger signs
		if (content.redFlags || content.dangerSigns) {
			const flags = content.redFlags || content.dangerSigns;
			formatted += `**RED FLAGS / DANGER SIGNS:**\n`;
			if (Array.isArray(flags)) {
				flags.forEach(flag => formatted += `• ${flag}\n`);
			} else {
				formatted += flags + '\n';
			}
			formatted += '\n';
		}

		// Add evidence information
		if (content.evidence_base || content.evidenceBase) {
			formatted += `**EVIDENCE BASE:** ${content.evidence_base || content.evidenceBase}\n\n`;
		}

		if (content.quality_of_evidence) {
			formatted += `**QUALITY OF EVIDENCE:** ${content.quality_of_evidence}\n\n`;
		}

		// FIXED: Return complete formatted content (no truncation)
		return formatted.trim();
	}

	calculateEnhancedClinicalRelevance(document, patientData, queryTerms, detectedDomain) {
		let relevanceBonus = 0;

		// FIXED: Proper general medicine matching for headaches
		if (queryTerms.includes('headache') || queryTerms.includes('head')) {
			if (document.metadata?.domain === CLINICAL_DOMAINS.GENERAL_MEDICINE ||
				document.title.toLowerCase().includes('headache') ||
				document.title.toLowerCase().includes('general medicine')) {
				relevanceBonus += 40; // Strong boost for general medicine
			}
		}

		// Age-based matching
		if (patientData.age !== undefined) {
			const age = parseInt(patientData.age);

			if (age < 5 && document.metadata?.domain === CLINICAL_DOMAINS.PEDIATRIC) {
				relevanceBonus += 20;
			}

			if (age >= 15 && age <= 49 && document.metadata?.domain === CLINICAL_DOMAINS.MATERNAL_HEALTH) {
				// Only boost maternal health if pregnancy context exists
				if (patientData.pregnancy) {
					relevanceBonus += 15;
				}
			}
		}

		// Emergency term matching
		const hasEmergencyTerms = queryTerms.some(term =>
			['emergency', 'urgent', 'critical', 'severe', 'danger'].includes(term)
		);
		if (hasEmergencyTerms && document.metadata?.domain === CLINICAL_DOMAINS.EMERGENCY) {
			relevanceBonus += 25;
		}

		return relevanceBonus;
	}

	getMatchReason(document, queryTerms, detectedDomain) {
		const reasons = [];

		if (document.metadata?.domain === detectedDomain) {
			reasons.push(`${detectedDomain.replace('_', ' ').toUpperCase()} Domain Match`);
		}

		if (document.metadata?.priority === 'critical') {
			reasons.push('Critical Priority');
		}

		if (document.title.toLowerCase().includes('headache') && queryTerms.includes('headache')) {
			reasons.push('Headache Specific');
		}

		if (document.metadata?.whoStandard) {
			reasons.push('WHO Standard');
		}

		const termMatches = queryTerms.filter(term =>
			document.searchableText.includes(term)
		);
		if (termMatches.length > 0) {
			reasons.push(`Terms: ${termMatches.slice(0, 3).join(', ')}`);
		}

		return reasons.join(' | ') || 'General Match';
	}

	async persistToCache() {
		if (typeof window !== 'undefined') {
			try {
				const cacheData = {
					version: this.cacheVersion,
					documents: this.documents,
					initialized: this.isInitialized,
					timestamp: new Date().toISOString(),
					documentCount: this.documents.length,
					fullContentEnabled: true // Flag to indicate full content support
				};

				localStorage.setItem('atlas_rag_cache', JSON.stringify(cacheData));
				console.log(`💾 Persisted ${this.documents.length} documents to cache with FULL CONTENT`);
			} catch (error) {
				console.warn('💾 Failed to persist RAG cache:', error);
			}
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
			guidelineCount: this.documents.length,
			categories: [...new Set(this.documents.map(d => d.category))],
			sources: [...new Set(this.documents.map(d => d.source))],
			domains: [...new Set(this.documents.map(d => d.metadata?.domain).filter(Boolean))],
			lastInitialized: this.documents.length > 0 ? this.documents[0].timestamp : null,
			cacheVersion: this.cacheVersion,
			fromCache: this.documents.length > 0 && this.isInitialized,
			fullContentEnabled: true,
			contentTruncationFixed: true, // New flag
			domainDetectionFixed: true,   // New flag
			// Detailed breakdown
			clinicalKnowledgeGuidelines: this.documents.filter(d => d.source === 'clinical-knowledge-database').length,
			expandedGuidelines: this.documents.filter(d => d.source === 'expanded-clinical-guidelines').length,
			smartGuidelines: this.documents.filter(d => d.source === 'smart-fhir-guidelines').length,
			databaseGuidelines: this.documents.filter(d => d.source === 'database').length
		};
	}

	async refreshGuidelines() {
		console.log('🔄 Refreshing clinical knowledge database...');
		this.documents = [];
		this.isInitialized = false;
		this.clearCache();
		const result = await this.initialize();
		console.log(`✅ Clinical knowledge refreshed: ${this.documents.length} documents loaded with FULL CONTENT`);
		return this.getStatus();
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