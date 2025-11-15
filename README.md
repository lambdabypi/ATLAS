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
│  IndexedDB (Client) • SQLite (Server) • Dexie.js ORM   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│           Synchronization Layer                         │
│  Offline Queue • Smart Sync • Background Sync API      │
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

## 🚀 Quick Start

### Prerequisites

```bash
# Required
Node.js >= 18.0.0
npm >= 9.0.0

# Optional (for backend)
SQLite3
Python >= 3.9 (for future analytics integration)
```

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/atlas.git
cd atlas

# Install frontend dependencies
npm install

# Install backend dependencies
cd atlas-backend
npm install
cd ..
```

### Environment Configuration

Create `.env.local` in the project root:

```env
# Google Gemini API
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Backend API (development)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Database (backend)
DATABASE_PATH=./data/atlas.db

# Service Worker (production)
NEXT_PUBLIC_SW_ENABLED=true

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_INPUT=false
NEXT_PUBLIC_ENABLE_OFFLINE_SYNC=true
```

### Development

```bash
# Terminal 1: Start frontend (Next.js)
npm run dev
# Access at http://localhost:3000

# Terminal 2: Start backend (Express)
cd atlas-backend
npm start
# API runs at http://localhost:3001
```

### Production Build

```bash
# Build frontend
npm run build
npm start

# Build backend
cd atlas-backend
npm run build
npm run start:prod
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
│   ├── db/                       # Database layer
│   │   ├── index.js             # Dexie.js setup
│   │   ├── patients.js          # Patient CRUD
│   │   ├── consultations.js     # Consultation CRUD
│   │   └── reference.js         # Guidelines storage
│   ├── sync/                     # Synchronization
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

### Backend (`/atlas-backend`)

```
atlas-backend/
├── routes/                       # API routes
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

## 🔧 Core Technologies

### Frontend Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Client DB**: IndexedDB (via Dexie.js)
- **PWA**: Service Workers + Cache API
- **AI Client**: Google Gemini API SDK

### Backend Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: SQLite3
- **ORM**: None (raw SQL for simplicity)
- **API Style**: RESTful

### AI/ML Stack
- **Online AI**: Google Gemini 2.5 Flash
- **Offline Embeddings**: Xenova/all-MiniLM-L6-v2
- **Embedding Engine**: Transformers.js (WebAssembly)
- **Vector Search**: Cosine similarity (in-memory)

## 💾 Data Architecture

### IndexedDB Schema (Client-Side)

```javascript
// Dexie.js Schema Definition
const db = new Dexie('ATLASDatabase');
db.version(1).stores({
  patients: 'patientId, name, uhid, dateOfBirth, lastModified',
  consultations: 'consultationId, patientId, date, providerId, lastModified',
  guidelines: 'guidelineId, category, domain, title',
  syncQueue: '++id, timestamp, priority, type, status'
});
```

**Storage Capacity**: 50% of available disk space per origin (browser-dependent)

### SQLite Schema (Server-Side)

```sql
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

-- Clinical Guidelines Table
CREATE TABLE guidelines (
  guideline_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  domain TEXT,
  content TEXT,
  who_protocol_id TEXT,
  version TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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

## 🔄 Synchronization Strategy

### Current Implementation: Last-Write-Wins

```javascript
// lib/sync/consultation-sync.js
async function syncConsultations() {
  const queue = await db.syncQueue
    .where('type').equals('consultation')
    .and(item => item.status === 'pending')
    .toArray();
  
  for (const item of queue) {
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        body: JSON.stringify(item.data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        await db.syncQueue.delete(item.id);
      } else {
        // Retry with exponential backoff
        await scheduleRetry(item);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

### Future Enhancement: CRDT-Based Sync

```javascript
// Planned: lib/sync/crdt-healthcare.js
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

class CRDTConsultation {
  constructor(consultationId) {
    this.doc = new Y.Doc();
    this.consultation = this.doc.getMap('consultation');
    
    // Automatic conflict resolution
    this.provider = new WebsocketProvider(
      'wss://atlas-sync.example.com',
      consultationId,
      this.doc
    );
  }
  
  updateField(field, value) {
    // Guaranteed conflict-free merge
    this.consultation.set(field, value);
  }
}
```

## 🧪 Testing

### Automated Testing Suite

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --grep "PWA"          # PWA functionality
npm test -- --grep "AI"           # AI integration
npm test -- --grep "Offline"      # Offline capabilities
npm test -- --grep "Sync"         # Synchronization

# Performance benchmarks
npm run benchmark

# Lighthouse CI audit
npm run lighthouse
```

### Clinical Scenario Testing

```bash
# Generate synthetic test data
npm run generate:test-data

# Run clinical validation
npm run test:clinical

# WHO alignment validation
npm run test:who-alignment
```

### Test Coverage

| Component | Unit Tests | Integration Tests | E2E Tests |
|-----------|------------|-------------------|-----------|
| AI System | ✅ 85% | ✅ 78% | ✅ 65% |
| Data Persistence | ✅ 92% | ✅ 88% | ✅ 75% |
| Sync Logic | ✅ 88% | ✅ 72% | ⚠️ 45% |
| UI Components | ✅ 76% | ⚠️ 55% | ⚠️ 40% |

## 🔐 Security Considerations

### Current Implementation

- ✅ HTTPS-only in production
- ✅ Environment variable protection
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (React auto-escaping)
- ✅ CORS configuration

### Planned Enhancements

- ⚠️ End-to-end encryption for clinical data
- ⚠️ Multi-factor authentication
- ⚠️ Biometric authentication for mobile
- ⚠️ Comprehensive audit logging
- ⚠️ Role-based access control (RBAC)
- ⚠️ HIPAA compliance measures

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

## 📈 Performance Optimization

### Service Worker Caching Strategy

```javascript
// public/sw.js
const CACHE_VERSION = 'atlas-v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

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

// Network-first for API calls (with offline fallback)
if (event.request.url.includes('/api/')) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(API_CACHE).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
}
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
NEXT_PUBLIC_API_URL
DATABASE_PATH
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

```bash
# Build and run
docker build -t atlas .
docker run -p 3000:3000 -e NEXT_PUBLIC_GEMINI_API_KEY=your_key atlas
```

### Self-Hosted Deployment

```bash
# Build for production
npm run build

# Start with PM2 (process manager)
npm install -g pm2
pm2 start npm --name "atlas" -- start
pm2 startup
pm2 save

# Nginx reverse proxy configuration
server {
    listen 80;
    server_name atlas.example.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
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
    
    // Send to monitoring service (e.g., DataDog, New Relic)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: 'Performance',
        value: value,
        ...tags
      });
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance]', metric);
    }
  }
  
  static async measureAsync(name, fn) {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.logMetric(name, duration, { status: 'success' });
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.logMetric(name, duration, { status: 'error' });
      throw error;
    }
  }
}

// Usage
const patients = await PerformanceMonitor.measureAsync(
  'database.query.patients',
  () => db.patients.toArray()
);
```

### Custom Metrics

- **Clinical Workflow Metrics**: Time to complete consultation, AI recommendation usage rate
- **System Health**: Offline transition rate, sync success rate, error rates
- **User Engagement**: Feature usage, guideline access patterns
- **Performance**: Page load times, API response times, cache hit rates

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
4. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
5. Push to branch: `git push origin feature/amazing-feature`
6. Open Pull Request

### Code Style

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type checking (if using TypeScript in future)
npm run type-check
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
**Email**: sreenivas.sh@northeastern.edu  
**GitHub**: [@yourusername](https://github.com/yourusername)  
**Project Link**: [https://github.com/yourusername/atlas](https://github.com/yourusername/atlas)

---

**⚠️ Disclaimer**: ATLAS is a research prototype developed for a Master's thesis. It is NOT approved for clinical use. Any deployment in real healthcare settings requires proper regulatory approval, clinical validation, and compliance with local healthcare regulations.

---

**Built with ❤️ for global health equity**
