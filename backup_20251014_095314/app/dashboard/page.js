// src/app/dashboard/page.js
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { patientDb, consultationDb } from '../../lib/db';
import { setupAutoSync } from '../../lib/sync';
import { syncWithClinicalPriority } from '../../lib/sync/prioritizedSync';
import { colors, fontSize, fontWeight, createHoverProps } from '../../styles/styleUtils';
import StyleWrapper from '../../components/StyleWrapper';

export default function Dashboard() {
	const [stats, setStats] = useState({
		totalPatients: 0,
		consultationsToday: 0,
		recentConsultations: [],
		recentPatients: []
	});
	const [loading, setLoading] = useState(true);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
	const [syncStatus, setSyncStatus] = useState({ inProgress: false, lastSync: null, message: null });

	// Refs for elements that need media query adjustments
	const gridRef = useRef(null);
	const recentSectionWrapperRef = useRef(null);

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

	// Set up online/offline detection
	useEffect(() => {
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Apply media query styles on client-side
	useEffect(() => {
		const applyMediaStyles = () => {
			const isTabletOrLarger = window.innerWidth >= 768;

			if (gridRef.current) {
				gridRef.current.style.gridTemplateColumns = isTabletOrLarger ? 'repeat(3, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))';
			}

			if (recentSectionWrapperRef.current) {
				recentSectionWrapperRef.current.style.gridTemplateColumns = isTabletOrLarger ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))';
			}
		};

		applyMediaStyles();
		window.addEventListener('resize', applyMediaStyles);
		return () => window.removeEventListener('resize', applyMediaStyles);
	}, []);

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	// Handle manual sync button click
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
			message: 'Syncing data...'
		});

		try {
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

	// Inline styles
	const styles = {
		container: {
			maxWidth: '1280px',
			margin: '0 auto',
			padding: '1rem',
		},
		heading: {
			fontSize: '1.875rem',
			fontWeight: '700',
			color: '#1f2937',
			marginBottom: '1rem',
		},
		flexBetween: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '2rem',
		},
		onlineIndicator: {
			height: '0.75rem',
			width: '0.75rem',
			borderRadius: '9999px',
			backgroundColor: isOnline ? '#10b981' : '#ef4444',
		},
		onlineText: {
			fontSize: '0.875rem',
			color: '#4b5563',
		},
		syncButton: {
			marginLeft: '1rem',
			backgroundColor: '#dbeafe',
			color: '#2563eb',
			padding: '0.25rem 1rem',
			fontSize: '0.875rem',
			borderRadius: '0.375rem',
			display: 'flex',
			alignItems: 'center',
			cursor: 'pointer',
			border: 'none',
		},
		spinningIcon: {
			animation: 'spin 1s linear infinite',
			marginRight: '0.5rem',
			height: '1rem',
			width: '1rem',
			color: '#2563eb',
		},
		statusMessage: {
			marginBottom: '1rem',
			padding: '0.75rem',
			borderRadius: '0.375rem',
			backgroundColor: syncStatus.message?.includes('failed') ? '#fee2e2' : '#dbeafe',
			color: syncStatus.message?.includes('failed') ? '#b91c1c' : '#1e40af',
		},
		loader: {
			textAlign: 'center',
			padding: '3rem',
		},
		spinningLoader: {
			animation: 'spin 1s linear infinite',
			height: '3rem',
			width: '3rem',
			borderRadius: '9999px',
			borderWidth: '2px',
			borderColor: 'transparent',
			borderBottomColor: '#1e40af',
			margin: '0 auto 1rem auto',
		},
		loaderText: {
			color: '#6b7280',
		},
		grid: {
			display: 'grid',
			gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
			gap: '1.5rem',
			marginBottom: '2rem',
		},
		card: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			padding: '1.5rem',
		},
		cardHeader: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: '1rem',
		},
		cardTitle: {
			fontWeight: '600',
			color: '#4b5563',
		},
		iconContainer: {
			backgroundColor: '#dbeafe',
			padding: '0.5rem',
			borderRadius: '0.375rem',
		},
		iconGreen: {
			backgroundColor: '#d1fae5',
			padding: '0.5rem',
			borderRadius: '0.375rem',
		},
		iconPurple: {
			backgroundColor: '#f3e8ff',
			padding: '0.5rem',
			borderRadius: '0.375rem',
		},
		icon: {
			height: '1.5rem',
			width: '1.5rem',
			color: '#2563eb',
		},
		iconGreenColor: {
			height: '1.5rem',
			width: '1.5rem',
			color: '#059669',
		},
		iconPurpleColor: {
			height: '1.5rem',
			width: '1.5rem',
			color: '#7e22ce',
		},
		statNumber: {
			fontSize: '1.875rem',
			fontWeight: '700',
			color: '#1f2937',
		},
		link: {
			fontSize: '0.875rem',
			color: '#2563eb',
			textDecoration: 'none',
		},
		buttonContainer: {
			display: 'flex',
			flexDirection: 'column',
			gap: '0.5rem',
		},
		primaryButton: {
			display: 'block',
			backgroundColor: '#2563eb',
			color: 'white',
			padding: '0.5rem 1rem',
			borderRadius: '0.375rem',
			textAlign: 'center',
			textDecoration: 'none',
		},
		secondaryButton: {
			display: 'block',
			backgroundColor: '#f3f4f6',
			color: '#1f2937',
			padding: '0.5rem 1rem',
			borderRadius: '0.375rem',
			textAlign: 'center',
			textDecoration: 'none',
		},
		recentSectionWrapper: {
			display: 'grid',
			gridTemplateColumns: 'repeat(1, minmax(0, 1fr))',
			gap: '1.5rem',
		},
		recentSection: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			overflow: 'hidden',
		},
		sectionHeader: {
			padding: '1rem 1.5rem',
			backgroundColor: '#eff6ff',
			borderBottom: '1px solid #dbeafe',
		},
		sectionTitle: {
			fontWeight: '700',
			fontSize: '1.125rem',
			color: '#1f2937',
		},
		emptyState: {
			padding: '1.5rem',
			textAlign: 'center',
		},
		emptyStateText: {
			color: '#6b7280',
		},
		emptyStateLink: {
			display: 'inline-block',
			marginTop: '0.5rem',
			color: '#2563eb',
			textDecoration: 'none',
		},
		patientList: {
			listStyle: 'none',
			margin: 0,
			padding: 0,
		},
		patientItem: {
			borderBottom: '1px solid #e5e7eb',
			padding: '1rem 1.5rem',
			transition: 'background-color 0.2s',
		},
		patientItemHover: {
			backgroundColor: '#f9fafb',
		},
		patientItemContent: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
		},
		patientInfo: {},
		patientName: {
			fontWeight: '500',
			color: '#1f2937',
		},
		patientDetails: {
			fontSize: '0.875rem',
			color: '#6b7280',
			marginTop: '0.25rem',
		},
		patientAllergies: {
			fontSize: '0.75rem',
			color: '#ef4444',
			marginTop: '0.25rem',
		},
		visitInfo: {
			textAlign: 'right',
		},
		visitLabel: {
			fontSize: '0.875rem',
			color: '#6b7280',
		},
		visitDate: {
			fontSize: '0.75rem',
			fontWeight: '500',
			color: '#1f2937',
		},
		table: {
			width: '100%',
			borderCollapse: 'collapse',
		},
		tableHead: {
			backgroundColor: '#f9fafb',
		},
		tableHeader: {
			padding: '0.75rem 1.5rem',
			textAlign: 'left',
			fontSize: '0.75rem',
			fontWeight: '500',
			color: '#6b7280',
			textTransform: 'uppercase',
			letterSpacing: '0.05em',
		},
		tableRow: {},
		tableRowHover: {
			backgroundColor: '#f9fafb',
		},
		tableCell: {
			padding: '1rem 1.5rem',
			borderTop: '1px solid #e5e7eb',
		},
		viewAllFooter: {
			padding: '0.75rem 1.5rem',
			backgroundColor: '#f9fafb',
			textAlign: 'right',
			borderTop: '1px solid #e5e7eb',
		},
		viewAllLink: {
			fontSize: '0.875rem',
			color: '#2563eb',
			textDecoration: 'none',
		},
		spinKeyframes: `
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`,
	};

	return (
		<StyleWrapper additionalStyles={styles.spinKeyframes}>
			<div style={styles.container}>
				<div style={styles.flexBetween}>
					<h1 style={styles.heading}>Clinical Dashboard</h1>

					<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
						<div style={styles.onlineIndicator}></div>
						<span style={styles.onlineText}>
							{isOnline ? 'Online' : 'Offline'}
						</span>

						{isOnline && (
							<button
								style={styles.syncButton}
								onClick={handleSyncClick}
								disabled={syncStatus.inProgress}
							>
								{syncStatus.inProgress ? (
									<>
										<div style={styles.spinningIcon}>
											<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
										</div>
										Syncing...
									</>
								) : (
									'Sync Data'
								)}
							</button>
						)}
					</div>
				</div>

				{syncStatus.message && (
					<div style={styles.statusMessage}>
						{syncStatus.message}
					</div>
				)}

				{loading ? (
					<div style={styles.loader}>
						<div style={styles.spinningLoader}></div>
						<p style={styles.loaderText}>Loading dashboard data...</p>
					</div>
				) : (
					<>
						<div style={styles.grid} ref={gridRef}>
							<div style={styles.card}>
								<div style={styles.cardHeader}>
									<h2 style={styles.cardTitle}>Total Patients</h2>
									<div style={styles.iconContainer}>
										<svg xmlns="http://www.w3.org/2000/svg" style={styles.icon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
										</svg>
									</div>
								</div>
								<div style={styles.statNumber}>{stats.totalPatients}</div>
								<div style={{ marginTop: '0.5rem' }}>
									<a href="/patients" style={styles.link}>
										View all patients →
									</a>
								</div>
							</div>

							<div style={styles.card}>
								<div style={styles.cardHeader}>
									<h2 style={styles.cardTitle}>Consultations Today</h2>
									<div style={styles.iconGreen}>
										<svg xmlns="http://www.w3.org/2000/svg" style={styles.iconGreenColor} fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
										</svg>
									</div>
								</div>
								<div style={styles.statNumber}>{stats.consultationsToday}</div>
								<div style={{ marginTop: '0.5rem' }}>
									<a href="/consultation" style={styles.link}>
										View all consultations →
									</a>
								</div>
							</div>

							<div style={styles.card}>
								<div style={styles.cardHeader}>
									<h2 style={styles.cardTitle}>Quick Actions</h2>
									<div style={styles.iconPurple}>
										<svg xmlns="http://www.w3.org/2000/svg" style={styles.iconPurpleColor} fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
										</svg>
									</div>
								</div>
								<div style={styles.buttonContainer}>
									<a href="/consultation/new" style={styles.primaryButton}>
										New Consultation
									</a>
									<a href="/patients/add" style={styles.secondaryButton}>
										Add Patient
									</a>
									<a href="/reference" style={styles.secondaryButton}>
										Clinical Reference
									</a>
								</div>
							</div>
						</div>

						{/* Recent Consultations and Patients */}
						<div style={styles.recentSectionWrapper} ref={recentSectionWrapperRef}>
							{/* Recent Consultations */}
							<div style={styles.recentSection}>
								<div style={styles.sectionHeader}>
									<h2 style={styles.sectionTitle}>Recent Consultations</h2>
								</div>

								{stats.recentConsultations.length === 0 ? (
									<div style={styles.emptyState}>
										<p style={styles.emptyStateText}>No consultations recorded yet</p>
										<a href="/consultation/new" style={styles.emptyStateLink}>
											Start your first consultation
										</a>
									</div>
								) : (
									<>
										<div style={{ overflowX: 'auto' }}>
											<table style={styles.table}>
												<thead style={styles.tableHead}>
													<tr>
														<th style={{ ...styles.tableHeader, width: '40%' }}>Patient</th>
														<th style={{ ...styles.tableHeader, width: '30%' }}>Date & Time</th>
														<th style={{ ...styles.tableHeader, width: '30%' }}>Chief Complaint</th>
													</tr>
												</thead>
												<tbody>
													{stats.recentConsultations.map((consultation) => {
														const hoverProps = createHoverProps({
															backgroundColor: colors.gray[50]
														});

														return (
															<tr key={consultation.id} style={styles.tableRow} {...hoverProps}>
																<td style={styles.tableCell}>
																	<div style={{ fontWeight: '500', color: '#1f2937' }}>{consultation.patientName}</div>
																	<div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
																		{consultation.patientAge} yrs, {consultation.patientGender}
																	</div>
																</td>
																<td style={styles.tableCell}>
																	<div style={{ fontSize: '0.875rem', color: '#1f2937' }}>{formatDate(consultation.date)}</div>
																</td>
																<td style={styles.tableCell}>
																	<div style={{ fontSize: '0.875rem', color: '#1f2937' }}>{consultation.chiefComplaint || 'Not specified'}</div>
																	{consultation.symptoms && (
																		<div style={{ fontSize: '0.75rem', color: '#6b7280', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '200px' }}>
																			{consultation.symptoms}
																		</div>
																	)}
																</td>
															</tr>
														);
													})}
												</tbody>
											</table>
										</div>

										<div style={styles.viewAllFooter}>
											<a href="/consultation" style={styles.viewAllLink}>
												View all consultations →
											</a>
										</div>
									</>
								)}
							</div>

							{/* Recent Patients */}
							<div style={styles.recentSection}>
								<div style={styles.sectionHeader}>
									<h2 style={styles.sectionTitle}>Recent Patients</h2>
								</div>

								{stats.recentPatients.length === 0 ? (
									<div style={styles.emptyState}>
										<p style={styles.emptyStateText}>No patients in the database</p>
										<a href="/patients/add" style={styles.emptyStateLink}>
											Add your first patient
										</a>
									</div>
								) : (
									<>
										<ul style={styles.patientList}>
											{stats.recentPatients.map((patient) => {
												const hoverProps = createHoverProps({
													backgroundColor: colors.gray[50]
												});

												return (
													<li key={patient.id} style={styles.patientItem} {...hoverProps}>
														<a href={`/patients/${patient.id}`} style={{ textDecoration: 'none' }}>
															<div style={styles.patientItemContent}>
																<div style={styles.patientInfo}>
																	<div style={styles.patientName}>{patient.name}</div>
																	<div style={styles.patientDetails}>
																		{patient.age} yrs, {patient.gender}
																	</div>
																	{patient.allergies && (
																		<div style={styles.patientAllergies}>
																			Allergies: {patient.allergies}
																		</div>
																	)}
																</div>
																<div style={styles.visitInfo}>
																	<div style={styles.visitLabel}>Last visit</div>
																	<div style={styles.visitDate}>
																		{new Date(patient.lastVisit).toLocaleDateString()}
																	</div>
																</div>
															</div>
														</a>
													</li>
												);
											})}
										</ul>

										<div style={styles.viewAllFooter}>
											<a href="/patients" style={styles.viewAllLink}>
												View all patients →
											</a>
										</div>
									</>
								)}
							</div>
						</div>
					</>
				)}
			</div>
		</StyleWrapper>
	);
}