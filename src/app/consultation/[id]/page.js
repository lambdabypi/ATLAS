// src/app/consultation/[id]/page.js - ENHANCED VERSION
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getConsultationById, updateConsultation } from '../../../lib/db/consultations';
import { getById as getPatientById } from '../../../lib/db/patients';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { TextArea } from '../../../components/ui/TextArea';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';

// Enhanced imports for AI and bias detection
import { CONFIDENCE_LEVELS } from '../../../lib/ai/enhancedGemini';
import { BIAS_SEVERITY } from '../../../lib/ai/biasDetection';
import { startTiming, endTiming } from '../../../lib/monitoring/performanceMonitor';

export default function EnhancedConsultationDetailPage() {
	const params = useParams();
	const { id } = params;

	const [consultation, setConsultation] = useState(null);
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editedDiagnosis, setEditedDiagnosis] = useState('');
	const [editedPlan, setEditedPlan] = useState('');
	const [editedNotes, setEditedNotes] = useState('');
	const [saveLoading, setSaveLoading] = useState(false);

	// Enhanced states for displaying metadata
	const [showMetadata, setShowMetadata] = useState(false);
	const [showBiasDetails, setShowBiasDetails] = useState(false);

	useEffect(() => {
		async function loadConsultationData() {
			if (!id) return;

			const loadTimingId = startTiming('consultation_detail_load');

			try {
				const consultationData = await getConsultationById(Number(id));

				if (!consultationData) {
					setLoading(false);
					endTiming(loadTimingId, { success: false, reason: 'consultation_not_found' });
					return;
				}

				setConsultation(consultationData);
				setEditedDiagnosis(consultationData.finalDiagnosis || '');
				setEditedPlan(consultationData.plan || '');
				setEditedNotes(consultationData.providerNotes || '');

				if (consultationData.patientId) {
					const patientData = await getPatientById(consultationData.patientId);
					setPatient(patientData);
				}

				endTiming(loadTimingId, { success: true, hasAI: !!consultationData.aiRecommendations });
				setLoading(false);
			} catch (error) {
				console.error('Error loading consultation data:', error);
				endTiming(loadTimingId, { success: false, error: error.message });
				setLoading(false);
			}
		}

		loadConsultationData();
	}, [id]);

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const handleSaveConsultation = async () => {
		setSaveLoading(true);
		const saveTimingId = startTiming('consultation_save');

		try {
			await updateConsultation(Number(id), {
				finalDiagnosis: editedDiagnosis,
				plan: editedPlan,
				providerNotes: editedNotes
			});

			setConsultation({
				...consultation,
				finalDiagnosis: editedDiagnosis,
				plan: editedPlan,
				providerNotes: editedNotes
			});

			setIsEditing(false);
			endTiming(saveTimingId, { success: true });
		} catch (error) {
			console.error('Error updating consultation:', error);
			endTiming(saveTimingId, { success: false, error: error.message });
			alert('Failed to update consultation. Please try again.');
		} finally {
			setSaveLoading(false);
		}
	};

	const handlePrintConsultation = () => {
		window.print();
	};

	// Helper function to get confidence badge variant
	const getConfidenceBadgeVariant = (confidence) => {
		switch (confidence) {
			case CONFIDENCE_LEVELS.HIGH:
				return 'success';
			case CONFIDENCE_LEVELS.MEDIUM:
				return 'warning';
			case CONFIDENCE_LEVELS.LOW:
				return 'secondary';
			case CONFIDENCE_LEVELS.VERY_LOW:
				return 'danger';
			default:
				return 'secondary';
		}
	};

	// Helper function to get bias severity badge variant
	const getBiasBadgeVariant = (severity) => {
		switch (severity) {
			case 'critical':
				return 'danger';
			case 'high':
				return 'danger';
			case 'medium':
				return 'warning';
			case 'low':
				return 'secondary';
			default:
				return 'secondary';
		}
	};

	const ConsultationIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
	);

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<div className="flex justify-center items-center min-h-64">
					<LoadingSpinner size="lg" />
					<span className="ml-3 text-gray-600">Loading consultation data...</span>
				</div>
			</div>
		);
	}

	if (!consultation) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardContent>
						<EmptyState
							icon={ConsultationIcon}
							title="Consultation Not Found"
							description="The consultation you're looking for doesn't exist or has been deleted."
							action={
								<Button as={Link} href="/consultation" variant="primary">
									Back to Consultations
								</Button>
							}
						/>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Enhanced Header with Metadata Toggle */}
			<div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Consultation Details</h1>
					<p className="text-gray-600 mt-1">
						{formatDate(consultation.date)}
					</p>
					{consultation.aiRecommendations && (
						<div className="flex items-center mt-2 space-x-2">
							<Badge variant="primary" size="sm">AI-Assisted</Badge>
							{consultation.biasReport && consultation.biasReport.severity !== 'none' && (
								<Badge variant={getBiasBadgeVariant(consultation.biasReport.severity)} size="sm">
									Bias: {consultation.biasReport.severity}
								</Badge>
							)}
						</div>
					)}
				</div>

				<div className="mt-4 md:mt-0 flex space-x-3">
					<Button
						onClick={() => setShowMetadata(!showMetadata)}
						variant="outline"
						size="sm"
					>
						{showMetadata ? 'Hide' : 'Show'} Metadata
					</Button>

					{isEditing ? (
						<>
							<Button
								onClick={handleSaveConsultation}
								variant="primary"
								loading={saveLoading}
								disabled={saveLoading}
							>
								Save Changes
							</Button>
							<Button
								onClick={() => setIsEditing(false)}
								variant="secondary"
								disabled={saveLoading}
							>
								Cancel
							</Button>
						</>
					) : (
						<>
							<Button
								onClick={() => setIsEditing(true)}
								variant="primary"
							>
								Edit
							</Button>
							<Button
								onClick={handlePrintConsultation}
								variant="outline"
							>
								Print
							</Button>
						</>
					)}
				</div>
			</div>

			{/* Enhanced Metadata Display */}
			{showMetadata && (
				<Card className="mb-6">
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Consultation Metadata</h3>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-medium text-gray-700">Consultation ID</p>
								<p className="text-gray-600">{consultation.id}</p>
							</div>
							<div>
								<p className="font-medium text-gray-700">Created</p>
								<p className="text-gray-600">{formatDate(consultation.date)}</p>
							</div>
							{consultation.aiModel && (
								<div>
									<p className="font-medium text-gray-700">AI Model Used</p>
									<p className="text-gray-600">
										{consultation.aiModel === 'rule_based' ? 'Clinical Guidelines' : 'Gemini AI'}
									</p>
								</div>
							)}
							{consultation.aiConfidence && (
								<div>
									<p className="font-medium text-gray-700">AI Confidence</p>
									<Badge variant={getConfidenceBadgeVariant(consultation.aiConfidence)}>
										{consultation.aiConfidence}
									</Badge>
								</div>
							)}
							{consultation.relevantGuidelinesUsed && consultation.relevantGuidelinesUsed.length > 0 && (
								<div>
									<p className="font-medium text-gray-700">Guidelines Referenced</p>
									<p className="text-gray-600">{consultation.relevantGuidelinesUsed.length} guidelines</p>
								</div>
							)}
							{consultation.tags && consultation.tags.length > 0 && (
								<div>
									<p className="font-medium text-gray-700">Tags</p>
									<div className="flex flex-wrap gap-1 mt-1">
										{consultation.tags.map((tag, index) => (
											<Badge key={index} variant="secondary" className="text-xs">
												{tag}
											</Badge>
										))}
									</div>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Patient Information - Enhanced */}
			{patient && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
							<Button
								as={Link}
								href={`/patients/${patient.id}`}
								variant="outline"
								size="sm"
							>
								View Full Record
							</Button>
						</div>
					</CardHeader>

					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<p className="text-sm text-gray-500">Name</p>
								<p className="font-medium">{patient.name}</p>
							</div>

							<div>
								<p className="text-sm text-gray-500">Age / Gender</p>
								<p className="font-medium">{patient.age} years, {patient.gender}</p>
							</div>

							{patient.allergies && (
								<div className="md:col-span-2">
									<p className="text-sm text-gray-500 mb-2">Allergies</p>
									<Badge variant="danger">{patient.allergies}</Badge>
								</div>
							)}

							{patient.currentMedications && (
								<div className="md:col-span-2">
									<p className="text-sm text-gray-500">Current Medications</p>
									<p className="text-gray-700">{patient.currentMedications}</p>
								</div>
							)}

							{patient.medicalHistory && (
								<div className="md:col-span-2">
									<p className="text-sm text-gray-500">Medical History</p>
									<p className="text-gray-700">{patient.medicalHistory}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Clinical Assessment Data */}
			<Card className="mb-6">
				<CardHeader>
					<h2 className="text-lg font-semibold text-gray-900">Clinical Assessment</h2>
				</CardHeader>

				<CardContent className="space-y-6">
					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Chief Complaint</h3>
						<div className="p-3 bg-gray-50 rounded-md">
							{consultation.chiefComplaint || 'Not specified'}
						</div>
					</div>

					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Symptoms</h3>
						<div className="p-3 bg-gray-50 rounded-md">
							{consultation.symptoms || 'Not recorded'}
						</div>
					</div>

					{consultation.vitals && (
						<div>
							<h3 className="text-md font-medium text-gray-700 mb-2">Vital Signs</h3>
							<div className="p-3 bg-gray-50 rounded-md">
								{consultation.vitals}
							</div>
						</div>
					)}

					{consultation.examination && (
						<div>
							<h3 className="text-md font-medium text-gray-700 mb-2">Physical Examination</h3>
							<div className="p-3 bg-gray-50 rounded-md">
								{consultation.examination}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Enhanced AI Clinical Decision Support Section */}
			{consultation.aiRecommendations && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">AI Clinical Decision Support</h2>
							<div className="flex space-x-2">
								{consultation.aiConfidence && (
									<Badge variant={getConfidenceBadgeVariant(consultation.aiConfidence)}>
										{consultation.aiConfidence} confidence
									</Badge>
								)}
								{consultation.biasReport && consultation.biasReport.severity !== 'none' && (
									<Badge
										variant={getBiasBadgeVariant(consultation.biasReport.severity)}
										onClick={() => setShowBiasDetails(!showBiasDetails)}
										className="cursor-pointer"
									>
										Bias: {consultation.biasReport.severity}
									</Badge>
								)}
							</div>
						</div>
					</CardHeader>

					<CardContent>
						<div className="p-4 bg-blue-50 rounded-md border-l-4 border-blue-500 whitespace-pre-wrap">
							{consultation.aiRecommendations}
						</div>

						{/* AI Metadata */}
						<div className="mt-3 text-xs text-gray-500 space-y-1">
							{consultation.aiTimestamp && (
								<p>Generated: {formatDate(consultation.aiTimestamp)}</p>
							)}
							{consultation.aiModel && (
								<p>
									Source: {consultation.aiModel === 'rule_based' ? 'Clinical Guidelines' : 'AI Analysis'}
									{consultation.aiModel === 'rule_based' && ' (Offline Mode)'}
								</p>
							)}
						</div>

						{/* Enhanced Bias Report Display */}
						{consultation.biasReport && consultation.biasReport.severity !== 'none' && (
							<div className="mt-4">
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<div className="flex justify-between items-start">
										<div>
											<h4 className="text-sm font-medium text-yellow-800 mb-1">
												Bias Detection Alert ({consultation.biasReport.severity} severity)
											</h4>
											<div className="text-xs text-yellow-700">
												{consultation.biasReport.categories?.length > 0 && (
													<>
														Detected categories: {consultation.biasReport.categories.join(', ')}
														<br />
													</>
												)}
												{consultation.biasReport.mitigated && (
													<span>Automatic bias mitigation was applied to this recommendation.</span>
												)}
											</div>
										</div>
										<Button
											onClick={() => setShowBiasDetails(!showBiasDetails)}
											variant="outline"
											size="sm"
											className="ml-2"
										>
											{showBiasDetails ? 'Hide' : 'Show'} Details
										</Button>
									</div>

									{showBiasDetails && (
										<div className="mt-3 pt-3 border-t border-yellow-300">
											<h5 className="text-xs font-medium text-yellow-800 mb-2">Bias Analysis Details:</h5>
											<div className="text-xs text-yellow-700 space-y-1">
												<p><strong>Severity:</strong> {consultation.biasReport.severity}</p>
												{consultation.biasReport.categories && (
													<p><strong>Categories Detected:</strong> {consultation.biasReport.categories.join(', ')}</p>
												)}
												<p><strong>Mitigation Applied:</strong> {consultation.biasReport.mitigated ? 'Yes' : 'No'}</p>
												<div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
													<strong>Clinical Note:</strong> This AI recommendation was automatically
													reviewed for potential bias. The system detected concerning patterns and
													applied appropriate mitigations. Please review the recommendation critically
													and ensure clinical decisions are based on individual patient presentation.
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{/* Clinical Guidelines Referenced */}
						{consultation.relevantGuidelinesUsed && consultation.relevantGuidelinesUsed.length > 0 && (
							<div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
								<h4 className="text-sm font-medium text-green-800 mb-2">Clinical Guidelines Referenced</h4>
								<p className="text-xs text-green-700">
									This recommendation referenced {consultation.relevantGuidelinesUsed.length} clinical
									guideline(s) to ensure evidence-based recommendations.
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Legacy AI Recommendations (for backward compatibility) */}
			{consultation.differentialDiagnosis && !consultation.aiRecommendations && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">Differential Diagnoses</h2>
							<Badge variant="secondary">Legacy Format</Badge>
						</div>
					</CardHeader>

					<CardContent>
						<div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
							{consultation.differentialDiagnosis}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Enhanced Provider Clinical Assessment */}
			<Card className="mb-6">
				<CardHeader>
					<div className="flex justify-between items-center">
						<h2 className="text-lg font-semibold text-gray-900">Provider Clinical Assessment</h2>
						<Badge variant="primary">Authoritative Medical Decision</Badge>
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Final Diagnosis</h3>
						{isEditing ? (
							<TextArea
								value={editedDiagnosis}
								onChange={(e) => setEditedDiagnosis(e.target.value)}
								placeholder="Enter final diagnosis based on clinical assessment..."
								rows={3}
								className="font-mono"
							/>
						) : (
							<div className={`p-3 rounded-md border ${consultation.finalDiagnosis
									? 'bg-gray-50 border-gray-200'
									: 'bg-yellow-50 border-yellow-300'
								}`}>
								{consultation.finalDiagnosis ? (
									<div className="whitespace-pre-wrap">{consultation.finalDiagnosis}</div>
								) : (
									<span className="text-yellow-800 text-sm font-medium flex items-center">
										<svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										Provider diagnosis required - please review and complete clinical assessment
									</span>
								)}
							</div>
						)}
					</div>

					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Treatment Plan</h3>
						{isEditing ? (
							<TextArea
								value={editedPlan}
								onChange={(e) => setEditedPlan(e.target.value)}
								placeholder="Enter comprehensive treatment plan including medications, dosages, follow-up timeline, and patient instructions..."
								rows={5}
								className="font-mono"
							/>
						) : (
							<div className={`p-3 rounded-md border ${consultation.plan
									? 'bg-gray-50 border-gray-200'
									: 'bg-yellow-50 border-yellow-300'
								}`}>
								{consultation.plan ? (
									<div className="whitespace-pre-wrap">{consultation.plan}</div>
								) : (
									<span className="text-yellow-800 text-sm font-medium flex items-center">
										<svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
										</svg>
										Treatment plan required - please provide comprehensive care plan
									</span>
								)}
							</div>
						)}
					</div>

					{/* Additional Provider Notes */}
					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Additional Clinical Notes</h3>
						{isEditing ? (
							<TextArea
								value={editedNotes}
								onChange={(e) => setEditedNotes(e.target.value)}
								placeholder="Any additional observations, differential considerations, or clinical notes..."
								rows={3}
								className="font-mono"
							/>
						) : (
							consultation.providerNotes ? (
								<div className="p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
									{consultation.providerNotes}
								</div>
							) : (
								<div className="p-3 bg-gray-100 rounded-md border border-gray-300 text-gray-500 text-sm italic">
									No additional clinical notes recorded
								</div>
							)
						)}
					</div>

					{/* Clinical Decision Quality Indicators */}
					<div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
						<h4 className="text-sm font-medium text-blue-800 mb-2">Clinical Documentation Quality</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
							<div className="flex items-center">
								{consultation.finalDiagnosis ? (
									<svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
								) : (
									<svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
									</svg>
								)}
								<span className={consultation.finalDiagnosis ? 'text-green-700' : 'text-red-700'}>
									Final Diagnosis {consultation.finalDiagnosis ? 'Complete' : 'Missing'}
								</span>
							</div>
							<div className="flex items-center">
								{consultation.plan ? (
									<svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
								) : (
									<svg className="w-4 h-4 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
									</svg>
								)}
								<span className={consultation.plan ? 'text-green-700' : 'text-red-700'}>
									Treatment Plan {consultation.plan ? 'Complete' : 'Missing'}
								</span>
							</div>
							<div className="flex items-center">
								{consultation.aiRecommendations ? (
									<svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
									</svg>
								) : (
									<svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
									</svg>
								)}
								<span className={consultation.aiRecommendations ? 'text-blue-700' : 'text-gray-600'}>
									AI Support {consultation.aiRecommendations ? 'Available' : 'Not Used'}
								</span>
							</div>
							<div className="flex items-center">
								{consultation.biasReport && consultation.biasReport.mitigated ? (
									<svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
									</svg>
								) : (
									<svg className="w-4 h-4 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
										<path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
									</svg>
								)}
								<span className={consultation.biasReport?.mitigated ? 'text-green-700' : 'text-gray-600'}>
									Bias Review {consultation.biasReport?.mitigated ? 'Applied' : 'Not Required'}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Enhanced Navigation */}
			<div className="flex justify-between items-center">
				<Button
					as={Link}
					href="/consultation"
					variant="outline"
				>
					← Back to Consultations
				</Button>

				<div className="flex space-x-3">
					{patient && (
						<Button
							as={Link}
							href={`/consultation/new?patientId=${patient.id}`}
							variant="secondary"
						>
							New Consultation
						</Button>
					)}

					<Button
						as={Link}
						href={`/patients/${consultation.patientId}`}
						variant="outline"
					>
						Patient Record →
					</Button>
				</div>
			</div>
		</div>
	);
}