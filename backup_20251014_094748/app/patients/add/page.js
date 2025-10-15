// src/app/patients/add/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { patientDb } from '../../../lib/db';
import { queuePatientSync } from '../../../lib/sync/patientSync';
import StyleWrapper from '../../../components/StyleWrapper';

export default function AddPatientPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		age: '',
		gender: '',
		medicalHistory: '',
		allergies: '',
		currentMedications: ''
	});

	// Handle form input changes
	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value
		}));
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();

		// Basic validation
		if (!formData.name || !formData.age || !formData.gender) {
			alert('Please fill in all required fields');
			return;
		}

		setLoading(true);

		try {
			// Add patient to IndexedDB
			const patientId = await patientDb.add({
				...formData,
				lastVisit: new Date().toISOString()
			});

			// Queue for sync when online
			await queuePatientSync(patientId, 'add', {
				...formData,
				lastVisit: new Date().toISOString()
			});

			// Redirect to the patient page or start a consultation
			router.push(`/patient/${patientId}`);
		} catch (error) {
			console.error('Error adding patient:', error);
			alert('Error adding patient. Please try again.');
			setLoading(false);
		}
	};

	// Styles
	const styles = {
		container: {
			maxWidth: '64rem',
			margin: '0 auto',
			padding: '1rem',
		},
		heading: {
			fontSize: '1.5rem',
			fontWeight: 'bold',
			color: '#1f2937',
			marginBottom: '1.5rem',
		},
		formCard: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			padding: '1.5rem',
		},
		formGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr',
			gap: '1.5rem',
			marginBottom: '1.5rem',
		},
		formGroup: {
			marginBottom: '1.5rem',
		},
		label: {
			display: 'block',
			color: '#374151',
			fontWeight: '600',
			marginBottom: '0.5rem',
		},
		input: {
			width: '100%',
			padding: '0.75rem',
			border: '1px solid #d1d5db',
			borderRadius: '0.375rem',
			outline: 'none',
		},
		inputFocus: {
			borderColor: '#3b82f6',
			boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)',
		},
		textarea: {
			width: '100%',
			padding: '0.75rem',
			border: '1px solid #d1d5db',
			borderRadius: '0.375rem',
			outline: 'none',
			resize: 'vertical',
		},
		select: {
			width: '100%',
			padding: '0.75rem',
			border: '1px solid #d1d5db',
			borderRadius: '0.375rem',
			appearance: 'none',
			backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
			backgroundPosition: 'right 0.5rem center',
			backgroundRepeat: 'no-repeat',
			backgroundSize: '1.5em 1.5em',
			outline: 'none',
		},
		buttonContainer: {
			display: 'flex',
			justifyContent: 'flex-end',
			gap: '0.75rem',
		},
		cancelButton: {
			padding: '0.5rem 1rem',
			borderRadius: '0.375rem',
			border: '1px solid #d1d5db',
			backgroundColor: 'white',
			color: '#374151',
			cursor: 'pointer',
		},
		saveButton: {
			padding: '0.5rem 1rem',
			borderRadius: '0.375rem',
			border: '1px solid transparent',
			backgroundColor: '#2563eb',
			color: 'white',
			cursor: 'pointer',
			boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
		},
		spinnerIcon: {
			animation: 'spin 1s linear infinite',
			marginRight: '0.5rem',
			height: '1rem',
			width: '1rem',
		},
		loadingContainer: {
			display: 'flex',
			alignItems: 'center',
		},
		// Media query styles
		formGridMedium: {
			gridTemplateColumns: 'repeat(2, 1fr)',
		},
	};

	// Apply media queries for responsive design
	const applyInputFocus = (e) => {
		e.target.style.borderColor = '#3b82f6';
		e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.3)';
	};

	const removeInputFocus = (e) => {
		e.target.style.borderColor = '#d1d5db';
		e.target.style.boxShadow = 'none';
	};

	return (
		<StyleWrapper>
			<div style={styles.container}>
				<h1 style={styles.heading}>Add New Patient</h1>

				<div style={styles.formCard}>
					<form onSubmit={handleSubmit}>
						<div
							id="form-grid"
							style={styles.formGrid}
						>
							<div>
								<label style={styles.label} htmlFor="name">
									Full Name *
								</label>
								<input
									type="text"
									id="name"
									name="name"
									style={styles.input}
									value={formData.name}
									onChange={handleInputChange}
									onFocus={applyInputFocus}
									onBlur={removeInputFocus}
									required
								/>
							</div>

							<div>
								<label style={styles.label} htmlFor="age">
									Age *
								</label>
								<input
									type="number"
									id="age"
									name="age"
									min="0"
									max="120"
									style={styles.input}
									value={formData.age}
									onChange={handleInputChange}
									onFocus={applyInputFocus}
									onBlur={removeInputFocus}
									required
								/>
							</div>

							<div>
								<label style={styles.label} htmlFor="gender">
									Gender *
								</label>
								<select
									id="gender"
									name="gender"
									style={styles.select}
									value={formData.gender}
									onChange={handleInputChange}
									onFocus={applyInputFocus}
									onBlur={removeInputFocus}
									required
								>
									<option value="">Select Gender</option>
									<option value="Male">Male</option>
									<option value="Female">Female</option>
									<option value="Other">Other</option>
								</select>
							</div>

							<div>
								<label style={styles.label} htmlFor="allergies">
									Allergies
								</label>
								<input
									type="text"
									id="allergies"
									name="allergies"
									style={styles.input}
									value={formData.allergies}
									onChange={handleInputChange}
									onFocus={applyInputFocus}
									onBlur={removeInputFocus}
									placeholder="List allergies, separated by commas"
								/>
							</div>
						</div>

						<div style={styles.formGroup}>
							<label style={styles.label} htmlFor="currentMedications">
								Current Medications
							</label>
							<input
								type="text"
								id="currentMedications"
								name="currentMedications"
								style={styles.input}
								value={formData.currentMedications}
								onChange={handleInputChange}
								onFocus={applyInputFocus}
								onBlur={removeInputFocus}
								placeholder="List current medications, separated by commas"
							/>
						</div>

						<div style={styles.formGroup}>
							<label style={styles.label} htmlFor="medicalHistory">
								Medical History
							</label>
							<textarea
								id="medicalHistory"
								name="medicalHistory"
								rows="4"
								style={styles.textarea}
								value={formData.medicalHistory}
								onChange={handleInputChange}
								onFocus={applyInputFocus}
								onBlur={removeInputFocus}
								placeholder="Relevant medical history, previous conditions, surgeries, etc."
							></textarea>
						</div>

						<div style={styles.buttonContainer}>
							<Link href="/patients">
								<button
									type="button"
									style={styles.cancelButton}
								>
									Cancel
								</button>
							</Link>

							<button
								type="submit"
								style={styles.saveButton}
								disabled={loading}
							>
								{loading ? (
									<span style={styles.loadingContainer}>
										<svg style={styles.spinnerIcon} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Saving...
									</span>
								) : (
									'Save Patient'
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</StyleWrapper>
	);
}