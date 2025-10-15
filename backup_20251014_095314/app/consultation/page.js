// src/app/consultation/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllConsultations, getConsultationStats } from '../../lib/db/consultations';
import { getById as getPatientById } from '../../lib/db/patients';

export default function ConsultationsPage() {
	const [consultations, setConsultations] = useState([]);
	const [stats, setStats] = useState({
		today: 0,
		week: 0,
		total: 0,
		uniquePatients: 0
	});
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedFilter, setSelectedFilter] = useState('all');

	// Load consultations from IndexedDB
	useEffect(() => {
		async function loadConsultations() {
			try {
				// Get all consultations
				const allConsultations = await getAllConsultations();

				// Get patient information for each consultation
				const consultationsWithPatients = await Promise.all(
					allConsultations.map(async (consultation) => {
						const patient = await getPatientById(consultation.patientId);
						return {
							...consultation,
							patientName: patient ? patient.name : 'Unknown',
							patientAge: patient ? patient.age : '',
							patientGender: patient ? patient.gender : ''
						};
					})
				);

				// Sort by date (newest first)
				const sortedConsultations = consultationsWithPatients.sort(
					(a, b) => new Date(b.date) - new Date(a.date)
				);

				setConsultations(sortedConsultations);

				// Get consultation statistics
				const consultationStats = await getConsultationStats();
				setStats(consultationStats);

				setLoading(false);
			} catch (error) {
				console.error('Error loading consultations:', error);
				setLoading(false);
			}
		}

		loadConsultations();
	}, []);

	// Filter consultations based on search query and selected filter
	const filteredConsultations = consultations.filter(consultation => {
		// Apply search filter
		const matchesSearch =
			(consultation.patientName && consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.chiefComplaint && consultation.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.symptoms && consultation.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.finalDiagnosis && consultation.finalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

		// Apply time period filter
		let matchesTimeFilter = true;
		if (selectedFilter !== 'all') {
			const consultationDate = new Date(consultation.date);
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			if (selectedFilter === 'today') {
				matchesTimeFilter = consultationDate >= today;
			} else if (selectedFilter === 'week') {
				const lastWeek = new Date();
				lastWeek.setDate(lastWeek.getDate() - 7);
				lastWeek.setHours(0, 0, 0, 0);
				matchesTimeFilter = consultationDate >= lastWeek;
			} else if (selectedFilter === 'month') {
				const lastMonth = new Date();
				lastMonth.setMonth(lastMonth.getMonth() - 1);
				lastMonth.setHours(0, 0, 0, 0);
				matchesTimeFilter = consultationDate >= lastMonth;
			}
		}

		return matchesSearch && matchesTimeFilter;
	});

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
	};

	// Handle time filter change
	const handleFilterChange = (e) => {
		setSelectedFilter(e.target.value);
	};

	return (
		<div className="max-w-7xl mx-auto p-4">
			<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
				<h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Consultations</h1>

				<Link href="/consultation/new" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
					New Consultation
				</Link>
			</div>

			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
					<div className="p-4 border rounded-lg bg-blue-50 border-blue-100">
						<h3 className="text-sm font-medium text-blue-800">Today</h3>
						<p className="mt-1 text-3xl font-semibold text-blue-900">{stats.today}</p>
						<p className="mt-1 text-sm text-blue-700">consultations</p>
					</div>

					<div className="p-4 border rounded-lg bg-green-50 border-green-100">
						<h3 className="text-sm font-medium text-green-800">This Week</h3>
						<p className="mt-1 text-3xl font-semibold text-green-900">{stats.week}</p>
						<p className="mt-1 text-sm text-green-700">consultations</p>
					</div>

					<div className="p-4 border rounded-lg bg-purple-50 border-purple-100">
						<h3 className="text-sm font-medium text-purple-800">Unique Patients</h3>
						<p className="mt-1 text-3xl font-semibold text-purple-900">{stats.uniquePatients}</p>
						<p className="mt-1 text-sm text-purple-700">patients seen</p>
					</div>

					<div className="p-4 border rounded-lg bg-gray-50 border-gray-200">
						<h3 className="text-sm font-medium text-gray-800">Total</h3>
						<p className="mt-1 text-3xl font-semibold text-gray-900">{stats.total}</p>
						<p className="mt-1 text-sm text-gray-700">all-time consultations</p>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-lg shadow-md overflow-hidden">
				<div className="p-4 bg-gray-50 border-b border-gray-200">
					<div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
						<div className="relative w-full md:w-64">
							<input
								type="text"
								placeholder="Search consultations..."
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

						<div className="flex items-center space-x-2">
							<label htmlFor="filter" className="text-sm text-gray-700">
								Show:
							</label>
							<select
								id="filter"
								className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
								value={selectedFilter}
								onChange={handleFilterChange}
							>
								<option value="all">All Time</option>
								<option value="today">Today</option>
								<option value="week">This Week</option>
								<option value="month">This Month</option>
							</select>
						</div>
					</div>
				</div>

				{loading ? (
					<div className="text-center p-8">
						<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
						<p>Loading consultations...</p>
					</div>
				) : filteredConsultations.length === 0 ? (
					<div className="text-center p-8">
						<p className="text-gray-500">
							{searchQuery
								? `No consultations found matching "${searchQuery}"`
								: 'No consultations recorded yet'}
						</p>
						<Link href="/consultation/new" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
							Create your first consultation
						</Link>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Patient
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date & Time
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
								{filteredConsultations.map((consultation) => (
									<tr key={consultation.id} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap">
											<div className="font-medium text-gray-900">{consultation.patientName}</div>
											<div className="text-sm text-gray-500">
												{consultation.patientAge} yrs, {consultation.patientGender}
											</div>
										</td>
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
		</div>
	);
}