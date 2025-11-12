// src/lib/initializeEnhancedAtlas.js - FULLY SSR COMPATIBLE VERSION
import { seedInitialData } from './db';
import { setupAutoSync } from './sync';

// ✅ CRITICAL: All browser-dependent modules should be lazy-loaded
let performanceMonitor = null;
let initializeRAGSystem = null;

// ✅ Robust browser check
const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

// ✅ Lazy import for browser-only modules
async function getBrowserModules() {
	if (!isBrowser()) {
		console.log('Server environment detected, skipping browser-only modules');
		return {
			performanceMonitor: null,
			initializeRAGSystem: null
		};
	}

	if (!performanceMonitor) {
		try {
			const perfModule = await import('./monitoring/performanceMonitor');
			performanceMonitor = perfModule.default;
		} catch (error) {
			console.warn('Performance monitor not available:', error);
		}
	}

	if (!initializeRAGSystem) {
		try {
			const aiModule = await import('./ai/enhancedHybridAI');
			initializeRAGSystem = aiModule.initializeRAGSystem;
		} catch (error) {
			console.warn('RAG system not available:', error);
		}
	}

	return { performanceMonitor, initializeRAGSystem };
}

export async function initializeEnhancedAtlas(options = {}) {
	console.log('Initializing Enhanced ATLAS system (SSR Safe)...');

	const {
		enableRAGSystem = true,
		initializeRAGOnStartup = true,
		showProgress = true
	} = options;

	const browserEnvironment = isBrowser();

	console.log(`Environment: ${browserEnvironment ? 'Browser' : 'Server'}`);

	try {
		// 1. Seed database with expanded guidelines
		console.log('1. Seeding expanded clinical guidelines...');
		await seedInitialData();

		// 2. Set up synchronization (browser only)
		if (browserEnvironment) {
			console.log('2. Setting up synchronization...');
			setupAutoSync(15); // Sync every 15 minutes
		} else {
			console.log('2. Skipping synchronization (server environment)');
		}

		// 3. Initialize RAG system (browser only)
		if (enableRAGSystem && browserEnvironment) {
			console.log('3. Loading browser modules...');
			const { performanceMonitor, initializeRAGSystem } = await getBrowserModules();

			if (initializeRAGOnStartup && initializeRAGSystem) {
				console.log('4. Initializing RAG system...');
				await initializeRAGSystem();
			} else {
				console.log('4. RAG system will be initialized on demand');
			}

			if (performanceMonitor) {
				console.log('5. Performance monitoring enabled');
			}
		} else {
			console.log('3. Skipping RAG system initialization (server environment or disabled)');
		}

		const successMessage = browserEnvironment
			? 'Enhanced ATLAS system initialized successfully (Browser)'
			: 'Enhanced ATLAS system initialized successfully (Server)';

		console.log('✅', successMessage);

		return {
			success: true,
			message: successMessage,
			components: {
				database: true,
				sync: browserEnvironment,
				rag: enableRAGSystem && browserEnvironment,
				performance: browserEnvironment
			}
		};

	} catch (error) {
		const errorMessage = `Enhanced ATLAS initialization failed: ${error.message}`;
		console.error('❌', errorMessage);

		return {
			success: false,
			error: errorMessage,
			originalError: error
		};
	}
}

// ✅ Additional helper function to check if system is ready for browser features
export function isBrowserSystemReady() {
	return isBrowser() && performanceMonitor !== null;
}

// ✅ Helper to get system status
export function getSystemStatus() {
	const browserReady = isBrowser();

	return {
		environment: browserReady ? 'browser' : 'server',
		database: true, // Always available
		sync: browserReady,
		rag: browserReady && initializeRAGSystem !== null,
		performance: browserReady && performanceMonitor !== null,
		localStorage: browserReady
	};
}