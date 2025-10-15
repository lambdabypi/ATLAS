// src/app/consultation/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getConsultationById } from '../../../lib/db/consultations';
import { getById as getPatientById } from '../../../lib/db/patients';

export default function ConsultationDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { id } = params;

	const [consultation, setConsultation] = useState(null);
	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editedDiagnosis, setEditedDiagnosis] = useState('');
	const [editedPlan, setEditedPlan] = useState('');

	// Load consultation and patient data
	useEffect(() => {
		async function loadConsultationData() {
			if (!id) return;

			try {
				const consultationData = await getConsultationById(Number(id));

				if (!consultationData) {
					setLoading(false);
					return;
				}

				setConsultation(consultationData);
				setEditedDiagnosis(consultationData.finalDiagnosis || '');
				setEditedPlan(consultationData.plan || '');

				// Load patient data
				if (consultationData.patientId) {
					const patientData = await getPatientById(consultationData.patientId);
					setPatient(patientData);
				}

				setLoading(false);
			} catch (error) {
				console.error('Error loading consultation data:', error);
				setLoading(false);
			}
		}

		loadConsultationData();
	}, [id]);

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	// Handle saving edited consultation
	const handleSaveConsultation = async () => {
		try {
			// Update consultation in the database
			await updateConsultation(Number(id), {
				finalDiagnosis: editedDiagnosis,
				plan: editedPlan
			});

			// Update local state
			setConsultation({
				...consultation,
				finalDiagnosis: editedDiagnosis,
				plan: editedPlan
			});

			setIsEditing(false);
		} catch (error) {
			console.error('Error updating consultation:', error);
			alert('Failed to update consultation. Please try again.');
		}
	};

	// Handle printing the consultation
	const handlePrintConsultation = () => {
		window.print();
	};

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto p-4">
				<div className="text-center p-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
					<p>Loading consultation data...</p>
				</div>
			</div>
		);
	}

	if (!consultation) {
		return (
			<div className="max-w-4xl mx-auto p-4">
				<div className="bg-white rounded-lg shadow-md p-8 text-center">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">Consultation Not Found</h2>
					<p className="text-gray-600 mb-6">The consultation you're looking for doesn't exist or has been deleted.</p>
					<Link
						href="/consultation"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Back to Consultations
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-4">
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Consultation Details</h1>
					<p className="text-gray-600">
						{formatDate(consultation.date)}
					</p>
				</div>

				<div className="mt-4 sm:mt-0 flex space-x-3">
					{isEditing ? (
						<>
							<button
								onClick={handleSaveConsultation}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
							>
								Save Changes
							</button>
							<button
								onClick={() => setIsEditing(false)}
								className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Cancel
							</button>
						</>
					) : (
						<>
							<button
								onClick={() => setIsEditing(true)}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Edit
							</button>
							<button
								onClick={handlePrintConsultation}
								className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								Print
							</button>
						</>
					)}
				</div>
			</div>

			{patient && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h2>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div>
							<p className="text-sm text-gray-500">Name</p>
							<p className="font-medium">{patient.name}</p>
						</div>

						<div>
							<p className="text-sm text-gray-500">Age / Gender</p>
							<p className="font-medium">{patient.age} years, {patient.gender}</p>
						</div>

						{patient.medicalHistory && (
							<div className="md:col-span-2">
								<p className="text-sm text-gray-500">Medical History</p>
								<p>{patient.medicalHistory}</p>
							</div>
						)}

						{patient.allergies && (
							<div>
								<p className="text-sm text-gray-500">Allergies</p>
								<p className="text-red-600 font-medium">{patient.allergies}</p>
							</div>
						)}

						{patient.currentMedications && (
							<div>
								<p className="text-sm text-gray-500">Current Medications</p>
								<p>{patient.currentMedications}</p>
							</div>
						)}
					</div>

					<div className="mt-4 text-right">
						<Link
							href={`/patient/${patient.id}`}
							className="text-blue-600 hover:text-blue-800"
						>
							View Full Patient Record
						</Link>
					</div>
				</div>
			)}

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">Consultation Details</h2>

				<div className="space-y-6">
					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Chief Complaint</h3>
						<p className="p-3 bg-gray-50 rounded-md">{consultation.chiefComplaint || 'Not specified'}</p>
					</div>

					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Symptoms</h3>
						<p className="p-3 bg-gray-50 rounded-md">{consultation.symptoms || 'Not recorded'}</p>
					</div>

					{consultation.vitals && (
						<div>
							<h3 className="text-md font-medium text-gray-700 mb-2">Vitals</h3>
							<p className="p-3 bg-gray-50 rounded-md">{consultation.vitals}</p>
						</div>
					)}

					{consultation.examination && (
						<div>
							<h3 className="text-md font-medium text-gray-700 mb-2">Physical Examination</h3>
							<p className="p-3 bg-gray-50 rounded-md">{consultation.examination}</p>
						</div>
					)}
				</div>
			</div>

			{consultation.differentialDiagnosis && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">Differential Diagnoses</h2>
					<div className="prose max-w-none">
						<div className="whitespace-pre-wrap p-3 bg-gray-50 rounded-md">
							{consultation.differentialDiagnosis}
						</div>
					</div>
				</div>
			)}

			{consultation.aiRecommendations && (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-lg font-semibold text-gray-800 mb-4">AI-Assisted Recommendations</h2>
					<div className="prose max-w-none">
						<div className="whitespace-pre-wrap p-3 bg-blue-50 rounded-md border-l-4 border-blue-500">
							{consultation.aiRecommendations}
						</div>
					</div>
				</div>
			)}

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">Provider Assessment</h2>

				<div className="space-y-6">
					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Final Diagnosis</h3>
						{isEditing ? (
							<textarea
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								rows="2"
								value={editedDiagnosis}
								onChange={(e) => setEditedDiagnosis(e.target.value)}
								placeholder="Enter final diagnosis"
							></textarea>
						) : (
							<p className="p-3 bg-gray-50 rounded-md">
								{consultation.finalDiagnosis || 'Not recorded'}
							</p>
						)}
					</div>

					<div>
						<h3 className="text-md font-medium text-gray-700 mb-2">Treatment Plan</h3>
						{isEditing ? (
							<textarea
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								rows="4"
								value={editedPlan}
								onChange={(e) => setEditedPlan(e.target.value)}
								placeholder="Enter treatment plan and follow-up recommendations"
							></textarea>
						) : (
							<p className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">
								{consultation.plan || 'Not recorded'}
							</p>
						)}
					</div>
				</div>
			</div>

			<div className="mt-6 flex justify-between">
				<Link
					href="/consultation"
					className="text-blue-600 hover:text-blue-800"
				>
					← Back to Consultations
				</Link>

				{patient && (
					<Link
						href={`/consultation/new?patientId=${patient.id}`}
						className="text-blue-600 hover:text-blue-800"
					>
						New Consultation for This Patient →
					</Link>
				)}
			</div>
		</div>
	);
}