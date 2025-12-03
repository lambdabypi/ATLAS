# ATLAS - Adaptive Triage and Local Advisory System

[![PWA Score](https://img.shields.io/badge/PWA-100%2F100-success)]()
[![WHO Alignment](https://img.shields.io/badge/WHO%20Alignment-80%25-green)]()
[![Offline Support](https://img.shields.io/badge/Offline-95%25-brightgreen)]()
[![License](https://img.shields.io/badge/License-MIT-blue)]()

> AI-Enhanced Clinical Decision Support System for Resource-Limited Healthcare Settings

ATLAS is a Progressive Web Application (PWA) that combines offline-first architecture with Google Gemini AI to provide clinical decision support in environments with limited infrastructure. Built as part of a Master's thesis at Northeastern University's Data Analytics Engineering program.

## 🎯 Project Overview

### Problem Statement
Healthcare providers in resource-limited settings serve 3.6 billion people worldwide without reliable internet connectivity, advanced hardware, or consistent access to specialist knowledge. Existing clinical decision support systems are either:
- **Too sophisticated**: Require continuous connectivity and expensive infrastructure (Epic, IBM Watson)
- **Too limited**: Lack AI capabilities and sophisticated clinical reasoning (IMCI Digital, CommCare)

### Solution
ATLAS bridges this gap by providing:
- ✅ **Offline-first architecture** - Full functionality without internet (95% reliability)
- ✅ **AI-powered recommendations** - Google Gemini integration with 80% WHO guideline alignment
- ✅ **Progressive Web App** - Works across devices without app store deployment
- ✅ **Hybrid intelligence** - Seamless fallback from Gemini API → RAG → Rule-based systems
- ✅ **WHO-aligned protocols** - Evidence-based clinical guidelines integration

## 📊 Performance Metrics

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| PWA Score | >90/100 | 100/100 | ✅ |
| Offline Functionality | >95% | 95% | ✅ |
| WHO Alignment | >75% | 80% | ✅ |
| Transaction Reliability | >99% | 99.97% | ✅ |
| Load Time (3G) | <3s | 2.8s | ✅ |
| AI Response Time (online) | <20s | 14.5s | ✅ |
| AI Response Time (offline) | <500ms | 180ms | ✅ |

## 🏗️ Architecture

### System Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│           User Interface Layer (Next.js 14)             │
│  React Components • Tailwind CSS • Service Worker      │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Business Logic Layer                       │
│  Patient Mgmt • Consultation Logic • Gemini Integration│
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Data Persistence Layer                        │
│  IndexedDB (Client-Side Only) • Dexie.js ORM           │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Synchronization Layer                         │
│  Offline Queue • Smart Sync • Background Sync API      │
│        (Built but not currently used)                  │
└─────────────────────────────────────────────────────────┘
```

### Hybrid AI Architecture

```
Clinical Query
      ↓
   Online? ─── Yes ──→ Gemini 2.5 Flash API
      │                      ↓
     No              (RAG context enrichment)
      ↓                      ↓
   Clinical RAG ←────── Enriched Response
      ↓
  Local Response
```

**Three-Tier Fallback Chain:**
1. **Primary**: Google Gemini 2.5 Flash (online, 15s timeout)
2. **Secondary**: Clinical RAG with Embeddings (offline, 180ms avg)
3. **Tertiary**: Rule-based Emergency Protocols

### Current Architecture Status

⚠️ **Important**: ATLAS currently operates as a **100% client-side PWA**:
- ✅ All data stored in browser IndexedDB (no server database usage)
- ✅ All AI processing through direct client → Gemini API calls
- ✅ Complete offline functionality through local storage
- 🔧 Backend API built but **not actively used** (ready for future sync features)

This design enables the 95% offline reliability and ensures healthcare workflow continuity regardless of server availability.

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0

# For Evaluation & Testing
Python >= 3.9 (for validation framework)
R >= 4.0 (for statistical analysis)

# Optional (for backend - currently unused)
SQLite3
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/atlas.git
cd atlas

# Install frontend dependencies
npm install

# Install Python evaluation dependencies
cd evaluation
pip install -r requirements.txt
cd ..

# Optional: Install backend dependencies (for future sync features)
cd atlas-backend
npm install
cd ..
```

### Environment Configuration

Create `.env.local` in the project root:

```env
# Google Gemini API (Required)
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API (Optional - not currently used)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Service Worker (production)
NEXT_PUBLIC_SW_ENABLED=true

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_INPUT=false
NEXT_PUBLIC_ENABLE_OFFLINE_SYNC=false
```

### Development

```bash
# Start frontend (main application)
npm run dev
# Access at http://localhost:3000

# Optional: Start backend (for future sync features)
cd atlas-backend
npm start
# API runs at http://localhost:3001 (not used by frontend)
```

### Production Build

```bash
# Build frontend
npm run build
npm start

# Backend is optional for current functionality
```

## 📁 Project Structure

### Frontend (`/src`)

```
src/
├── app/                          # Next.js 14 App Router
│   ├── layout.js                 # Root layout with providers
│   ├── page.js                   # Landing page
│   ├── consultation/             # Consultation workflows
│   │   ├── page.js               # Consultation list
│   │   ├── new/page.js           # Form selection
│   │   └── [id]/page.js          # Consultation detail
│   ├── dashboard/                # Main dashboard
│   ├── patients/                 # Patient management
│   ├── guidelines/               # Clinical reference
│   └── testing/                  # Development testing
│
├── components/                   # React components
│   ├── auth/                     # Authentication
│   │   └── UserSelection.jsx    # Role-based login
│   ├── clinical/                 # Clinical tools
│   │   ├── ClinicalGuidelines.jsx
│   │   └── VoiceInput.jsx
│   ├── consultation/             # Consultation forms
│   │   ├── ConsultationForm.jsx           # Standard form
│   │   └── EnhancedConsultationForm.jsx   # AI-enhanced form
│   ├── layout/                   # Layout components
│   │   ├── AppShell.jsx
│   │   └── Navigation.jsx
│   ├── patient/                  # Patient components
│   │   ├── PatientList.jsx
│   │   └── PatientRecord.jsx
│   └── ui/                       # Reusable UI components
│       ├── AIAnalysisDisplay.jsx
│       ├── Button.jsx
│       ├── Card.jsx
│       └── [other components]
│
├── lib/                          # Core libraries
│   ├── ai/                       # AI integration
│   │   ├── gemini.js            # Gemini API client
│   │   ├── enhancedHybridAI.js  # Hybrid selector
│   │   ├── clinicalRAGSystem.js # RAG implementation
│   │   ├── workingSemanticRAG.js # Embeddings RAG
│   │   └── prompts.js           # Clinical prompts
│   ├── clinical/                 # Clinical knowledge
│   │   ├── clinicalKnowledgeDatabase.js
│   │   └── smartGuidelines.js
│   ├── db/                       # Database layer (IndexedDB only)
│   │   ├── index.js             # Dexie.js setup
│   │   ├── patients.js          # Patient CRUD
│   │   ├── consultations.js     # Consultation CRUD
│   │   └── reference.js         # Guidelines storage
│   ├── sync/                     # Synchronization (future use)
│   │   ├── consultation-sync.js
│   │   ├── patient-sync.js
│   │   └── prioritized-sync.js
│   └── utils/                    # Utilities
│       ├── validation.js
│       └── date.js
│
└── styles/                       # Global styles
    └── globals.css
```

### Backend (`/atlas-backend`) - Built but Unused

```
atlas-backend/
├── routes/                       # API routes (ready for future sync)
│   ├── auth.js                   # Authentication endpoints
│   ├── consultations.js          # Consultation CRUD
│   ├── patients.js               # Patient CRUD
│   ├── performance.js            # Metrics endpoints
│   └── reference.js              # Guidelines API
│
├── database/                     # Database setup
│   └── init.js                   # SQLite initialization
│
├── data/                         # Data storage
│   ├── atlas.db                  # Main database
│   ├── atlas.db-shm             # Shared memory
│   └── atlas.db-wal             # Write-ahead log
│
└── server.js                     # Express server
```

### Evaluation Framework (`/evaluation`)

```
evaluation/
├── config/                       # Test configuration
│   └── test_config.json         # Evaluation parameters
│
├── data/                         # Evaluation datasets
│   ├── expert_surveys/           # Clinical expert assessments
│   ├── framework_assessments/    # NASSS & RE-AIM evaluations
│   └── synthetic_scenarios/      # WHO-aligned test cases
│
├── results/                      # Evaluation outputs
│   ├── clinical_validation/      # Clinical reasoning results
│   ├── performance_metrics/      # Technical performance data
│   └── reports/                  # Generated analysis reports
│
└── scripts/                      # Evaluation tools
    ├── ai_testing_results.csv    # AI performance data
    ├── atlas_data_analysis.py    # Main Python analysis
    ├── atlas_evaluation_analysis.R # R statistical analysis
    ├── atlas_live_testing.py     # Live system testing
    ├── lighthouse_results.json   # PWA performance data
    ├── test_scenarios.csv        # Test scenario definitions
    │
    ├── evaluation_results/       # Processed results
    │   ├── atlas_evaluation_dashboard.png
    │   ├── atlas_evaluation_report.json
    │   ├── clinical_validation_results.csv
    │   ├── nasss_assessment.csv
    │   ├── performance_metrics.csv
    │   └── reaim_assessment.csv
    │
    └── live_test_results/        # Live testing outputs
        ├── atlas_live_test_report.json
        └── test_summary.csv
```

## 🔧 Core Technologies

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Client DB**: IndexedDB (via Dexie.js) - **Primary data storage**
- **PWA**: Service Workers + Cache API
- **AI Client**: Google Gemini API SDK

### Backend Stack (Future Sync Features)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **ORM**: None (raw SQL for simplicity)
- **API Style**: RESTful

### Evaluation & Testing Stack
- **Core Analysis**: Python 3.9+
  - pandas, numpy for data analysis
  - matplotlib, seaborn for visualization
  - scikit-learn for statistical validation
- **Statistical Analysis**: R 4.0+
  - Advanced statistical modeling
  - Research-grade analysis frameworks
- **Performance Testing**: Lighthouse CI, Jest
- **Clinical Validation**: Custom WHO-aligned scenario framework

### AI/ML Stack
- **Online AI**: Google Gemini 2.5 Flash
- **Offline Embeddings**: Xenova/all-MiniLM-L6-v2
- **Embedding Engine**: Transformers.js (WebAssembly)
- **Vector Search**: Cosine similarity (in-memory)

## 💾 Data Architecture

### IndexedDB Schema (Client-Side Only - Primary Storage)

```javascript
// Dexie.js Schema Definition
const db = new Dexie('ATLASDatabase');
db.version(1).stores({
  patients: 'patientId, name, uhid, dateOfBirth, lastModified',
  consultations: 'consultationId, patientId, date, providerId, lastModified',
  guidelines: 'guidelineId, category, domain, title',
  syncQueue: '++id, timestamp, priority, type, status'  // Future use
});
```

**Storage Capacity**: 50% of available disk space per origin (browser-dependent)
**Persistence**: Managed by StoragePersistenceManager for reliability across browser sessions

### SQLite Schema (Server-Side - Future Sync Only)

```sql
-- Built but currently unused - ready for multi-user deployment
-- Patients Table
CREATE TABLE patients (
  patient_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  uhid TEXT UNIQUE,
  date_of_birth TEXT,
  gender TEXT,
  contact_number TEXT,
  medical_history TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Consultations Table
CREATE TABLE consultations (
  consultation_id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  provider_id TEXT,
  consultation_date DATETIME,
  chief_complaint TEXT,
  clinical_notes TEXT,
  ai_recommendations TEXT,
  treatment_plan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);
```

## 🤖 AI Integration Details

### Google Gemini Configuration

```javascript
// lib/ai/gemini.js
const generationConfig = {
  temperature: 0.7,           // Balanced creativity/consistency
  topP: 0.95,                // Nucleus sampling
  topK: 40,                  // Top-k sampling
  maxOutputTokens: 1000,     // Response length limit
  responseMimeType: "text/plain"
};

const safetySettings = [
  { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
  { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
];
```

### Clinical Prompt Engineering

```javascript
// lib/ai/prompts.js
const CLINICAL_SYSTEM_PROMPT = `
You are ATLAS, an AI clinical decision support assistant for resource-limited healthcare settings.

CORE PRINCIPLES:
1. Follow WHO clinical guidelines and evidence-based protocols
2. Consider available resources and local constraints
3. Prioritize patient safety above all else
4. Provide clear, actionable recommendations
5. Identify when specialist referral is necessary

RESPONSE STRUCTURE:
- Differential Diagnosis (ranked by likelihood)
- Recommended Assessments (prioritized by urgency/availability)
- Treatment Suggestions (resource-appropriate)
- Referral Recommendations (when needed)
- Follow-up Planning

CONSTRAINTS:
- Assume limited diagnostic equipment
- Consider medication availability
- Factor in transportation barriers
- Account for provider training level
`;
```

### RAG System Architecture

```javascript
// lib/ai/workingSemanticRAG.js

// 1. Embedding Generation (initialization)
async function generateEmbeddings(documents) {
  const extractor = await pipeline('feature-extraction', 
    'Xenova/all-MiniLM-L6-v2');
  
  const embeddings = [];
  for (const doc of documents) {
    const output = await extractor(doc.content, {
      pooling: 'mean',
      normalize: true
    });
    embeddings.push({
      id: doc.id,
      embedding: Array.from(output.data),
      metadata: doc.metadata
    });
  }
  return embeddings;
}

// 2. Semantic Search (query time)
function searchSimilar(queryEmbedding, documentEmbeddings, topK = 5) {
  const similarities = documentEmbeddings.map(doc => ({
    ...doc,
    similarity: cosineSimilarity(queryEmbedding, doc.embedding)
  }));
  
  return similarities
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

// 3. Response Generation
function generateResponse(query, retrievedDocs) {
  const context = retrievedDocs
    .map(doc => doc.metadata.content)
    .join('\n\n');
    
  return {
    answer: formatClinicalResponse(context, query),
    sources: retrievedDocs.map(d => d.metadata),
    confidence: calculateConfidence(retrievedDocs)
  };
}
```

### Performance Benchmarks

| Operation | Average | 95th Percentile | Target |
|-----------|---------|-----------------|--------|
| Embedding Generation | 45ms | 120ms | <200ms |
| Query Embedding | 35ms | 80ms | <100ms |
| Similarity Search | 8ms | 15ms | <50ms |
| Response Generation | 12ms | 25ms | <50ms |
| **Total Query** | **55ms** | **120ms** | **<300ms** |

## 🧪 Testing & Evaluation

### Automated Testing Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "PWA"          # PWA functionality
npm test -- --grep "AI"           # AI integration
npm test -- --grep "Offline"      # Offline capabilities

# Performance benchmarks
npm run benchmark

# Lighthouse CI audit
npm run lighthouse
```

### Python-Based Clinical Evaluation

```bash
# Navigate to evaluation directory
cd evaluation

# Run comprehensive clinical validation
python scripts/atlas_live_testing.py

# Generate evaluation dashboard
python scripts/atlas_data_analysis.py

# Run statistical analysis
Rscript scripts/atlas_evaluation_analysis.R

# Generate performance reports
python scripts/atlas_data_analysis.py --generate-report
```

### Clinical Scenario Testing

The evaluation framework includes comprehensive WHO-aligned clinical validation:

- **90 synthetic clinical scenarios** across 4 domains
- **Automated WHO protocol alignment scoring**
- **Clinical appropriateness assessment**
- **Resource awareness validation**
- **Safety protocol verification**

```python
# Example Python evaluation script usage
from scripts.atlas_live_testing import ClinicalEvaluator

evaluator = ClinicalEvaluator()
results = evaluator.run_comprehensive_evaluation()
print(f"WHO Alignment: {results['who_alignment']}")
print(f"Clinical Safety: {results['safety_score']}")
```

### Test Coverage

| Component | Unit Tests | Integration Tests | Clinical Evaluation |
|-----------|------------|-------------------|-------------------|
| AI System | ✅ 85% | ✅ 78% | ✅ 80% WHO Alignment |
| Data Persistence | ✅ 92% | ✅ 88% | ✅ 99.97% Reliability |
| Offline Functionality | ✅ 88% | ✅ 95% | ✅ 95% Uptime |
| UI Components | ✅ 76% | ⚠️ 65% | ✅ Clinical Workflow Validated |

## 🔐 Security Considerations

### Current Implementation

- ✅ HTTPS-only in production
- ✅ Environment variable protection
- ✅ Input validation and sanitization
- ✅ XSS protection (React auto-escaping)
- ✅ CORS configuration
- ✅ Client-side data encryption

### Planned Enhancements

- ⚠️ End-to-end encryption for clinical data
- ⚠️ Multi-factor authentication
- ⚠️ Biometric authentication for mobile
- ⚠️ Comprehensive audit logging
- ⚠️ Role-based access control (RBAC)
- ⚠️ HIPAA compliance measures

## 📈 Performance Optimization

### Service Worker Caching Strategy

```javascript
// public/sw.js
const CACHE_VERSION = 'atlas-v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;

// Cache-first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image' || 
      event.request.destination === 'style' ||
      event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request).then(fetchResponse => {
          return caches.open(STATIC_CACHE).then(cache => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        });
      })
    );
  }
});
```

### Database Optimization

```javascript
// lib/db/index.js - Indexing Strategy
db.version(2).stores({
  patients: 'patientId, name, uhid, *lastModified',  // Composite index
  consultations: 'consultationId, patientId, *date, providerId',
  guidelines: 'guidelineId, [category+domain]'  // Compound index
});

// Query optimization
async function getRecentConsultations(patientId, limit = 10) {
  return await db.consultations
    .where('patientId').equals(patientId)
    .reverse()  // Use index in reverse
    .limit(limit)
    .toArray();
}
```

## 🌍 Deployment

### Production Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables (set in Vercel dashboard)
NEXT_PUBLIC_GEMINI_API_KEY
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```javascript
// lib/monitoring/performanceMonitor.js
class PerformanceMonitor {
  static logMetric(name, value, tags = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      tags: {
        ...tags,
        environment: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_APP_VERSION
      }
    };
    
    // Log to IndexedDB for offline analysis
    this.storeMetricLocally(metric);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance]', metric);
    }
  }
}
```

### Custom Metrics

- **Clinical Workflow Metrics**: Time to complete consultation, AI recommendation usage rate
- **System Health**: Offline transition rate, cache hit rates, error rates  
- **User Engagement**: Feature usage, guideline access patterns
- **Performance**: Page load times, AI response times, offline reliability

## 🐛 Troubleshooting

### Common Issues

#### Service Worker Not Updating

```bash
# Clear service worker cache
# Chrome DevTools > Application > Service Workers > Unregister
# Or programmatically:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(registration => registration.unregister());
});
```

#### IndexedDB Storage Quota Exceeded

```javascript
// Check storage usage
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({usage, quota}) => {
    console.log(`Using ${usage} out of ${quota} bytes.`);
    const percentUsed = (usage / quota * 100).toFixed(2);
    console.log(`Storage: ${percentUsed}% used`);
  });
}

// Request persistent storage
navigator.storage.persist().then(granted => {
  console.log(`Persistent storage: ${granted}`);
});
```

#### Gemini API Rate Limiting

```javascript
// Implement exponential backoff
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await callGemini(prompt);
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  // Fallback to RAG if all retries fail
  return await clinicalRAG.query(prompt);
}
```

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Make changes and test thoroughly
4. Run evaluation suite: `cd evaluation && python scripts/atlas_live_testing.py`
5. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open Pull Request

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Run Python evaluation
cd evaluation
python scripts/atlas_data_analysis.py --validate
```

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add voice input support
fix: Resolve offline sync race condition
docs: Update API documentation
style: Format code with prettier
refactor: Simplify RAG retrieval logic
test: Add tests for consultation sync
eval: Update clinical validation framework
chore: Update dependencies
```

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Google Gemini API](https://ai.google.dev/docs)
- [Dexie.js Guide](https://dexie.org/)
- [WHO SMART Guidelines](https://www.who.int/teams/digital-health-and-innovation/smart-guidelines)

### Research Papers
- [ATLAS Master's Thesis](./docs/thesis.pdf) - Complete research documentation
- [Clinical Decision Support in LMICs](https://doi.org/10.xxxx) - Background research

### Related Projects
- [WHO Digital Adaptation Kits](https://github.com/WorldHealthOrganization)
- [OpenMRS](https://openmrs.org/) - Open-source medical record system
- [CommCare](https://www.dimagi.com/commcare/) - Mobile data collection

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- **Advisor**: Dr. Sivarit Sultornsanee, Northeastern University
- **Institution**: Northeastern University, Data Analytics Engineering Program
- **AI Provider**: Google Gemini API
- **Clinical Guidelines**: World Health Organization (WHO)
- **Inspiration**: 3.6 billion people served by resource-limited healthcare systems worldwide

## 📞 Contact

**Project Maintainer**: Shreyas Sreenivas  
**Email**: sreenivas.s@northeastern.edu  
**GitHub**: [@lambdabypi](https://github.com/lambdabypi)  
**Project Link**: [https://github.com/lambdabypi/atlas](https://github.com/lambdabypi/ATLAS)

---

**⚠️ Disclaimer**: ATLAS is a research prototype developed for a Master's thesis. It is NOT approved for clinical use. Any deployment in real healthcare settings requires proper regulatory approval, clinical validation, and compliance with local healthcare regulations.

---

**Built with ❤️ for global health equity**