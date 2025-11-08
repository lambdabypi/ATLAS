// src/app/consultation/page.js - CENTERED VERSION
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllConsultations, getConsultationStats } from '../../lib/db/consultations';
import { getById as getPatientById } from '../../lib/db/patients';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

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

	useEffect(() => {
		async function loadConsultations() {
			try {
				const allConsultations = await getAllConsultations();

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

				const sortedConsultations = consultationsWithPatients.sort(
					(a, b) => new Date(b.date) - new Date(a.date)
				);

				setConsultations(sortedConsultations);

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

	const filteredConsultations = consultations.filter(consultation => {
		const matchesSearch =
			(consultation.patientName && consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.chiefComplaint && consultation.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.symptoms && consultation.symptoms.toLowerCase().includes(searchQuery.toLowerCase())) ||
			(consultation.finalDiagnosis && consultation.finalDiagnosis.toLowerCase().includes(searchQuery.toLowerCase()));

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

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const ConsultationIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
		</svg>
	);

	const filterOptions = [
		{ value: 'all', label: 'All Time' },
		{ value: 'today', label: 'Today' },
		{ value: 'week', label: 'This Week' },
		{ value: 'month', label: 'This Month' }
	];

	if (loading) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex justify-center items-center min-h-64">
							<LoadingSpinner size="lg" />
							<span className="ml-3 text-gray-600">Loading consultations...</span>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="atlas-backdrop">
			<div className="atlas-page-container">
				<div className="atlas-content-wrapper" style={{ maxWidth: '90rem' }}>
					{/* Header */}
					<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
						<div className="atlas-header-center mb-4 md:mb-0">
							<h1 className="text-2xl font-bold text-gray-900">Consultations</h1>
						</div>
						<Button as={Link} href="/consultation/new" variant="primary">
							New Consultation
						</Button>
					</div>

					{/* Statistics Cards */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
						<Card className="atlas-card-primary">
							<CardContent>
								<div className="p-4 text-center">
									<div className="text-2xl font-bold text-blue-900">{stats.today}</div>
									<div className="text-sm text-blue-800 font-medium">Today</div>
									<div className="text-xs text-blue-700">consultations</div>
								</div>
							</CardContent>
						</Card>

						<Card className="atlas-card-primary">
							<CardContent>
								<div className="p-4 text-center">
									<div className="text-2xl font-bold text-green-900">{stats.week}</div>
									<div className="text-sm text-green-800 font-medium">This Week</div>
									<div className="text-xs text-green-700">consultations</div>
								</div>
							</CardContent>
						</Card>

						<Card className="atlas-card-primary">
							<CardContent>
								<div className="p-4 text-center">
									<div className="text-2xl font-bold text-purple-900">{stats.uniquePatients}</div>
									<div className="text-sm text-purple-800 font-medium">Unique Patients</div>
									<div className="text-xs text-purple-700">patients seen</div>
								</div>
							</CardContent>
						</Card>

						<Card className="atlas-card-primary">
							<CardContent>
								<div className="p-4 text-center">
									<div className="text-2xl font-bold text-gray-900">{stats.total}</div>
									<div className="text-sm text-gray-800 font-medium">Total</div>
									<div className="text-xs text-gray-700">all-time consultations</div>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Main Content */}
					<Card className="atlas-card-primary">
						<CardHeader>
							<div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
								<h2 className="text-lg font-semibold text-gray-900">All Consultations</h2>

								<div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
									<div className="w-full md:w-64">
										<Input
											type="text"
											placeholder="Search consultations..."
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
										/>
									</div>

									<div className="w-full md:w-40">
										<Select
											value={selectedFilter}
											onChange={(e) => setSelectedFilter(e.target.value)}
											options={filterOptions}
										/>
									</div>
								</div>
							</div>
						</CardHeader>

						<CardContent padding={false}>
							{filteredConsultations.length === 0 ? (
								<EmptyState
									icon={ConsultationIcon}
									title={searchQuery ? "No consultations found" : "No consultations recorded yet"}
									description={searchQuery
										? `No consultations found matching "${searchQuery}"`
										: "Start your first consultation to see it here."
									}
									action={
										<div className="space-y-2">
											<Button as={Link} href="/consultation/new" variant="primary">
												{searchQuery ? "Create New Consultation" : "Start First Consultation"}
											</Button>
											{searchQuery && (
												<Button onClick={() => setSearchQuery('')} variant="secondary" className="ml-2">
													Clear Search
												</Button>
											)}
										</div>
									}
								/>
							) : (
								<div className="overflow-x-auto">
									<table className="table">
										<thead className="bg-gray-50">
											<tr>
												<th className="table-header">Patient</th>
												<th className="table-header">Date & Time</th>
												<th className="table-header">Chief Complaint</th>
												<th className="table-header">Diagnosis</th>
												<th className="table-header text-right">Actions</th>
											</tr>
										</thead>
										<tbody className="bg-white divide-y divide-gray-200">
											{filteredConsultations.map((consultation) => (
												<tr key={consultation.id} className="table-row hover:bg-gray-50 transition-colors">
													<td className="table-cell whitespace-nowrap">
														<div className="font-medium text-gray-900">{consultation.patientName}</div>
														<div className="text-sm text-gray-500">
															{consultation.patientAge} yrs, {consultation.patientGender}
														</div>
													</td>
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
														<div className="text-sm text-gray-900">
															{consultation.finalDiagnosis || (
																<Badge variant="secondary">Not recorded</Badge>
															)}
														</div>
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
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}