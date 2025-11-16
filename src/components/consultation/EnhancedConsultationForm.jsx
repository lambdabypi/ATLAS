// src/components/consultation/EnhancedConsultationForm.jsx - UPDATED WITH CENTRALIZED ONLINE STATUS
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { getEnhancedClinicalRecommendations, getEnhancedSystemStatus } from '../../lib/ai/enhancedHybridAI';
import { AIAnalysisDisplay } from '../ui/AIAnalysisDisplay';
import { CONFIDENCE_LEVELS } from '../../lib/constants/clinicalConstants.js';
import { getRelevantGuidelines, seedExpandedGuidelines } from '../../lib/db/expandedGuidelines';
import { patientDb, consultationDb, medicalDb } from '../../lib/db';
import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus'; // 🎯 CENTRALIZED HOOK
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TextArea } from '../ui/TextArea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Badge } from '../ui/Badge';
import ConnectionStatus from '../ui/ConnectionStatus'; // 🎯 REUSABLE COMPONENT

export default function EnhancedConsultationForm({ patientId, onConsultationComplete }) {
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(false);
	const [patientLoading, setPatientLoading] = useState(true);

	// 🎯 USE CENTRALIZED ONLINE STATUS
	const { isOnline, getStatusInfo } = useOnlineStatus();
	const statusInfo = getStatusInfo();

	// AI Analysis States
	const [aiAnalysis, setAiAnalysis] = useState(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysisProgress, setAnalysisProgress] = useState(0);
	const [apiError, setApiError] = useState(null);

	// Enhanced states for clinical workflow
	const [relevantGuidelines, setRelevantGuidelines] = useState([]);
	const [consultationId, setConsultationId] = useState(null);

	// System status
	const [systemStatus, setSystemStatus] = useState({
		models: {
			localAI: { available: false },
			clinicalRAG: { available: false },
			gemini: { available: false }
		},
		hybrid: { enabled: false }
	});
	const [modelPreference, setModelPreference] = useState('auto');
	const [modelStats, setModelStats] = useState({
		localAIQueries: 0,
		ragQueries: 0,
		geminiQueries: 0,
		totalQueries: 0,
		lastUpdate: Date.now()
	});

	// Clinical assessment sections state
	const [activeSection, setActiveSection] = useState('presenting-complaint');
	const [clinicalFlags, setClinicalFlags] = useState({
		dangerSigns: false,
		emergencyIndicators: false,
		chronicCondition: false,
		followUpRequired: false
	});

	const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
		defaultValues: {
			// Basic Information
			chiefComplaint: '',
			presentingComplaint: '',
			historyPresentingComplaint: '',

			// Clinical Assessment
			symptoms: '',
			symptomDuration: '',
			symptomSeverity: '',
			associatedSymptoms: '',

			// Systematic Review
			systematicReview: {
				cardiovascular: '',
				respiratory: '',
				gastrointestinal: '',
				genitourinary: '',
				neurological: '',
				musculoskeletal: '',
				dermatological: '',
				psychiatric: ''
			},

			// Physical Examination
			generalAppearance: '',
			vitalSigns: {
				temperature: '',
				bloodPressure: '',
				heartRate: '',
				respiratoryRate: '',
				oxygenSaturation: '',
				weight: '',
				height: '',
				bmi: ''
			},

			// System Examination
			systemExamination: {
				cardiovascular: '',
				respiratory: '',
				abdominal: '',
				neurological: '',
				musculoskeletal: '',
				skin: '',
				ent: '',
				eyes: ''
			},

			// Investigations
			investigationsOrdered: '',
			investigationResults: '',

			// Assessment and Plan
			clinicalAssessment: '',
			differentialDiagnosis: '',
			finalDiagnosis: '',
			treatmentPlan: '',
			medications: '',
			followUpInstructions: '',

			// Advanced
			riskFactors: '',
			prognosticFactors: '',
			patientEducation: '',
			clinicalNotes: ''
		}
	});

	// Watch all form fields
	const watchedFields = watch();

	// 🎯 SYSTEM STATUS MONITORING WITH CONNECTION AWARENESS
	const updateSystemStatus = useCallback(async () => {
		try {
			const status = await getEnhancedSystemStatus();
			setSystemStatus(status);

			// Get current connection status for logging only (not a dependency)
			const currentStatusInfo = getStatusInfo();

			console.log('🤖 Enhanced System Status:', {
				ragAvailable: status.models?.clinicalRAG?.available,
				ragGuidelineCount: status.models?.clinicalRAG?.guidelineCount,
				geminiAvailable: status.models?.gemini?.available,
				hybridEnabled: status.hybrid?.enabled,
				connectionStatus: currentStatusInfo.statusText
			});
		} catch (error) {
			console.warn('Could not get system status:', error);
			// Fallback status with connection-aware defaults
			setSystemStatus({
				models: {
					localAI: { available: true },
					clinicalRAG: { available: true, guidelineCount: 15 },
					gemini: { available: isOnline }
				},
				hybrid: { enabled: true }
			});
		}
	}, [isOnline, getStatusInfo]);

	useEffect(() => {
		updateSystemStatus();
		const interval = setInterval(updateSystemStatus, 15000);
		return () => clearInterval(interval);
	}, [updateSystemStatus]);

	// Load patient data
	useEffect(() => {
		const loadPatientData = async () => {
			if (!patientId) {
				setPatientLoading(false);
				return;
			}

			try {
				const patientData = await patientDb.getById(patientId);
				if (patientData) {
					setPatient(patientData);
					// Pre-populate known patient information
					setValue('medicalHistory', patientData.medicalHistory || '');
					setValue('allergies', patientData.allergies || '');
					setValue('currentMedications', patientData.currentMedications || '');
					setValue('riskFactors', patientData.riskFactors || '');
				}
				await seedExpandedGuidelines(medicalDb);
			} catch (error) {
				console.error('Error loading patient data:', error);
			} finally {
				setPatientLoading(false);
			}
		};

		loadPatientData();
	}, [patientId, setValue]);

	// 🎯 ENHANCED REAL-TIME CLINICAL ANALYSIS WITH CONNECTION AWARENESS
	const performRealTimeAnalysis = useCallback(async (formData) => {
		if (!formData.chiefComplaint && !formData.symptoms && !formData.presentingComplaint) {
			return;
		}

		// Don't start analysis if offline and no local capabilities
		if (!isOnline && !systemStatus.models?.clinicalRAG?.available) {
			console.log('Skipping AI analysis - offline and no local capabilities');
			return;
		}

		setIsAnalyzing(true);
		setAnalysisProgress(20);
		setApiError(null);

		try {
			// Update clinical flags
			const newFlags = {
				dangerSigns: detectDangerSigns(formData),
				emergencyIndicators: detectEmergencyIndicators(formData),
				chronicCondition: detectChronicCondition(formData),
				followUpRequired: true
			};
			setClinicalFlags(newFlags);

			setAnalysisProgress(40);

			// Get relevant guidelines with FULL content
			const guidelines = await getRelevantGuidelines(
				formData.symptoms || formData.chiefComplaint || formData.presentingComplaint,
				{
					age: patient?.age,
					gender: patient?.gender,
					pregnancy: patient?.pregnancy,
					conditions: formData.symptoms
				}
			);
			setRelevantGuidelines(guidelines);

			setAnalysisProgress(60);

			// Construct comprehensive clinical query
			const clinicalQuery = constructComprehensiveQuery(formData, patient);

			setAnalysisProgress(80);

			// 🎯 CONNECTION-AWARE AI OPTIONS
			const analysisOptions = {
				modelPreference: !isOnline ? 'local-only' :
					statusInfo.isSlowConnection ? 'prefer-local' : modelPreference,
				maxRetries: statusInfo.isSlowConnection ? 1 : 2,
				fallbackToRules: true,
				fullContent: true,
				timeoutMs: statusInfo.isSlowConnection ? 30000 : 10000 // Longer timeout for slow connections
			};

			// Get enhanced clinical recommendations
			const response = await getEnhancedClinicalRecommendations(
				clinicalQuery,
				{
					age: patient?.age,
					gender: patient?.gender,
					symptoms: formData.symptoms || formData.chiefComplaint,
					chiefComplaint: formData.chiefComplaint || formData.presentingComplaint,
					examination: formData.generalAppearance,
					vitals: formatVitalSigns(formData.vitalSigns),
					medicalHistory: formData.medicalHistory,
					allergies: formData.allergies,
					currentMedications: formData.currentMedications || formData.medications,
					pregnancy: patient?.pregnancy,
					emergencyIndicators: newFlags.dangerSigns || newFlags.emergencyIndicators
				},
				{ guidelines },
				analysisOptions
			);

			updateModelStats(response.selectedModel, response.responseTime);

			setAnalysisProgress(100);

			setAiAnalysis({
				...response,
				timestamp: new Date(),
				isOffline: !isOnline,
				connectionType: statusInfo.connectionType,
				isSlowConnection: statusInfo.isSlowConnection,
				clinicalFlags: newFlags,
				guidelinesUsed: guidelines.length,
				systemStatus: await getEnhancedSystemStatus()
			});

		} catch (error) {
			console.error('Analysis failed:', error);

			// 🎯 CONNECTION-AWARE ERROR MESSAGES
			let errorMessage = `Analysis failed: ${error.message}`;
			if (!isOnline) {
				errorMessage += '\n\nWorking offline - only local guidelines and rules available.';
			} else if (statusInfo.isSlowConnection) {
				errorMessage += '\n\nSlow connection detected - try the Standard form for better performance.';
			}

			setApiError(errorMessage);

			setAiAnalysis({
				text: `${errorMessage}\n\nPlease refer to clinical guidelines manually and use your professional judgment.`,
				timestamp: new Date(),
				confidence: CONFIDENCE_LEVELS.VERY_LOW,
				selectedModel: 'error-fallback',
				isError: true,
				isOffline: !isOnline,
				connectionType: statusInfo.connectionType,
				isSlowConnection: statusInfo.isSlowConnection
			});
		} finally {
			setTimeout(() => {
				setIsAnalyzing(false);
				setAnalysisProgress(0);
			}, 500);
		}
	}, [patient, isOnline, statusInfo, modelPreference, systemStatus]);

	// Helper functions for clinical assessment
	const detectDangerSigns = (formData) => {
		const dangerKeywords = [
			'unconscious', 'unresponsive', 'severe bleeding', 'convulsions',
			'difficulty breathing', 'chest pain', 'unable to drink', 'vomits everything'
		];

		const allText = Object.values(formData).join(' ').toLowerCase();
		return dangerKeywords.some(keyword => allText.includes(keyword));
	};

	const detectEmergencyIndicators = (formData) => {
		const emergencyKeywords = [
			'emergency', 'urgent', 'critical', 'severe', 'acute', 'sudden onset',
			'collapse', 'shock', 'seizure', 'stroke', 'heart attack'
		];

		const allText = Object.values(formData).join(' ').toLowerCase();
		return emergencyKeywords.some(keyword => allText.includes(keyword));
	};

	const detectChronicCondition = (formData) => {
		const chronicKeywords = [
			'chronic', 'diabetes', 'hypertension', 'asthma', 'copd', 'arthritis',
			'long-term', 'ongoing', 'persistent', 'recurrent'
		];

		const allText = Object.values(formData).join(' ').toLowerCase();
		return chronicKeywords.some(keyword => allText.includes(keyword));
	};

	const constructComprehensiveQuery = (formData, patient) => {
		let query = `COMPREHENSIVE CLINICAL ASSESSMENT

CONNECTION STATUS: ${statusInfo.statusText}
${!isOnline ? 'OFFLINE MODE - Using local guidelines and rules only' : ''}
${statusInfo.isSlowConnection ? 'SLOW CONNECTION - Prioritize essential recommendations' : ''}

PATIENT PROFILE:
- Age: ${patient?.age || 'Unknown'} years
- Gender: ${patient?.gender || 'Not specified'}
- Pregnancy Status: ${patient?.pregnancy ? 'Active pregnancy' : 'Not pregnant'}

PRESENTING COMPLAINT:
${formData.chiefComplaint || formData.presentingComplaint || 'Not specified'}

HISTORY OF PRESENTING COMPLAINT:
${formData.historyPresentingComplaint || 'Not provided'}

SYMPTOMS:
${formData.symptoms || 'Not specified'}
Duration: ${formData.symptomDuration || 'Not specified'}
Severity: ${formData.symptomSeverity || 'Not specified'}
Associated Symptoms: ${formData.associatedSymptoms || 'None reported'}

PHYSICAL EXAMINATION:
General Appearance: ${formData.generalAppearance || 'Not examined'}

VITAL SIGNS:
${formatVitalSigns(formData.vitalSigns)}

CLINICAL CONTEXT:
- Medical History: ${formData.medicalHistory || 'Unknown'}
- Current Medications: ${formData.medications || 'None reported'}
- Allergies: ${formData.allergies || 'NKDA'}
- Risk Factors: ${formData.riskFactors || 'Not assessed'}

Please provide ${statusInfo.isSlowConnection ? 'concise' : 'comprehensive'} clinical analysis including:
1. Clinical Assessment and Differential Diagnosis
2. WHO Guideline-based Management Recommendations  
3. Medication Dosages and Administration
4. Follow-up and Monitoring Requirements
5. Red Flags and Referral Criteria
6. Patient Education Points
`;

		return query;
	};

	const formatVitalSigns = (vitals) => {
		if (!vitals) return 'Not recorded';

		const formatted = [];
		if (vitals.temperature) formatted.push(`Temp: ${vitals.temperature}`);
		if (vitals.bloodPressure) formatted.push(`BP: ${vitals.bloodPressure}`);
		if (vitals.heartRate) formatted.push(`HR: ${vitals.heartRate}`);
		if (vitals.respiratoryRate) formatted.push(`RR: ${vitals.respiratoryRate}`);
		if (vitals.oxygenSaturation) formatted.push(`SpO2: ${vitals.oxygenSaturation}%`);

		return formatted.length > 0 ? formatted.join(', ') : 'Not recorded';
	};

	const updateModelStats = useCallback((selectedModel, responseTime) => {
		setModelStats(prev => {
			const newStats = { ...prev };
			newStats.totalQueries += 1;

			if (selectedModel?.includes('rag') || selectedModel?.includes('clinical-rag')) {
				newStats.ragQueries += 1;
			} else if (selectedModel?.includes('gemini')) {
				newStats.geminiQueries += 1;
			} else {
				newStats.localAIQueries += 1;
			}

			newStats.lastUpdate = Date.now();
			return newStats;
		});
	}, []);

	// Clinical assessment sections
	const clinicalSections = [
		{ id: 'presenting-complaint', label: 'Presenting Complaint', icon: '📋' },
		{ id: 'history', label: 'History', icon: '📝' },
		{ id: 'examination', label: 'Physical Examination', icon: '🩺' },
		{ id: 'investigations', label: 'Investigations', icon: '🧪' },
		{ id: 'assessment', label: 'Assessment & Plan', icon: '⚕️' },
		{ id: 'advanced', label: 'Advanced', icon: '🎯' }
	];

	// Debounced analysis trigger with connection awareness
	useEffect(() => {
		const hasData = watchedFields.chiefComplaint || watchedFields.symptoms || watchedFields.presentingComplaint;

		if (hasData) {
			// Longer delay for slow connections to avoid overloading
			const delay = statusInfo.isSlowConnection ? 5000 : 3000;

			const timeoutId = setTimeout(() => {
				performRealTimeAnalysis(watchedFields);
			}, delay);

			return () => clearTimeout(timeoutId);
		}
	}, [watchedFields.chiefComplaint, watchedFields.symptoms, watchedFields.presentingComplaint, watchedFields.generalAppearance, performRealTimeAnalysis, statusInfo.isSlowConnection]);

	// Form submission
	const onSubmit = useCallback(async (data) => {
		setLoading(true);

		try {
			// Update patient record
			if (patient?.id) {
				await patientDb.update(patient.id, {
					medicalHistory: data.medicalHistory,
					allergies: data.allergies,
					currentMedications: data.medications,
					riskFactors: data.riskFactors
				});
			}

			const finalConsultationId = consultationId || `consultation_${Date.now()}_${patient?.id}`;

			// Comprehensive consultation data
			const consultationData = {
				id: finalConsultationId,
				patientId: patient.id,
				date: new Date().toISOString(),

				// Clinical Assessment
				chiefComplaint: data.chiefComplaint,
				presentingComplaint: data.presentingComplaint,
				historyPresentingComplaint: data.historyPresentingComplaint,
				symptoms: data.symptoms,
				symptomDuration: data.symptomDuration,
				symptomSeverity: data.symptomSeverity,
				associatedSymptoms: data.associatedSymptoms,

				// Physical Examination
				generalAppearance: data.generalAppearance,
				vitalSigns: data.vitalSigns,
				systemExamination: data.systemExamination,
				systematicReview: data.systematicReview,

				// Investigations
				investigationsOrdered: data.investigationsOrdered,
				investigationResults: data.investigationResults,

				// Clinical Decision
				clinicalAssessment: data.clinicalAssessment,
				differentialDiagnosis: data.differentialDiagnosis,
				finalDiagnosis: data.finalDiagnosis,
				treatmentPlan: data.treatmentPlan,
				medications: data.medications,
				followUpInstructions: data.followUpInstructions,

				// AI Support
				aiRecommendations: aiAnalysis?.text || null,
				aiConfidence: aiAnalysis?.confidence || null,
				aiModel: aiAnalysis?.selectedModel || 'unknown',
				aiMethod: aiAnalysis?.method || 'unknown',

				// Clinical Quality
				clinicalFlags: clinicalFlags,
				relevantGuidelinesUsed: relevantGuidelines?.map(g => g.id) || [],

				// 🎯 CONNECTION METADATA
				isOnline: isOnline,
				connectionType: statusInfo.connectionType,
				isSlowConnection: statusInfo.isSlowConnection,
				connectionStatusAtSave: statusInfo.statusText,

				// Metadata
				formType: 'enhanced-clinical-comprehensive',
				tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : [],
				modelStats: {
					...modelStats,
					capturedAt: new Date().toISOString()
				}
			};

			await consultationDb.add(consultationData);

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
	}, [patient, consultationId, aiAnalysis, relevantGuidelines, clinicalFlags, onConsultationComplete, modelStats, isOnline, statusInfo]);

	// Loading states
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

	if (!patient) {
		return (
			<div className="atlas-backdrop">
				<div className="min-h-screen flex items-center justify-center p-4">
					<div className="w-full max-w-md">
						<Card className="atlas-card-primary">
							<CardContent>
								<div className="text-center py-12">
									<h2 className="text-xl font-semibold text-gray-900 mb-4">Patient Not Found</h2>
									<Button onClick={() => window.history.back()} variant="primary">
										Go Back
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	// Clinical section rendering function (same as before, but with connection-aware hints)
	const renderClinicalSection = () => {
		switch (activeSection) {
			case 'presenting-complaint':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
							Presenting Complaint
							{/* 🎯 CONNECTION-AWARE HINTS */}
							{!isOnline && (
								<span className="text-sm font-normal text-amber-600 ml-2">(Offline - AI limited)</span>
							)}
							{statusInfo.isSlowConnection && (
								<span className="text-sm font-normal text-yellow-600 ml-2">(AI may be slower)</span>
							)}
						</h3>

						<Input
							label="Chief Complaint"
							placeholder="What is the main reason for today's visit?"
							{...register('chiefComplaint', { required: 'Chief complaint is required' })}
							error={errors.chiefComplaint?.message}
							required
						/>

						<TextArea
							label="Presenting Complaint (Detailed)"
							placeholder="Detailed description of the presenting complaint..."
							rows={3}
							{...register('presentingComplaint')}
						/>

						<TextArea
							label="History of Presenting Complaint"
							placeholder="Timeline, progression, aggravating/relieving factors, associated symptoms..."
							rows={4}
							{...register('historyPresentingComplaint')}
						/>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<Input
								label="Symptom Duration"
								placeholder="e.g., 3 days, 2 weeks"
								{...register('symptomDuration')}
							/>

							<select
								{...register('symptomSeverity')}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">Severity</option>
								<option value="mild">Mild (1-3/10)</option>
								<option value="moderate">Moderate (4-6/10)</option>
								<option value="severe">Severe (7-10/10)</option>
							</select>

							<Input
								label="Associated Symptoms"
								placeholder="Other related symptoms"
								{...register('associatedSymptoms')}
							/>
						</div>
					</div>
				);

			case 'history':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Clinical History</h3>

						<TextArea
							label="Medical History"
							placeholder="Past medical history, chronic conditions, surgeries..."
							rows={3}
							{...register('medicalHistory')}
						/>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<TextArea
								label="Current Medications"
								placeholder="List all current medications with dosages..."
								rows={3}
								{...register('medications')}
							/>

							<TextArea
								label="Known Allergies"
								placeholder="Drug allergies, food allergies, environmental allergies..."
								rows={3}
								{...register('allergies')}
							/>
						</div>

						<TextArea
							label="Risk Factors"
							placeholder="Smoking, alcohol use, family history, occupational exposure..."
							rows={2}
							{...register('riskFactors')}
						/>

						{/* Systematic Review of Systems */}
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-medium text-gray-900 mb-3">Review of Systems</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<TextArea
									label="Cardiovascular"
									placeholder="Chest pain, palpitations, shortness of breath..."
									rows={2}
									{...register('systematicReview.cardiovascular')}
								/>
								<TextArea
									label="Respiratory"
									placeholder="Cough, wheeze, sputum..."
									rows={2}
									{...register('systematicReview.respiratory')}
								/>
								<TextArea
									label="Gastrointestinal"
									placeholder="Nausea, vomiting, abdominal pain..."
									rows={2}
									{...register('systematicReview.gastrointestinal')}
								/>
								<TextArea
									label="Neurological"
									placeholder="Headache, dizziness, weakness..."
									rows={2}
									{...register('systematicReview.neurological')}
								/>
							</div>
						</div>
					</div>
				);

			case 'examination':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Physical Examination</h3>

						<TextArea
							label="General Appearance"
							placeholder="Alert, oriented, in no acute distress..."
							rows={2}
							{...register('generalAppearance')}
						/>

						{/* Vital Signs */}
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-medium text-gray-900 mb-3">Vital Signs</h4>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
								<Input
									label="Temperature (°C)"
									placeholder="37.0"
									{...register('vitalSigns.temperature')}
								/>
								<Input
									label="Blood Pressure"
									placeholder="120/80"
									{...register('vitalSigns.bloodPressure')}
								/>
								<Input
									label="Heart Rate (/min)"
									placeholder="72"
									{...register('vitalSigns.heartRate')}
								/>
								<Input
									label="Respiratory Rate (/min)"
									placeholder="16"
									{...register('vitalSigns.respiratoryRate')}
								/>
								<Input
									label="SpO2 (%)"
									placeholder="98"
									{...register('vitalSigns.oxygenSaturation')}
								/>
								<Input
									label="Weight (kg)"
									placeholder="70"
									{...register('vitalSigns.weight')}
								/>
								<Input
									label="Height (cm)"
									placeholder="170"
									{...register('vitalSigns.height')}
								/>
								<Input
									label="BMI"
									placeholder="24.2"
									{...register('vitalSigns.bmi')}
								/>
							</div>
						</div>

						{/* System Examination */}
						<div className="border border-gray-200 rounded-lg p-4">
							<h4 className="font-medium text-gray-900 mb-3">Systematic Examination</h4>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<TextArea
									label="Cardiovascular"
									placeholder="Heart sounds, murmurs, peripheral pulses..."
									rows={2}
									{...register('systemExamination.cardiovascular')}
								/>
								<TextArea
									label="Respiratory"
									placeholder="Chest inspection, auscultation, percussion..."
									rows={2}
									{...register('systemExamination.respiratory')}
								/>
								<TextArea
									label="Abdominal"
									placeholder="Inspection, palpation, bowel sounds..."
									rows={2}
									{...register('systemExamination.abdominal')}
								/>
								<TextArea
									label="Neurological"
									placeholder="Mental state, cranial nerves, motor, sensory..."
									rows={2}
									{...register('systemExamination.neurological')}
								/>
							</div>
						</div>
					</div>
				);

			case 'investigations':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Investigations</h3>

						<TextArea
							label="Investigations Ordered"
							placeholder="Blood tests, imaging, ECG, urinalysis..."
							rows={3}
							{...register('investigationsOrdered')}
						/>

						<TextArea
							label="Investigation Results"
							placeholder="Results of completed investigations..."
							rows={4}
							{...register('investigationResults')}
						/>
					</div>
				);

			case 'assessment':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Assessment & Management Plan</h3>

						<TextArea
							label="Clinical Assessment"
							placeholder="Summary of clinical findings and interpretation..."
							rows={3}
							{...register('clinicalAssessment')}
						/>

						<TextArea
							label="Differential Diagnosis"
							placeholder="List possible diagnoses in order of likelihood..."
							rows={3}
							{...register('differentialDiagnosis')}
						/>

						<TextArea
							label="Final Diagnosis"
							placeholder="Primary diagnosis and any secondary diagnoses..."
							rows={2}
							{...register('finalDiagnosis')}
						/>

						<TextArea
							label="Treatment Plan"
							placeholder="Immediate treatment, ongoing management, referrals..."
							rows={4}
							{...register('treatmentPlan')}
						/>

						<TextArea
							label="Follow-up Instructions"
							placeholder="When to return, what to monitor, lifestyle advice..."
							rows={3}
							{...register('followUpInstructions')}
						/>
					</div>
				);

			case 'advanced':
				return (
					<div className="space-y-6">
						<h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Advanced Clinical Documentation</h3>

						<TextArea
							label="Prognostic Factors"
							placeholder="Factors affecting prognosis and outcome..."
							rows={2}
							{...register('prognosticFactors')}
						/>

						<TextArea
							label="Patient Education"
							placeholder="Information and education provided to patient..."
							rows={3}
							{...register('patientEducation')}
						/>

						<TextArea
							label="Clinical Notes"
							placeholder="Additional clinical observations and considerations..."
							rows={4}
							{...register('clinicalNotes')}
						/>

						{/* Clinical Quality Indicators */}
						<div className="border border-amber-200 bg-amber-50 rounded-lg p-4">
							<h4 className="font-medium text-amber-900 mb-3">Clinical Quality Flags</h4>
							<div className="grid grid-cols-2 gap-2 text-sm">
								<div className="flex items-center">
									<span className={`mr-2 ${clinicalFlags.dangerSigns ? 'text-red-600' : 'text-green-600'}`}>
										{clinicalFlags.dangerSigns ? '⚠️' : '✅'}
									</span>
									<span>Danger Signs {clinicalFlags.dangerSigns ? 'Detected' : 'Not Present'}</span>
								</div>
								<div className="flex items-center">
									<span className={`mr-2 ${clinicalFlags.emergencyIndicators ? 'text-red-600' : 'text-green-600'}`}>
										{clinicalFlags.emergencyIndicators ? '🚨' : '✅'}
									</span>
									<span>Emergency {clinicalFlags.emergencyIndicators ? 'Priority' : 'Routine'}</span>
								</div>
								<div className="flex items-center">
									<span className={`mr-2 ${clinicalFlags.chronicCondition ? 'text-blue-600' : 'text-gray-600'}`}>
										{clinicalFlags.chronicCondition ? '📋' : '○'}
									</span>
									<span>Chronic Condition {clinicalFlags.chronicCondition ? 'Present' : 'Not Identified'}</span>
								</div>
								<div className="flex items-center">
									<span className={`mr-2 ${clinicalFlags.followUpRequired ? 'text-orange-600' : 'text-gray-600'}`}>
										{clinicalFlags.followUpRequired ? '📅' : '○'}
									</span>
									<span>Follow-up {clinicalFlags.followUpRequired ? 'Required' : 'Optional'}</span>
								</div>
							</div>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	// Main render
	return (
		<div className="atlas-backdrop">
			<div className="min-h-screen py-4 sm:py-8">
				<div className="w-full mx-auto px-4 sm:px-6 lg:px-8">

					{/* 🎯 CONNECTION STATUS BANNER */}
					<ConnectionStatus variant="banner" showLastCheck={true} className="mb-6" />

					{/* Header */}
					<div className="text-center mb-6">
						<h1 className="text-2xl font-bold text-gray-900">Comprehensive Clinical Consultation</h1>
						<p className="text-gray-600">Patient: {patient.name} (ID: {patient.id}) | Age: {patient.age} | Gender: {patient.gender}</p>

						{/* 🎯 ENHANCED STATUS DISPLAY */}
						<div className="flex flex-wrap justify-center gap-2 mt-2">
							<ConnectionStatus variant="compact" />
							<Badge variant="primary" size="sm">⚕️ Comprehensive Assessment</Badge>
							{systemStatus.models?.clinicalRAG?.available && (
								<Badge variant="info" size="sm">📚 RAG Ready ({systemStatus.models.clinicalRAG.guidelineCount} guidelines)</Badge>
							)}
							{clinicalFlags.dangerSigns && (
								<Badge variant="error" size="sm">⚠️ Danger Signs</Badge>
							)}
							{clinicalFlags.emergencyIndicators && (
								<Badge variant="error" size="sm">🚨 Emergency Priority</Badge>
							)}
							{statusInfo.isSlowConnection && (
								<Badge variant="warning" size="sm">🐌 Slow Connection</Badge>
							)}
						</div>
					</div>

					{/* Clinical Section Navigation */}
					<Card className="atlas-card-secondary mb-6">
						<CardContent className="p-3">
							<div className="flex flex-wrap gap-2">
								{clinicalSections.map(section => (
									<button
										key={section.id}
										type="button"
										onClick={() => setActiveSection(section.id)}
										className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section.id
											? 'bg-blue-500 text-white'
											: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
											}`}
									>
										{section.icon} {section.label}
									</button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Main Content Area - Form + AI Panel Side by Side */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Clinical Assessment Form - Takes 2/3 width on large screens */}
						<div className="lg:col-span-2">
							<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
								<Card className="atlas-card-primary">
									<CardHeader>
										<h2 className="text-lg font-semibold text-gray-900">
											{clinicalSections.find(s => s.id === activeSection)?.icon} {clinicalSections.find(s => s.id === activeSection)?.label}
										</h2>
									</CardHeader>

									<CardContent>
										{renderClinicalSection()}
									</CardContent>
								</Card>

								{/* Submit Section */}
								<div className="flex flex-col sm:flex-row justify-between items-center gap-4">
									<div className="flex space-x-4">
										<Button
											type="button"
											variant="secondary"
											onClick={() => window.history.back()}
											disabled={loading}
										>
											Cancel
										</Button>
									</div>

									{/* 🎯 ENHANCED STATS WITH CONNECTION INFO */}
									<div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-2 sm:space-y-0">
										<div className="flex items-center space-x-3 text-sm text-gray-600">
											<Badge variant="info" size="sm">
												📊 {modelStats.totalQueries} AI queries used
											</Badge>
											{!isOnline && (
												<Badge variant="warning" size="sm">💾 Saving locally</Badge>
											)}
											{statusInfo.isSlowConnection && (
												<Badge variant="warning" size="sm">🐌 Slow connection</Badge>
											)}
										</div>

										<Button
											type="submit"
											variant="primary"
											loading={loading}
											disabled={loading}
											size="lg"
											className="w-full sm:w-auto"
										>
											{loading ? 'Saving...' :
												!isOnline ? 'Save Comprehensive Consultation (Offline)' :
													'Save Comprehensive Consultation'
											}
										</Button>
									</div>
								</div>
							</form>
						</div>

						{/* 🎯 ENHANCED AI ANALYSIS PANEL WITH CONNECTION AWARENESS */}
						{(isAnalyzing || aiAnalysis) && (
							<div className="lg:col-span-1">
								<div className="sticky top-6">
									<div
										className="atlas-card-primary border border-gray-200 rounded-lg shadow-sm bg-white"
										style={{
											maxHeight: 'calc(100vh - 34rem)',
											display: 'flex',
											flexDirection: 'column'
										}}
									>
										{/* Header - Fixed height, won't scroll */}
										<div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
											<div className="flex flex-col space-y-2">
												<div className="flex justify-between items-start">
													<h2 className="text-lg font-semibold text-gray-900">
														Clinical Decision Support
													</h2>
													<ConnectionStatus variant="icon-only" />
												</div>
												{isAnalyzing && (
													<div className="flex items-center space-x-2">
														<LoadingSpinner size="sm" />
														<span className="text-sm text-gray-600">
															Analyzing... {analysisProgress}%
														</span>
														<div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
															<div
																className="bg-blue-600 h-2 rounded-full transition-all duration-300"
																style={{ width: `${analysisProgress}%` }}
															/>
														</div>
													</div>
												)}
												{aiAnalysis && !isAnalyzing && (
													<div className="flex flex-wrap gap-1">
														<Badge
															variant={
																aiAnalysis.selectedModel?.includes('rule-based') || aiAnalysis.selectedModel?.includes('local') ? 'success' :
																	aiAnalysis.selectedModel?.includes('rag') || aiAnalysis.selectedModel?.includes('clinical-rag') ? 'primary' :
																		aiAnalysis.selectedModel?.includes('gemini') ? 'info' : 'outline'
															}
															size="sm"
														>
															{aiAnalysis.selectedModel?.includes('rule-based') || aiAnalysis.selectedModel?.includes('local') ? '🏥 Rules' :
																aiAnalysis.selectedModel?.includes('rag') || aiAnalysis.selectedModel?.includes('clinical-rag') ? '📚 RAG' :
																	aiAnalysis.selectedModel?.includes('gemini') ? '🌐 Gemini' : '📋 AI'}
														</Badge>
														{aiAnalysis.guidelinesUsed && (
															<Badge variant="info" size="sm">
																📋 {aiAnalysis.guidelinesUsed} Guidelines
															</Badge>
														)}
														{aiAnalysis.isOffline && (
															<Badge variant="warning" size="sm">⚠️ Offline</Badge>
														)}
														{aiAnalysis.isSlowConnection && (
															<Badge variant="warning" size="sm">🐌 Slow</Badge>
														)}
													</div>
												)}
											</div>
										</div>

										{/* SCROLLABLE CONTENT AREA */}
										<div
											className="overflow-y-auto p-4"
											style={{
												flex: '1 1 0%',
												minHeight: '200px',
												maxHeight: 'calc(100vh - 10rem)',
												overflowWrap: 'break-word',
												wordBreak: 'break-word',
												scrollbarWidth: 'thin',
												scrollbarColor: '#cbd5e0 #f7fafc'
											}}
										>
											{aiAnalysis && (
												<div className="space-y-4">
													{/* Connection Status Alert */}
													{(aiAnalysis.isOffline || aiAnalysis.isSlowConnection) && (
														<div className={`p-3 rounded-lg border text-sm ${aiAnalysis.isOffline ? 'bg-amber-50 border-amber-200 text-amber-800' :
															'bg-yellow-50 border-yellow-200 text-yellow-800'
															}`}>
															<div className="flex items-center">
																<span className="mr-2">
																	{aiAnalysis.isOffline ? '⚠️' : '🐌'}
																</span>
																<span className="font-medium">
																	{aiAnalysis.isOffline ? 'Offline Analysis' : 'Slow Connection'}
																</span>
															</div>
															<p className="text-xs mt-1">
																{aiAnalysis.isOffline
																	? 'Using local guidelines and rules only'
																	: 'Analysis may be slower than usual'
																}
															</p>
														</div>
													)}

													{/* AI Analysis Content - Main text response */}
													<div className="prose prose-sm max-w-none">
														<div
															className="text-gray-900 leading-relaxed text-sm"
															style={{
																fontFamily: 'system-ui, -apple-system, sans-serif',
																lineHeight: '1.6',
																whiteSpace: 'pre-wrap',
																wordBreak: 'break-word',
																overflowWrap: 'anywhere'
															}}
														>
															{aiAnalysis.text}
														</div>
													</div>

													{/* Clinical Flags Section */}
													{aiAnalysis.clinicalFlags && (
														<div className="border-t border-gray-200 pt-3 mt-3">
															<h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
																<span className="mr-2">🏥</span>
																Clinical Flags
															</h4>
															<div className="space-y-2">
																{Object.entries(aiAnalysis.clinicalFlags).map(([flag, value]) => (
																	<div
																		key={flag}
																		className={`flex items-center justify-between p-2 rounded-lg text-sm ${value ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
																			}`}
																	>
																		<span className="flex items-center">
																			<span className={`mr-2 ${value ? 'text-red-600' : 'text-green-600'}`}>
																				{value ? '⚠️' : '✅'}
																			</span>
																			<span className="capitalize font-medium">
																				{flag.replace(/([A-Z])/g, ' $1').trim()}
																			</span>
																		</span>
																		<span className={`text-xs px-2 py-1 rounded-full ${value ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
																			}`}>
																			{value ? 'Active' : 'Clear'}
																		</span>
																	</div>
																))}
															</div>
														</div>
													)}

													{/* Analysis Metadata - Compact */}
													<div className="border-t border-gray-200 pt-3 mt-3">
														<h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
															<span className="mr-2">📊</span>
															Details
														</h4>
														<div className="space-y-1 text-xs text-gray-600">
															<div className="flex justify-between items-center">
																<span>Model:</span>
																<span className="text-right font-mono">{aiAnalysis.selectedModel || 'Unknown'}</span>
															</div>
															<div className="flex justify-between items-center">
																<span>Connection:</span>
																<span className="text-right">{aiAnalysis.connectionType || statusInfo.statusText}</span>
															</div>
															<div className="flex justify-between items-center">
																<span>Confidence:</span>
																<Badge
																	variant={
																		aiAnalysis.confidence === 'high' ? 'success' :
																			aiAnalysis.confidence === 'medium' ? 'warning' : 'error'
																	}
																	size="sm"
																>
																	{aiAnalysis.confidence || 'Not assessed'}
																</Badge>
															</div>
															<div className="flex justify-between items-center">
																<span>Generated:</span>
																<span className="text-right">{aiAnalysis.timestamp?.toLocaleTimeString() || 'Unknown'}</span>
															</div>
															<div className="flex justify-between items-center">
																<span>Guidelines:</span>
																<span className="text-right">{aiAnalysis.guidelinesUsed || 0} referenced</span>
															</div>
														</div>
													</div>

													{/* Session Stats - Compact grid */}
													{modelStats.totalQueries > 0 && (
														<div className="border-t border-gray-200 pt-3 mt-3">
															<h4 className="font-medium text-gray-900 mb-2 flex items-center text-sm">
																<span className="mr-2">⚡</span>
																Session ({modelStats.totalQueries} queries)
															</h4>
															<div className="grid grid-cols-3 gap-1 text-xs">
																<div className="bg-blue-50 border border-blue-200 p-1.5 rounded text-center">
																	<div className="font-semibold text-blue-900">{modelStats.ragQueries}</div>
																	<div className="text-blue-700 text-xs">RAG</div>
																</div>
																<div className="bg-green-50 border border-green-200 p-1.5 rounded text-center">
																	<div className="font-semibold text-green-900">{modelStats.localAIQueries}</div>
																	<div className="text-green-700 text-xs">Local</div>
																</div>
																<div className="bg-purple-50 border border-purple-200 p-1.5 rounded text-center">
																	<div className="font-semibold text-purple-900">{modelStats.geminiQueries}</div>
																	<div className="text-purple-700 text-xs">Cloud</div>
																</div>
															</div>
														</div>
													)}

													{/* Bottom spacing for scroll comfort */}
													<div className="h-2"></div>
												</div>
											)}

											{/* Error State with Connection Context */}
											{apiError && (
												<div className="p-3 bg-red-50 border border-red-200 rounded-lg">
													<div className="flex items-center mb-2">
														<span className="text-red-600 mr-2">⚠️</span>
														<span className="font-medium text-red-800 text-sm">Analysis Error</span>
													</div>
													<p className="text-sm text-red-700 mb-3 break-words whitespace-pre-wrap">{apiError}</p>
													<div className="flex flex-col space-y-2">
														<Button
															variant="secondary"
															size="sm"
															onClick={() => performRealTimeAnalysis(watchedFields)}
															disabled={isAnalyzing}
															className="w-full"
														>
															🔄 Retry Analysis
														</Button>
														{!isOnline && (
															<p className="text-xs text-red-600">
																💡 Try the Standard form for better offline performance
															</p>
														)}
													</div>
												</div>
											)}

											{/* No Analysis State - Connection Aware */}
											{!aiAnalysis && !isAnalyzing && !apiError && (
												<div className="text-center py-6 text-gray-500">
													<div className="text-3xl mb-2">🏥</div>
													<h3 className="text-sm font-medium text-gray-700 mb-1">
														{!isOnline ? 'Limited AI Support (Offline)' :
															statusInfo.isSlowConnection ? 'AI Support Ready (Slow Connection)' :
																'AI Support Ready'}
													</h3>
													<p className="text-xs text-gray-600 mb-1">
														{!isOnline ? 'Local guidelines and rules available' :
															statusInfo.isSlowConnection ? 'Analysis may be slower than usual' :
																'Analysis will appear as you complete the assessment'}
													</p>
													<p className="text-xs text-gray-500">
														Start with chief complaint or symptoms
													</p>
												</div>
											)}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>

					{/* WHO Guidelines Display - Full width at bottom */}
					{relevantGuidelines.length > 0 && (
						<Card className="atlas-card-secondary mt-6">
							<CardHeader>
								<h3 className="text-lg font-semibold text-gray-900">WHO Clinical Guidelines</h3>
								<p className="text-sm text-gray-600">{relevantGuidelines.length} relevant guidelines found</p>
							</CardHeader>
							<CardContent className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
								<div className="space-y-4">
									{relevantGuidelines.map((guideline, index) => (
										<div key={guideline.id || index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
											<h4 className="font-semibold text-blue-900 mb-2">{guideline.title}</h4>

											<div className="prose prose-sm max-w-none">
												<div className="text-blue-800 leading-relaxed whitespace-pre-wrap text-sm">
													{typeof guideline.content === 'string'
														? guideline.content
														: JSON.stringify(guideline.content, null, 2)}
												</div>
											</div>

											{guideline.category && (
												<div className="mt-2">
													<Badge variant="outline" size="sm">
														{guideline.category}
													</Badge>
													{guideline.subcategory && (
														<Badge variant="outline" size="sm" className="ml-2">
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