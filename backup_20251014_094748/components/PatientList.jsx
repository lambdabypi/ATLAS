// src/components/PatientList.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { patientDb } from '../lib/db';
import PatientRecord from './PatientRecord';

export default function PatientList() {
	const [patients, setPatients] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedPatient, setSelectedPatient] = useState(null);
	const [isOnline, setIsOnline] = useState(true);

	// Load patients from IndexedDB
	useEffect(() => {
		async function loadPatients() {
			try {
				const allPatients = await patientDb.getAll();

				// Sort by last visit date (newest first)
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

		// Check online status
		setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

		// Set up online/offline detection
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
	};

	// Filter patients based on search query
	const filteredPatients = patients.filter(patient =>
		patient.name.toLowerCase().includes(searchQuery.toLowerCase())
	);

	// Select a patient to view details
	const handlePatientSelect = (patient) => {
		setSelectedPatient(patient);
	};

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	return (
		<div className="flex flex-col lg:flex-row gap-6">
			<div className="w-full lg:w-2/5">
				<div className="bg-white rounded-lg shadow-md overflow-hidden">
					<div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="relative w-full">
							<input
								type="text"
								placeholder="Search patients..."
								className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={searchQuery}
								onChange={handleSearchChange}
							/>
							{searchQuery && (
								<button
									className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
									onClick={() => setSearchQuery('')}
								>
									✕
								</button>
							)}
						</div>

						<Link
							href="/patients/add"
							className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 whitespace-nowrap"
						>
							Add New Patient
						</Link>
					</div>

					{loading ? (
						<div className="text-center p-8">
							<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
							<p>Loading patients...</p>
						</div>
					) : filteredPatients.length === 0 ? (
						<div className="text-center p-8">
							{searchQuery ? (
								<p className="text-gray-500">No patients found matching "{searchQuery}"</p>
							) : (
								<>
									<p className="text-gray-500 mb-4">No patients in the database</p>
									<Link
										href="/patients/add"
										className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
									>
										Add Your First Patient
									</Link>
								</>
							)}
						</div>
					) : (
						<ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
							{filteredPatients.map(patient => (
								<li
									key={patient.id}
									className={`hover:bg-gray-50 cursor-pointer ${selectedPatient?.id === patient.id ? 'bg-blue-50' : ''}`}
									onClick={() => handlePatientSelect(patient)}
								>
									<div className="p-4">
										<div className="flex justify-between">
											<div>
												<h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
												<p className="text-sm text-gray-500">{patient.age} years, {patient.gender}</p>
												{patient.allergies && (
													<p className="text-xs text-red-600 mt-1">Allergies: {patient.allergies}</p>
												)}
											</div>
											<div className="text-right">
												<p className="text-xs text-gray-500">Last visit</p>
												<p className="text-sm font-medium">{formatDate(patient.lastVisit)}</p>
											</div>
										</div>
									</div>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<div className="w-full lg:w-3/5">
				{selectedPatient ? (
					<PatientRecord patient={selectedPatient} />
				) : (
					<div className="bg-white rounded-lg shadow-md p-8 text-center">
						<svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
						</svg>
						<h3 className="text-lg font-medium text-gray-900 mb-2">No patient selected</h3>
						<p className="text-gray-500 mb-4">
							Select a patient from the list to view their medical record or create a new consultation.
						</p>
						<Link
							href="/patients/add"
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
						>
							Add New Patient
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}