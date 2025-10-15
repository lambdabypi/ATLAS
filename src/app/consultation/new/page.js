// src/app/consultation/new/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConsultationForm from '../../../components/consultation/ConsultationForm';
import { getById as getPatientById } from '../../../lib/db/patients';
import { patientDb } from '../../../lib/db';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function NewConsultationPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const patientId = searchParams.get('patientId');

	const [patient, setPatient] = useState(null);
	const [loading, setLoading] = useState(true);
	const [patientList, setPatientList] = useState([]);
	const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
	const [searchQuery, setSearchQuery] = useState('');
	const [showPatientSelect, setShowPatientSelect] = useState(!patientId);

	useEffect(() => {
		async function loadPatientData() {
			if (patientId) {
				try {
					const patientData = await getPatientById(Number(patientId));
					setPatient(patientData);
					setLoading(false);
				} catch (error) {
					console.error('Error loading patient data:', error);
					setLoading(false);
				}
			} else {
				setLoading(false);
			}
		}

		async function loadPatientList() {
			try {
				const patients = await patientDb.getAll();
				setPatientList(patients);
			} catch (error) {
				console.error('Error loading patient list:', error);
			}
		}

		loadPatientData();
		loadPatientList();
	}, [patientId]);

	const filteredPatients = patientList.filter(p =>
		p.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const handlePatientSelect = async (id) => {
		setSelectedPatientId(id);

		if (id) {
			try {
				const patientData = await getPatientById(Number(id));
				setPatient(patientData);
				setShowPatientSelect(false);
			} catch (error) {
				console.error('Error loading selected patient data:', error);
			}
		} else {
			setPatient(null);
		}
	};

	const handleConsultationComplete = (consultationId) => {
		router.push(`/consultation/${consultationId}`);
	};

	const PatientsIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
		</svg>
	);

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
					<span className="ml-3 text-gray-600">Loading patient data...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-4xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">New Consultation</h1>
				<p className="mt-1 text-gray-600">Start a new patient consultation with AI-assisted clinical decision support.</p>
			</div>

			{showPatientSelect ? (
				<Card>
					<CardHeader>
						<h2 className="text-xl font-semibold text-gray-900">Select Patient</h2>
					</CardHeader>

					<CardContent>
						<div className="space-y-4">
							<Input
								label="Search Patients"
								type="text"
								placeholder="Search by patient name"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>

							{filteredPatients.length === 0 ? (
								<EmptyState
									icon={PatientsIcon}
									title={searchQuery ? "No patients found" : "No patients in database"}
									description={searchQuery
										? `No patients found matching "${searchQuery}"`
										: "Add your first patient to start consultations."
									}
									action={
										<div className="space-y-2">
											<Button
												onClick={() => router.push('/patients/add')}
												variant="primary"
											>
												Add New Patient
											</Button>
											{searchQuery && (
												<Button
													onClick={() => setSearchQuery('')}
													variant="secondary"
													className="ml-2"
												>
													Clear Search
												</Button>
											)}
										</div>
									}
								/>
							) : (
								<>
									<div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
										<ul className="divide-y divide-gray-200">
											{filteredPatients.map(p => (
												<li
													key={p.id}
													className="p-3 hover:bg-blue-50 cursor-pointer transition-colors"
													onClick={() => handlePatientSelect(p.id)}
												>
													<div className="font-medium text-gray-900">{p.name}</div>
													<div className="text-sm text-gray-500">
														{p.age} years, {p.gender}
													</div>
													{p.allergies && (
														<div className="text-xs text-red-600 mt-1">
															Allergies: {p.allergies}
														</div>
													)}
												</li>
											))}
										</ul>
									</div>

									<div className="flex justify-end">
										<Button
											onClick={() => router.push('/patients/add')}
											variant="outline"
										>
											Add New Patient
										</Button>
									</div>
								</>
							)}
						</div>
					</CardContent>
				</Card>
			) : patient ? (
				<ConsultationForm
					patientId={patient.id}
					onConsultationComplete={handleConsultationComplete}
				/>
			) : (
				<Card>
					<CardContent>
						<EmptyState
							icon={ConsultationIcon}
							title="No Patient Selected"
							description="Please select a patient to start a consultation."
							action={
								<Button
									onClick={() => setShowPatientSelect(true)}
									variant="primary"
								>
									Select Patient
								</Button>
							}
						/>
					</CardContent>
				</Card>
			)}
		</div>
	);
}