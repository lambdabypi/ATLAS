// src/components/consultation/ConsultationForm.jsx - FIXED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { processClinicalSymptoms, getClinicalRecommendations } from '../../lib/ai/gemini';
import { patientDb, consultationDb, medicalDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input, TextArea } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

export default function ConsultationForm({ patientId, onConsultationComplete }) {
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
	const [relevantMedicalData, setRelevantMedicalData] = useState(null);

	// Real-time analysis states
	const [realTimeDiagnosis, setRealTimeDiagnosis] = useState(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [apiError, setApiError] = useState(null);

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

	// Watch all form fields for real-time analysis
	const symptoms = watch('symptoms', '');
	const chiefComplaint = watch('chiefComplaint', '');
	const vitals = watch('vitals', '');
	const examination = watch('examination', '');
	const medicalHistory = watch('medicalHistory', '');
	const allergies = watch('allergies', '');
	const currentMedications = watch('currentMedications', '');

	// Load patient data
	useEffect(() => {
		async function loadPatient() {
			if (patientId) {
				try {
					const patientData = await patientDb.getById(patientId);
					setPatient(patientData);

					if (patientData) {
						setValue('medicalHistory', patientData.medicalHistory || '');
						setValue('allergies', patientData.allergies || '');
						setValue('currentMedications', patientData.currentMedications || '');
					}
				} catch (error) {
					console.error('Error loading patient data:', error);
				}
			}
		}

		loadPatient();
	}, [patientId, setValue]);

	// Set up online/offline detection
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Real-time analysis function with proper error handling
	const performRealTimeAnalysis = useCallback(async (formData) => {
		// Only analyze if we have substantial data
		const hasEnoughData = formData.symptoms?.length > 5 ||
			formData.chiefComplaint?.length > 3;

		if (!hasEnoughData) {
			setRealTimeDiagnosis(null);
			return;
		}

		if (!isOnline) {
			setRealTimeDiagnosis({
				text: 'You are offline. Connect to the internet to get AI-powered clinical recommendations.',
				timestamp: new Date(),
				confidence: 'low',
				isOffline: true
			});
			return;
		}

		setIsAnalyzing(true);
		setAnalysisProgress(0);
		setApiError(null);

		try {
			// Simulate progress updates
			const progressInterval = setInterval(() => {
				setAnalysisProgress(prev => Math.min(prev + 15, 85));
			}, 200);

			const patientData = {
				name: patient?.name || '',
				age: patient?.age || '',
				gender: patient?.gender || '',
				medicalHistory: formData.medicalHistory || '',
				allergies: formData.allergies || '',
				currentMedications: formData.currentMedications || ''
			};

			// Create a comprehensive query for analysis
			const analysisQuery = `
Clinical Assessment Request:

Patient: ${patientData.age} year old ${patientData.gender}
${formData.chiefComplaint ? `Chief Complaint: ${formData.chiefComplaint}` : ''}
${formData.symptoms ? `Symptoms: ${formData.symptoms}` : ''}
${formData.vitals ? `Vitals: ${formData.vitals}` : ''}
${formData.examination ? `Physical Examination: ${formData.examination}` : ''}
${formData.medicalHistory ? `Medical History: ${formData.medicalHistory}` : ''}

Please provide:
1. Most likely differential diagnoses (top 3)
2. Key clinical findings to support each diagnosis
3. Recommended next steps for assessment
4. Treatment considerations for resource-limited setting
5. Red flags requiring urgent attention
6. Keep the response concise and clinically relevant.

Format your response clearly with bullet points for easy reading.
			`.trim();

			console.log('Sending query to Gemini:', analysisQuery);

			// Get AI recommendations
			const result = await getClinicalRecommendations(
				analysisQuery,
				patientData,
				relevantMedicalData
			);

			clearInterval(progressInterval);
			setAnalysisProgress(100);

			console.log('Received Gemini response:', result);

			if (result.error) {
				throw new Error(result.error);
			}

			setRealTimeDiagnosis({
				text: result.text,
				timestamp: new Date(),
				confidence: calculateConfidence(formData),
				fromCache: result.fromCache || false,
				isError: false
			});

		} catch (error) {
			console.error('Error in real-time analysis:', error);
			setApiError(error.message);

			setRealTimeDiagnosis({
				text: `Unable to get AI recommendations: ${error.message}. 

Please check:
- Your internet connection
- That you have set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file
- That your Gemini API key is valid

You can still complete the consultation manually using the clinical guidelines.`,
				timestamp: new Date(),
				confidence: 'low',
				isError: true
			});
		} finally {
			setTimeout(() => {
				setIsAnalyzing(false);
				setAnalysisProgress(0);
			}, 500);
		}
	}, [patient, relevantMedicalData, isOnline]);

	// Calculate confidence based on amount of data provided
	const calculateConfidence = (formData) => {
		let score = 0;
		if (formData.symptoms?.length > 10) score += 2;
		if (formData.chiefComplaint?.length > 5) score += 2;
		if (formData.vitals?.length > 5) score += 1;
		if (formData.examination?.length > 10) score += 2;
		if (formData.medicalHistory?.length > 5) score += 1;

		if (score >= 6) return 'high';
		if (score >= 4) return 'medium';
		return 'low';
	};

	// Debounced real-time analysis trigger
	useEffect(() => {
		const formData = {
			symptoms,
			chiefComplaint,
			vitals,
			examination,
			medicalHistory,
			allergies,
			currentMedications
		};

		// Only trigger if we have some meaningful data
		const hasData = symptoms || chiefComplaint || examination;

		if (hasData) {
			// Debounce the analysis - wait 3 seconds after user stops typing
			const timeoutId = setTimeout(() => {
				performRealTimeAnalysis(formData);
			}, 3000);

			return () => clearTimeout(timeoutId);
		}
	}, [symptoms, chiefComplaint, vitals, examination, medicalHistory, allergies, currentMedications, performRealTimeAnalysis]);

	// Find relevant medical data based on symptoms
	useEffect(() => {
		async function findRelevantData() {
			if (!symptoms || symptoms.trim() === '') {
				setRelevantMedicalData(null);
				return;
			}

			try {
				const symptomsList = symptoms
					.split(',')
					.map(s => s.trim())
					.filter(s => s.length > 3);

				if (symptomsList.length === 0) return;

				const searchPromises = symptomsList.map(async (symptom) => {
					const conditions = await medicalDb.searchConditions(symptom);
					const medications = await medicalDb.searchMedications(symptom);
					const guidelines = await medicalDb.searchGuidelines(symptom);
					return { conditions, medications, guidelines };
				});

				const searchResults = await Promise.all(searchPromises);

				const combinedResults = {
					conditions: [],
					medications: [],
					guidelines: []
				};

				searchResults.forEach(result => {
					result.conditions.forEach(condition => {
						if (!combinedResults.conditions.some(c => c.id === condition.id)) {
							combinedResults.conditions.push(condition);
						}
					});

					result.medications.forEach(medication => {
						if (!combinedResults.medications.some(m => m.id === medication.id)) {
							combinedResults.medications.push(medication);
						}
					});

					result.guidelines.forEach(guideline => {
						if (!combinedResults.guidelines.some(g => g.id === guideline.id)) {
							combinedResults.guidelines.push(guideline);
						}
					});
				});

				setRelevantMedicalData(combinedResults);
			} catch (error) {
				console.error('Error finding relevant medical data:', error);
			}
		}

		const timeoutId = setTimeout(findRelevantData, 500);
		return () => clearTimeout(timeoutId);
	}, [symptoms]);

	// Handle form submission
	const onSubmit = async (data) => {
		setLoading(true);

		try {
			// Update patient record
			if (patient?.id) {
				await patientDb.update(patient.id, {
					medicalHistory: data.medicalHistory,
					allergies: data.allergies,
					currentMedications: data.currentMedications
				});
			}

			// Save consultation
			if (patient?.id) {
				const consultationId = await consultationDb.add({
					patientId: patient.id,
					symptoms: data.symptoms,
					chiefComplaint: data.chiefComplaint,
					vitals: data.vitals,
					examination: data.examination,
					differentialDiagnosis: realTimeDiagnosis?.text,
					aiRecommendations: realTimeDiagnosis?.text,
					finalDiagnosis: data.providerDiagnosis || '',
					plan: data.providerPlan || '',
					providerNotes: data.providerNotes || '',
					tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : []
				});

				// Call completion callback if provided
				if (onConsultationComplete) {
					onConsultationComplete(consultationId);
				} else {
					alert('Consultation saved successfully!');
				}
			}
		} catch (error) {
			console.error('Error saving consultation:', error);
			alert('Error saving consultation. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (!patient) {
		return (
			<div className="flex justify-center items-center min-h-64">
				<LoadingSpinner />
				<span className="ml-2">Loading patient data...</span>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto space-y-6">
			{/* Patient Information */}
			<Card>
				<CardHeader>
					<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						<div>
							<p className="text-sm text-gray-500">Name</p>
							<p className="font-medium">{patient.name}</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">Age</p>
							<p className="font-medium">{patient.age} years</p>
						</div>
						<div>
							<p className="text-sm text-gray-500">Gender</p>
							<p className="font-medium">{patient.gender}</p>
						</div>
					</div>
					{patient.allergies && (
						<div className="mt-4">
							<Badge variant="danger">Allergies: {patient.allergies}</Badge>
						</div>
					)}
				</CardContent>
			</Card>

			{/* AI Analysis Panel */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold text-gray-900">
							{isAnalyzing ? 'Analyzing Clinical Data...' : 'AI Clinical Decision Support'}
						</h3>
						{realTimeDiagnosis && !realTimeDiagnosis.isError && !realTimeDiagnosis.isOffline && (
							<Badge variant={
								realTimeDiagnosis.confidence === 'high' ? 'success' :
									realTimeDiagnosis.confidence === 'medium' ? 'warning' : 'secondary'
							}>
								{realTimeDiagnosis.confidence} confidence
							</Badge>
						)}
					</div>
				</CardHeader>

				<CardContent>
					{/* Progress bar for analysis */}
					{isAnalyzing && (
						<div className="mb-4">
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full transition-all duration-300"
									style={{ width: `${analysisProgress}%` }}
								></div>
							</div>
						</div>
					)}

					{/* Analysis results */}
					<div className={`p-4 rounded-lg border ${realTimeDiagnosis?.isError ? 'bg-red-50 border-red-200' :
						realTimeDiagnosis?.isOffline ? 'bg-yellow-50 border-yellow-200' :
							'bg-gray-50 border-gray-200'
						}`}>
						<div className="whitespace-pre-line text-sm">
							{realTimeDiagnosis ?
								realTimeDiagnosis.text :
								'Start entering patient data to see real-time AI clinical analysis and recommendations...'
							}
						</div>
					</div>

					{/* Analysis metadata */}
					{realTimeDiagnosis && (
						<div className="mt-4 flex justify-between items-center">
							<p className="text-xs text-gray-500">
								Last updated: {realTimeDiagnosis.timestamp.toLocaleTimeString()}
								{realTimeDiagnosis.fromCache && ' (from cache)'}
							</p>

							{realTimeDiagnosis.text && !realTimeDiagnosis.isError && (
								<Button
									type="button"
									onClick={() => {
										// Copy AI recommendations to provider diagnosis field
										setValue('providerDiagnosis', realTimeDiagnosis.text);
									}}
									variant="outline"
									size="sm"
								>
									Copy to Diagnosis
								</Button>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Relevant Guidelines Display */}
			{relevantMedicalData?.guidelines && relevantMedicalData.guidelines.length > 0 && (
				<Card>
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Relevant Clinical Guidelines</h3>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{relevantMedicalData.guidelines.slice(0, 3).map(guideline => (
								<div key={guideline.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
									<h4 className="font-medium text-blue-900">{guideline.title}</h4>
									<p className="text-sm text-blue-700 mt-1">
										{typeof guideline.content === 'string' ?
											JSON.parse(guideline.content).overview || 'Clinical guideline available' :
											guideline.content.overview || 'Clinical guideline available'
										}
									</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Consultation Form */}
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

				{/* Provider Clinical Decision Section */}
				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">Provider Clinical Decision</h2>
							<Badge variant="primary">Healthcare Provider Responsibility</Badge>
						</div>
					</CardHeader>

					<CardContent className="space-y-6">
						<TextArea
							label="Final Diagnosis"
							placeholder="Enter your clinical diagnosis based on assessment and available information..."
							rows={3}
							{...register('providerDiagnosis')}
							helperText="This is your professional clinical diagnosis, distinct from AI recommendations above."
						/>

						<TextArea
							label="Treatment Plan"
							placeholder="Enter treatment plan, medications, follow-up instructions..."
							rows={4}
							{...register('providerPlan')}
							helperText="Include medications, dosages, follow-up timeline, and patient instructions."
						/>

						<TextArea
							label="Additional Clinical Notes"
							placeholder="Any additional observations, considerations, or notes..."
							rows={2}
							{...register('providerNotes')}
							helperText="Optional additional notes for future reference."
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
		</div>
	);
}