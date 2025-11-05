// app/consultation/new/page.js
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { patientDb } from '../../../lib/db';
import ConsultationForm from '../../../components/consultation/ConsultationForm';
import EnhancedConsultationForm from '../../../components/consultation/EnhancedConsultationForm';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export default function NewConsultationPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [formType, setFormType] = useState(null); // 'enhanced' or 'standard'
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

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

	// Handle online/offline status
	useEffect(() => {
		const handleOnlineStatus = () => setIsOnline(navigator.onLine);

		window.addEventListener('online', handleOnlineStatus);
		window.addEventListener('offline', handleOnlineStatus);

		return () => {
			window.removeEventListener('online', handleOnlineStatus);
			window.removeEventListener('offline', handleOnlineStatus);
		};
	}, []);

	// Handle consultation completion
	const handleConsultationComplete = (consultationId) => {
		router.push(`/consultation/${consultationId}`);
	};

	// If no patient selected, show patient selection
	if (!loading && !patientId) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardHeader>
						<h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
					</CardHeader>
					<CardContent>
						<p className="text-gray-600 mb-4">
							Please select a patient before starting a consultation.
						</p>
						<Button
							onClick={() => router.push('/patients')}
							variant="primary"
						>
							Select Patient
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show loading state
	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Show form type selection
	if (!formType) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="mb-6">
					<h1 className="text-2xl font-bold text-gray-900 mb-2">New Consultation</h1>
					<p className="text-gray-600">Patient: {patient?.name} (ID: {patient?.id})</p>
					<div className="flex items-center space-x-2 mt-2">
						<Badge variant={isOnline ? "success" : "warning"} size="sm">
							{isOnline ? "🟢 Online" : "🟡 Offline"}
						</Badge>
					</div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Enhanced Form Option */}
					<Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500">
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

							{!isOnline && (
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
									<p className="text-sm text-yellow-800">
										<strong>⚠️ Offline Mode:</strong> AI features limited, but WHO guidelines and rule-based recommendations available.
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
					<Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-transparent hover:border-gray-500">
						<CardHeader>
							<div className="flex justify-between items-start">
								<h2 className="text-xl font-semibold text-gray-900">📋 Standard Form</h2>
								<div className="space-y-1">
									<Badge variant="secondary" size="sm">Basic Guidelines</Badge>
									<Badge variant="outline" size="sm">Offline Ready</Badge>
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

				{/* Quick Selection Buttons */}
				<div className="mt-8 bg-gray-50 p-6 rounded-lg">
					<p className="text-center text-sm text-gray-600 mb-4">
						<strong>Quick selection based on case complexity:</strong>
					</p>
					<div className="flex justify-center space-x-4">
						<Button
							onClick={() => setFormType('standard')}
							variant="outline"
							size="sm"
							className="flex items-center space-x-2"
						>
							<span>📝</span>
							<span>Routine Case</span>
						</Button>
						<Button
							onClick={() => setFormType('enhanced')}
							variant="outline"
							size="sm"
							className="flex items-center space-x-2"
						>
							<span>🧠</span>
							<span>Complex Case</span>
						</Button>
					</div>
				</div>

				{/* Information Box */}
				<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<h3 className="font-medium text-blue-900 mb-2">💡 Not sure which to choose?</h3>
					<ul className="text-sm text-blue-800 space-y-1">
						<li><strong>Choose Enhanced</strong> for: Unusual symptoms, teaching cases, second opinions</li>
						<li><strong>Choose Standard</strong> for: Follow-ups, common conditions, quick consultations</li>
						<li>You can always switch between forms using the button in the bottom corner</li>
					</ul>
				</div>
			</div>
		);
	}

	// Render selected form
	return (
		<div>
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

			{/* Form Switch Option */}
			<div className="fixed bottom-6 right-6">
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
	);
}