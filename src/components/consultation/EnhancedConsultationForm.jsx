// src/components/consultation/EnhancedConsultationForm.jsx - FIXED VERSION
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { enhancedGeminiWithSMART, CONFIDENCE_LEVELS } from '../../lib/ai/enhancedGemini';
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

// Import SMART Guidelines and CRDT if available
let SMARTGuidelinesEngine, HealthcareCRDTManager;
try {
	const smartModule = import('../../lib/clinical/smartGuidelines');
	const crdtModule = import('../../lib/sync/crdt-healthcare');

	smartModule.then(module => { SMARTGuidelinesEngine = module.SMARTGuidelinesEngine; });
	crdtModule.then(module => { HealthcareCRDTManager = module.HealthcareCRDTManager; });
} catch (error) {
	console.warn('Advanced modules not available:', error.message);
}

export default function EnhancedConsultationForm({ patientId, onConsultationComplete }) {
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(false);
	const [patientLoading, setPatientLoading] = useState(true);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// AI Analysis States - FIXED to handle objects properly
	const [aiAnalysis, setAiAnalysis] = useState(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [apiError, setApiError] = useState(null);
	const [biasReport, setBiasReport] = useState(null);

	// Enhanced states for clinical workflow
	const [relevantGuidelines, setRelevantGuidelines] = useState([]);
	const [smartGuidelines, setSmartGuidelines] = useState(null);
	const [clinicalContext, setClinicalContext] = useState({});
	const [consultationId, setConsultationId] = useState(null);
	const [crdtManager, setCrdtManager] = useState(null);

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm();

	// Watch form fields for real-time analysis
	const symptoms = watch('symptoms', '');
	const chiefComplaint = watch('chiefComplaint', '');
	const vitals = watch('vitals', '');
	const examination = watch('examination', '');
	const medicalHistory = watch('medicalHistory', '');
	const allergies = watch('allergies', '');
	const currentMedications = watch('currentMedications', '');

	// Provider fields for final clinical decision
	const providerDiagnosis = watch('providerDiagnosis', '');
	const providerPlan = watch('providerPlan', '');

	// Initialize CRDT manager for collaboration
	useEffect(() => {
		if (HealthcareCRDTManager) {
			const manager = new HealthcareCRDTManager(`device_${Date.now()}`);
			setCrdtManager(manager);
		}
	}, []);

	// Load patient data and seed guidelines
	useEffect(() => {
		const loadPatientData = async () => {
			if (!patientId) {
				setPatientLoading(false);
				return;
			}

			try {
				// Use getById from patientDb
				const patientData = await patientDb.getById(patientId);
				if (patientData) {
					setPatient(patientData);

					// Pre-populate form with patient data
					setValue('medicalHistory', patientData.medicalHistory || '');
					setValue('allergies', patientData.allergies || '');
					setValue('currentMedications', patientData.currentMedications || '');

					// Set clinical context based on patient
					setClinicalContext({
						patientAge: patientData.age,
						patientGender: patientData.gender,
						isPregnant: patientData.pregnancy?.status === 'active',
						gestationalAge: patientData.pregnancy?.gestationalAge,
						chronicConditions: patientData.chronicConditions || []
					});
				}

				// Ensure guidelines are available
				await seedExpandedGuidelines(medicalDb);

			} catch (error) {
				console.error('Error loading patient data:', error);
			} finally {
				setPatientLoading(false);
			}
		};

		loadPatientData();
	}, [patientId, setValue]);

	// Enhanced real-time analysis with SMART Guidelines - FIXED bias handling
	const performRealTimeAnalysis = useCallback(async (formData) => {
		if (!formData.symptoms && !formData.chiefComplaint && !formData.examination) {
			return;
		}

		setIsAnalyzing(true);
		setAnalysisProgress(20);
		setApiError(null);

		const analysisTimingId = startTiming('real_time_analysis');

		try {
			// Step 1: Get relevant guidelines (20-40%)
			setAnalysisProgress(40);
			const guidelines = await getRelevantGuidelines(formData.symptoms, {
				age: patient?.age,
				conditions: formData.symptoms
			});
			setRelevantGuidelines(guidelines);

			// Step 2: Prepare clinical context for SMART Guidelines (40-60%)
			setAnalysisProgress(60);
			const enhancedContext = {
				...clinicalContext,
				encounterType: determineEncounterType(formData),
				facilityLevel: 'health-center', // Could be configurable
				resourceLevel: 'basic'
			};

			// Step 3: Get AI analysis with SMART Guidelines (60-80%)
			setAnalysisProgress(80);
			const query = `Patient presents with: ${formData.chiefComplaint || 'Multiple symptoms'}
			
Symptoms: ${formData.symptoms}
Examination: ${formData.examination}
Vitals: ${formData.vitals}

Please provide clinical assessment and recommendations.`;

			const response = await enhancedGeminiWithSMART(
				query,
				{
					age: patient?.age,
					gender: patient?.gender,
					symptoms: formData.symptoms,
					examination: formData.examination,
					vitals: formData.vitals,
					medicalHistory: formData.medicalHistory,
					allergies: formData.allergies,
					currentMedications: formData.currentMedications,
					pregnancy: patient?.pregnancy,
					gestationalAge: patient?.pregnancy?.gestationalAge
				},
				enhancedContext
			);

			// Store SMART Guidelines for display
			if (response.smartGuidelines) {
				setSmartGuidelines(response.smartGuidelines);
			}

			// Step 4: Bias analysis if AI response available (80-90%) - FIXED
			let biasAnalysis = null;
			let finalResponseText = response.text;

			if (response.text && !response.isRuleBased) {
				setAnalysisProgress(90);
				try {
					biasAnalysis = await analyzeBias(response.text, {
						patientAge: patient?.age,
						patientGender: patient?.gender,
						symptoms: formData.symptoms,
						context: 'clinical_recommendation'
					});

					if (biasAnalysis.detectedBiases?.length > 0) {
						// FIXED: Handle mitigation result properly
						const mitigationResult = await mitigateBias(response.text, biasAnalysis);
						finalResponseText = mitigationResult.mitigatedResponse; // Extract just the text
						response.biasMitigated = true;
						response.mitigationChanges = mitigationResult.changesApplied;
					}

					setBiasReport(biasAnalysis);
				} catch (biasError) {
					console.warn('Bias analysis failed:', biasError);
				}
			}

			// Step 5: Update CRDT if available (90-100%)
			if (crdtManager) {
				try {
					const newConsultationId = consultationId || `consultation_${Date.now()}`;

					// Check if document already exists
					if (!crdtManager.getDocument(newConsultationId)) {
						const consultationCRDT = crdtManager.createDocument(
							'consultation',
							newConsultationId,
							{
								patientId: patient?.id,
								symptoms: formData.symptoms,
								chiefComplaint: formData.chiefComplaint,
								vitals: formData.vitals,
								examination: formData.examination,
								aiAnalysis: { ...response, text: finalResponseText }, // Use final text
								smartGuidelines: response.smartGuidelines,
								timestamp: new Date().toISOString()
							}
						);

						if (!consultationId) {
							setConsultationId(newConsultationId);
						}
					}
				} catch (crdtError) {
					console.warn('CRDT update failed:', crdtError);
				}
			}

			setAnalysisProgress(100);

			// FIXED: Set the final response with corrected text
			setAiAnalysis({
				...response,
				text: finalResponseText, // Use the potentially mitigated text
				biasReport: biasAnalysis,
				mitigationApplied: response.biasMitigated || false
			});

			endTiming(analysisTimingId, {
				hasAiResponse: !!finalResponseText,
				responseLength: finalResponseText?.length || 0,
				confidence: response.confidence,
				guidelinesCount: guidelines.length,
				smartGuidelinesCount: response.smartGuidelines?.recommendations?.length || 0,
				biasDetected: biasAnalysis?.detectedBiases?.length > 0
			});

		} catch (error) {
			console.error('Real-time analysis failed:', error);
			setApiError(error.message);

			// Fallback to basic guideline display
			setAiAnalysis({
				text: `Analysis temporarily unavailable. Please refer to clinical guidelines manually.`,
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
	}, [patient, clinicalContext, consultationId, crdtManager]);

	// Determine encounter type for SMART Guidelines
	const determineEncounterType = (formData) => {
		if (patient?.pregnancy?.status === 'active') {
			return 'anc-visit';
		}
		if (patient?.age && patient.age < 5) {
			return 'pediatric-sick-child';
		}
		if (formData.symptoms?.includes('chronic') || patient?.chronicConditions?.length > 0) {
			return 'chronic-care';
		}
		return 'acute-care';
	};

	// Debounced analysis trigger
	useEffect(() => {
		const formData = {
			symptoms, chiefComplaint, vitals, examination,
			medicalHistory, allergies, currentMedications
		};

		const hasData = symptoms || chiefComplaint || examination;

		if (hasData) {
			const timeoutId = setTimeout(() => {
				performRealTimeAnalysis(formData);
			}, 3000); // 3 second delay for better UX

			return () => clearTimeout(timeoutId);
		}
	}, [symptoms, chiefComplaint, vitals, examination, medicalHistory, allergies, currentMedications, performRealTimeAnalysis]);

	// Enhanced form submission with CRDT sync
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

			// Generate consultation ID first
			const finalConsultationId = consultationId || `consultation_${Date.now()}_${patient?.id}`;

			// Prepare consultation data
			const consultationData = {
				id: finalConsultationId,
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

				// WHO SMART Guidelines data
				smartGuidelines: smartGuidelines ? {
					recommendations: smartGuidelines.recommendations,
					domain: smartGuidelines.domain,
					version: smartGuidelines.version,
					evidence: smartGuidelines.evidence
				} : null,

				// Bias report
				biasReport: biasReport ? {
					severity: biasReport.overallSeverity,
					categories: biasReport.detectedBiases?.map(b => b.category) || [],
					mitigated: biasReport.detectedBiases?.length > 0
				} : null,

				// Provider clinical decisions (authoritative)
				finalDiagnosis: data.providerDiagnosis || '',
				plan: data.providerPlan || '',
				providerNotes: data.providerNotes || '',

				// Metadata
				relevantGuidelinesUsed: relevantGuidelines?.map(g => g.id) || [],
				clinicalContext: clinicalContext,
				formType: 'enhanced', // Distinguish from standard form
				tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : [],

				// CRDT metadata
				crdtId: crdtManager ? finalConsultationId : null,
				lastSyncAttempt: new Date().toISOString()
			};

			// Save consultation
			await consultationDb.add(consultationData);

			// Update CRDT with final data
			if (crdtManager && consultationId) {
				crdtManager.updateDocument(consultationId, 'finalDiagnosis', data.providerDiagnosis, {
					providerId: 'current-user', // Would be actual user ID
					providerRole: 'clinician',
					timestamp: new Date().toISOString()
				});
			}

			endTiming(submissionTimingId, {
				consultationId: finalConsultationId,
				hasAiRecommendations: !!consultationData.aiRecommendations,
				hasSmartGuidelines: !!consultationData.smartGuidelines,
				hasDiagnosis: !!data.providerDiagnosis
			});

			// Navigate to consultation view or call completion callback
			if (onConsultationComplete) {
				onConsultationComplete(finalConsultationId);
			} else {
				window.location.href = `/consultation/${finalConsultationId}`;
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

	if (patientLoading) {
		return (
			<div className="flex justify-center items-center min-h-64">
				<LoadingSpinner size="lg" />
				<span className="ml-3 text-gray-600">Loading patient data...</span>
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardContent>
						<div className="text-center py-12">
							<h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Not Found</h2>
							<p className="text-gray-600 mb-6">
								Unable to load patient data. Please try again.
							</p>
							<Button
								onClick={() => window.history.back()}
								variant="primary"
							>
								Go Back
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Enhanced Header with Status */}
			<div className="mb-6">
				<div className="flex justify-between items-start">
					<div>
						<h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
						<p className="text-gray-600">Patient: {patient.name} (ID: {patient.id})</p>
						<div className="flex items-center space-x-2 mt-2">
							<Badge variant={isOnline ? "success" : "warning"} size="sm">
								{isOnline ? "🟢 Online" : "🟡 Offline"}
							</Badge>
							<Badge variant="primary" size="sm">🤖 Enhanced Form</Badge>
							{smartGuidelines && (
								<Badge variant="success" size="sm">
									WHO SMART Guidelines Active
								</Badge>
							)}
							{crdtManager && (
								<Badge variant="secondary" size="sm">
									Collaborative Mode
								</Badge>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* AI Analysis Panel - FIXED to properly display text */}
			{(isAnalyzing || aiAnalysis) && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">
								Clinical Decision Support
							</h2>
							{isAnalyzing && (
								<div className="flex items-center space-x-2">
									<LoadingSpinner size="sm" />
									<span className="text-sm text-gray-600">
										Analyzing... {analysisProgress}%
									</span>
								</div>
							)}
						</div>
					</CardHeader>

					<CardContent>
						{aiAnalysis && (
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<div className="flex items-center space-x-2">
										<Badge variant={
											aiAnalysis.confidence === CONFIDENCE_LEVELS.HIGH ? 'success' :
												aiAnalysis.confidence === CONFIDENCE_LEVELS.MEDIUM ? 'warning' : 'secondary'
										}>
											{aiAnalysis.confidence} Confidence
										</Badge>
										{aiAnalysis.isRuleBased && (
											<Badge variant="secondary" size="sm">WHO Guidelines</Badge>
										)}
										{aiAnalysis.smartGuidelines && (
											<Badge variant="primary" size="sm">SMART Guidelines</Badge>
										)}
										{aiAnalysis.mitigationApplied && (
											<Badge variant="warning" size="sm">Bias Mitigated</Badge>
										)}
									</div>
									<span className="text-xs text-gray-500">
										{aiAnalysis.responseTime ?
											`${Math.round(aiAnalysis.responseTime)}ms` :
											aiAnalysis.timestamp?.toLocaleTimeString()
										}
									</span>
								</div>

								<div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
									<div className="whitespace-pre-wrap text-sm">
										{/* FIXED: Properly display the text string */}
										{typeof aiAnalysis.text === 'string' ?
											aiAnalysis.text :
											'Analysis complete - see clinical context above'
										}
									</div>
								</div>

								{biasReport && biasReport.detectedBiases?.length > 0 && (
									<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
										<div className="flex items-center space-x-2 mb-2">
											<Badge variant="warning" size="sm">
												Bias Detected & Mitigated
											</Badge>
										</div>
										<p className="text-sm text-yellow-800">
											Detected biases: {biasReport.detectedBiases.map(b => b.category).join(', ')}
										</p>
									</div>
								)}
							</div>
						)}

						{apiError && (
							<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-800">
									AI Analysis Error: {apiError}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* WHO SMART Guidelines Display */}
			{smartGuidelines?.recommendations && (
				<Card className="mb-6">
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">
							WHO SMART Guidelines
						</h2>
						<p className="text-sm text-gray-600">
							{smartGuidelines.guidelines} - Domain: {smartGuidelines.domain}
						</p>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{smartGuidelines.recommendations.slice(0, 3).map((rec, idx) => (
								<div key={idx} className="p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
									<h4 className="font-medium text-green-900">{rec.title}</h4>
									<p className="text-sm text-green-800 mt-1">{rec.description}</p>
									<div className="flex items-center space-x-4 mt-2 text-xs">
										<span className="text-green-600">Evidence: {rec.evidence}</span>
										{rec.resourceConstraints && (
											<span className="text-green-600">
												Resources: {rec.resourceConstraints.join(', ')}
											</span>
										)}
									</div>
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
				<Card className="mt-6">
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Additional Clinical Guidelines</h3>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{relevantGuidelines.slice(0, 3).map(guideline => (
								<div key={guideline.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
									<h4 className="font-medium text-blue-900">{guideline.title}</h4>
									<p className="text-sm text-blue-700 mt-1">
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