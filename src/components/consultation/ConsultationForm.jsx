// src/components/consultation/ConsultationForm.jsx - DYNAMIC RESPONSIVE DESIGN
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { getRelevantGuidelines } from '../../lib/db/expandedGuidelines';
import { getById as getPatientById } from '../../lib/db/patients';
import { consultationDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import { useUserSystem } from '../../lib/auth/simpleUserSystem';

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
	const [patientLoading, setPatientLoading] = useState(true);
	const [relevantGuidelines, setRelevantGuidelines] = useState([]);
	const [smartGuidelines, setSmartGuidelines] = useState(null);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
	const [guidelinesLoading, setGuidelinesLoading] = useState(false);
	const [formExpanded, setFormExpanded] = useState(false);

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

	const { currentUser, hasPermission } = useUserSystem();

	// Watch key fields for guideline suggestions
	const symptoms = watch('symptoms', '');
	const chiefComplaint = watch('chiefComplaint', '');

	if (!currentUser) {
		// Return error message or redirect to user selection
	}

	// Load patient data with better error handling
	useEffect(() => {
		const loadPatientData = async () => {
			if (!patientId) {
				setPatientLoading(false);
				return;
			}

			console.log('Loading patient with ID:', patientId, typeof patientId);

			try {
				setPatientLoading(true);

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
				}
			} catch (error) {
				console.error('Error loading patient data:', error);
			} finally {
				setPatientLoading(false);
			}
		};

		loadPatientData();
	}, [patientId, setValue]);

	// Enhanced guideline suggestions with loading states
	useEffect(() => {
		const getGuidelines = async () => {
			if (!symptoms && !chiefComplaint) {
				setRelevantGuidelines([]);
				setSmartGuidelines(null);
				return;
			}

			setGuidelinesLoading(true);

			try {
				const guidelines = await getRelevantGuidelines(symptoms || chiefComplaint, {
					age: patient?.age,
					conditions: symptoms,
					gender: patient?.gender,
					pregnancy: patient?.pregnancy
				});
				setRelevantGuidelines(guidelines);

				if (SMARTGuidelinesEngine && patient) {
					try {
						const smartEngine = new SMARTGuidelinesEngine();
						const clinicalDomain = determineClinicalDomain(patient, symptoms);

						const smartRecs = await smartEngine.executeGuideline(
							clinicalDomain,
							{
								age: patient.age,
								symptoms: symptoms,
								pregnancy: patient.pregnancy,
								gender: patient.gender
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
			} finally {
				setGuidelinesLoading(false);
			}
		};

		const timeoutId = setTimeout(getGuidelines, 2000);
		return () => clearTimeout(timeoutId);
	}, [symptoms, chiefComplaint, patient]);

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

	const onSubmit = async (data) => {
		setLoading(true);

		try {
			if (patient?.id) {
				await getPatientById(patient.id);
			}

			const consultationData = {
				id: `consultation_${Date.now()}_${patient?.id}`,
				patientId: patient.id,
				date: new Date().toISOString(),

				symptoms: data.symptoms,
				chiefComplaint: data.chiefComplaint,
				vitals: data.vitals,
				examination: data.examination,

				finalDiagnosis: data.providerDiagnosis || '',
				plan: data.providerPlan || '',
				providerNotes: data.providerNotes || '',

				// Enhanced fields when form is expanded
				medicalHistory: data.medicalHistory || '',
				allergies: data.allergies || '',
				currentMedications: data.currentMedications || '',
				socialHistory: data.socialHistory || '',
				familyHistory: data.familyHistory || '',
				investigationsOrdered: data.investigationsOrdered || '',
				followUpPlan: data.followUpPlan || '',

				relevantGuidelinesUsed: relevantGuidelines?.map(g => g.id) || [],
				smartGuidelinesUsed: smartGuidelines?.recommendations?.map(r => r.id) || [],

				formType: formExpanded ? 'standard-expanded' : 'standard',
				formMode: formExpanded ? 'comprehensive' : 'quick',
				tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : [],
				isOnline: isOnline
			};

			await consultationDb.add(consultationData);

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

	useEffect(() => {
		const handleOnlineStatus = () => setIsOnline(navigator.onLine);

		window.addEventListener('online', handleOnlineStatus);
		window.addEventListener('offline', handleOnlineStatus);

		return () => {
			window.removeEventListener('online', handleOnlineStatus);
			window.removeEventListener('offline', handleOnlineStatus);
		};
	}, []);

	if (patientLoading) {
		return (
			<div className="atlas-backdrop">
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="flex justify-center items-center">
						<LoadingSpinner size="lg" />
						<span className="ml-3 text-gray-600">Loading patient data...</span>
					</div>
				</div>
			</div>
		);
	}

	if (!patient && patientId) {
		return (
			<div className="atlas-backdrop">
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="w-full max-w-md">
						<Card className="atlas-card-primary">
							<CardContent>
								<div className="text-center py-12">
									<h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Not Found</h2>
									<p className="text-gray-600 mb-6">
										The patient with ID {patientId} could not be found in the database.
									</p>
									<div className="flex flex-col sm:flex-row justify-center gap-3">
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
				</div>
			</div>
		);
	}

	return (
		<div className="atlas-backdrop">
			{/* DYNAMIC: Flexible responsive layout with adaptive sizing */}
			<div className="min-h-screen py-4 sm:py-6 lg:py-8">
				{/* DYNAMIC: Responsive container that adapts to form complexity */}
				<div className={`w-full mx-auto px-4 sm:px-6 transition-all duration-300 ${formExpanded ? 'max-w-6xl' : 'max-w-4xl'
					}`}>
					{/* Header */}
					<div className="text-center mb-6 sm:mb-8">
						<h1 className={`font-bold text-gray-900 mb-2 transition-all duration-300 ${formExpanded ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
							}`}>
							{formExpanded ? 'Comprehensive' : 'Standard'} Consultation
						</h1>
						<p className="text-base sm:text-lg text-gray-600 mb-4">
							Patient: {patient?.name} (ID: {patient?.id}) | Age: {patient?.age} | Gender: {patient?.gender}
						</p>

						{/* Dynamic badge layout */}
						<div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-4">
							<Badge variant={isOnline ? "success" : "warning"} size="sm">
								{isOnline ? "🟢 Online" : "🟡 Offline"}
							</Badge>
							<Badge variant={formExpanded ? "primary" : "secondary"} size="sm">
								{formExpanded ? "📋 Comprehensive Form" : "📝 Standard Form"}
							</Badge>
							{smartGuidelines && (
								<Badge variant="info" size="sm">📚 WHO Guidelines Available</Badge>
							)}
							{guidelinesLoading && (
								<Badge variant="warning" size="sm">⏳ Loading Guidelines...</Badge>
							)}
						</div>

						{/* Form Mode Toggle */}
						<div className="flex justify-center mb-6">
							<div className="bg-gray-100 p-1 rounded-lg inline-flex">
								<button
									type="button"
									onClick={() => setFormExpanded(false)}
									className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${!formExpanded
										? 'bg-white shadow text-blue-600'
										: 'text-gray-600 hover:text-gray-900'
										}`}
								>
									Quick Form
								</button>
								<button
									type="button"
									onClick={() => setFormExpanded(true)}
									className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${formExpanded
										? 'bg-white shadow text-blue-600'
										: 'text-gray-600 hover:text-gray-900'
										}`}
								>
									Comprehensive
								</button>
							</div>
						</div>
					</div>

					{/* WHO SMART Guidelines - Dynamic positioning */}
					{smartGuidelines?.recommendations && (
						<Card className={`atlas-card-primary mb-6 transition-all duration-300 ${formExpanded ? 'fixed top-4 right-4 w-80 z-10' : ''
							}`}>
							<CardHeader>
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-gray-900">
										WHO Clinical Guidelines
									</h2>
									{formExpanded && (
										<Button
											variant="secondary"
											size="sm"
											onClick={() => setSmartGuidelines(null)}
										>
											×
										</Button>
									)}
								</div>
								<p className="text-sm text-gray-600">
									Relevant guidelines for this clinical presentation
								</p>
							</CardHeader>
							<CardContent className={formExpanded ? "max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300" : ""}>
								<div className="space-y-3">
									{smartGuidelines.recommendations.slice(0, formExpanded ? 5 : 2).map((rec, idx) => (
										<div key={idx} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
											<h4 className="font-medium text-blue-900 text-sm">{rec.title}</h4>
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

					{/* Main Content - Dynamic Layout */}
					<div className={`transition-all duration-300 ${formExpanded && smartGuidelines?.recommendations
						? 'mr-84' // Make room for floating guidelines
						: ''
						}`}>
						{/* Clinical Assessment Form */}
						<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
							{/* Essential Clinical Information */}
							<Card className="atlas-card-primary">
								<CardHeader>
									<div className="flex items-center justify-between">
										<h2 className="text-lg font-semibold text-gray-900">Clinical Assessment</h2>
										<div className="flex items-center space-x-2">
											{guidelinesLoading && <LoadingSpinner size="sm" />}
											<Badge variant="outline" size="sm">
												{formExpanded ? 'Comprehensive Mode' : 'Quick Mode'}
											</Badge>
										</div>
									</div>
								</CardHeader>

								<CardContent className="space-y-6">
									{/* Core Clinical Fields */}
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
										rows={formExpanded ? 4 : 3}
										{...register('symptoms', { required: 'Symptoms are required' })}
										error={errors.symptoms?.message}
										required
									/>

									{/* Dynamic field sizing based on form mode */}
									<div className={`grid gap-6 ${formExpanded ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'
										}`}>
										<Input
											label="Vital Signs"
											placeholder="Temperature, BP, HR, RR, O2 Sat (if available)"
											{...register('vitals')}
											helperText="Include units where applicable"
										/>

										{formExpanded && (
											<Input
												label="Investigations Ordered"
												placeholder="Blood tests, imaging, ECG..."
												{...register('investigationsOrdered')}
											/>
										)}
									</div>

									<TextArea
										label="Physical Examination"
										placeholder="Document physical examination findings..."
										rows={formExpanded ? 5 : 4}
										{...register('examination')}
									/>

									{/* Expanded fields when in comprehensive mode */}
									{formExpanded && (
										<>
											<div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
												<TextArea
													label="Medical History"
													rows={3}
													{...register('medicalHistory')}
													placeholder="Past medical history, surgeries..."
												/>

												<TextArea
													label="Known Allergies"
													{...register('allergies')}
													placeholder="Drug allergies, food allergies..."
													rows={3}
												/>

												<TextArea
													label="Current Medications"
													{...register('currentMedications')}
													placeholder="List current medications with dosages"
													rows={3}
												/>
											</div>

											<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
												<TextArea
													label="Social History"
													placeholder="Smoking, alcohol, occupation..."
													rows={3}
													{...register('socialHistory')}
												/>

												<TextArea
													label="Family History"
													placeholder="Relevant family medical history..."
													rows={3}
													{...register('familyHistory')}
												/>
											</div>
										</>
									)}

									{/* Quick access to essential history in standard mode */}
									{!formExpanded && (
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
											<TextArea
												label="Medical History (Brief)"
												rows={2}
												{...register('medicalHistory')}
												placeholder="Key medical history points"
											/>

											<TextArea
												label="Allergies & Medications"
												{...register('allergies')}
												placeholder="Known allergies and current medications"
												rows={2}
											/>
										</div>
									)}
								</CardContent>
							</Card>

							{/* Clinical Decision Section */}
							<Card className="atlas-card-primary">
								<CardHeader>
									<div className="flex justify-between items-center">
										<h2 className="text-lg font-semibold text-gray-900">Clinical Decision</h2>
										<Badge variant="primary" size="sm">Healthcare Provider</Badge>
									</div>
								</CardHeader>

								<CardContent className="space-y-6">
									<TextArea
										label="Diagnosis"
										placeholder="Enter your clinical diagnosis..."
										rows={formExpanded ? 3 : 2}
										{...register('providerDiagnosis')}
										helperText="Your professional clinical assessment and diagnosis"
									/>

									<TextArea
										label="Treatment Plan"
										placeholder="Enter treatment plan, medications, follow-up instructions..."
										rows={formExpanded ? 5 : 4}
										{...register('providerPlan')}
										helperText="Include medications, dosages, follow-up timeline, and patient instructions."
									/>

									{formExpanded && (
										<TextArea
											label="Follow-up Plan"
											placeholder="Specific follow-up instructions and timeline..."
											rows={3}
											{...register('followUpPlan')}
											helperText="When to return, what to monitor, referral requirements"
										/>
									)}

									<TextArea
										label="Clinical Notes"
										placeholder="Any additional observations or notes..."
										rows={formExpanded ? 3 : 2}
										{...register('providerNotes')}
										helperText="Optional additional notes for future reference"
									/>
								</CardContent>
							</Card>

							{/* Dynamic button layout */}
							<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
								<div className="flex space-x-4">
									<Button
										type="button"
										variant="secondary"
										onClick={() => window.history.back()}
										disabled={loading}
										className="w-full sm:w-auto"
									>
										Cancel
									</Button>
								</div>

								<div className="flex flex-col sm:flex-row items-center gap-4">
									{/* Form stats */}
									<div className="flex items-center space-x-4 text-sm text-gray-600">
										{relevantGuidelines.length > 0 && (
											<span className="flex items-center">
												<span className="mr-1">📚</span>
												{relevantGuidelines.length} guidelines
											</span>
										)}
										<span className="flex items-center">
											<span className="mr-1">📋</span>
											{formExpanded ? 'Comprehensive' : 'Quick'} mode
										</span>
									</div>

									<Button
										type="submit"
										variant="primary"
										loading={loading}
										disabled={loading}
										className="w-full sm:w-auto"
										size={formExpanded ? "lg" : "md"}
									>
										{loading ? 'Saving...' : `Save ${formExpanded ? 'Comprehensive' : 'Standard'} Consultation`}
									</Button>
								</div>
							</div>
						</form>
					</div>

					{/* Guidelines Display - Dynamic positioning and sizing */}
					{relevantGuidelines.length > 0 && !formExpanded && (
						<Card className="atlas-card-secondary mt-6">
							<CardHeader>
								<h3 className="text-lg font-semibold text-gray-900">Clinical Reference Guidelines</h3>
								<p className="text-sm text-gray-600">{relevantGuidelines.length} guidelines found</p>
							</CardHeader>
							<CardContent className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
								<div className="space-y-3">
									{relevantGuidelines.slice(0, 3).map(guideline => (
										<div key={guideline.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
											<h4 className="font-medium text-gray-900">{guideline.title}</h4>
											<p className="text-sm text-gray-700 mt-1">
												{guideline.content?.overview || 'Clinical guideline reference'}
											</p>
											{guideline.category && (
												<div className="mt-2">
													<Badge variant="outline" size="sm">
														{guideline.category}
													</Badge>
												</div>
											)}
										</div>
									))}

									{relevantGuidelines.length > 3 && (
										<div className="text-center pt-3">
											<Button
												variant="secondary"
												size="sm"
												onClick={() => setFormExpanded(true)}
											>
												View {relevantGuidelines.length - 3} more guidelines
											</Button>
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					)}

					{/* Expanded guidelines view */}
					{relevantGuidelines.length > 0 && formExpanded && !smartGuidelines?.recommendations && (
						<Card className="atlas-card-secondary mt-6">
							<CardHeader>
								<h3 className="text-lg font-semibold text-gray-900">All Clinical Reference Guidelines</h3>
								<p className="text-sm text-gray-600">{relevantGuidelines.length} guidelines found</p>
							</CardHeader>
							<CardContent className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
									{relevantGuidelines.map(guideline => (
										<div key={guideline.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
											<h4 className="font-medium text-gray-900 mb-2">{guideline.title}</h4>
											<p className="text-sm text-gray-700 mb-3">
												{guideline.content?.overview || 'Clinical guideline reference'}
											</p>
											{guideline.category && (
												<div className="flex flex-wrap gap-2">
													<Badge variant="outline" size="sm">
														{guideline.category}
													</Badge>
													{guideline.subcategory && (
														<Badge variant="outline" size="sm">
															{guideline.subcategory}
														</Badge>
													)}
												</div>
											)}
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}