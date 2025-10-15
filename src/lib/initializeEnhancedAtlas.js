// src/lib/initializeEnhancedAtlas.js
import { seedInitialData } from './db';
import { setupAutoSync } from './sync';
import performanceMonitor from './monitoring/performanceMonitor';

export async function initializeEnhancedAtlas() {
	console.log('Initializing Enhanced ATLAS system...');

	try {
		// 1. Seed database with expanded guidelines
		console.log('1. Seeding expanded clinical guidelines...');
		await seedInitialData();

		// 2. Set up synchronization
		console.log('2. Setting up synchronization...');
		setupAutoSync(15); // Sync every 15 minutes

		// 3. Run initial performance test
		console.log('3. Running initial performance assessment...');
		const performanceResults = await performanceMonitor.testOfflineCapability();
		console.log('Initial performance results:', performanceResults);

		// 4. Enable performance monitoring in development
		if (process.env.NODE_ENV === 'development') {
			localStorage.setItem('atlas_monitoring', 'enabled');
			console.log('4. Performance monitoring enabled for development');
		}

		console.log('✅ Enhanced ATLAS initialization complete');

		return {
			success: true,
			message: 'Enhanced ATLAS initialized successfully',
			performanceResults
		};

	} catch (error) {
		console.error('❌ Enhanced ATLAS initialization failed:', error);
		return {
			success: false,
			error: error.message
		};
	}
}

// Auto-initialize when imported (for development)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
	// Initialize after a short delay to ensure DOM is ready
	setTimeout(() => {
		initializeEnhancedAtlas();
	}, 1000);
}