// Enhanced ConsultationForm.jsx with proper Gemini response handling
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { processClinicalSymptoms, getClinicalRecommendations } from '../lib/ai/gemini';
import { patientDb, consultationDb, medicalDb } from '../lib/db';
import { colors, fontSize, fontWeight, spacing, mergeStyles } from '../styles/styleUtils';

export default function ConsultationForm({ patientId }) {
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
				await consultationDb.add({
					patientId: patient.id,
					symptoms: data.symptoms,
					chiefComplaint: data.chiefComplaint,
					vitals: data.vitals,
					examination: data.examination,
					differentialDiagnosis: realTimeDiagnosis?.text,
					aiRecommendations: realTimeDiagnosis?.text,
					finalDiagnosis: '',
					plan: '',
					tags: data.symptoms ? data.symptoms.split(',').map(s => s.trim().toLowerCase()) : []
				});
			}

			alert('Consultation saved successfully!');

		} catch (error) {
			console.error('Error saving consultation:', error);
			alert('Error saving consultation. Please try again.');
		} finally {
			setLoading(false);
		}
	};

	if (!patient) {
		return <div style={{ padding: '1rem' }}>Loading patient data...</div>;
	}

	const styles = {
		container: {
			maxWidth: '64rem',
			margin: '0 auto',
			padding: '1rem',
		},
		card: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
			padding: '1.5rem',
			marginBottom: '1.5rem',
		},
		patientInfo: {
			marginBottom: '1.5rem',
			padding: '1rem',
			backgroundColor: colors.blue[50],
			borderRadius: '0.5rem',
		},
		analysisCard: {
			backgroundColor: '#f8fafc',
			border: '2px solid #e2e8f0',
			borderRadius: '0.5rem',
			padding: '1rem',
			marginBottom: '1rem',
		},
		analysisHeader: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			marginBottom: '0.5rem'
		},
		analysisTitle: {
			fontSize: '1rem',
			fontWeight: '600',
			color: '#374151'
		},
		confidenceBadge: {
			padding: '0.25rem 0.75rem',
			borderRadius: '0.375rem',
			fontSize: '0.75rem',
			fontWeight: '500'
		},
		confidenceHigh: { backgroundColor: '#d1fae5', color: '#065f46' },
		confidenceMedium: { backgroundColor: '#fef3c7', color: '#92400e' },
		confidenceLow: { backgroundColor: '#fee2e2', color: '#991b1b' },
		progressBar: {
			width: '100%',
			height: '0.5rem',
			backgroundColor: '#e5e7eb',
			borderRadius: '0.25rem',
			overflow: 'hidden',
			marginBottom: '0.75rem'
		},
		progressFill: {
			height: '100%',
			backgroundColor: '#3b82f6',
			transition: 'width 0.3s ease-in-out'
		},
		analysisContent: {
			fontSize: '0.875rem',
			color: '#4b5563',
			whiteSpace: 'pre-line',
			maxHeight: '300px',
			overflowY: 'auto',
			lineHeight: '1.5',
			padding: '0.5rem',
			backgroundColor: 'white',
			borderRadius: '0.25rem',
			border: '1px solid #e5e7eb'
		},
		errorContent: {
			color: '#dc2626',
			backgroundColor: '#fef2f2',
			border: '1px solid #fecaca'
		},
		offlineContent: {
			color: '#d97706',
			backgroundColor: '#fffbeb',
			border: '1px solid #fed7aa'
		},
		timestamp: {
			fontSize: '0.75rem',
			color: '#9ca3af',
			marginTop: '0.5rem',
			fontStyle: 'italic'
		},
		formGroup: {
			marginBottom: '1rem',
		},
		label: {
			display: 'block',
			color: '#374151',
			fontWeight: '600',
			marginBottom: '0.5rem',
		},
		input: {
			width: '100%',
			padding: '0.75rem',
			border: '2px solid #d1d5db',
			borderRadius: '0.5rem',
			fontSize: '1rem',
			transition: 'border-color 0.2s'
		},
		textarea: {
			width: '100%',
			padding: '0.75rem',
			border: '2px solid #d1d5db',
			borderRadius: '0.5rem',
			fontSize: '1rem',
			transition: 'border-color 0.2s',
			resize: 'vertical'
		},
		submitButton: {
			backgroundColor: '#2563eb',
			color: 'white',
			padding: '0.75rem 2rem',
			borderRadius: '0.5rem',
			fontSize: '1rem',
			fontWeight: '600',
			border: 'none',
			cursor: 'pointer',
			transition: 'background-color 0.2s'
		}
	};

	return (
		<div style={styles.container}>
			<div style={styles.card}>
				<h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
					Patient Consultation
				</h2>

				<div style={styles.patientInfo}>
					<h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Patient Information</h3>
					<p><strong>Name:</strong> {patient.name}</p>
					<p><strong>Age:</strong> {patient.age}</p>
					<p><strong>Gender:</strong> {patient.gender}</p>
				</div>

				{/* Real-time Analysis Panel */}
				<div style={styles.analysisCard}>
					<div style={styles.analysisHeader}>
						<h3 style={styles.analysisTitle}>
							{isAnalyzing ? 'Analyzing Clinical Data...' : 'AI Clinical Analysis'}
						</h3>
						{realTimeDiagnosis && !realTimeDiagnosis.isError && !realTimeDiagnosis.isOffline && (
							<span style={{
								...styles.confidenceBadge,
								...(realTimeDiagnosis.confidence === 'high' ? styles.confidenceHigh :
									realTimeDiagnosis.confidence === 'medium' ? styles.confidenceMedium :
										styles.confidenceLow)
							}}>
								{realTimeDiagnosis.confidence} confidence
							</span>
						)}
					</div>

					{isAnalyzing && (
						<div style={styles.progressBar}>
							<div style={{
								...styles.progressFill,
								width: `${analysisProgress}%`
							}}></div>
						</div>
					)}

					<div style={{
						...styles.analysisContent,
						...(realTimeDiagnosis?.isError ? styles.errorContent : {}),
						...(realTimeDiagnosis?.isOffline ? styles.offlineContent : {})
					}}>
						{realTimeDiagnosis ?
							realTimeDiagnosis.text :
							'Start entering patient data above to see real-time AI clinical analysis and recommendations...'
						}
					</div>

					{realTimeDiagnosis && (
						<div style={styles.timestamp}>
							Last updated: {realTimeDiagnosis.timestamp.toLocaleTimeString()}
							{realTimeDiagnosis.fromCache && ' (from cache)'}
						</div>
					)}
				</div>

				{/* Form */}
				<form onSubmit={handleSubmit(onSubmit)}>
					<div style={styles.formGroup}>
						<label style={styles.label}>Chief Complaint</label>
						<input
							type="text"
							style={styles.input}
							placeholder="What is the main reason for today's visit?"
							{...register('chiefComplaint', { required: 'Chief complaint is required' })}
						/>
						{errors.chiefComplaint && (
							<p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
								{errors.chiefComplaint.message}
							</p>
						)}
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Symptoms</label>
						<textarea
							style={styles.textarea}
							rows="3"
							placeholder="Describe all symptoms the patient is experiencing..."
							{...register('symptoms', { required: 'Symptoms are required' })}
						/>
						{errors.symptoms && (
							<p style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '0.25rem' }}>
								{errors.symptoms.message}
							</p>
						)}
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Vital Signs</label>
						<input
							type="text"
							style={styles.input}
							placeholder="Temperature, BP, HR, RR, O2 Sat (if available)"
							{...register('vitals')}
						/>
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Physical Examination</label>
						<textarea
							style={styles.textarea}
							rows="4"
							placeholder="Document physical examination findings..."
							{...register('examination')}
						/>
					</div>

					<div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
						<div style={{ flex: 1 }}>
							<label style={styles.label}>Medical History</label>
							<textarea
								style={styles.textarea}
								rows="2"
								{...register('medicalHistory')}
							/>
						</div>
						<div style={{ flex: 1 }}>
							<label style={styles.label}>Allergies</label>
							<input
								type="text"
								style={styles.input}
								{...register('allergies')}
							/>
						</div>
					</div>

					<div style={styles.formGroup}>
						<label style={styles.label}>Current Medications</label>
						<input
							type="text"
							style={styles.input}
							{...register('currentMedications')}
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							type="submit"
							style={styles.submitButton}
							disabled={loading}
						>
							{loading ? 'Saving...' : 'Save Consultation'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}