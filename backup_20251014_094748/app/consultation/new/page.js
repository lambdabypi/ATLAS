// src/app/consultation/new/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ConsultationForm from '../../../components/ConsultationForm';
import { getById as getPatientById } from '../../../lib/db/patients';
import { patientDb } from '../../../lib/db';

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

	// Load patient data if patientId is provided
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

	// Filter patients based on search query
	const filteredPatients = patientList.filter(p =>
		p.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Handle patient selection
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

	// Handle consultation submission
	const handleConsultationComplete = (consultationId) => {
		// Redirect to the new consultation
		router.push(`/consultation/${consultationId}`);
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

	return (
		<div className="max-w-4xl mx-auto p-4">
			<h1 className="text-2xl font-bold text-gray-800 mb-6">New Consultation</h1>

			{showPatientSelect ? (
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">Select Patient</h2>

					<div className="mb-4">
						<label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1">
							Search Patients
						</label>
						<input
							type="text"
							id="patient-search"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Search by patient name"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
						/>
					</div>

					{filteredPatients.length === 0 ? (
						<div className="text-center p-4 bg-gray-50 rounded-md">
							<p className="text-gray-600 mb-2">No patients found</p>
							<button
								className="text-blue-600 hover:text-blue-800"
								onClick={() => router.push('/patients/add')}
							>
								Add New Patient
							</button>
						</div>
					) : (
						<div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
							<ul className="divide-y divide-gray-200">
								{filteredPatients.map(p => (
									<li
										key={p.id}
										className="p-3 hover:bg-blue-50 cursor-pointer"
										onClick={() => handlePatientSelect(p.id)}
									>
										<div className="font-medium">{p.name}</div>
										<div className="text-sm text-gray-500">
											{p.age} years, {p.gender}
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="mt-4 flex justify-end">
						<button
							className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
							onClick={() => router.push('/patients/add')}
						>
							Add New Patient
						</button>
					</div>
				</div>
			) : patient ? (
				<ConsultationForm
					patientId={patient.id}
					onConsultationComplete={handleConsultationComplete}
				/>
			) : (
				<div className="bg-white rounded-lg shadow-md p-8 text-center">
					<h2 className="text-xl font-semibold text-gray-800 mb-4">No Patient Selected</h2>
					<p className="text-gray-600 mb-6">Please select a patient to start a consultation.</p>
					<button
						onClick={() => setShowPatientSelect(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						Select Patient
					</button>
				</div>
			)}
		</div>
	);
}