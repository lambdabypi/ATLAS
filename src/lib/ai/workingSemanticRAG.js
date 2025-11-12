// src/lib/ai/workingSemanticRAG.js
// Properly configured Transformers.js embeddings

export class WorkingSemanticRAG {
	constructor() {
		this.documents = [];
		this.embeddings = new Map();
		this.isInitialized = false;
		this.embedder = null;

		// Medical term normalizations
		this.medicalNormalizations = new Map([
			['head ache', 'headache'],
			['stomach ache', 'stomachache'],
			['back pain', 'backpain'],
			['chest pain', 'chestpain'],
			['difficulty breathing', 'dyspnea'],
			['shortness of breath', 'dyspnea'],
			['high blood pressure', 'hypertension'],
			['low blood pressure', 'hypotension'],
			['heart attack', 'myocardial infarction'],
			['stroke', 'cerebrovascular accident'],
			['diabetes', 'diabetes mellitus'],
			['high sugar', 'hyperglycemia'],
			['low sugar', 'hypoglycemia']
		]);
	}

	async initialize() {
		try {
			console.log('🧠 Initializing Working Semantic RAG...');

			await this.loadClinicalDocuments();
			await this.initializeEmbeddings();
			await this.generateDocumentEmbeddings();

			this.isInitialized = true;
			console.log(`✅ Working Semantic RAG initialized with ${this.documents.length} documents`);

			return { success: true, message: 'Working Semantic RAG initialized' };

		} catch (error) {
			console.error('❌ Working Semantic RAG initialization failed:', error);
			return { success: false, error: error.message };
		}
	}

	async initializeEmbeddings() {
		try {
			console.log('🔄 Loading Transformers.js embeddings...');

			// Import and configure Transformers.js
			const { pipeline, env } = await import('@xenova/transformers');

			// Configure environment for browser usage
			env.allowLocalModels = false;
			env.allowRemoteModels = true;
			env.useBrowserCache = true;
			env.useCustomCache = true;

			// Use a smaller, faster model that works well in browsers
			console.log('📦 Loading sentence-transformers model...');

			this.embedder = await pipeline(
				'feature-extraction',
				'Xenova/all-MiniLM-L6-v2',
				{
					// Progress callback to show loading progress
					progress_callback: (progress) => {
						if (progress.status === 'downloading') {
							console.log(`📥 Downloading model: ${Math.round(progress.progress || 0)}%`);
						} else if (progress.status === 'loading') {
							console.log(`🔄 Loading model components...`);
						}
					}
				}
			);

			console.log('✅ Transformers.js embeddings loaded successfully!');
			return true;

		} catch (error) {
			console.error('❌ Failed to load Transformers.js:', error);
			throw new Error(`Embeddings loading failed: ${error.message}`);
		}
	}

	async loadClinicalDocuments() {
		try {
			const { LightweightRAG } = await import('../rag/lightweightRAG');
			const rag = new LightweightRAG();
			await rag.initialize();

			this.documents = rag.documents.map(doc => ({
				id: doc.id || crypto.randomUUID(),
				title: doc.title,
				content: doc.content,
				fullContent: doc.fullContent,
				domain: doc.metadata?.domain,
				priority: doc.metadata?.priority,
				keywords: this.extractMedicalKeywords(doc.content),
				normalizedContent: this.normalizeMedicalTerms(doc.content)
			}));

			console.log(`📚 Loaded ${this.documents.length} clinical documents`);

		} catch (error) {
			console.error('Failed to load documents:', error);
			throw error;
		}
	}

	normalizeMedicalTerms(text) {
		let normalized = text.toLowerCase();

		for (const [variant, standard] of this.medicalNormalizations) {
			const regex = new RegExp(variant.replace(/\s+/g, '\\s+'), 'gi');
			normalized = normalized.replace(regex, standard);
		}

		return normalized;
	}

	extractMedicalKeywords(content) {
		const medicalKeywords = [];
		const text = content.toLowerCase();

		const patterns = [
			/\b(symptom|symptoms)\b/g,
			/\b(diagnos[ie]s)\b/g,
			/\b(treatment|therapy)\b/g,
			/\b(medication|medicine|drug)\b/g,
			/\b(patient|condition|disease)\b/g,
			/\b(assessment|management|follow.?up)\b/g
		];

		patterns.forEach(pattern => {
			const matches = text.match(pattern);
			if (matches) medicalKeywords.push(...matches);
		});

		return [...new Set(medicalKeywords)];
	}

	async generateDocumentEmbeddings() {
		console.log('🔄 Generating real embeddings for all documents...');

		let successCount = 0;
		const totalDocs = this.documents.length;

		for (let i = 0; i < this.documents.length; i++) {
			const doc = this.documents[i];

			try {
				console.log(`🔧 Processing document ${i + 1}/${totalDocs}: ${doc.title}`);

				const embedding = await this.getEmbedding(doc.normalizedContent);
				this.embeddings.set(doc.id, embedding);
				successCount++;

				// Show progress
				if ((i + 1) % 5 === 0) {
					console.log(`📊 Progress: ${i + 1}/${totalDocs} documents processed`);
				}

			} catch (error) {
				console.error(`❌ Failed to generate embedding for ${doc.title}:`, error);
				throw new Error(`Embedding generation failed for ${doc.title}: ${error.message}`);
			}
		}

		console.log(`✅ Successfully generated ${successCount}/${totalDocs} real embeddings!`);
	}

	async getEmbedding(text) {
		if (!this.embedder) {
			throw new Error('Embedder not initialized');
		}

		try {
			const normalizedText = this.normalizeMedicalTerms(text);

			// Truncate text if too long (models have token limits)
			const truncatedText = normalizedText.substring(0, 500);

			console.log(`🔍 Getting embedding for: "${truncatedText.substring(0, 50)}..."`);

			const output = await this.embedder(truncatedText, { pooling: 'mean', normalize: true });
			const embedding = Array.from(output.data);

			console.log(`✅ Generated ${embedding.length}-dim embedding`);
			return embedding;

		} catch (error) {
			console.error('Embedding generation error:', error);
			throw error;
		}
	}

	async semanticSearch(query, patientData = {}, maxResults = 5) {
		if (!this.isInitialized) {
			await this.initialize();
		}

		console.log(`🔍 Real semantic search for: "${query}"`);

		const normalizedQuery = this.normalizeMedicalTerms(query);
		const enhancedQuery = this.enhanceQueryWithContext(normalizedQuery, patientData);

		console.log(`🔧 Enhanced query: "${enhancedQuery}"`);

		// Get real query embedding
		const queryEmbedding = await this.getEmbedding(enhancedQuery);
		console.log(`✅ Got query embedding (${queryEmbedding.length} dimensions)`);

		// Calculate cosine similarity with all document embeddings
		const similarities = [];

		for (const doc of this.documents) {
			const docEmbedding = this.embeddings.get(doc.id);
			if (!docEmbedding) continue;

			const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
			const boostedScore = this.applyClinicalBoosts(similarity, doc, patientData, normalizedQuery);

			similarities.push({
				document: doc,
				similarity: similarity,
				boostedScore: boostedScore,
				relevantKeywords: this.findRelevantKeywords(doc.keywords, normalizedQuery)
			});
		}

		const results = similarities
			.filter(result => result.boostedScore > 0.1)
			.sort((a, b) => b.boostedScore - a.boostedScore)
			.slice(0, maxResults);

		console.log(`✅ Found ${results.length} semantically relevant documents:`);
		results.forEach((result, idx) => {
			console.log(`  ${idx + 1}. ${result.document.title}`);
			console.log(`     Real similarity: ${result.similarity.toFixed(4)}`);
			console.log(`     Boosted score: ${result.boostedScore.toFixed(4)}`);
			console.log(`     Domain: ${result.document.domain}`);
		});

		return results;
	}

	cosineSimilarity(a, b) {
		if (a.length !== b.length) {
			console.warn(`Vector length mismatch: ${a.length} vs ${b.length}`);
			return 0;
		}

		let dotProduct = 0;
		let normA = 0;
		let normB = 0;

		for (let i = 0; i < a.length; i++) {
			dotProduct += a[i] * b[i];
			normA += a[i] * a[i];
			normB += b[i] * b[i];
		}

		const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
		return magnitude === 0 ? 0 : dotProduct / magnitude;
	}

	enhanceQueryWithContext(query, patientData) {
		let enhanced = query;

		if (patientData.age) {
			if (patientData.age < 5) enhanced += ' pediatric child infant';
			else if (patientData.age > 65) enhanced += ' elderly geriatric';
			else if (patientData.age >= 15 && patientData.age <= 49) enhanced += ' adult reproductive';
		}

		if (patientData.gender) {
			if (patientData.gender.toLowerCase().includes('female')) {
				enhanced += ' female woman pregnancy maternal';
			} else if (patientData.gender.toLowerCase().includes('male')) {
				enhanced += ' male man';
			}
		}

		return enhanced;
	}

	applyClinicalBoosts(similarity, doc, patientData, query) {
		let boosted = similarity;

		if (doc.domain && this.isRelevantDomain(doc.domain, query)) {
			boosted *= 1.3;
		}

		if (doc.priority === 'critical') boosted *= 1.2;
		else if (doc.priority === 'high') boosted *= 1.1;

		if (patientData.age && this.isAgeAppropriate(doc, patientData.age)) {
			boosted *= 1.2;
		}

		if (patientData.gender && this.isGenderAppropriate(doc, patientData.gender)) {
			boosted *= 1.15;
		}

		return Math.min(boosted, 1.0);
	}

	isRelevantDomain(docDomain, query) {
		const domainKeywords = {
			'maternal-health': ['pregnancy', 'pregnant', 'maternal', 'birth', 'delivery'],
			'pediatric': ['child', 'infant', 'pediatric', 'baby'],
			'emergency': ['urgent', 'emergency', 'critical', 'severe'],
			'general-medicine': ['headache', 'fever', 'cough', 'pain']
		};

		const keywords = domainKeywords[docDomain] || [];
		return keywords.some(keyword => query.includes(keyword));
	}

	isAgeAppropriate(doc, age) {
		const content = doc.content.toLowerCase();

		if (age < 5 && content.includes('pediatric')) return true;
		if (age > 65 && content.includes('elderly')) return true;
		if (age >= 15 && age <= 49 && content.includes('adult')) return true;

		return true;
	}

	isGenderAppropriate(doc, gender) {
		const content = doc.content.toLowerCase();
		const isPregnancyRelated = content.includes('pregnancy') || content.includes('maternal');

		if (isPregnancyRelated && !gender.toLowerCase().includes('female')) {
			return false;
		}

		return true;
	}

	findRelevantKeywords(docKeywords, query) {
		const queryTerms = query.split(/\s+/);
		return docKeywords.filter(keyword =>
			queryTerms.some(term =>
				keyword.includes(term) || term.includes(keyword)
			)
		);
	}
}