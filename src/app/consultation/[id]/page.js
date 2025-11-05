// app/consultation/[id]/page.js - FIXED VERSION with proper patient loading
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { consultationDb } from '../../../lib/db';
import { getById as getPatientById } from '../../../lib/db/patients'; // FIXED: Use correct import
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TextArea } from '../../../components/ui/TextArea';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function ConsultationViewPage() {
	const params = useParams();
	const [consultation, setConsultation] = useState(null);
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [showMetadata, setShowMetadata] = useState(false);
	const [saveLoading, setSaveLoading] = useState(false);

	// Edit state
	const [editedNotes, setEditedNotes] = useState('');
	const [editedDiagnosis, setEditedDiagnosis] = useState('');
	const [editedPlan, setEditedPlan] = useState('');

	const consultationId = params?.id;

	// FIXED: Load consultation and patient data with better error handling
	useEffect(() => {
		const loadData = async () => {
			if (!consultationId) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);

				// Load consultation data
				const consultationData = await consultationDb.getById(consultationId);

				if (consultationData) {
					setConsultation(consultationData);
					setEditedNotes(consultationData.providerNotes || '');
					setEditedDiagnosis(consultationData.finalDiagnosis || '');
					setEditedPlan(consultationData.plan || '');

					// Load patient data - FIXED with better error handling
					if (consultationData.patientId) {
						console.log('Loading patient with ID:', consultationData.patientId, typeof consultationData.patientId);

						try {
							const patientData = await getPatientById(consultationData.patientId);

							if (patientData) {
								setPatient(patientData);
								console.log('Patient loaded successfully:', patientData);
							} else {
								console.warn('Patient not found for ID:', consultationData.patientId);
								// Continue without patient data rather than failing completely
							}
						} catch (patientError) {
							console.error('Error loading patient:', patientError);
							// Continue without patient data
						}
					}
				} else {
					console.warn('Consultation not found for ID:', consultationId);
				}
			} catch (error) {
				console.error('Error loading consultation:', error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [consultationId]);

	// Save consultation changes
	const handleSaveConsultation = async () => {
		setSaveLoading(true);

		try {
			const updatedConsultation = {
				...consultation,
				finalDiagnosis: editedDiagnosis,
				plan: editedPlan,
				providerNotes: editedNotes,
				lastModified: new Date().toISOString()
			};

			await consultationDb.update(consultationId, updatedConsultation);
			setConsultation(updatedConsultation);
			setIsEditing(false);
		} catch (error) {
			console.error('Error saving consultation:', error);
			alert('Error saving changes. Please try again.');
		} finally {
			setSaveLoading(false);
		}
	};

	// Print consultation
	const handlePrintConsultation = () => {
		window.print();
	};

	// Utility functions
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const getBiasBadgeVariant = (severity) => {
		switch (severity) {
			case 'high': return 'danger';
			case 'medium': return 'warning';
			case 'low': return 'secondary';
			default: return 'outline';
		}
	};

	const getConfidenceBadgeVariant = (confidence) => {
		switch (confidence) {
			case 'high': return 'success';
			case 'medium': return 'warning';
			case 'low': return 'secondary';
			default: return 'outline';
		}
	};

	// Loading state
	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				<div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
			</div>
		);
	}

	// Not found state
	if (!consultation) {
		return (
			<div className="max-w-4xl mx-auto p-6">
				<Card>
					<CardContent>
						<EmptyState
							title="Consultation not found"
							description="The consultation you're looking for doesn't exist or may have been deleted."
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
		<div className="max-w-4xl mx-auto p-6 print:p-4">
			{/* Enhanced Header with Metadata Toggle */}
			<div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between print:flex-row">
				<div>
					<h1 className="text-2xl font-bold text-gray-900 print:text-xl">Consultation Details</h1>
					<p className="text-gray-600 mt-1">
						{formatDate(consultation.date)}
					</p>
					<div className="flex items-center flex-wrap gap-2 mt-2">
						{consultation.aiRecommendations && (
							<Badge variant="primary" size="sm">AI-Assisted</Badge>
						)}
						{consultation.smartGuidelines && (
							<Badge variant="success" size="sm">WHO SMART Guidelines</Badge>
						)}
						{consultation.biasReport && consultation.biasReport.severity !== 'none' && (
							<Badge variant={getBiasBadgeVariant(consultation.biasReport.severity)} size="sm">
								Bias: {consultation.biasReport.severity}
							</Badge>
						)}
						{consultation.formType && (
							<Badge variant="outline" size="sm">
								{consultation.formType === 'enhanced' ? 'Enhanced Form' : 'Standard Form'}
							</Badge>
						)}
					</div>
				</div>

				<div className="mt-4 md:mt-0 flex space-x-3 print:hidden">
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

			{/* Patient Information - FIXED: Better handling when patient is missing */}
			{patient ? (
				<Card className="mb-6">
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div>
								<p className="text-sm font-medium text-gray-700">Name</p>
								<p className="text-gray-900">{patient.name}</p>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-700">Age</p>
								<p className="text-gray-900">{patient.age} years</p>
							</div>
							<div>
								<p className="text-sm font-medium text-gray-700">Patient ID</p>
								<p className="text-gray-900">{patient.id}</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card className="mb-6">
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
					</CardHeader>
					<CardContent>
						<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
							<p className="text-sm text-yellow-800">
								⚠️ Patient information not available (Patient ID: {consultation.patientId})
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Enhanced Metadata Display */}
			{showMetadata && (
				<Card className="mb-6 print:hidden">
					<CardHeader>
						<h3 className="text-lg font-semibold text-gray-900">Consultation Metadata</h3>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
							<div>
								<p className="font-medium text-gray-700">Consultation ID</p>
								<p className="text-gray-600 font-mono text-xs">{consultation.id}</p>
							</div>
							<div>
								<p className="font-medium text-gray-700">Created</p>
								<p className="text-gray-600">{formatDate(consultation.date)}</p>
							</div>
							{consultation.aiModel && (
								<div>
									<p className="font-medium text-gray-700">AI Model Used</p>
									<p className="text-gray-600">
										{consultation.aiModel === 'rule_based' ? 'WHO Guidelines (Rule-based)' : 'Gemini AI + Guidelines'}
									</p>
								</div>
							)}
							{consultation.aiConfidence && (
								<div>
									<p className="font-medium text-gray-700">AI Confidence</p>
									<Badge variant={getConfidenceBadgeVariant(consultation.aiConfidence)} size="sm">
										{consultation.aiConfidence}
									</Badge>
								</div>
							)}
							{consultation.lastModified && (
								<div>
									<p className="font-medium text-gray-700">Last Modified</p>
									<p className="text-gray-600">{formatDate(consultation.lastModified)}</p>
								</div>
							)}
							{consultation.crdtId && (
								<div>
									<p className="font-medium text-gray-700">Collaboration ID</p>
									<p className="text-gray-600 font-mono text-xs">{consultation.crdtId}</p>
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Clinical Assessment */}
			<Card className="mb-6">
				<CardHeader>
					<h2 className="text-lg font-semibold text-gray-900">Clinical Assessment</h2>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">Chief Complaint</h4>
							<p className="text-gray-900 p-3 bg-gray-50 rounded-md border">
								{consultation.chiefComplaint || 'Not recorded'}
							</p>
						</div>
						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">Vital Signs</h4>
							<p className="text-gray-900 p-3 bg-gray-50 rounded-md border">
								{consultation.vitals || 'Not recorded'}
							</p>
						</div>
					</div>

					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">Symptoms</h4>
						<p className="text-gray-900 p-3 bg-gray-50 rounded-md border">
							{consultation.symptoms || 'Not recorded'}
						</p>
					</div>

					{consultation.examination && (
						<div>
							<h4 className="text-sm font-medium text-gray-700 mb-2">Physical Examination</h4>
							<p className="text-gray-900 p-3 bg-gray-50 rounded-md border whitespace-pre-wrap">
								{consultation.examination}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* WHO SMART Guidelines Display */}
			{consultation.smartGuidelines && (
				<Card className="mb-6">
					<CardHeader>
						<h2 className="text-lg font-semibold text-gray-900">WHO SMART Guidelines Applied</h2>
						<p className="text-sm text-gray-600">
							Domain: {consultation.smartGuidelines.domain} |
							Version: {consultation.smartGuidelines.version}
						</p>
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{consultation.smartGuidelines.recommendations?.map((rec, idx) => (
								<div key={idx} className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
									<h4 className="font-medium text-green-900 mb-2">{rec.title}</h4>
									<p className="text-sm text-green-800 mb-2">{rec.description}</p>
									<div className="flex items-center space-x-4 text-xs">
										<span className="px-2 py-1 bg-green-100 text-green-800 rounded">
											Evidence: {rec.evidence}
										</span>
										{rec.resourceConstraints && (
											<span className="text-green-600">
												Resources: {rec.resourceConstraints.join(', ')}
											</span>
										)}
									</div>
								</div>
							))}
						</div>

						{consultation.smartGuidelines.evidence && (
							<div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
								<p className="text-sm text-blue-800">
									<strong>Evidence Base:</strong> {consultation.smartGuidelines.evidence}
								</p>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* AI Recommendations */}
			{consultation.aiRecommendations && (
				<Card className="mb-6">
					<CardHeader>
						<div className="flex justify-between items-center">
							<h2 className="text-lg font-semibold text-gray-900">AI Clinical Decision Support</h2>
							<div className="flex items-center space-x-2">
								{consultation.aiConfidence && (
									<Badge variant={getConfidenceBadgeVariant(consultation.aiConfidence)} size="sm">
										{consultation.aiConfidence} Confidence
									</Badge>
								)}
								<Badge variant="secondary" size="sm">
									{consultation.aiModel === 'rule_based' ? 'Rule-based' : 'AI Generated'}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
							<div className="whitespace-pre-wrap text-sm text-blue-900">
								{consultation.aiRecommendations}
							</div>
						</div>

						{consultation.biasReport && consultation.biasReport.mitigated && (
							<div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div className="flex items-center space-x-2 mb-2">
									<Badge variant="warning" size="sm">Bias Mitigated</Badge>
								</div>
								<p className="text-sm text-yellow-800">
									Bias categories addressed: {consultation.biasReport.categories?.join(', ')}
								</p>
							</div>
						)}

						<div className="mt-3 text-xs text-gray-500">
							Generated: {consultation.aiTimestamp ?
								formatDate(consultation.aiTimestamp) :
								formatDate(consultation.date)
							}
						</div>
					</CardContent>
				</Card>
			)}

			{/* Provider Clinical Decision */}
			<Card className="mb-6">
				<CardHeader>
					<div className="flex justify-between items-center">
						<h2 className="text-lg font-semibold text-gray-900">Provider Clinical Decision</h2>
						<Badge variant="primary">Healthcare Provider Authority</Badge>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">Final Diagnosis</h4>
						{isEditing ? (
							<TextArea
								value={editedDiagnosis}
								onChange={(e) => setEditedDiagnosis(e.target.value)}
								placeholder="Enter clinical diagnosis..."
								rows={2}
								className="font-mono"
							/>
						) : (
							consultation.finalDiagnosis ? (
								<div className="p-3 bg-green-50 rounded-md border border-green-200 font-medium">
									{consultation.finalDiagnosis}
								</div>
							) : (
								<div className="p-3 bg-gray-100 rounded-md border border-gray-300 text-gray-500 text-sm italic">
									No diagnosis recorded
								</div>
							)
						)}
					</div>

					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">Treatment Plan</h4>
						{isEditing ? (
							<TextArea
								value={editedPlan}
								onChange={(e) => setEditedPlan(e.target.value)}
								placeholder="Enter treatment plan, medications, follow-up..."
								rows={4}
								className="font-mono"
							/>
						) : (
							consultation.plan ? (
								<div className="p-3 bg-gray-50 rounded-md border border-gray-200 whitespace-pre-wrap">
									{consultation.plan}
								</div>
							) : (
								<div className="p-3 bg-gray-100 rounded-md border border-gray-300 text-gray-500 text-sm italic">
									No treatment plan recorded
								</div>
							)
						)}
					</div>

					<div>
						<h4 className="text-sm font-medium text-gray-700 mb-2">Additional Clinical Notes</h4>
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
								<span className={`mr-2 ${consultation.finalDiagnosis ? 'text-green-600' : 'text-red-600'}`}>
									{consultation.finalDiagnosis ? '✓' : '✗'}
								</span>
								<span className={consultation.finalDiagnosis ? 'text-green-700' : 'text-red-700'}>
									Final Diagnosis {consultation.finalDiagnosis ? 'Complete' : 'Missing'}
								</span>
							</div>
							<div className="flex items-center">
								<span className={`mr-2 ${consultation.plan ? 'text-green-600' : 'text-red-600'}`}>
									{consultation.plan ? '✓' : '✗'}
								</span>
								<span className={consultation.plan ? 'text-green-700' : 'text-red-700'}>
									Treatment Plan {consultation.plan ? 'Complete' : 'Missing'}
								</span>
							</div>
							<div className="flex items-center">
								<span className={`mr-2 ${consultation.aiRecommendations ? 'text-green-600' : 'text-gray-600'}`}>
									{consultation.aiRecommendations ? '✓' : '○'}
								</span>
								<span className={consultation.aiRecommendations ? 'text-green-700' : 'text-gray-600'}>
									AI Support {consultation.aiRecommendations ? 'Used' : 'Not Used'}
								</span>
							</div>
							<div className="flex items-center">
								<span className={`mr-2 ${consultation.smartGuidelines ? 'text-green-600' : 'text-gray-600'}`}>
									{consultation.smartGuidelines ? '✓' : '○'}
								</span>
								<span className={consultation.smartGuidelines ? 'text-green-700' : 'text-gray-600'}>
									WHO Guidelines {consultation.smartGuidelines ? 'Applied' : 'Not Applied'}
								</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Navigation */}
			<div className="flex justify-between items-center print:hidden">
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