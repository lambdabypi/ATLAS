// src/app/patients/[id]/page.js - CENTERED VERSION
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getById as getPatientById, update as updatePatient } from '../../../lib/db/patients';
import { getConsultationsByPatientId } from '../../../lib/db/consultations';
import { queuePatientSync } from '../../../lib/sync/patient-sync';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, TextArea, Select } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function PatientDetailPage() {
	const params = useParams();
	const { id } = params;

	const [patient, setPatient] = useState(null);
	const [consultations, setConsultations] = useState([]);
	const [loading, setLoading] = useState(true);
	const [isEditing, setIsEditing] = useState(false);
	const [editedPatient, setEditedPatient] = useState(null);

	useEffect(() => {
		async function loadPatientData() {
			if (!id) return;

			// Handle special routes like "add" or "new"
			if (id === 'add' || id === 'new') {
				console.log('Redirecting to add patient page');
				setLoading(false);
				return;
			}

			// Validate that id is a valid number
			const patientId = parseInt(id, 10);
			if (isNaN(patientId)) {
				console.error('Invalid patient ID:', id);
				setLoading(false);
				return;
			}

			try {
				console.log('Loading patient with ID:', patientId);
				const patientData = await getPatientById(patientId);

				if (!patientData) {
					console.log('Patient not found for ID:', patientId);
					setLoading(false);
					return;
				}

				setPatient(patientData);
				setEditedPatient(patientData);

				const patientConsultations = await getConsultationsByPatientId(patientId);
				setConsultations(patientConsultations);

				setLoading(false);
			} catch (error) {
				console.error('Error loading patient data:', error);
				setLoading(false);
			}
		}

		loadPatientData();
	}, [id]);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setEditedPatient(prev => ({
			...prev,
			[name]: value
		}));
	};

	const handleSavePatient = async () => {
		try {
			const patientId = parseInt(id, 10);
			await updatePatient(patientId, editedPatient);

			// Queue for sync when online - only queue if we have sync functionality
			try {
				await queuePatientSync(patientId, 'update', editedPatient);
			} catch (syncError) {
				console.warn('Could not queue patient for sync:', syncError);
				// Don't fail the whole operation if sync queueing fails
			}

			setPatient(editedPatient);
			setIsEditing(false);
		} catch (error) {
			console.error('Error updating patient:', error);
			alert('Failed to update patient. Please try again.');
		}
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	const PatientIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
		</svg>
	);

	const genderOptions = [
		{ value: 'Male', label: 'Male' },
		{ value: 'Female', label: 'Female' },
		{ value: 'Other', label: 'Other' }
	];

	if (loading) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex justify-center items-center min-h-64">
							<LoadingSpinner size="lg" />
							<span className="ml-3 text-gray-600">Loading patient data...</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<Card className="atlas-card-primary">
							<CardContent>
								<EmptyState
									icon={PatientIcon}
									title="Patient Not Found"
									description={`The patient record with ID ${id} doesn't exist or has been deleted.`}
									action={
										<Button as={Link} href="/patients" variant="primary">
											Back to Patients
										</Button>
									}
								/>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="atlas-backdrop">
			<div className="atlas-page-container">
				<div className="atlas-content-wrapper">
					{/* Header */}
					<div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
						<div className="atlas-header-center">
							<h1 className="text-2xl font-bold text-gray-800">Patient Record</h1>
							<p className="text-gray-600">
								Last Visit: {formatDate(patient.lastVisit)}
							</p>
						</div>

						<div className="mt-4 md:mt-0 flex space-x-3">
							{isEditing ? (
								<>
									<Button onClick={handleSavePatient} variant="primary">
										Save Changes
									</Button>
									<Button onClick={() => setIsEditing(false)} variant="secondary">
										Cancel
									</Button>
								</>
							) : (
								<>
									<Button onClick={() => setIsEditing(true)} variant="primary">
										Edit Patient
									</Button>
									<Button
										as={Link}
										href={`/consultation/new?patientId=${patient.id}`}
										variant="primary"
									>
										New Consultation
									</Button>
								</>
							)}
						</div>
					</div>

					{/* Patient Information */}
					<Card className="atlas-card-primary mb-6">
						<CardHeader>
							<h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
						</CardHeader>

						<CardContent>
							{isEditing ? (
								<div className="space-y-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<Input
											label="Full Name"
											type="text"
											name="name"
											value={editedPatient.name}
											onChange={handleInputChange}
										/>

										<div className="grid grid-cols-2 gap-4">
											<Input
												label="Age"
												type="number"
												name="age"
												min="0"
												max="120"
												value={editedPatient.age}
												onChange={handleInputChange}
											/>

											<Select
												label="Gender"
												name="gender"
												value={editedPatient.gender}
												onChange={handleInputChange}
												options={genderOptions}
											/>
										</div>
									</div>

									<Input
										label="Allergies"
										type="text"
										name="allergies"
										value={editedPatient.allergies || ''}
										onChange={handleInputChange}
										placeholder="List allergies, separated by commas"
									/>

									<Input
										label="Current Medications"
										type="text"
										name="currentMedications"
										value={editedPatient.currentMedications || ''}
										onChange={handleInputChange}
										placeholder="List current medications, separated by commas"
									/>

									<TextArea
										label="Medical History"
										name="medicalHistory"
										rows={4}
										value={editedPatient.medicalHistory || ''}
										onChange={handleInputChange}
										placeholder="Relevant medical history, previous conditions, surgeries, etc."
									/>
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
						</CardContent>
					</Card>

					{/* Consultation History */}
					<Card className="atlas-card-primary">
						<CardHeader>
							<div className="flex justify-between items-center">
								<h2 className="font-bold text-lg text-gray-800">Consultation History</h2>
								<Button
									as={Link}
									href={`/consultation/new?patientId=${patient.id}`}
									variant="outline"
									size="sm"
								>
									+ New Consultation
								</Button>
							</div>
						</CardHeader>

						{consultations.length === 0 ? (
							<CardContent>
								<div className="text-center py-6">
									<p className="text-gray-500">No consultations recorded for this patient</p>
									<Button
										as={Link}
										href={`/consultation/new?patientId=${patient.id}`}
										variant="primary"
										className="mt-4"
									>
										Start first consultation
									</Button>
								</div>
							</CardContent>
						) : (
							<div className="overflow-x-auto">
								<table className="table">
									<thead className="bg-gray-50">
										<tr>
											<th className="table-header">Date</th>
											<th className="table-header">Chief Complaint</th>
											<th className="table-header">Diagnosis</th>
											<th className="table-header text-right">Actions</th>
										</tr>
									</thead>
									<tbody className="bg-white divide-y divide-gray-200">
										{consultations.map((consultation) => (
											<tr key={consultation.id} className="table-row hover:bg-gray-50 transition-colors">
												<td className="table-cell whitespace-nowrap">
													<div className="text-sm text-gray-900">{formatDate(consultation.date)}</div>
												</td>
												<td className="table-cell">
													<div className="text-sm text-gray-900">{consultation.chiefComplaint || 'Not specified'}</div>
													{consultation.symptoms && (
														<div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
															{consultation.symptoms}
														</div>
													)}
												</td>
												<td className="table-cell">
													<div className="text-sm text-gray-900">{consultation.finalDiagnosis || 'Not recorded'}</div>
												</td>
												<td className="table-cell whitespace-nowrap text-right text-sm font-medium">
													<Button
														as={Link}
														href={`/consultation/${consultation.id}`}
														variant="outline"
														size="sm"
													>
														View
													</Button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</Card>

					{/* Navigation */}
					<div className="mt-6">
						<Button as={Link} href="/patients" variant="outline">
							← Back to Patients
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}