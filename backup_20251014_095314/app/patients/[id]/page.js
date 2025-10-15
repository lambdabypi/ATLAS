// src/app/patient/[id]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getById as getPatientById, update as updatePatient } from '../../../lib/db/patients';
import { getConsultationsByPatientId } from '../../../lib/db/consultations';
import { queuePatientSync } from '../../../lib/sync/patientSync';

export default function PatientDetailPage() {
	const params = useParams();
	const router = useRouter();
	const { id } = params;

	const [patient, setPatient] = useState(null);
	const [consultations, setConsultations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editedPatient, setEditedPatient] = useState(null);

	// Load patient and consultation data
	useEffect(() => {
		async function loadPatientData() {
			if (!id) return;

			try {
				const patientData = await getPatientById(Number(id));

				if (!patientData) {
					setLoading(false);
					return;
				}

				setPatient(patientData);
				setEditedPatient(patientData);

				// Load consultations for this patient
				const patientConsultations = await getConsultationsByPatientId(Number(id));
				setConsultations(patientConsultations);

				setLoading(false);
			} catch (error) {
				console.error('Error loading patient data:', error);
				setLoading(false);
			}
		}

		loadPatientData();
	}, [id]);

	// Handle form input changes when editing
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setEditedPatient(prev => ({
			...prev,
			[name]: value
		}));
	};

	// Handle saving edited patient
	const handleSavePatient = async () => {
		try {
			// Update patient in the database
			await updatePatient(Number(id), editedPatient);

			// Queue for sync when online
			await queuePatientSync(Number(id), 'update', editedPatient);

			// Update local state
			setPatient(editedPatient);
			setIsEditing(false);
		} catch (error) {
			console.error('Error updating patient:', error);
			alert('Failed to update patient. Please try again.');
		}
	};

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	if (loading) {
		return (
			<div className="max-w-4xl mx-auto p-4">
				<div className="text-center p-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
					<p>Loading patient data...</p>
				</div>
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="max-w-4xl mx-auto p-4">
				<div className="bg-white rounded-lg shadow-md p-8 text-center">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">Patient Not Found</h2>
					<p className="text-gray-600 mb-6">The patient record you're looking for doesn't exist or has been deleted.</p>
					<Link
						href="/patients"
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Back to Patients
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-4">
			<div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-800">Patient Record</h1>
					<p className="text-gray-600">
						Last Visit: {formatDate(patient.lastVisit)}
					</p>
				</div>

				<div className="mt-4 sm:mt-0 flex space-x-3">
					{isEditing ? (
						<>
							<button
								onClick={handleSavePatient}
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
								Edit Patient
							</button>
							<Link
								href={`/consultation/new?patientId=${patient.id}`}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
							>
								New Consultation
							</Link>
						</>
					)}
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h2 className="text-lg font-semibold text-gray-800 mb-4">Patient Information</h2>

				{isEditing ? (
					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<label className="block text-gray-700 font-medium mb-2" htmlFor="name">
									Full Name
								</label>
								<input
									type="text"
									id="name"
									name="name"
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									value={editedPatient.name}
									onChange={handleInputChange}
								/>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-gray-700 font-medium mb-2" htmlFor="age">
										Age
									</label>
									<input
										type="number"
										id="age"
										name="age"
										min="0"
										max="120"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={editedPatient.age}
										onChange={handleInputChange}
									/>
								</div>

								<div>
									<label className="block text-gray-700 font-medium mb-2" htmlFor="gender">
										Gender
									</label>
									<select
										id="gender"
										name="gender"
										className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										value={editedPatient.gender}
										onChange={handleInputChange}
									>
										<option value="Male">Male</option>
										<option value="Female">Female</option>
										<option value="Other">Other</option>
									</select>
								</div>
							</div>
						</div>

						<div>
							<label className="block text-gray-700 font-medium mb-2" htmlFor="allergies">
								Allergies
							</label>
							<input
								type="text"
								id="allergies"
								name="allergies"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={editedPatient.allergies || ''}
								onChange={handleInputChange}
								placeholder="List allergies, separated by commas"
							/>
						</div>

						<div>
							<label className="block text-gray-700 font-medium mb-2" htmlFor="currentMedications">
								Current Medications
							</label>
							<input
								type="text"
								id="currentMedications"
								name="currentMedications"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={editedPatient.currentMedications || ''}
								onChange={handleInputChange}
								placeholder="List current medications, separated by commas"
							/>
						</div>

						<div>
							<label className="block text-gray-700 font-medium mb-2" htmlFor="medicalHistory">
								Medical History
							</label>
							<textarea
								id="medicalHistory"
								name="medicalHistory"
								rows="4"
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={editedPatient.medicalHistory || ''}
								onChange={handleInputChange}
								placeholder="Relevant medical history, previous conditions, surgeries, etc."
							></textarea>
						</div>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						<div>
							<p className="text-sm text-gray-500">Name</p>
							<p className="font-medium">{patient.name}</p>
						</div>

						<div>
							<p className="text-sm text-gray-500">Age / Gender</p>
							<p className="font-medium">{patient.age} years, {patient.gender}</p>
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
								<p>{patient.currentMedications}</p>
							</div>
						)}

						{patient.medicalHistory && (
							<div className="md:col-span-2">
								<p className="text-sm text-gray-500">Medical History</p>
								<p className="whitespace-pre-line">{patient.medicalHistory}</p>
							</div>
						)}
					</div>
				)}
			</div>

			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
					<h2 className="font-bold text-lg text-gray-800">Consultation History</h2>
					<Link
						href={`/consultation/new?patientId=${patient.id}`}
						className="text-blue-600 hover:text-blue-800 text-sm"
					>
						+ New Consultation
					</Link>
				</div>

				{consultations.length === 0 ? (
					<div className="p-6 text-center">
						<p className="text-gray-500">No consultations recorded for this patient</p>
						<Link
							href={`/consultation/new?patientId=${patient.id}`}
							className="mt-2 inline-block text-blue-600 hover:text-blue-800"
						>
							Start first consultation
						</Link>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Chief Complaint
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Diagnosis
									</th>
									<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{consultations.map((consultation) => (
									<tr key={consultation.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="text-sm text-gray-900">{formatDate(consultation.date)}</div>
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900">{consultation.chiefComplaint || 'Not specified'}</div>
											{consultation.symptoms && (
												<div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
													{consultation.symptoms}
												</div>
											)}
										</td>
										<td className="px-6 py-4">
											<div className="text-sm text-gray-900">{consultation.finalDiagnosis || 'Not recorded'}</div>
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<Link
												href={`/consultation/${consultation.id}`}
												className="text-blue-600 hover:text-blue-900"
											>
												View
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className="mt-6">
				<Link
					href="/patients"
					className="text-blue-600 hover:text-blue-800"
				>
					← Back to Patients
				</Link>
			</div>
		</div>
	);
}