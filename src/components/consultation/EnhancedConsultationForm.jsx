// src/components/consultation/EnhancedConsultationForm.jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { getEnhancedClinicalRecommendations, CONFIDENCE_LEVELS } from '../../lib/ai/enhancedGemini';
import { analyzeBias, mitigateBias } from '../../lib/ai/biasDetection';
import { getRelevantGuidelines, seedExpandedGuidelines } from '../../lib/db/expandedGuidelines';
import { patientDb, consultationDb, medicalDb } from '../../lib/db';
import { startTiming, endTiming } from '../../lib/monitoring/performanceMonitor';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';

export default function EnhancedConsultationForm({ patientId, onConsultationComplete }) {
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(false);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// AI Analysis States
	const [aiAnalysis, setAiAnalysis] = useState(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [apiError, setApiError] = useState(null);
	const [biasReport, setBiasReport] = useState(null);

	// Enhanced states for clinical workflow
	const [relevantGuidelines, setRelevantGuidelines] = useState([]);
	const [clinicalContext, setClinicalContext] = useState({});
	const [consultationId, setConsultationId] = useState(null);

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

	// Watch form fields for real-time analysis
	const symptoms = watch('symptoms', '');
	const chiefComplaint = watch('chiefComplaint', '');
	const vitals = watch('vitals', '');
	const examination = watch('examination', '');
	const medicalHistory = watch('medicalHistory', '');
	const allergies = watch('allergies', '');
	const currentMedications = watch('currentMedications', '');

	// NEW: Provider fields for final clinical decision
	const providerDiagnosis = watch('providerDiagnosis', '');
	const providerPlan = watch('providerPlan', '');

	// Load patient data and initialize expanded guidelines
	useEffect(() => {
		async function initializeConsultation() {
			try {
				// Ensure expanded guidelines are available
				await seedExpandedGuidelines(medicalDb);

				if (patientId) {
					const patientData = await patientDb.getById(patientId);
					setPatient(patientData);

					if (patientData) {
						setValue('medicalHistory', patientData.medicalHistory || '');
						setValue('allergies', patientData.allergies || '');
						setValue('currentMedications', patientData.currentMedications || '');
					}
				}
			} catch (error) {
				console.error('Error initializing consultation:', error);
			}
		}

		initializeConsultation();
	}, [patientId, setValue]);

	// Enhanced real-time analysis with bias detection
	const performRealTimeAnalysis = useCallback(async (formData) => {
		const hasEnoughData = formData.symptoms?.length > 5 || formData.chiefComplaint?.length > 3;

		if (!hasEnoughData) {
			setAiAnalysis(null);
			setBiasReport(null);
			return;
		}

		const timingId = startTiming('real_time_ai_analysis');
		setIsAnalyzing(true);
		setAnalysisProgress(0);
		setApiError(null);

		try {
			// Get relevant guidelines based on symptoms and patient age
			const guidelines = await getRelevantGuidelines(
				await medicalDb.searchGuidelines(''),
				formData.symptoms,
				patient?.age
			);
			setRelevantGuidelines(guidelines);

			// Progress simulation
			const progressInterval = setInterval(() => {
				setAnalysisProgress(prev => Math.min(prev + 15, 85));
			}, 200);

			const patientData = {
				name: patient?.name || '',
				age: patient?.age || '',
				gender: patient?.gender || '',
				medicalHistory: formData.medicalHistory || '',
				allergies: formData.allergies || '',
				currentMedications: formData.currentMedications || '',
				symptoms: formData.symptoms || '',
				vitals: formData.vitals || '',
				examination: formData.examination || ''
			};

			const relevantMedicalData = {
				guidelines: guidelines.slice(0, 3), // Limit for context size
				conditions: await medicalDb.searchConditions(formData.symptoms),
				medications: await medicalDb.searchMedications(formData.symptoms)
			};

			// Create comprehensive clinical query
			const clinicalQuery = `
Clinical Assessment for ${patientData.age} year old ${patientData.gender}:

Chief Complaint: ${formData.chiefComplaint}
Symptoms: ${formData.symptoms}
${formData.vitals ? `Vitals: ${formData.vitals}` : ''}
${formData.examination ? `Examination: ${formData.examination}` : ''}

Please provide:
1. Differential diagnosis (top 3 most likely)
2. Recommended next steps for assessment
3. Treatment considerations for resource-limited setting
4. Red flags requiring urgent attention
5. Follow-up recommendations

Format response with clear sections for easy clinical use.
      `.trim();

			console.log('Requesting enhanced AI analysis...');

			// Get AI recommendations with enhanced error handling
			const aiResult = await getEnhancedClinicalRecommendations(
				clinicalQuery,
				patientData,
				relevantMedicalData,
				{ maxRetries: 2, timeoutMs: 15000, fallbackToRules: true }
			);

			clearInterval(progressInterval);
			setAnalysisProgress(100);

			// Analyze for bias if AI-generated (not rule-based)
			let biasAnalysis = null;
			let mitigatedResponse = aiResult.text;

			if (!aiResult.isRuleBased && !aiResult.isError) {
				console.log('Analyzing response for bias...');
				biasAnalysis = await analyzeBias(aiResult.text, patientData, clinicalQuery);
				setBiasReport(biasAnalysis);

				// Apply bias mitigation if needed
				if (biasAnalysis.overallSeverity !== 'none') {
					const mitigation = await mitigateBias(aiResult.text, biasAnalysis);
					mitigatedResponse = mitigation.mitigatedResponse;

					console.log(`Bias detected (${biasAnalysis.overallSeverity}), mitigation applied:`,
						mitigation.changesApplied);
				}
			}

			setAiAnalysis({
				...aiResult,
				text: mitigatedResponse,
				biasReport: biasAnalysis,
				relevantGuidelines: guidelines,
				timestamp: new Date(),
				confidence: aiResult.confidence || CONFIDENCE_LEVELS.MEDIUM
			});

			// Store clinical context for later use
			setClinicalContext({
				patientData,
				relevantMedicalData,
				query: clinicalQuery,
				guidelines
			});

			endTiming(timingId, {
				success: !aiResult.isError,
				confidence: aiResult.confidence,
				biasDetected: biasAnalysis?.overallSeverity !== 'none',
				guidelinesFound: guidelines.length
			});

		} catch (error) {
			console.error('Error in real-time analysis:', error);
			setApiError(error.message);
			endTiming(timingId, { error: error.message });

			setAiAnalysis({
				text: `Analysis failed: ${error.message}. Please refer to clinical guidelines manually.`,
				timestamp: new Date(),
				confidence: CONFIDENCE_LEVELS.VERY_LOW,
				isError: true
			});
		} finally {
			setTimeout(() => {
				setIsAnalyzing(false);
				setAnalysisProgress(0);
			}, 500);
		}
	}, [patient, medicalDb]);

	// Debounced analysis trigger (increased to 4 seconds for more stable experience)
	useEffect(() => {
		const formData = {
			symptoms, chiefComplaint, vitals, examination,
			medicalHistory, allergies, currentMedications
		};

		const hasData = symptoms || chiefComplaint || examination;

		if (hasData) {
			const timeoutId = setTimeout(() => {
				performRealTimeAnalysis(formData);
			}, 4000);

			return () => clearTimeout(timeoutId);
		}
	}, [symptoms, chiefComplaint, vitals, examination, medicalHistory, allergies, currentMedications, performRealTimeAnalysis]);

	// Enhanced form submission with proper AI/Provider distinction
	const onSubmit = async (data) => {
		setLoading(true);
		const submissionTimingId = startTiming('consultation_submission');

		try {
			// Update patient record
			if (patient?.id) {
				await patientDb.update(patient.id, {
					medicalHistory: data.medicalHistory,
					allergies: data.allergies,
					currentMedications: data.currentMedications
				});
			}

			// Prepare consultation data with clear AI vs Provider distinction
			const consultationData = {
				patientId: patient.id,
				date: new Date().toISOString(),

				// Clinical assessment data
				symptoms: data.symptoms,
				chiefComplaint: data.chiefComplaint,
				vitals: data.vitals,
				examination: data.examination,

				// AI-generated content (stored separately from provider decisions)
				aiRecommendations: aiAnalysis?.text || null,
				aiConfidence: aiAnalysis?.confidence || null,
				aiTimestamp: aiAnalysis?.timestamp?.toISOString() || null,
				aiModel: aiAnalysis?.isRuleBased ? 'rule_based' : 'gemini_ai',
				biasReport: biasReport ? {
					severity: biasReport.overallSeverity,
					categories: biasReport.detectedBiases?.map(b => b.category) || [],
					mitigated: biasReport.detectedBiases?.length > 0
				} : null,

				// Provider clinical decisions (the authoritative medical decisions)
				finalDiagnosis: data.providerDiagnosis || '', // Provider's diagnosis
				plan: data.providerPlan || '', // Provider's treatment plan
				providerNotes: data.providerNotes || '', // Additional provider notes

				// Metadata
				relevantGuidelinesUsed: relevantGuidelines?.map(g => g.id) || [],
				clinicalContext: clinicalContext,
				tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : []
			};

			// Save consultation
			const newConsultationId = await consultationDb.add(consultationData);
			setConsultationId(newConsultationId);

			endTiming(submissionTimingId, { success: true, consultationId: newConsultationId });

			// Call completion callback
			if (onConsultationComplete) {
				onConsultationComplete(newConsultationId);
			} else {
				alert('Consultation saved successfully!');
			}

		} catch (error) {
			console.error('Error saving consultation:', error);
			endTiming(submissionTimingId, { error: error.message });
			alert('Error saving consultation. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	// Utility function to copy AI recommendations to provider fields
	const copyAIRecommendationsToDiagnosis = () => {
		if (aiAnalysis?.text) {
			setValue('providerDiagnosis', aiAnalysis.text);
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
			{/* Patient Information Card - Same as before */}
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

			{/* Enhanced AI Analysis Panel */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<h3 className="text-lg font-semibold text-gray-900">
							{isAnalyzing ? 'Analyzing Clinical Data...' : 'AI Clinical Decision Support'}
						</h3>
						<div className="flex space-x-2">
							{aiAnalysis && !aiAnalysis.isError && (
								<Badge variant={
									aiAnalysis.confidence === CONFIDENCE_LEVELS.HIGH ? 'success' :
										aiAnalysis.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'warning' : 'secondary'
								}>
									{aiAnalysis.confidence} confidence
								</Badge>
							)}
							{biasReport && biasReport.overallSeverity !== 'none' && (
								<Badge variant="warning">
									Bias: {biasReport.overallSeverity}
								</Badge>
							)}
						</div>
					</div>
				</CardHeader>

				<CardContent>
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

					<div className={`p-4 rounded-lg border ${aiAnalysis?.isError ? 'bg-red-50 border-red-200' :
						!isOnline ? 'bg-yellow-50 border-yellow-200' :
							'bg-gray-50 border-gray-200'
						}`}>
						<div className="whitespace-pre-line text-sm">
							{aiAnalysis ?
								aiAnalysis.text :
								'Start entering patient data to see real-time AI clinical analysis and recommendations...'
							}
						</div>
					</div>

					{aiAnalysis && (
						<div className="mt-4 flex justify-between items-center">
							<p className="text-xs text-gray-500">
								Last updated: {aiAnalysis.timestamp.toLocaleTimeString()}
								{aiAnalysis.isRuleBased && ' (guideline-based)'}
								{aiAnalysis.fromCache && ' (from cache)'}
							</p>

							{aiAnalysis.text && !aiAnalysis.isError && (
								<Button
									onClick={copyAIRecommendationsToDiagnosis}
									variant="outline"
									size="sm"
								>
									Copy to Diagnosis
								</Button>
							)}
						</div>
					)}

					{/* Bias Report Display */}
					{biasReport && biasReport.overallSeverity !== 'none' && (
						<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<h4 className="text-sm font-medium text-yellow-800 mb-2">
								Bias Detection Alert ({biasReport.overallSeverity} severity)
							</h4>
							<div className="text-xs text-yellow-700">
								Detected biases: {biasReport.detectedBiases?.map(b => b.category).join(', ')}
								<br />
								Response has been automatically reviewed and adjusted where possible.
							</div>
						</div>
					)}
				</CardContent>
			</Card>

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

			{/* Relevant Guidelines Display */}
			{relevantGuidelines.length > 0 && (
				<Card>
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Relevant Clinical Guidelines</h3>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{relevantGuidelines.slice(0, 3).map(guideline => (
								<div key={guideline.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
									<h4 className="font-medium text-blue-900">{guideline.title}</h4>
									<p className="text-sm text-blue-700 mt-1">{guideline.content.overview}</p>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}