// app/consultation/new/page.js - UPDATED WITH CENTRALIZED ONLINE STATUS
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { patientDb } from '../../../lib/db';
import ConsultationForm from '../../../components/consultation/ConsultationForm';
import EnhancedConsultationForm from '../../../components/consultation/EnhancedConsultationForm';
import { useOnlineStatus } from '../../../lib/hooks/useOnlineStatus'; // 🎯 CENTRALIZED HOOK
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export default function NewConsultationPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [formType, setFormType] = useState(null); // 'enhanced' or 'standard'

	// 🎯 USE CENTRALIZED ONLINE STATUS
	const { isOnline, getStatusInfo } = useOnlineStatus();
	const statusInfo = getStatusInfo();

	const patientId = searchParams?.get('patientId');

	// Load patient data
	useEffect(() => {
		const loadPatient = async () => {
			if (!patientId) {
				setLoading(false);
				return;
			}

			try {
				const patientData = await patientDb.getById(patientId);
				if (patientData) {
					setPatient(patientData);
				} else {
					console.error('Patient not found');
				}
			} catch (error) {
				console.error('Error loading patient:', error);
			} finally {
				setLoading(false);
			}
		};

		loadPatient();
	}, [patientId]);

	// Handle consultation completion
	const handleConsultationComplete = (consultationId) => {
		router.push(`/consultation/${consultationId}`);
	};

	// If no patient selected, show patient selection
	if (!loading && !patientId) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<Card className="atlas-card-primary">
							<CardHeader>
								<div className="atlas-header-center">
									<h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
								</div>
							</CardHeader>
							<CardContent>
								<div className="text-center">
									<p className="text-gray-600 mb-4">
										Please select a patient before starting a consultation.
									</p>
									<Button
										onClick={() => router.push('/patients')}
										variant="primary"
									>
										Select Patient
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	// Show loading state
	if (loading) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex justify-center items-center min-h-screen">
							<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Show form type selection
	if (!formType) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="atlas-header-center mb-6">
							<h1 className="text-2xl font-bold text-gray-900 mb-2">New Consultation</h1>
							<p className="text-gray-600">Patient: {patient?.name} (ID: {patient?.id})</p>

							{/* 🎯 ENHANCED STATUS DISPLAY */}
							<div className="atlas-status-bar mt-4">
								<div className={`atlas-status flex items-center px-4 py-2 rounded-full ${statusInfo.statusColor === 'green' ? 'bg-green-50 border-green-200' :
										statusInfo.statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
											'bg-red-50 border-red-200'
									} border`}>
									<span className="mr-2">{statusInfo.statusIcon}</span>
									<Badge
										variant={
											statusInfo.statusColor === 'green' ? 'success' :
												statusInfo.statusColor === 'yellow' ? 'warning' : 'error'
										}
										size="sm"
									>
										{statusInfo.statusText}
									</Badge>
									{statusInfo.isSlowConnection && (
										<Badge variant="warning" size="sm" className="ml-2">
											Slow Connection
										</Badge>
									)}
								</div>
							</div>
						</div>

						{/* Connection Quality Warnings */}
						{!isOnline && (
							<div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
								<div className="flex items-start">
									<span className="mr-3 text-amber-600 text-lg">⚠️</span>
									<div>
										<h4 className="font-medium text-amber-900">Working Offline</h4>
										<p className="text-sm text-amber-800 mt-1">
											You're currently offline. Consultations will be saved locally and synced when connection is restored.
										</p>
									</div>
								</div>
							</div>
						)}

						{isOnline && statusInfo.isSlowConnection && (
							<div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
								<div className="flex items-start">
									<span className="mr-3 text-yellow-600 text-lg">🐌</span>
									<div>
										<h4 className="font-medium text-yellow-900">Slow Connection</h4>
										<p className="text-sm text-yellow-800 mt-1">
											AI features may be slower than usual due to your connection speed.
										</p>
									</div>
								</div>
							</div>
						)}

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Enhanced Form Option */}
							<Card className="atlas-card-primary cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500">
								<CardHeader>
									<div className="flex justify-between items-start">
										<h2 className="text-xl font-semibold text-gray-900">🤖 Enhanced Form</h2>
										<div className="space-y-1">
											<Badge variant="primary" size="sm">AI-Assisted</Badge>
											<Badge variant="success" size="sm">WHO Guidelines</Badge>
											<Badge variant="secondary" size="sm">Real-time</Badge>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3 text-sm text-gray-700 mb-4">
										<div>✓ AI-powered clinical decision support</div>
										<div>✓ WHO SMART Guidelines integration</div>
										<div>✓ Real-time clinical analysis</div>
										<div>✓ Bias detection and mitigation</div>
										<div>✓ Collaborative CRDT synchronization</div>
									</div>

									{/* 🎯 DYNAMIC OFFLINE/SLOW CONNECTION MESSAGES */}
									{!isOnline && (
										<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
											<p className="text-sm text-yellow-800">
												<strong>⚠️ Offline Mode:</strong> AI features limited, but WHO guidelines and rule-based recommendations available.
											</p>
										</div>
									)}

									{isOnline && statusInfo.isSlowConnection && (
										<div className="p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
											<p className="text-sm text-orange-800">
												<strong>🐌 Slow Connection:</strong> AI analysis may take longer than usual.
											</p>
										</div>
									)}

									<p className="text-sm text-gray-600 mb-4 bg-blue-50 p-3 rounded">
										<strong>Best for:</strong> Complex cases, teaching environments, comprehensive clinical support
									</p>

									<Button
										onClick={() => setFormType('enhanced')}
										variant="primary"
										className="w-full"
									>
										Use Enhanced Form
									</Button>
								</CardContent>
							</Card>

							{/* Standard Form Option */}
							<Card className="atlas-card-secondary cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-gray-500">
								<CardHeader>
									<div className="flex justify-between items-start">
										<h2 className="text-xl font-semibold text-gray-900">📋 Standard Form</h2>
										<div className="space-y-1">
											<Badge variant="secondary" size="sm">Basic Guidelines</Badge>
											<Badge variant="outline" size="sm">Offline Ready</Badge>
											{statusInfo.isSlowConnection && (
												<Badge variant="success" size="sm">Recommended</Badge>
											)}
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<div className="space-y-3 text-sm text-gray-700 mb-4">
										<div>• Fast, streamlined interface</div>
										<div>• Basic WHO guideline references</div>
										<div>• Works fully offline</div>
										<div>• Lower resource requirements</div>
										<div>• Ideal for routine consultations</div>
									</div>

									{/* 🎯 ADAPTIVE RECOMMENDATIONS */}
									{!isOnline && (
										<div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
											<p className="text-sm text-green-800">
												<strong>✅ Recommended for offline use:</strong> All features work without internet connection.
											</p>
										</div>
									)}

									{statusInfo.isSlowConnection && (
										<div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
											<p className="text-sm text-green-800">
												<strong>🚀 Recommended for slow connections:</strong> Faster loading and minimal data usage.
											</p>
										</div>
									)}

									<p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded">
										<strong>Best for:</strong> Routine consultations, resource-limited settings, simple workflow
									</p>

									<Button
										onClick={() => setFormType('standard')}
										variant="secondary"
										className="w-full"
									>
										Use Standard Form
									</Button>
								</CardContent>
							</Card>
						</div>

						{/* Quick Selection Buttons with Connection-Aware Recommendations */}
						<div className="mt-8 bg-gray-50 p-6 rounded-lg">
							<p className="text-center text-sm text-gray-600 mb-4">
								<strong>Quick selection based on {!isOnline ? 'offline mode' : statusInfo.isSlowConnection ? 'connection speed' : 'case complexity'}:</strong>
							</p>
							<div className="flex justify-center space-x-4">
								<Button
									onClick={() => setFormType('standard')}
									variant="outline"
									size="sm"
									className="flex items-center space-x-2"
								>
									<span>📝</span>
									<span>{!isOnline || statusInfo.isSlowConnection ? 'Better for Current Connection' : 'Routine Case'}</span>
								</Button>
								<Button
									onClick={() => setFormType('enhanced')}
									variant={!isOnline || statusInfo.isSlowConnection ? "outline" : "primary"}
									size="sm"
									className="flex items-center space-x-2"
								>
									<span>🧠</span>
									<span>{!isOnline ? 'Limited Offline Mode' : statusInfo.isSlowConnection ? 'May Be Slower' : 'Complex Case'}</span>
								</Button>
							</div>
						</div>

						{/* Information Box with Connection-Specific Tips */}
						<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
							<h3 className="font-medium text-blue-900 mb-2">💡 {!isOnline ? 'Offline Tips' : statusInfo.isSlowConnection ? 'Slow Connection Tips' : 'Not sure which to choose?'}</h3>
							<ul className="text-sm text-blue-800 space-y-1">
								{!isOnline ? (
									<>
										<li><strong>Standard Form:</strong> All features work offline, data saved locally</li>
										<li><strong>Enhanced Form:</strong> Limited to local guidelines, no AI analysis</li>
										<li>Data will sync automatically when connection is restored</li>
									</>
								) : statusInfo.isSlowConnection ? (
									<>
										<li><strong>Standard Form:</strong> Faster loading, minimal data usage</li>
										<li><strong>Enhanced Form:</strong> AI features will be slower but still available</li>
										<li>Consider Standard Form for better performance on slow connections</li>
									</>
								) : (
									<>
										<li><strong>Choose Enhanced</strong> for: Unusual symptoms, teaching cases, second opinions</li>
										<li><strong>Choose Standard</strong> for: Follow-ups, common conditions, quick consultations</li>
										<li>You can always switch between forms using the button in the bottom corner</li>
									</>
								)}
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Render selected form (wrapped in backdrop for consistency)
	return (
		<div className="atlas-backdrop">
			<div className="atlas-page-container">
				<div className="atlas-content-wrapper" style={{ maxWidth: '90rem' }}>
					{formType === 'enhanced' ? (
						<EnhancedConsultationForm
							patientId={patientId}
							onConsultationComplete={handleConsultationComplete}
						/>
					) : (
						<ConsultationForm
							patientId={patientId}
							onConsultationComplete={handleConsultationComplete}
						/>
					)}

					{/* Form Switch Option with Connection Status */}
					<div className="fixed bottom-6 right-6 space-y-2">
						{/* Connection Status Mini-Widget */}
						<div className={`px-3 py-2 rounded-lg shadow-lg text-xs ${statusInfo.statusColor === 'green' ? 'bg-green-100 text-green-800' :
								statusInfo.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
									'bg-red-100 text-red-800'
							}`}>
							<div className="flex items-center">
								<span className="mr-1">{statusInfo.statusIcon}</span>
								<span>{statusInfo.statusText}</span>
							</div>
						</div>

						{/* Form Switch Button */}
						<Button
							onClick={() => setFormType(formType === 'enhanced' ? 'standard' : 'enhanced')}
							variant="outline"
							size="sm"
							className="shadow-lg flex items-center space-x-2"
						>
							<span>{formType === 'enhanced' ? '📋' : '🤖'}</span>
							<span>Switch to {formType === 'enhanced' ? 'Standard' : 'Enhanced'}</span>
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}