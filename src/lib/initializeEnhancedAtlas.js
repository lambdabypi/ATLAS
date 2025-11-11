// src/lib/initializeEnhancedAtlas.js - CLEANED for simplified hybrid system
import { seedInitialData } from './db';
import { setupAutoSync } from './sync';

// ✅ FIXED: Only import performance monitor (no issues with SSR)
let performanceMonitor = null;
let initializeRAGSystem = null;

// ✅ FIXED: Lazy import for browser-only modules
async function getBrowserModules() {
	if (typeof window === 'undefined') {
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
	console.log('Initializing Enhanced ATLAS system (Cleaned)...');

	const {
		enableRAGSystem = true,
		initializeRAGOnStartup = true, // Set to false if you want manual RAG initialization
		showProgress = true
	} = options;

	// ✅ FIXED: Check if we're in browser environment
	const isBrowser = typeof window !== 'undefined';

	try {
		// 1. Seed database with expanded guidelines
		console.log('1. Seeding expanded clinical guidelines...');
		await seedInitialData();

		// 2. Set up synchronization
		console.log('2. Setting up synchronization...');
		setupAutoSync(15); // Sync every 15 minutes

		// 3. Initialize RAG system (browser only)
		if (enableRAGSystem && isBrowser) {
			console.log('3. Setting up Clinical RAG system...');

			const { initializeRAGSystem: initRAG } = await getBrowserModules();

			if (initRAG) {
				let ragResult;
				if (initializeRAGOnStartup) {
					// Initialize RAG system immediately
					ragResult = await initRAG();
				} else {
					// Just check if RAG system is available, don't initialize
					try {
						const { clinicalRAGSystem } = await import('./ai/clinicalRAGSystem');
						ragResult = await clinicalRAGSystem.getStatus();

						if (!ragResult.initialized) {
							console.log('   ℹ️  RAG system not initialized - will initialize on first use');
							console.log('   💡 To enable RAG initialization on startup, set initializeRAGOnStartup: true');
						}
					} catch (error) {
						ragResult = { success: false, error: error.message };
					}
				}

				console.log('   📚 RAG system initialization result:', {
					success: ragResult.success,
					message: ragResult.message || 'Ready',
					initialized: ragResult.initialized
				});
			} else {
				console.log('   ⚠️  RAG system module not available');
			}
		} else if (!isBrowser) {
			console.log('3. RAG system initialization skipped (server-side rendering)');
		} else {
			console.log('3. RAG system disabled - using rule-based local AI only');
		}

		// 4. Run initial performance test (browser only)
		if (isBrowser) {
			console.log('4. Running initial performance assessment...');

			const { performanceMonitor: perfMonitor } = await getBrowserModules();
			let performanceResults = {};

			if (perfMonitor) {
				try {
					performanceResults = await perfMonitor.testOfflineCapability();
					console.log('   📈 Initial performance results:', performanceResults);
				} catch (error) {
					console.warn('   ⚠️  Performance test failed:', error);
					performanceResults = { error: error.message };
				}
			} else {
				console.log('   ℹ️  Performance monitoring not available');
			}
		} else {
			console.log('4. Performance testing skipped (server-side rendering)');
		}

		// 5. Enable performance monitoring in development (browser only)
		if (process.env.NODE_ENV === 'development' && isBrowser) {
			localStorage.setItem('atlas_monitoring', 'enabled');
			console.log('5. Performance monitoring enabled for development');
		} else if (!isBrowser) {
			console.log('5. Performance monitoring setup skipped (server-side rendering)');
		}

		// 6. Set initialization complete flag (browser only)
		if (isBrowser) {
			window.ATLAS_INITIALIZATION_COMPLETE = true;
		}

		console.log('✅ Enhanced ATLAS initialization complete (Cleaned Version)');
		console.log('🤖 Available AI Systems: Rules-Based, Clinical RAG, Gemini API');

		// Emit completion event (browser only)
		if (isBrowser) {
			window.dispatchEvent(new CustomEvent('atlas:initialization-complete', {
				detail: {
					success: true,
					performanceResults: {},
					ragSystemEnabled: enableRAGSystem,
					version: 'cleaned-no-hf'
				}
			}));
		}

		return {
			success: true,
			message: 'Enhanced ATLAS initialized successfully (Cleaned)',
			performanceResults: {},
			ragSystemEnabled: enableRAGSystem,
			ragInitializedOnStartup: initializeRAGOnStartup,
			serverSide: !isBrowser,
			version: 'cleaned-no-hf'
		};

	} catch (error) {
		console.error('❌ Enhanced ATLAS initialization failed:', error);

		// Emit error event (browser only)
		if (isBrowser) {
			window.dispatchEvent(new CustomEvent('atlas:initialization-error', {
				detail: { error: error.message }
			}));
		}

		return {
			success: false,
			error: error.message,
			serverSide: !isBrowser
		};
	}
}

// Manual RAG initialization function for UI (browser only)
export async function initializeRAGManually(progressCallback = null) {
	// ✅ FIXED: Check browser environment
	if (typeof window === 'undefined') {
		return {
			success: false,
			error: 'RAG system initialization not available in server environment'
		};
	}

	console.log('📚 Starting manual RAG system initialization...');

	try {
		const { initializeRAGSystem: initRAG } = await getBrowserModules();

		if (!initRAG) {
			throw new Error('RAG system module not available');
		}

		const result = await initRAG();

		console.log('✅ Manual RAG initialization complete:', result);
		return result;

	} catch (error) {
		console.error('❌ Manual RAG initialization failed:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

// Check system status (browser only)
export async function checkSystemStatus() {
	// ✅ FIXED: Check browser environment
	if (typeof window === 'undefined') {
		return {
			ruleBasedAvailable: true,
			ragSystemAvailable: false,
			geminiAvailable: false,
			totalStorageUsed: 0,
			serverSide: true
		};
	}

	try {
		const { getEnhancedSystemStatus } = await import('./ai/enhancedHybridAI');
		const status = await getEnhancedSystemStatus();

		return {
			ruleBasedAvailable: status.models.localAI.available,
			ragSystemAvailable: status.models.clinicalRAG.available,
			geminiAvailable: status.models.gemini.available,
			online: status.online,
			hybridEnabled: status.hybrid.enabled,
			version: status.hybrid.version || 'cleaned-no-hf'
		};
	} catch (error) {
		console.error('Error checking system status:', error);
		return {
			ruleBasedAvailable: true,
			ragSystemAvailable: false,
			geminiAvailable: false,
			error: error.message
		};
	}
}

// ✅ FIXED: Only auto-initialize in browser
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	// Initialize after a short delay to ensure DOM is ready
	setTimeout(() => {
		initializeEnhancedAtlas({
			enableRAGSystem: true,
			initializeRAGOnStartup: true, // Set to false if you want manual RAG initialization
			showProgress: true
		});
	}, 1000);
}