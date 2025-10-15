// src/components/PatientRecord.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getConsultationsByPatientId } from '../lib/db/consultations';
import { colors, fontSize, fontWeight, spacing, mergeStyles, createHoverProps } from '../styles/styleUtils';

export default function PatientRecord({ patient }) {
	const [consultations, setConsultations] = useState([]);
	const [loading, setLoading] = useState(true);

	// Load consultations for this patient
	useEffect(() => {
		async function loadConsultations() {
			if (!patient || !patient.id) return;

			try {
				const patientConsultations = await getConsultationsByPatientId(patient.id);

				// Sort by date (newest first)
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

	// Format date for display
	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	// Styles
	const styles = {
		container: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			overflow: 'hidden',
		},
		infoSection: {
			padding: '1.5rem',
			borderBottom: `1px solid ${colors.gray[200]}`,
		},
		sectionTitle: {
			fontSize: fontSize.xl,
			fontWeight: fontWeight.semibold,
			color: colors.gray[800],
			marginBottom: '1rem',
		},
		grid: {
			display: 'grid',
			gridTemplateColumns: '1fr',
			gap: '1.5rem',
			'@media (min-width: 768px)': {
				gridTemplateColumns: 'repeat(2, 1fr)',
			},
		},
		infoLabel: {
			fontSize: fontSize.sm,
			color: colors.gray[500],
		},
		infoValue: {
			fontWeight: fontWeight.medium,
		},
		allergiesValue: {
			color: colors.red[600],
			fontWeight: fontWeight.medium,
		},
		medicalHistoryContainer: {
			'@media (min-width: 768px)': {
				gridColumn: 'span 2',
			},
		},
		preWrap: {
			whiteSpace: 'pre-line',
		},
		buttonsContainer: {
			marginTop: '1.5rem',
			display: 'flex',
			justifyContent: 'flex-end',
		},
		viewLink: {
			color: colors.blue[600],
			marginRight: '1rem',
			textDecoration: 'none',
		},
		consultationButton: {
			padding: '0.5rem 1rem',
			backgroundColor: colors.blue[600],
			color: 'white',
			borderRadius: '0.375rem',
			fontWeight: fontWeight.medium,
			textDecoration: 'none',
		},
		consultationSection: {
			backgroundColor: colors.blue[50],
			padding: '1rem 1.5rem',
			borderBottom: `1px solid ${colors.blue[100]}`,
		},
		sectionHeader: {
			fontWeight: fontWeight.semibold,
			color: colors.gray[800],
		},
		loadingContainer: {
			padding: '1.5rem',
			textAlign: 'center',
		},
		spinnerStyle: {
			animation: 'spin 1s linear infinite',
			height: '2rem',
			width: '2rem',
			borderRadius: '9999px',
			borderWidth: '2px',
			borderColor: 'transparent',
			borderBottomColor: colors.blue[800],
			margin: '0 auto 0.5rem auto',
		},
		loadingText: {
			color: colors.gray[500],
		},
		emptyContainer: {
			padding: '1.5rem',
			textAlign: 'center',
		},
		emptyText: {
			color: colors.gray[500],
		},
		emptyLink: {
			marginTop: '0.5rem',
			display: 'inline-block',
			color: colors.blue[600],
			textDecoration: 'none',
		},
		consultationList: {
			maxHeight: '300px',
			overflowY: 'auto',
		},
		consultationItem: {
			borderBottom: `1px solid ${colors.gray[200]}`,
		},
		consultationLink: {
			display: 'block',
			padding: '1rem 1.5rem',
			textDecoration: 'none',
		},
		consultationHeader: {
			display: 'flex',
			justifyContent: 'space-between',
		},
		consultationTitle: {
			fontWeight: fontWeight.medium,
			color: colors.gray[900],
		},
		consultationDate: {
			fontSize: fontSize.sm,
			color: colors.gray[500],
			textAlign: 'right',
		},
		diagnosisText: {
			fontSize: fontSize.sm,
			color: colors.gray[600],
			marginTop: '0.25rem',
		},
		symptomsText: {
			fontSize: fontSize.xs,
			color: colors.gray[500],
			marginTop: '0.25rem',
			textOverflow: 'ellipsis',
			overflow: 'hidden',
			whiteSpace: 'nowrap',
			maxWidth: '20rem',
		},
		viewAllContainer: {
			padding: '0.75rem 1.5rem',
			backgroundColor: colors.gray[50],
			textAlign: 'right',
		},
		viewAllLink: {
			fontSize: fontSize.sm,
			color: colors.blue[600],
			textDecoration: 'none',
		},
		noPatientContainer: {
			padding: '1rem',
			backgroundColor: colors.yellow[50],
			borderRadius: '0.375rem',
		},
		noPatientText: {
			color: colors.yellow[700],
		},
		spinKeyframes: `
			@keyframes spin {
				0% { transform: rotate(0deg); }
				100% { transform: rotate(360deg); }
			}
		`,
	};

	// Apply media query styles on client-side
	useEffect(() => {
		const applyMediaStyles = () => {
			const isTabletOrLarger = window.innerWidth >= 768;
			const gridElement = document.getElementById('patient-info-grid');
			const medicalHistoryElement = document.getElementById('medical-history-container');

			if (gridElement) {
				gridElement.style.gridTemplateColumns = isTabletOrLarger ? 'repeat(2, 1fr)' : '1fr';
			}

			if (medicalHistoryElement) {
				medicalHistoryElement.style.gridColumn = isTabletOrLarger ? 'span 2' : 'auto';
			}
		};

		applyMediaStyles();
		window.addEventListener('resize', applyMediaStyles);
		return () => window.removeEventListener('resize', applyMediaStyles);
	}, []);

	if (!patient) {
		return (
			<div style={styles.noPatientContainer}>
				<p style={styles.noPatientText}>No patient selected</p>
			</div>
		);
	}

	return (
		<>
			<style>{styles.spinKeyframes}</style>
			<div style={styles.container}>
				<div style={styles.infoSection}>
					<h2 style={styles.sectionTitle}>Patient Information</h2>

					<div id="patient-info-grid" style={styles.grid}>
						<div>
							<p style={styles.infoLabel}>Name</p>
							<p style={styles.infoValue}>{patient.name}</p>
						</div>

						<div>
							<p style={styles.infoLabel}>Age / Gender</p>
							<p style={styles.infoValue}>{patient.age} years, {patient.gender}</p>
						</div>

						<div>
							<p style={styles.infoLabel}>Last Visit</p>
							<p style={styles.infoValue}>{formatDate(patient.lastVisit)}</p>
						</div>

						{patient.allergies && (
							<div>
								<p style={styles.infoLabel}>Allergies</p>
								<p style={styles.allergiesValue}>{patient.allergies}</p>
							</div>
						)}

						{patient.currentMedications && (
							<div>
								<p style={styles.infoLabel}>Current Medications</p>
								<p style={styles.infoValue}>{patient.currentMedications}</p>
							</div>
						)}

						{patient.medicalHistory && (
							<div id="medical-history-container" style={styles.medicalHistoryContainer}>
								<p style={styles.infoLabel}>Medical History</p>
								<p style={mergeStyles(styles.infoValue, styles.preWrap)}>{patient.medicalHistory}</p>
							</div>
						)}
					</div>

					<div style={styles.buttonsContainer}>
						<Link
							href={`/patients/${patient.id}`}
							style={styles.viewLink}
						>
							View Full Record
						</Link>

						<Link
							href={`/consultation/new?patientId=${patient.id}`}
							style={styles.consultationButton}
						>
							New Consultation
						</Link>
					</div>
				</div>

				<div>
					<div style={styles.consultationSection}>
						<h3 style={styles.sectionHeader}>Recent Consultations</h3>
					</div>

					{loading ? (
						<div style={styles.loadingContainer}>
							<div style={styles.spinnerStyle}></div>
							<p style={styles.loadingText}>Loading consultations...</p>
						</div>
					) : consultations.length === 0 ? (
						<div style={styles.emptyContainer}>
							<p style={styles.emptyText}>No consultations recorded for this patient</p>
							<Link
								href={`/consultation/new?patientId=${patient.id}`}
								style={styles.emptyLink}
							>
								Start first consultation
							</Link>
						</div>
					) : (
						<div style={styles.consultationList}>
							{consultations.slice(0, 5).map(consultation => {
								const hoverProps = createHoverProps({
									backgroundColor: colors.gray[50]
								});

								return (
									<div key={consultation.id} style={styles.consultationItem} {...hoverProps}>
										<Link
											href={`/consultation/${consultation.id}`}
											style={styles.consultationLink}
										>
											<div style={styles.consultationHeader}>
												<div>
													<p style={styles.consultationTitle}>{consultation.chiefComplaint || 'Consultation'}</p>
													{consultation.finalDiagnosis && (
														<p style={styles.diagnosisText}>
															Diagnosis: {consultation.finalDiagnosis}
														</p>
													)}
													{consultation.symptoms && (
														<p style={styles.symptomsText}>
															Symptoms: {consultation.symptoms}
														</p>
													)}
												</div>
												<div>
													<p style={styles.consultationDate}>{formatDate(consultation.date)}</p>
												</div>
											</div>
										</Link>
									</div>
								);
							})}
						</div>
					)}

					{consultations.length > 5 && (
						<div style={styles.viewAllContainer}>
							<Link
								href={`/patients/${patient.id}`}
								style={styles.viewAllLink}
							>
								View all consultations →
							</Link>
						</div>
					)}
				</div>
			</div>
		</>
	);
}