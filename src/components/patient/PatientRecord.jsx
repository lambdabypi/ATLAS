// src/components/patient/PatientRecord.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getConsultationsByPatientId } from '../../lib/db/consultations';

export default function PatientRecord({ patient }) {
	const [consultations, setConsultations] = useState([]);
	const [loading, setLoading] = useState(true);

	// Load consultations for this patient
	useEffect(() => {
		async function loadConsultations() {
			if (!patient || !patient.id) return;

			try {
				const patientConsultations = await getConsultationsByPatientId(patient.id);

				// Sort by date (newest first)
				const sortedConsultations = patientConsultations.sort(
					(a, b) => new Date(b.date) - new Date(a.date)
				);

				setConsultations(sortedConsultations);
				setLoading(false);
			} catch (error) {
				console.error('Error loading consultations:', error);
				setLoading(false);
			}
		}

		loadConsultations();
	}, [patient]);

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	// Create hover effect handlers
	const createHoverHandlers = () => ({
		onMouseEnter: (e) => {
			e.currentTarget.style.backgroundColor = '#f9fafb';
		},
		onMouseLeave: (e) => {
			e.currentTarget.style.backgroundColor = '';
		}
	});

	if (!patient) {
		return (
			<div className="bg-yellow-50 p-4 rounded-lg">
				<p className="text-yellow-700">No patient selected</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-md overflow-hidden">
			<div className="p-6 border-b border-gray-200">
				<h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Information</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<p className="text-sm text-gray-500">Name</p>
						<p className="font-medium">{patient.name}</p>
					</div>

					<div>
						<p className="text-sm text-gray-500">Age / Gender</p>
						<p className="font-medium">{patient.age} years, {patient.gender}</p>
					</div>

					<div>
						<p className="text-sm text-gray-500">Last Visit</p>
						<p className="font-medium">{formatDate(patient.lastVisit)}</p>
					</div>

					{patient.allergies && (
						<div>
							<p className="text-sm text-gray-500">Allergies</p>
							<p className="text-red-600 font-medium">{patient.allergies}</p>
						</div>
					)}

					{patient.currentMedications && (
						<div>
							<p className="text-sm text-gray-500">Current Medications</p>
							<p className="font-medium">{patient.currentMedications}</p>
						</div>
					)}

					{patient.medicalHistory && (
						<div className="md:col-span-2">
							<p className="text-sm text-gray-500">Medical History</p>
							<p className="font-medium whitespace-pre-line">{patient.medicalHistory}</p>
						</div>
					)}
				</div>

				<div className="mt-6 flex justify-end">
					<Link
						href={`/patients/${patient.id}`}
						className="text-blue-600 hover:text-blue-800 mr-4"
					>
						View Full Record
					</Link>

					<Link
						href={`/patients/${patient.id}/consultation`}
						className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						New Consultation
					</Link>
				</div>
			</div>

			<div>
				<div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
					<h3 className="font-semibold text-gray-800">Recent Consultations</h3>
				</div>

				{loading ? (
					<div className="text-center p-6">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mx-auto mb-2"></div>
						<p className="text-gray-500">Loading consultations...</p>
					</div>
				) : consultations.length === 0 ? (
					<div className="text-center p-6">
						<p className="text-gray-500">No consultations recorded for this patient</p>
						<Link
							href={`/patients/${patient.id}/consultation`}
							className="mt-2 inline-block text-blue-600 hover:text-blue-800"
						>
							Start first consultation
						</Link>
					</div>
				) : (
					<div className="max-h-80 overflow-y-auto">
						{consultations.slice(0, 5).map(consultation => (
							<div
								key={consultation.id}
								className="border-b border-gray-200 transition-colors duration-200"
								{...createHoverHandlers()}
							>
								<Link
									href={`/consultations/${consultation.id}`}
									className="block p-4 text-decoration-none"
								>
									<div className="flex justify-between">
										<div>
											<p className="font-medium text-gray-900">
												{consultation.chiefComplaint || 'Consultation'}
											</p>
											{consultation.finalDiagnosis && (
												<p className="text-sm text-gray-600 mt-1">
													Diagnosis: {consultation.finalDiagnosis}
												</p>
											)}
											{consultation.symptoms && (
												<p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
													Symptoms: {consultation.symptoms}
												</p>
											)}
										</div>
										<div>
											<p className="text-sm text-gray-500 text-right">
												{formatDate(consultation.date)}
											</p>
										</div>
									</div>
								</Link>
							</div>
						))}
					</div>
				)}

				{consultations.length > 5 && (
					<div className="px-6 py-3 bg-gray-50 text-right border-t border-gray-200">
						<Link
							href={`/patients/${patient.id}`}
							className="text-sm text-blue-600 hover:text-blue-800"
						>
							View all consultations →
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}