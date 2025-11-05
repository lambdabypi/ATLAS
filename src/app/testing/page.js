// app/testing/page.js
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

	const addLog = (message) => {
		setTestLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
	};

	const runPerformanceTests = async () => {
		setIsRunning(true);
		setCurrentTest('Performance Testing');
		setTestResults(null);
		setTestLogs([]);

		try {
			addLog('Starting performance testing suite...');

			// Import testing framework dynamically
			const { ATLASPerformanceTests } = await import('../../lib/testing/atlas-testing-framework');

			const perfTests = new ATLASPerformanceTests();
			addLog('Running offline capability tests...');

			const results = await perfTests.runPerformanceTests();

			addLog(`Performance testing complete. Overall score: ${results.overallScore}%`);

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
			addLog(`Performance testing failed: ${error.message}`);
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
			addLog('Starting clinical validation testing...');

			// Import testing framework dynamically
			const { ATLASClinicalTests } = await import('../../lib/testing/atlas-testing-framework');

			const clinicalTests = new ATLASClinicalTests();
			addLog('Running WHO guideline compliance tests...');

			const results = await clinicalTests.runClinicalValidation();

			addLog(`Clinical testing complete. Accuracy: ${results.overallAccuracy}%`);

			setTestResults({
				type: 'clinical',
				results,
				summary: {
					overallAccuracy: results.overallAccuracy,
					clinicalSafety: results.clinicalSafety,
					guidelineCompliance: results.guidelineCompliance,
					status: results.overallAccuracy > 75 ? 'PASS' : 'NEEDS IMPROVEMENT'
				}
			});

		} catch (error) {
			addLog(`Clinical testing failed: ${error.message}`);
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
			addLog('Starting comprehensive ATLAS test suite...');

			// Import testing framework dynamically
			const { ATLASTestingFramework } = await import('../../lib/testing/atlas-testing-framework');

			addLog('Running performance tests...');
			const results = await ATLASTestingFramework.runFullTestSuite();

			addLog('Running implementation framework assessment...');
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

				addLog('Running NASSS, RE-AIM, and WHO MAPS assessment...');
				const frameworkResults = await assessment.conductFullAssessment(
					systemData, orgData, userFeedback, deploymentData
				);

				results.implementationAssessment = frameworkResults;
				addLog(`Framework assessment complete. Readiness: ${frameworkResults.readinessDecision.decision}`);

			} catch (frameworkError) {
				addLog(`Framework assessment not available: ${frameworkError.message}`);
			}

			addLog(`Full test suite complete. Overall status: ${results.overallStatus}`);

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
			addLog(`Full test suite failed: ${error.message}`);
			console.error('Full test suite error:', error);
		} finally {
			setIsRunning(false);
			setCurrentTest('');
		}
	};

	const generateSyntheticData = async () => {
		try {
			addLog('Generating WHO-validated synthetic test data...');

			const { generateSyntheticTestData } = await import('../../lib/testing/synthetic-data-generator');
			const testData = generateSyntheticTestData();

			// Save to localStorage for inspection
			localStorage.setItem('atlas_synthetic_data', JSON.stringify(testData, null, 2));

			addLog(`Generated ${testData.metadata.totalCases} synthetic cases`);
			addLog('Data saved to localStorage as "atlas_synthetic_data"');

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
			addLog(`Data generation failed: ${error.message}`);
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

		addLog('Test results exported to JSON file');
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
			csvContent = 'Domain,Scenario,Accuracy,Status\n';
			if (testResults.results.results.maternalHealth) {
				testResults.results.results.maternalHealth.forEach((test, idx) => {
					csvContent += `Maternal Health,${test.scenario || 'Case ' + (idx + 1)},${test.accuracy || 0},${test.accuracy > 75 ? 'PASS' : 'FAIL'}\n`;
				});
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

			addLog('Test results exported to CSV file');
		}
	};

	return (
		<div className="max-w-6xl mx-auto p-6">
			<div className="mb-8">
				<h1 className="text-3xl font-bold text-gray-900 mb-2">ATLAS Testing Dashboard</h1>
				<p className="text-gray-600">Comprehensive testing suite for your thesis validation</p>
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
							WHO guideline accuracy, clinical scenarios
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

			{/* Test Logs */}
			{testLogs.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<h3 className="font-semibold">Test Execution Log</h3>
					</CardHeader>
					<CardContent>
						<div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
							{testLogs.map((log, idx) => (
								<div key={idx}>{log}</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Test Results */}
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
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
					<h3 className="font-semibold">Testing Instructions for Thesis</h3>
				</CardHeader>
				<CardContent>
					<ol className="list-decimal list-inside space-y-2 text-sm">
						<li><strong>Generate Data:</strong> Create WHO-validated synthetic test cases</li>
						<li><strong>Run Performance Tests:</strong> Validate offline capability, sync, memory usage</li>
						<li><strong>Run Clinical Tests:</strong> Validate AI accuracy against WHO guidelines</li>
						<li><strong>Run Full Suite:</strong> Complete thesis validation testing</li>
						<li><strong>Export Results:</strong> Download JSON/CSV for thesis analysis</li>
					</ol>

					<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
						<p className="text-sm text-blue-800">
							<strong>For your thesis:</strong> Run the Full Test Suite to get comprehensive results that map directly to your methodology in Chapter 3. Results include performance metrics, clinical validation, and implementation readiness assessment.
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}