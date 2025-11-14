// src/app/dashboard/page.js - UPDATED WITH CENTRALIZED ONLINE STATUS
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { patientDb, consultationDb } from '../../lib/db';
import { setupAutoSync } from '../../lib/sync';
import { syncWithClinicalPriority } from '../../lib/sync/prioritized-sync';
import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus'; // 🎯 CENTRALIZED HOOK
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

export default function Dashboard() {
	const [stats, setStats] = useState({
		totalPatients: 0,
		consultationsToday: 0,
		recentConsultations: [],
		recentPatients: []
	});
	const [loading, setLoading] = useState(true);
	const [syncStatus, setSyncStatus] = useState({ inProgress: false, lastSync: null, message: null });

	// 🎯 USE CENTRALIZED ONLINE STATUS
	const { isOnline, getStatusInfo, checkConnectivity } = useOnlineStatus();
	const statusInfo = getStatusInfo();

	// Load dashboard data from IndexedDB
	useEffect(() => {
		async function loadDashboardData() {
			try {
				// Get patient count
				const allPatients = await patientDb.getAll();
				const totalPatients = allPatients.length;

				// Get recent patients (up to 5)
				const recentPatients = allPatients
					.sort((a, b) => new Date(b.lastVisit) - new Date(a.lastVisit))
					.slice(0, 5);

				// Get all consultations
				const allConsultations = [];
				for (const patient of allPatients) {
					try {
						const patientConsultations = await consultationDb.getByPatientId(patient.id);
						allConsultations.push(...patientConsultations.map(cons => ({
							...cons,
							patientName: patient.name,
							patientGender: patient.gender,
							patientAge: patient.age
						})));
					} catch (error) {
						console.error(`Error loading consultations for patient ${patient.id}:`, error);
					}
				}

				// Calculate consultations today
				const today = new Date();
				today.setHours(0, 0, 0, 0);

				const consultationsToday = allConsultations.filter(cons => {
					const consDate = new Date(cons.date);
					return consDate >= today;
				}).length;

				// Get recent consultations (up to 10)
				const recentConsultations = allConsultations
					.sort((a, b) => new Date(b.date) - new Date(a.date))
					.slice(0, 10);

				setStats({
					totalPatients,
					consultationsToday,
					recentConsultations,
					recentPatients
				});

				setLoading(false);
			} catch (error) {
				console.error('Error loading dashboard data:', error);
				setLoading(false);
			}
		}

		loadDashboardData();

		// Set up auto sync
		setupAutoSync(15); // Try to sync every 15 minutes when online
	}, []);

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	// Handle manual sync button click with enhanced connectivity check
	const handleSyncClick = async () => {
		if (!isOnline) {
			setSyncStatus({
				inProgress: false,
				lastSync: new Date(),
				message: 'Cannot sync while offline'
			});
			return;
		}

		setSyncStatus({
			inProgress: true,
			lastSync: syncStatus.lastSync,
			message: 'Verifying connection and syncing data...'
		});

		try {
			// First, verify we actually have connectivity
			const hasConnectivity = await checkConnectivity();

			if (!hasConnectivity) {
				setSyncStatus({
					inProgress: false,
					lastSync: syncStatus.lastSync,
					message: 'Connection test failed - unable to sync'
				});
				return;
			}

			const result = await syncWithClinicalPriority();

			setSyncStatus({
				inProgress: false,
				lastSync: new Date(),
				message: result.message
			});

			// Clear message after 5 seconds
			setTimeout(() => {
				setSyncStatus(prev => ({
					...prev,
					message: null
				}));
			}, 5000);
		} catch (error) {
			console.error('Error syncing data:', error);

			setSyncStatus({
				inProgress: false,
				lastSync: syncStatus.lastSync,
				message: `Sync failed: ${error.message}`
			});
		}
	};

	const StatsIcon = ({ children }) => (
		<div className="atlas-icon-primary w-12 h-12">
			{children}
		</div>
	);

	if (loading) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex flex-col items-center justify-center min-h-96">
							<LoadingSpinner size="lg" />
							<p className="mt-4 text-gray-500">Loading dashboard data...</p>
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
					{/* Header with Enhanced Status Display */}
					<div className="flex justify-between items-center mb-8">
						<div className="atlas-header-center">
							<h1 className="atlas-title text-3xl">Clinical Dashboard</h1>
						</div>

						<div className="atlas-status-bar">
							{/* 🎯 ENHANCED STATUS DISPLAY */}
							<div className={`atlas-status flex items-center px-3 py-1 rounded-full ${statusInfo.statusColor === 'green' ? 'bg-green-50 border-green-200' :
									statusInfo.statusColor === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
										'bg-red-50 border-red-200'
								}`}>
								<span className="mr-2">{statusInfo.statusIcon}</span>
								<span className={`text-sm ${statusInfo.statusColor === 'green' ? 'text-green-800' :
										statusInfo.statusColor === 'yellow' ? 'text-yellow-800' :
											'text-red-800'
									}`}>
									{statusInfo.statusText}
								</span>
								{statusInfo.isSlowConnection && (
									<Badge variant="warning" size="sm" className="ml-2">
										Slow
									</Badge>
								)}
							</div>

							{isOnline && (
								<Button
									variant="outline"
									size="sm"
									onClick={handleSyncClick}
									loading={syncStatus.inProgress}
								>
									Sync Data
								</Button>
							)}
						</div>
					</div>

					{/* Enhanced Sync Status Message */}
					{syncStatus.message && (
						<div className={`mb-6 p-4 rounded-lg ${syncStatus.message.includes('failed') || syncStatus.message.includes('unable')
							? 'bg-red-50 border border-red-200 text-red-800'
							: syncStatus.message.includes('offline')
								? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
								: 'bg-blue-50 border border-blue-200 text-blue-800'
							}`}>
							<div className="flex items-center">
								<span className="mr-2">
									{syncStatus.message.includes('failed') || syncStatus.message.includes('unable') ? '❌' :
										syncStatus.message.includes('offline') ? '⚠️' : 'ℹ️'}
								</span>
								{syncStatus.message}
							</div>
						</div>
					)}

					{/* Offline Warning Banner */}
					{!isOnline && (
						<div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
							<div className="flex items-start">
								<span className="mr-3 text-amber-600">⚠️</span>
								<div>
									<h4 className="font-medium text-amber-900">Working Offline</h4>
									<p className="text-sm text-amber-800 mt-1">
										You're currently offline. Data will be saved locally and synced when connection is restored.
									</p>
									{statusInfo.lastConnectivityCheck && (
										<p className="text-xs text-amber-700 mt-2">
											Last connectivity check: {new Date(statusInfo.lastConnectivityCheck).toLocaleTimeString()}
										</p>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Connection Quality Warning */}
					{isOnline && statusInfo.isSlowConnection && (
						<div className="mb-6 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
							<div className="flex items-start">
								<span className="mr-3 text-yellow-600">🐌</span>
								<div>
									<h4 className="font-medium text-yellow-900">Slow Connection Detected</h4>
									<p className="text-sm text-yellow-800 mt-1">
										Your connection is slower than usual. Some features may take longer to load.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Stats Grid - Rest of component remains the same */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
						<Card className="atlas-card-primary">
							<CardContent>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Total Patients</p>
										<p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
									</div>
									<StatsIcon>
										<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</StatsIcon>
								</div>
								<div className="mt-4">
									<Link href="/patients" className="text-sm text-blue-600 hover:text-blue-800">
										View all patients →
									</Link>
								</div>
							</CardContent>
						</Card>

						<Card className="atlas-card-primary">
							<CardContent>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Consultations Today</p>
										<p className="text-2xl font-bold text-gray-900">{stats.consultationsToday}</p>
									</div>
									<div className="atlas-icon-primary w-12 h-12 bg-green-100">
										<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									</div>
								</div>
								<div className="mt-4">
									<Link href="/consultation" className="text-sm text-blue-600 hover:text-blue-800">
										View all consultations →
									</Link>
								</div>
							</CardContent>
						</Card>

						<Card className="atlas-card-primary">
							<CardContent>
								<div className="flex items-center justify-between">
									<div>
										<p className="text-sm font-medium text-gray-600">Quick Actions</p>
									</div>
									<div className="atlas-icon-primary w-12 h-12 bg-purple-100">
										<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
									</div>
								</div>
								<div className="mt-4 space-y-2">
									<Button as={Link} href="/consultation/new" variant="primary" className="w-full">
										New Consultation
									</Button>
									<Button as={Link} href="/patients/add" variant="secondary" className="w-full">
										Add Patient
									</Button>
									<Button as={Link} href="/reference" variant="secondary" className="w-full">
										Clinical Reference
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Recent Activity Grid - Same as before */}
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Recent Consultations */}
						<Card className="atlas-card-primary">
							<CardHeader>
								<h2 className="text-lg font-semibold text-gray-900">Recent Consultations</h2>
							</CardHeader>
							<CardContent padding={false}>
								{stats.recentConsultations.length === 0 ? (
									<EmptyState
										title="No consultations yet"
										description="Start your first consultation to see it here."
										action={
											<Button as={Link} href="/consultation/new" variant="primary">
												Start First Consultation
											</Button>
										}
									/>
								) : (
									<div className="overflow-hidden">
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
												</tr>
											</thead>
											<tbody className="bg-white divide-y divide-gray-200">
												{stats.recentConsultations.slice(0, 5).map((consultation) => (
													<tr key={consultation.id} className="hover:bg-gray-50 transition-colors">
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
													</tr>
												))}
											</tbody>
										</table>
										<div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
											<Link href="/consultation" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
												View all consultations →
											</Link>
										</div>
									</div>
								)}
							</CardContent>
						</Card>

						{/* Recent Patients */}
						<Card className="atlas-card-primary">
							<CardHeader>
								<h2 className="text-lg font-semibold text-gray-900">Recent Patients</h2>
							</CardHeader>
							<CardContent padding={false}>
								{stats.recentPatients.length === 0 ? (
									<EmptyState
										title="No patients in database"
										description="Add your first patient to get started."
										action={
											<Button as={Link} href="/patients/add" variant="primary">
												Add First Patient
											</Button>
										}
									/>
								) : (
									<div>
										<ul className="divide-y divide-gray-200">
											{stats.recentPatients.map((patient) => (
												<li key={patient.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
													<Link href={`/patients/${patient.id}`} className="block">
														<div className="flex items-center justify-between">
															<div className="flex-1 min-w-0">
																<p className="text-sm font-medium text-gray-900 truncate">
																	{patient.name}
																</p>
																<p className="text-sm text-gray-500">
																	{patient.age} yrs, {patient.gender}
																</p>
																{patient.allergies && (
																	<Badge variant="danger" className="mt-1">
																		Allergies: {patient.allergies}
																	</Badge>
																)}
															</div>
															<div className="flex-shrink-0 text-right">
																<p className="text-xs text-gray-500">Last visit</p>
																<p className="text-sm font-medium text-gray-900">
																	{new Date(patient.lastVisit).toLocaleDateString()}
																</p>
															</div>
														</div>
													</Link>
												</li>
											))}
										</ul>
										<div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-right">
											<Link href="/patients" className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
												View all patients →
											</Link>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}