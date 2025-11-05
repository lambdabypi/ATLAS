// src/components/consultation/ConsultationForm.jsx - FIXED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getRelevantGuidelines } from '../../lib/db/expandedGuidelines';
import { getById as getPatientById } from '../../lib/db/patients'; // FIXED: Use the correct import
import { consultationDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

// Simple SMART Guidelines integration for normal form
let SMARTGuidelinesEngine;
try {
	const smartModule = import('../../lib/clinical/smartGuidelines');
	smartModule.then(module => { SMARTGuidelinesEngine = module.SMARTGuidelinesEngine; });
} catch (error) {
	console.warn('SMART Guidelines not available in normal form');
}

export default function ConsultationForm({ patientId, onConsultationComplete }) {
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(false);
	const [patientLoading, setPatientLoading] = useState(true); // FIXED: Separate loading state for patient
	const [relevantGuidelines, setRelevantGuidelines] = useState([]);
	const [smartGuidelines, setSmartGuidelines] = useState(null);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

	// Watch key fields for guideline suggestions
	const symptoms = watch('symptoms', '');
	const chiefComplaint = watch('chiefComplaint', '');

	// FIXED: Load patient data with better error handling
	useEffect(() => {
		const loadPatientData = async () => {
			if (!patientId) {
				setPatientLoading(false);
				return;
			}

			console.log('Loading patient with ID:', patientId, typeof patientId);

			try {
				setPatientLoading(true);

				// Use the fixed patient database function
				const patientData = await getPatientById(patientId);

				console.log('Patient data retrieved:', patientData);

				if (patientData) {
					setPatient(patientData);
					// Pre-populate form
					setValue('medicalHistory', patientData.medicalHistory || '');
					setValue('allergies', patientData.allergies || '');
					setValue('currentMedications', patientData.currentMedications || '');
				} else {
					console.error('No patient found with ID:', patientId);
					// Don't fail silently - show an error or redirect
				}
			} catch (error) {
				console.error('Error loading patient data:', error);
				// Handle error gracefully
			} finally {
				setPatientLoading(false);
			}
		};

		loadPatientData();
	}, [patientId, setValue]);

	// Simple guideline suggestions
	useEffect(() => {
		const getGuidelines = async () => {
			if (!symptoms && !chiefComplaint) return;

			try {
				// Get basic guidelines
				const guidelines = await getRelevantGuidelines(symptoms || chiefComplaint, {
					age: patient?.age,
					conditions: symptoms
				});
				setRelevantGuidelines(guidelines);

				// Try to get SMART Guidelines if available
				if (SMARTGuidelinesEngine && patient) {
					try {
						const smartEngine = new SMARTGuidelinesEngine();
						const clinicalDomain = determineClinicalDomain(patient, symptoms);

						const smartRecs = await smartEngine.executeGuideline(
							clinicalDomain,
							{
								age: patient.age,
								symptoms: symptoms,
								pregnancy: patient.pregnancy
							},
							{ encounterType: 'outpatient' }
						);

						setSmartGuidelines(smartRecs);
					} catch (smartError) {
						console.warn('SMART Guidelines unavailable:', smartError);
					}
				}
			} catch (error) {
				console.error('Error fetching guidelines:', error);
			}
		};

		// Debounce guideline fetching
		const timeoutId = setTimeout(getGuidelines, 2000);
		return () => clearTimeout(timeoutId);
	}, [symptoms, chiefComplaint, patient]);

	// Simple clinical domain determination
	const determineClinicalDomain = (patient, symptoms) => {
		if (patient?.pregnancy?.status === 'active') {
			return 'maternal-health';
		}
		if (patient?.age && patient.age < 5) {
			return 'infectious-diseases';
		}
		if (symptoms?.includes('fever') || symptoms?.includes('cough') || symptoms?.includes('diarrhea')) {
			return 'infectious-diseases';
		}
		return 'general-medicine';
	};

	// Form submission
	const onSubmit = async (data) => {
		setLoading(true);

		try {
			// Update patient record using the fixed function
			if (patient?.id) {
				await getPatientById(patient.id); // Verify patient still exists
				// If you have an update function, use it here
				// await updatePatient(patient.id, { ... });
			}

			// Prepare consultation data
			const consultationData = {
				id: `consultation_${Date.now()}_${patient?.id}`,
				patientId: patient.id,
				date: new Date().toISOString(),

				// Clinical data
				symptoms: data.symptoms,
				chiefComplaint: data.chiefComplaint,
				vitals: data.vitals,
				examination: data.examination,

				// Provider decisions
				finalDiagnosis: data.providerDiagnosis || '',
				plan: data.providerPlan || '',
				providerNotes: data.providerNotes || '',

				// Guidelines reference (basic form doesn't use AI)
				relevantGuidelinesUsed: relevantGuidelines?.map(g => g.id) || [],
				smartGuidelinesUsed: smartGuidelines?.recommendations?.map(r => r.id) || [],

				// Metadata
				formType: 'standard', // Distinguish from enhanced form
				tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : [],
				isOnline: isOnline
			};

			// Save consultation
			await consultationDb.add(consultationData);

			// Navigate or callback
			if (onConsultationComplete) {
				onConsultationComplete(consultationData.id);
			} else {
				window.location.href = `/consultation/${consultationData.id}`;
			}

		} catch (error) {
			console.error('Error saving consultation:', error);
			alert('Error saving consultation. Please try again.');
		} finally {
			setLoading(false);
		}
	};

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

	// FIXED: Show loading state for patient loading
	if (patientLoading) {
		return (
			<div className="flex justify-center items-center min-h-64">
				<LoadingSpinner size="lg" />
				<span className="ml-3 text-gray-600">Loading patient data...</span>
			</div>
		);
	}

	// FIXED: Better handling of patient not found
	if (!patient && patientId) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardContent>
						<div className="text-center py-12">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Not Found</h2>
							<p className="text-gray-600 mb-6">
								The patient with ID {patientId} could not be found in the database.
							</p>
							<div className="space-x-3">
								<Button
									onClick={() => window.history.back()}
									variant="secondary"
								>
									Go Back
								</Button>
								<Button
									onClick={() => window.location.href = '/patients'}
									variant="primary"
								>
									View All Patients
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Header */}
			<div className="mb-6">
				<div className="flex justify-between items-start">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
						<p className="text-gray-600">Patient: {patient?.name} (ID: {patient?.id})</p>
						<div className="flex items-center space-x-2 mt-2">
							<Badge variant={isOnline ? "success" : "warning"} size="sm">
								{isOnline ? "🟢 Online" : "🟡 Offline"}
							</Badge>
							<Badge variant="secondary" size="sm">📋 Standard Form</Badge>
							{smartGuidelines && (
								<Badge variant="primary" size="sm">WHO Guidelines Available</Badge>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* WHO SMART Guidelines (Simple Display) */}
			{smartGuidelines?.recommendations && (
				<Card className="mb-6">
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">
							WHO Clinical Guidelines
						</h2>
						<p className="text-sm text-gray-600">
							Relevant guidelines for this clinical presentation
						</p>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{smartGuidelines.recommendations.slice(0, 2).map((rec, idx) => (
								<div key={idx} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
									<h4 className="font-medium text-blue-900">{rec.title}</h4>
									<p className="text-sm text-blue-800 mt-1">{rec.description}</p>
									{rec.evidence && (
										<span className="text-xs text-blue-600 mt-2 block">
											Evidence: {rec.evidence}
										</span>
									)}
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Clinical Assessment Form */}
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">Clinical Assessment</h2>
					</CardHeader>

					<CardContent className="space-y-6">
						<Input
							label="Chief Complaint"
							placeholder="What is the main reason for today's visit?"
							{...register('chiefComplaint', { required: 'Chief complaint is required' })}
							error={errors.chiefComplaint?.message}
							required
						/>

						<TextArea
							label="Symptoms"
							placeholder="Describe all symptoms the patient is experiencing..."
							rows={3}
							{...register('symptoms', { required: 'Symptoms are required' })}
							error={errors.symptoms?.message}
							required
						/>

						<Input
							label="Vital Signs"
							placeholder="Temperature, BP, HR, RR, O2 Sat (if available)"
							{...register('vitals')}
							helperText="Include units where applicable"
						/>

						<TextArea
							label="Physical Examination"
							placeholder="Document physical examination findings..."
							rows={4}
							{...register('examination')}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<TextArea
								label="Medical History"
								rows={3}
								{...register('medicalHistory')}
								helperText="Relevant past medical history"
							/>

							<Input
								label="Known Allergies"
								{...register('allergies')}
								placeholder="List allergies, separated by commas"
							/>
						</div>

						<Input
							label="Current Medications"
							{...register('currentMedications')}
							placeholder="List current medications with dosages"
						/>
					</CardContent>
				</Card>

				{/* Clinical Decision Section */}
				<Card>
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">Clinical Decision</h2>
					</CardHeader>

					<CardContent className="space-y-6">
						<TextArea
							label="Diagnosis"
							placeholder="Enter your clinical diagnosis..."
							rows={2}
							{...register('providerDiagnosis')}
						/>

						<TextArea
							label="Treatment Plan"
							placeholder="Enter treatment plan, medications, follow-up instructions..."
							rows={4}
							{...register('providerPlan')}
							helperText="Include medications, dosages, follow-up timeline, and patient instructions."
						/>

						<TextArea
							label="Clinical Notes"
							placeholder="Any additional observations or notes..."
							rows={2}
							{...register('providerNotes')}
						/>
					</CardContent>
				</Card>

				<div className="flex justify-end space-x-4">
					<Button
						type="button"
						variant="secondary"
						onClick={() => window.history.back()}
						disabled={loading}
					>
						Cancel
					</Button>

					<Button
						type="submit"
						variant="primary"
						loading={loading}
						disabled={loading}
					>
						Save Consultation
					</Button>
				</div>
			</form>

			{/* Basic Guidelines Display */}
			{relevantGuidelines.length > 0 && (
				<Card className="mt-6">
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Clinical Reference Guidelines</h3>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{relevantGuidelines.slice(0, 2).map(guideline => (
								<div key={guideline.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
									<h4 className="font-medium text-gray-900">{guideline.title}</h4>
									<p className="text-sm text-gray-700 mt-1">
										{guideline.content?.overview || 'Clinical guideline reference'}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}