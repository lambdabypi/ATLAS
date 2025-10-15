// src/lib/monitoring/performanceMonitor.js
import { syncQueueDb } from '../db';

// Performance metrics collection
export class PerformanceMonitor {
	constructor() {
		this.metrics = new Map();
		this.startTime = performance.now();
		this.isEnabled = process.env.NODE_ENV !== 'production' ||
			localStorage.getItem('atlas_monitoring') === 'enabled';
	}

	// Start timing an operation
	startTiming(operationName) {
		if (!this.isEnabled) return null;

		const timingId = `${operationName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		this.metrics.set(timingId, {
			operation: operationName,
			startTime: performance.now(),
			timestamp: new Date().toISOString()
		});

		return timingId;
	}

	// End timing and record result
	endTiming(timingId, additionalData = {}) {
		if (!this.isEnabled || !timingId) return null;

		const metric = this.metrics.get(timingId);
		if (!metric) return null;

		const endTime = performance.now();
		const duration = endTime - metric.startTime;

		const result = {
			...metric,
			endTime,
			duration,
			...additionalData,
			completedAt: new Date().toISOString()
		};

		// Store completed metric
		this.recordMetric(result);
		this.metrics.delete(timingId);

		return result;
	}

	// Record a metric
	async recordMetric(metric) {
		if (!this.isEnabled) return;

		try {
			// Store in IndexedDB for local analysis
			await syncQueueDb.addToQueue('performance_metrics',
				`metric_${Date.now()}`, 'add', metric);

			// Log slow operations
			if (metric.duration > 2000) { // >2 seconds
				console.warn('Slow operation detected:', metric);
			}

			// Emit custom event for real-time monitoring
			if (typeof window !== 'undefined') {
				window.dispatchEvent(new CustomEvent('atlas:performance', {
					detail: metric
				}));
			}
		} catch (error) {
			console.error('Error recording metric:', error);
		}
	}

	// Monitor offline functionality
	async testOfflineCapability() {
		const testId = this.startTiming('offline_capability_test');

		try {
			const { patientDb, consultationDb } = await import('../db');

			// Test patient operations
			const patientTestStart = performance.now();
			const testPatients = await patientDb.getAll();
			const patientTestDuration = performance.now() - patientTestStart;

			// Test consultation operations
			const consultationTestStart = performance.now();
			const testConsultations = await consultationDb.getAll ?
				await consultationDb.getAll() : [];
			const consultationTestDuration = performance.now() - consultationTestStart;

			// Test storage usage
			const storageInfo = await this.getStorageUsage();

			const result = {
				patientCount: testPatients.length,
				consultationCount: testConsultations.length,
				patientQueryTime: patientTestDuration,
				consultationQueryTime: consultationTestDuration,
				storageUsed: storageInfo.used,
				storageQuota: storageInfo.quota,
				storagePercentage: storageInfo.percentage
			};

			this.endTiming(testId, result);
			return result;

		} catch (error) {
			this.endTiming(testId, { error: error.message });
			throw error;
		}
	}

	// Monitor synchronization performance
	async testSyncPerformance() {
		const testId = this.startTiming('sync_performance_test');

		try {
			const { syncData } = await import('../sync');

			const syncStart = performance.now();
			const result = await syncData();
			const syncDuration = performance.now() - syncStart;

			const metrics = {
				syncDuration,
				syncSuccess: result.success,
				itemsSynced: result.syncedItems || 0,
				itemsFailed: result.failedItems || 0,
				networkCondition: this.getNetworkCondition()
			};

			this.endTiming(testId, metrics);
			return metrics;

		} catch (error) {
			this.endTiming(testId, { error: error.message });
			throw error;
		}
	}

	// Test AI response performance
	async testAIPerformance(sampleQuery) {
		const testId = this.startTiming('ai_performance_test');

		try {
			const { getEnhancedClinicalRecommendations } = await import('../ai/enhancedGemini');

			const samplePatient = {
				age: '35',
				gender: 'Male',
				symptoms: sampleQuery || 'fever, headache, body aches'
			};

			const aiStart = performance.now();
			const result = await getEnhancedClinicalRecommendations(
				'Clinical assessment needed',
				samplePatient,
				null,
				{ maxRetries: 1, timeoutMs: 5000 }
			);
			const aiDuration = performance.now() - aiStart;

			const metrics = {
				aiResponseTime: aiDuration,
				aiSuccess: !result.isError,
				confidence: result.confidence,
				isRuleBased: result.isRuleBased,
				responseLength: result.text?.length || 0
			};

			this.endTiming(testId, metrics);
			return metrics;

		} catch (error) {
			this.endTiming(testId, { error: error.message });
			throw error;
		}
	}

	// Monitor battery usage (approximation)
	async monitorBatteryUsage() {
		if (!navigator.getBattery) {
			return { supported: false };
		}

		try {
			const battery = await navigator.getBattery();

			return {
				supported: true,
				charging: battery.charging,
				chargingTime: battery.chargingTime,
				dischargingTime: battery.dischargingTime,
				level: battery.level
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	// Get storage usage information
	async getStorageUsage() {
		if (!navigator.storage || !navigator.storage.estimate) {
			return { supported: false };
		}

		try {
			const estimate = await navigator.storage.estimate();
			const used = estimate.usage || 0;
			const quota = estimate.quota || 0;
			const percentage = quota > 0 ? (used / quota) * 100 : 0;

			return {
				supported: true,
				used: Math.round(used / 1024 / 1024 * 100) / 100, // MB
				quota: Math.round(quota / 1024 / 1024 * 100) / 100, // MB
				percentage: Math.round(percentage * 100) / 100
			};
		} catch (error) {
			return { supported: false, error: error.message };
		}
	}

	// Get network condition
	getNetworkCondition() {
		if (!navigator.connection) {
			return { supported: false };
		}

		const connection = navigator.connection;
		return {
			supported: true,
			online: navigator.onLine,
			effectiveType: connection.effectiveType,
			downlink: connection.downlink,
			rtt: connection.rtt,
			saveData: connection.saveData
		};
	}

	// Run comprehensive performance test
	async runComprehensiveTest() {
		const testSuiteId = this.startTiming('comprehensive_performance_test');

		try {
			console.log('Starting comprehensive performance test...');

			const results = {
				timestamp: new Date().toISOString(),
				tests: {}
			};

			// Test offline capability
			try {
				results.tests.offline = await this.testOfflineCapability();
				console.log('✓ Offline capability test completed');
			} catch (error) {
				results.tests.offline = { error: error.message };
				console.error('✗ Offline capability test failed:', error.message);
			}

			// Test sync performance (only if online)
			if (navigator.onLine) {
				try {
					results.tests.sync = await this.testSyncPerformance();
					console.log('✓ Sync performance test completed');
				} catch (error) {
					results.tests.sync = { error: error.message };
					console.error('✗ Sync performance test failed:', error.message);
				}

				// Test AI performance
				try {
					results.tests.ai = await this.testAIPerformance();
					console.log('✓ AI performance test completed');
				} catch (error) {
					results.tests.ai = { error: error.message };
					console.error('✗ AI performance test failed:', error.message);
				}
			} else {
				results.tests.sync = { skipped: 'offline' };
				results.tests.ai = { skipped: 'offline' };
			}

			// System information
			results.system = {
				battery: await this.monitorBatteryUsage(),
				storage: await this.getStorageUsage(),
				network: this.getNetworkCondition(),
				userAgent: navigator.userAgent,
				viewport: {
					width: window.innerWidth,
					height: window.innerHeight
				}
			};

			this.endTiming(testSuiteId, { testsCompleted: Object.keys(results.tests).length });

			// Store comprehensive results
			await syncQueueDb.addToQueue('performance_reports',
				`report_${Date.now()}`, 'add', results);

			console.log('Comprehensive performance test completed:', results);
			return results;

		} catch (error) {
			this.endTiming(testSuiteId, { error: error.message });
			console.error('Comprehensive performance test failed:', error);
			throw error;
		}
	}

	// Get performance summary
	async getPerformanceSummary(hours = 24) {
		try {
			const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

			// This would need to be implemented with proper IndexedDB querying
			// For now, return a basic summary
			return {
				period: `${hours} hours`,
				summary: 'Performance monitoring active',
				recommendations: this.getPerformanceRecommendations()
			};
		} catch (error) {
			console.error('Error getting performance summary:', error);
			return { error: error.message };
		}
	}

	// Get performance recommendations
	getPerformanceRecommendations() {
		const recommendations = [];

		// Check if monitoring is enabled
		if (!this.isEnabled) {
			recommendations.push({
				type: 'info',
				message: 'Performance monitoring is disabled. Enable it in settings for detailed insights.'
			});
		}

		return recommendations;
	}

	// Clean old metrics (run periodically)
	async cleanOldMetrics(daysToKeep = 7) {
		if (!this.isEnabled) return;

		try {
			const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

			// This would need proper implementation with IndexedDB
			console.log(`Would clean metrics older than ${cutoffDate.toISOString()}`);

			return { cleaned: true, cutoffDate };
		} catch (error) {
			console.error('Error cleaning old metrics:', error);
			throw error;
		}
	}
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

export default performanceMonitor;

// Utility functions for easy use
export const startTiming = (operation) => performanceMonitor.startTiming(operation);
export const endTiming = (timingId, data) => performanceMonitor.endTiming(timingId, data);
export const recordMetric = (metric) => performanceMonitor.recordMetric(metric);

// React hook for performance monitoring
export function usePerformanceMonitoring() {
	const runTest = async (testType = 'comprehensive') => {
		switch (testType) {
			case 'offline':
				return await performanceMonitor.testOfflineCapability();
			case 'sync':
				return await performanceMonitor.testSyncPerformance();
			case 'ai':
				return await performanceMonitor.testAIPerformance();
			case 'comprehensive':
			default:
				return await performanceMonitor.runComprehensiveTest();
		}
	};

	const getSystemInfo = async () => {
		return {
			battery: await performanceMonitor.monitorBatteryUsage(),
			storage: await performanceMonitor.getStorageUsage(),
			network: performanceMonitor.getNetworkCondition()
		};
	};

	const getSummary = async (hours = 24) => {
		return await performanceMonitor.getPerformanceSummary(hours);
	};

	return {
		runTest,
		getSystemInfo,
		getSummary,
		startTiming: performanceMonitor.startTiming.bind(performanceMonitor),
		endTiming: performanceMonitor.endTiming.bind(performanceMonitor)
	};
}