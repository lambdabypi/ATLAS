// src/app/patients/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { patientDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

export default function PatientsPage() {
	const [patients, setPatients] = useState([]);
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		async function loadPatients() {
			try {
				const allPatients = await patientDb.getAll();

				const sortedPatients = allPatients.sort(
					(a, b) => new Date(b.lastVisit) - new Date(a.lastVisit)
				);

				setPatients(sortedPatients);
				setLoading(false);
			} catch (error) {
				console.error('Error loading patients:', error);
				setLoading(false);
			}
		}

		loadPatients();
	}, []);

	const filteredPatients = patients.filter(patient =>
		patient.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handlePatientSelect = (patient) => {
		setSelectedPatient(patient);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	const PatientsIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
		</svg>
	);

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Patient Records</h1>
				<Button as={Link} href="/patients/add" variant="primary">
					Add New Patient
				</Button>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Patient List */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-gray-800">Patients</h3>
									<Badge variant="secondary">
										{filteredPatients.length} patients
									</Badge>
								</div>

								<Input
									type="text"
									placeholder="Search patients..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</CardHeader>

						<CardContent padding={false}>
							{loading ? (
								<div className="flex justify-center py-8">
									<LoadingSpinner />
									<span className="ml-2 text-gray-500">Loading patients...</span>
								</div>
							) : filteredPatients.length === 0 ? (
								<div className="p-6">
									{searchQuery ? (
										<EmptyState
											icon={PatientsIcon}
											title="No patients found"
											description={`No patients found matching "${searchQuery}"`}
											action={
												<Button variant="secondary" onClick={() => setSearchQuery('')}>
													Clear Search
												</Button>
											}
										/>
									) : (
										<EmptyState
											icon={PatientsIcon}
											title="No patients in database"
											description="Add your first patient to get started."
											action={
												<Button as={Link} href="/patients/add" variant="primary">
													Add First Patient
												</Button>
											}
										/>
									)}
								</div>
							) : (
								<div className="max-h-96 overflow-y-auto">
									<ul className="divide-y divide-gray-200">
										{filteredPatients.map(patient => {
											const isActive = selectedPatient?.id === patient.id;
											return (
												<li
													key={patient.id}
													className={`p-4 cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
													onClick={() => handlePatientSelect(patient)}
												>
													<div className="flex justify-between items-start">
														<div className="flex-1">
															<h4 className="font-medium text-gray-900">{patient.name}</h4>
															<p className="text-sm text-gray-500">{patient.age} years, {patient.gender}</p>
															{patient.allergies && (
																<Badge variant="danger" className="mt-1 text-xs">
																	Allergies: {patient.allergies}
																</Badge>
															)}
														</div>
														<div className="text-right text-xs text-gray-500">
															<p>Last visit</p>
															<p className="font-medium">{formatDate(patient.lastVisit)}</p>
														</div>
													</div>
												</li>
											);
										})}
									</ul>
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Patient Details */}
				<div className="lg:col-span-2">
					{selectedPatient ? (
						<PatientRecord patient={selectedPatient} />
					) : (
						<Card>
							<CardContent>
								<EmptyState
									icon={PatientsIcon}
									title="No patient selected"
									description="Select a patient from the list to view their medical record or create a new consultation."
									action={
										<Button as={Link} href="/patients/add" variant="primary">
											Add New Patient
										</Button>
									}
								/>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

// Patient Record Component
function PatientRecord({ patient }) {
	const [consultations, setConsultations] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadConsultations() {
			if (!patient || !patient.id) return;

			try {
				const { getConsultationsByPatientId } = await import('../../lib/db/consultations');
				const patientConsultations = await getConsultationsByPatientId(patient.id);

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

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	const ConsultationIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
	);

	return (
		<div className="space-y-6">
			{/* Patient Information */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
						<div className="flex space-x-2">
							<Button as={Link} href={`/patients/${patient.id}`} variant="outline" size="sm">
								View Full Record
							</Button>
							<Button as={Link} href={`/consultation/new?patientId=${patient.id}`} variant="primary" size="sm">
								New Consultation
							</Button>
						</div>
					</div>
				</CardHeader>

				<CardContent>
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
								<Badge variant="danger">{patient.allergies}</Badge>
							</div>
						)}

						{patient.currentMedications && (
							<div className="md:col-span-2">
								<p className="text-sm text-gray-500">Current Medications</p>
								<p className="font-medium">{patient.currentMedications}</p>
							</div>
						)}

						{patient.medicalHistory && (
							<div className="md:col-span-2">
								<p className="text-sm text-gray-500">Medical History</p>
								<p className="text-gray-700 whitespace-pre-line">{patient.medicalHistory}</p>
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Recent Consultations */}
			<Card>
				<CardHeader>
					<div className="flex justify-between items-center">
						<h3 className="font-semibold text-gray-800">Recent Consultations</h3>
						<Button as={Link} href={`/consultation/new?patientId=${patient.id}`} variant="outline" size="sm">
							New Consultation
						</Button>
					</div>
				</CardHeader>

				<CardContent padding={false}>
					{loading ? (
						<div className="flex justify-center py-8">
							<LoadingSpinner />
							<span className="ml-2 text-gray-500">Loading consultations...</span>
						</div>
					) : consultations.length === 0 ? (
						<EmptyState
							icon={ConsultationIcon}
							title="No consultations recorded"
							description="This patient hasn't had any consultations yet."
							action={
								<Button as={Link} href={`/consultation/new?patientId=${patient.id}`} variant="primary">
									Start First Consultation
								</Button>
							}
						/>
					) : (
						<div className="max-h-80 overflow-y-auto">
							{consultations.slice(0, 5).map(consultation => (
								<div key={consultation.id} className="p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
									<Link href={`/consultation/${consultation.id}`} className="block">
										<div className="flex justify-between items-start">
											<div className="flex-1">
												<p className="font-medium text-gray-900">
													{consultation.chiefComplaint || 'Consultation'}
												</p>
												{consultation.finalDiagnosis && (
													<p className="text-sm text-gray-600 mt-1">
														Diagnosis: {consultation.finalDiagnosis}
													</p>
												)}
												{consultation.symptoms && (
													<p className="text-xs text-gray-500 mt-1 truncate">
														Symptoms: {consultation.symptoms}
													</p>
												)}
											</div>
											<div className="text-right text-sm text-gray-500 ml-4">
												{formatDate(consultation.date)}
											</div>
										</div>
									</Link>
								</div>
							))}

							{consultations.length > 5 && (
								<div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
									<Link href={`/patients/${patient.id}`} className="text-sm text-blue-600 hover:text-blue-800">
										View all consultations →
									</Link>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}