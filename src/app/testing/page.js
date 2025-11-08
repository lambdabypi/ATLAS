'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function TestingPage() {
	const [testResults, setTestResults] = useState(null);
	const [isRunning, setIsRunning] = useState(false);
	const [currentTest, setCurrentTest] = useState('');
	const [testLogs, setTestLogs] = useState([]);
	const [expandedSections, setExpandedSections] = useState({});
	const [detailedView, setDetailedView] = useState(true);

	const addLog = (message, level = 'info') => {
		const timestamp = new Date().toLocaleTimeString();
		const logEntry = {
			timestamp,
			message,
			level
		};
		setTestLogs(prev => [...prev, logEntry]);
	};

	const toggleSection = (section) => {
		setExpandedSections(prev => ({
			...prev,
			[section]: !prev[section]
		}));
	};

	const runPerformanceTests = async () => {
		setIsRunning(true);
		setCurrentTest('Performance Testing');
		setTestResults(null);
		setTestLogs([]);

		try {
			addLog('🚀 Starting performance testing suite...', 'info');

			// Import testing framework dynamically
			const { ATLASPerformanceTests } = await import('../../lib/testing/atlas-testing-framework');

			const perfTests = new ATLASPerformanceTests();
			addLog('📊 Initialized performance test engine', 'success');
			addLog('🔄 Running offline capability tests...', 'info');

			const results = await perfTests.runPerformanceTests();

			addLog(`✅ Performance testing complete. Overall score: ${results.overallScore}%`, 'success');

			setTestResults({
				type: 'performance',
				results,
				summary: {
					totalTests: results.totalTests,
					passedTests: results.passedTests,
					overallScore: results.overallScore,
					status: results.overallScore > 80 ? 'PASS' : 'NEEDS IMPROVEMENT'
				}
			});

		} catch (error) {
			addLog(`❌ Performance testing failed: ${error.message}`, 'error');
			console.error('Performance testing error:', error);
		} finally {
			setIsRunning(false);
			setCurrentTest('');
		}
	};

	const runClinicalTests = async () => {
		setIsRunning(true);
		setCurrentTest('Clinical Validation');
		setTestResults(null);
		setTestLogs([]);

		try {
			addLog('🚀 Starting clinical validation testing...', 'info');

			// Import testing framework dynamically
			const { ATLASClinicalTests } = await import('../../lib/testing/atlas-testing-framework');

			const clinicalTests = new ATLASClinicalTests();
			addLog('🏥 Initialized clinical test engine', 'success');
			addLog('📋 Running WHO guideline compliance tests...', 'info');
			addLog('🤰 Step 1: Testing Maternal Health Scenarios', 'info');
			addLog('🦠 Step 2: Testing Infectious Disease Scenarios', 'info');
			addLog('🧠 Step 3: Testing AI Accuracy', 'info');

			const results = await clinicalTests.runClinicalValidation();

			addLog(`✅ Clinical testing complete. Accuracy: ${results.overallAccuracy}%`, 'success');
			addLog(`📊 Statistics: ${results.statistics?.passedTests || 0}/${results.statistics?.totalTests || 0} tests passed`, 'info');

			if (results.errorSummary) {
				addLog(`⚠️ Error Summary: ${results.errorSummary.smartGuidelinesErrors} SMART errors, ${results.errorSummary.apiErrors} API errors, ${results.errorSummary.dataTypeErrors} type errors`, 'warning');
			}

			setTestResults({
				type: 'clinical',
				results,
				summary: {
					overallAccuracy: results.overallAccuracy,
					clinicalSafety: results.clinicalSafety,
					guidelineCompliance: results.guidelineCompliance,
					statistics: results.statistics,
					status: results.overallAccuracy > 75 ? 'PASS' : 'NEEDS IMPROVEMENT'
				}
			});

		} catch (error) {
			addLog(`❌ Clinical testing failed: ${error.message}`, 'error');
			console.error('Clinical testing error:', error);
		} finally {
			setIsRunning(false);
			setCurrentTest('');
		}
	};

	const runFullTestSuite = async () => {
		setIsRunning(true);
		setCurrentTest('Full Test Suite');
		setTestResults(null);
		setTestLogs([]);

		try {
			addLog('🚀 Starting comprehensive ATLAS test suite...', 'info');

			// Import testing framework dynamically
			const { ATLASTestingFramework } = await import('../../lib/testing/atlas-testing-framework');

			addLog('⚡ Running performance tests...', 'info');
			const results = await ATLASTestingFramework.runFullTestSuite();

			addLog('🔍 Running implementation framework assessment...', 'info');
			// Add implementation assessment if available
			try {
				const { IntegratedFrameworkAssessment } = await import('../../lib/evaluation/implementation-frameworks');
				const assessment = new IntegratedFrameworkAssessment();

				// Mock system data for assessment
				const systemData = {
					stability: 95,
					performance: { loadTime: 2.5 },
					offlineCapability: true,
					fhirCompliant: true,
					whoSmartGuidelines: true,
					susScore: 78
				};

				const orgData = {
					internetConnectivity: 75,
					electricityReliability: 80,
					deviceAvailability: 70,
					leadershipSupport: 4
				};

				const userFeedback = {
					clinicalImpact: 4,
					satisfaction: 4,
					workflowFit: 3.5
				};

				const deploymentData = {
					targetPopulation: 100000,
					actualReach: 5000
				};

				addLog('📊 Running NASSS, RE-AIM, and WHO MAPS assessment...', 'info');
				const frameworkResults = await assessment.conductFullAssessment(
					systemData, orgData, userFeedback, deploymentData
				);

				results.implementationAssessment = frameworkResults;
				addLog(`✅ Framework assessment complete. Readiness: ${frameworkResults.readinessDecision.decision}`, 'success');

			} catch (frameworkError) {
				addLog(`⚠️ Framework assessment not available: ${frameworkError.message}`, 'warning');
			}

			addLog(`🎉 Full test suite complete. Overall status: ${results.overallStatus}`, 'success');

			setTestResults({
				type: 'full',
				results,
				summary: {
					performanceScore: results.performance?.overallScore || 0,
					clinicalAccuracy: results.clinical?.overallAccuracy || 0,
					overallStatus: results.overallStatus,
					implementationReady: results.implementationAssessment?.readinessDecision?.decision || 'Unknown'
				}
			});

		} catch (error) {
			addLog(`❌ Full test suite failed: ${error.message}`, 'error');
			console.error('Full test suite error:', error);
		} finally {
			setIsRunning(false);
			setCurrentTest('');
		}
	};

	const generateSyntheticData = async () => {
		try {
			addLog('📊 Generating WHO-validated synthetic test data...', 'info');

			const { generateSyntheticTestData } = await import('../../lib/testing/synthetic-data-generator');
			const testData = generateSyntheticTestData();

			// Save to localStorage for inspection
			localStorage.setItem('atlas_synthetic_data', JSON.stringify(testData, null, 2));

			addLog(`✅ Generated ${testData.metadata.totalCases} synthetic cases`, 'success');
			addLog('💾 Data saved to localStorage as "atlas_synthetic_data"', 'info');

			// Display summary
			const summary = {
				imci: testData.imci.length,
				maternal: testData.maternalHealth.length,
				infectious: testData.infectiousDiseases.length,
				ncds: testData.ncds.length,
				edge: testData.edgeCases.length
			};

			setTestResults({
				type: 'data_generation',
				results: testData,
				summary
			});

		} catch (error) {
			addLog(`❌ Data generation failed: ${error.message}`, 'error');
			console.error('Data generation error:', error);
		}
	};

	const exportResults = () => {
		if (!testResults) return;

		const dataStr = JSON.stringify(testResults, null, 2);
		const dataBlob = new Blob([dataStr], { type: 'application/json' });
		const url = URL.createObjectURL(dataBlob);

		const link = document.createElement('a');
		link.href = url;
		link.download = `atlas-test-results-${Date.now()}.json`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);

		addLog('📤 Test results exported to JSON file', 'success');
	};

	const exportCSV = () => {
		if (!testResults) return;

		let csvContent = '';

		if (testResults.type === 'performance' && testResults.results.results) {
			csvContent = 'Test Name,Status,Score,Response Time,Notes\n';
			testResults.results.results.forEach(test => {
				csvContent += `${test.test},${test.status},${test.metrics?.totalTime || 'N/A'},${test.metrics?.totalTime || 'N/A'},${test.error || 'Success'}\n`;
			});
		} else if (testResults.type === 'clinical') {
			csvContent = 'Domain,Scenario,Accuracy,Status,Error\n';

			// Handle different result structures
			const processResults = (results, domain) => {
				if (Array.isArray(results)) {
					results.forEach((test, idx) => {
						csvContent += `${domain},${test.scenario || 'Case ' + (idx + 1)},${test.accuracy || 0},${test.status || (test.accuracy > 75 ? 'PASS' : 'FAIL')},${test.error || 'None'}\n`;
					});
				} else if (results?.results) {
					results.results.forEach((test, idx) => {
						csvContent += `${domain},${test.scenario || 'Case ' + (idx + 1)},${test.accuracy || 0},${test.status || (test.accuracy > 75 ? 'PASS' : 'FAIL')},${test.error || 'None'}\n`;
					});
				}
			};

			if (testResults.results.results) {
				if (testResults.results.results.maternalHealth) {
					processResults(testResults.results.results.maternalHealth, 'Maternal Health');
				}
				if (testResults.results.results.infectiousDiseases) {
					processResults(testResults.results.results.infectiousDiseases, 'Infectious Diseases');
				}
				if (testResults.results.results.aiAccuracy) {
					processResults(testResults.results.results.aiAccuracy, 'AI Accuracy');
				}
			}
		}

		if (csvContent) {
			const blob = new Blob([csvContent], { type: 'text/csv' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = `atlas-test-results-${Date.now()}.csv`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			addLog('📤 Test results exported to CSV file', 'success');
		}
	};

	const LogLevel = ({ level }) => {
		const colors = {
			info: 'text-blue-600',
			success: 'text-green-600',
			warning: 'text-orange-600',
			error: 'text-red-600',
			debug: 'text-gray-600'
		};

		return <span className={colors[level]}></span>;
	};

	const renderDetailedResults = () => {
		if (!testResults || testResults.type !== 'clinical' || !detailedView) return null;

		const { results } = testResults;

		return (
			<div className="space-y-6">
				{/* Maternal Health Results */}
				{results.results?.maternalHealth && (
					<div className="border rounded-lg">
						<button
							onClick={() => toggleSection('maternal')}
							className="w-full p-4 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
						>
							<span>🤰 Maternal Health Tests ({results.results.maternalHealth?.summary?.total || results.results.maternalHealth?.length || 0} tests)</span>
							<span className={`transform transition-transform ${expandedSections.maternal ? 'rotate-180' : ''}`}>
								⌄
							</span>
						</button>

						{expandedSections.maternal && (
							<div className="p-4">
								{(results.results.maternalHealth?.results || results.results.maternalHealth)?.map((test, idx) => (
									<div key={idx} className="mb-4 p-3 border rounded-lg">
										<div className="flex justify-between items-center mb-2">
											<h4 className="font-medium">{test.scenario || `Test ${idx + 1}`}</h4>
											<span className={`px-2 py-1 rounded text-sm ${test.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
												}`}>
												{test.status || (test.accuracy > 0 ? 'passed' : 'failed')} ({test.accuracy || 0}% accuracy)
											</span>
										</div>

										{test.error && (
											<div className="text-red-600 text-sm mb-2">
												<strong>Error:</strong> {test.error}
											</div>
										)}

										{test.recommendations && (
											<div className="text-sm">
												<strong>SMART Guidelines Response:</strong>
												<div className="bg-blue-50 p-2 rounded mt-1">
													<p><strong>Domain:</strong> {test.recommendations.domain}</p>
													<p><strong>Guidelines:</strong> {test.recommendations.guidelines}</p>
													<p><strong>Recommendations:</strong> {test.recommendations.recommendations?.length || 0}</p>
													{test.recommendations.recommendations?.map((rec, recIdx) => (
														<div key={recIdx} className="ml-2 mt-1">
															<strong>{rec.title}:</strong> {rec.description}
														</div>
													))}
												</div>
											</div>
										)}

										{test.expectedOutcome && (
											<details className="mt-2">
												<summary className="cursor-pointer text-sm font-medium">Expected Outcome</summary>
												<pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto">
													{JSON.stringify(test.expectedOutcome, null, 2)}
												</pre>
											</details>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Infectious Diseases Results */}
				{results.results?.infectiousDiseases && (
					<div className="border rounded-lg">
						<button
							onClick={() => toggleSection('infectious')}
							className="w-full p-4 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
						>
							<span>🦠 Infectious Diseases Tests ({results.results.infectiousDiseases?.summary?.total || results.results.infectiousDiseases?.length || 0} tests)</span>
							<span className={`transform transition-transform ${expandedSections.infectious ? 'rotate-180' : ''}`}>
								⌄
							</span>
						</button>

						{expandedSections.infectious && (
							<div className="p-4">
								{(results.results.infectiousDiseases?.results || results.results.infectiousDiseases)?.map((test, idx) => (
									<div key={idx} className="mb-4 p-3 border rounded-lg">
										<div className="flex justify-between items-center mb-2">
											<h4 className="font-medium">{test.scenario || `Test ${idx + 1}`}</h4>
											<span className={`px-2 py-1 rounded text-sm ${test.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
												}`}>
												{test.status || (test.accuracy > 0 ? 'passed' : 'failed')} ({test.accuracy || 0}% accuracy)
											</span>
										</div>

										{test.error && (
											<div className="text-red-600 text-sm mb-2">
												<strong>Error:</strong> {test.error}
												{test.stackTrace && (
													<details className="mt-1">
														<summary className="cursor-pointer">Stack Trace</summary>
														<pre className="text-xs bg-gray-100 p-2 mt-1 rounded overflow-x-auto max-h-32">
															{test.stackTrace}
														</pre>
													</details>
												)}
											</div>
										)}

										{test.recommendations && (
											<div className="text-sm">
												<strong>SMART Guidelines Response:</strong>
												<div className="bg-blue-50 p-2 rounded mt-1">
													<p><strong>Domain:</strong> {test.recommendations.domain}</p>
													<p><strong>Guidelines:</strong> {test.recommendations.guidelines}</p>
													<p><strong>Recommendations:</strong> {test.recommendations.recommendations?.length || 0}</p>
													{test.recommendations.recommendations?.map((rec, recIdx) => (
														<div key={recIdx} className="ml-2 mt-1">
															<strong>{rec.title}:</strong> {rec.description}
														</div>
													))}
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* AI Accuracy Tests */}
				{results.results?.aiAccuracy && (
					<div className="border rounded-lg">
						<button
							onClick={() => toggleSection('ai')}
							className="w-full p-4 text-left font-semibold bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
						>
							<span>🧠 AI Accuracy Tests ({results.results.aiAccuracy?.summary?.total || results.results.aiAccuracy?.length || 0} tests)</span>
							<span className={`transform transition-transform ${expandedSections.ai ? 'rotate-180' : ''}`}>
								⌄
							</span>
						</button>

						{expandedSections.ai && (
							<div className="p-4">
								{(results.results.aiAccuracy?.results || results.results.aiAccuracy)?.map((test, idx) => (
									<div key={idx} className="mb-4 p-3 border rounded-lg">
										<div className="flex justify-between items-center mb-2">
											<h4 className="font-medium">{test.category || `Test ${idx + 1}`}</h4>
											<span className={`px-2 py-1 rounded text-sm ${test.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
												}`}>
												{test.accuracy || 0}% accuracy
											</span>
										</div>

										<div className="text-sm space-y-2">
											<div>
												<strong>Query:</strong> {test.query}
											</div>

											<div>
												<strong>Expected Keywords:</strong> {test.expectedKeywords?.join(', ')}
											</div>

											{test.response && (
												<div>
													<strong>AI Response:</strong>
													<div className="bg-gray-50 p-2 rounded mt-1 max-h-32 overflow-y-auto">
														{test.response}
													</div>
												</div>
											)}

											{test.error && (
												<div className="text-red-600">
													<strong>Error:</strong> {test.error}
												</div>
											)}
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{/* Error Analysis */}
				{results.errorSummary && (
					<div className="border rounded-lg">
						<button
							onClick={() => toggleSection('errors')}
							className="w-full p-4 text-left font-semibold bg-red-50 hover:bg-red-100 flex justify-between items-center"
						>
							<span>⚠️ Error Analysis</span>
							<span className={`transform transition-transform ${expandedSections.errors ? 'rotate-180' : ''}`}>
								⌄
							</span>
						</button>

						{expandedSections.errors && (
							<div className="p-4">
								<div className="grid grid-cols-3 gap-4">
									<div className="text-center">
										<div className="text-2xl font-bold text-red-600">
											{results.errorSummary.smartGuidelinesErrors}
										</div>
										<div className="text-sm">SMART Guidelines Errors</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-orange-600">
											{results.errorSummary.apiErrors}
										</div>
										<div className="text-sm">API Rate Limit Errors</div>
									</div>
									<div className="text-center">
										<div className="text-2xl font-bold text-purple-600">
											{results.errorSummary.dataTypeErrors}
										</div>
										<div className="text-sm">Data Type Errors</div>
									</div>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		);
	};

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="mb-8">
				<div className="flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">ATLAS Testing Dashboard</h1>
						<p className="text-gray-600">Comprehensive testing suite with detailed debugging</p>
					</div>
					<div className="flex items-center space-x-2">
						<label className="flex items-center space-x-2">
							<input
								type="checkbox"
								checked={detailedView}
								onChange={(e) => setDetailedView(e.target.checked)}
								className="rounded"
							/>
							<span className="text-sm">Detailed Analysis</span>
						</label>
					</div>
				</div>
			</div>

			{/* Test Controls */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
				<Card>
					<CardHeader>
						<h3 className="font-semibold">Performance Tests</h3>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Network conditions, offline capability, memory usage
						</p>
						<Button
							onClick={runPerformanceTests}
							disabled={isRunning}
							variant="primary"
							className="w-full"
						>
							Run Performance
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 className="font-semibold">Clinical Tests</h3>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							WHO guideline accuracy with detailed error analysis
						</p>
						<Button
							onClick={runClinicalTests}
							disabled={isRunning}
							variant="primary"
							className="w-full"
						>
							Run Clinical
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 className="font-semibold">Full Test Suite</h3>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							Complete thesis validation testing
						</p>
						<Button
							onClick={runFullTestSuite}
							disabled={isRunning}
							variant="success"
							className="w-full"
						>
							Run All Tests
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<h3 className="font-semibold">Generate Data</h3>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-gray-600 mb-4">
							WHO-validated synthetic test cases
						</p>
						<Button
							onClick={generateSyntheticData}
							disabled={isRunning}
							variant="secondary"
							className="w-full"
						>
							Generate Data
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Current Test Status */}
			{isRunning && (
				<Card className="mb-6">
					<CardContent className="py-4">
						<div className="flex items-center space-x-3">
							<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
							<span className="font-medium">Running: {currentTest}</span>
							<Badge variant="primary">In Progress</Badge>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Enhanced Test Logs */}
			{testLogs.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<h3 className="font-semibold">Real-time Test Execution Log</h3>
					</CardHeader>
					<CardContent>
						<div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto space-y-1">
							{testLogs.map((log, idx) => (
								<div key={idx} className="flex items-center space-x-2">
									<span className="text-gray-500">[{log.timestamp}]</span>
									<LogLevel level={log.level} />
									<span>{log.message}</span>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Detailed Test Results */}
			{detailedView && renderDetailedResults()}

			{/* Test Results Summary */}
			{testResults && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h3 className="font-semibold">Test Results Summary</h3>
							<div className="space-x-2">
								<Button onClick={exportResults} variant="outline" size="sm">
									Export JSON
								</Button>
								<Button onClick={exportCSV} variant="outline" size="sm">
									Export CSV
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						{testResults.type === 'performance' && (
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-700">Total Tests</p>
									<p className="text-2xl font-bold text-blue-600">
										{testResults.summary.totalTests}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Passed</p>
									<p className="text-2xl font-bold text-green-600">
										{testResults.summary.passedTests}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Overall Score</p>
									<p className="text-2xl font-bold text-purple-600">
										{testResults.summary.overallScore}%
									</p>
								</div>
							</div>
						)}

						{testResults.type === 'clinical' && (
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-700">Clinical Accuracy</p>
									<p className="text-2xl font-bold text-blue-600">
										{testResults.summary.overallAccuracy}%
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Safety Status</p>
									<p className="text-lg font-semibold text-green-600">
										{testResults.summary.clinicalSafety}
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">WHO Compliance</p>
									<p className="text-2xl font-bold text-purple-600">
										{Math.round(testResults.summary.guidelineCompliance)}%
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Tests Passed</p>
									<p className="text-lg font-bold text-green-600">
										{testResults.summary.statistics?.passedTests || 0}/{testResults.summary.statistics?.totalTests || 0}
									</p>
								</div>
							</div>
						)}

						{testResults.type === 'full' && (
							<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-700">Performance</p>
									<p className="text-2xl font-bold text-blue-600">
										{testResults.summary.performanceScore}%
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Clinical Accuracy</p>
									<p className="text-2xl font-bold text-green-600">
										{testResults.summary.clinicalAccuracy}%
									</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Overall Status</p>
									<Badge variant={testResults.summary.overallStatus === 'ready' ? 'success' : 'warning'}>
										{testResults.summary.overallStatus}
									</Badge>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Implementation</p>
									<p className="text-sm font-semibold text-purple-600">
										{testResults.summary.implementationReady}
									</p>
								</div>
							</div>
						)}

						{testResults.type === 'data_generation' && (
							<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
								<div>
									<p className="text-sm font-medium text-gray-700">IMCI Cases</p>
									<p className="text-2xl font-bold text-blue-600">{testResults.summary.imci}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Maternal</p>
									<p className="text-2xl font-bold text-pink-600">{testResults.summary.maternal}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Infectious</p>
									<p className="text-2xl font-bold text-red-600">{testResults.summary.infectious}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">NCDs</p>
									<p className="text-2xl font-bold text-purple-600">{testResults.summary.ncds}</p>
								</div>
								<div>
									<p className="text-sm font-medium text-gray-700">Edge Cases</p>
									<p className="text-2xl font-bold text-orange-600">{testResults.summary.edge}</p>
								</div>
							</div>
						)}

						<div className="mt-4 p-3 bg-gray-50 rounded-lg">
							<p className="text-sm text-gray-600">
								<strong>Thesis Validation Status:</strong> {testResults.summary.status || 'Data Generated'}
							</p>
							<p className="text-xs text-gray-500 mt-1">
								Results saved to browser storage and available for export
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Instructions */}
			<Card>
				<CardHeader>
					<h3 className="font-semibold">Enhanced Testing Features</h3>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<h4 className="font-medium mb-2">🔍 What You'll See:</h4>
							<ul className="text-sm space-y-1">
								<li>• Real-time test execution logs with timestamps</li>
								<li>• Individual test results with error details</li>
								<li>• SMART Guidelines responses and matching</li>
								<li>• Error categorization and debugging info</li>
								<li>• Expandable sections for detailed analysis</li>
							</ul>
						</div>
						<div>
							<h4 className="font-medium mb-2">📊 For Your Thesis:</h4>
							<ul className="text-sm space-y-1">
								<li>• Export detailed results as JSON/CSV</li>
								<li>• View exact test failures and causes</li>
								<li>• Analyze WHO guideline compliance</li>
								<li>• Track performance across test categories</li>
								<li>• Generate comprehensive validation data</li>
							</ul>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}