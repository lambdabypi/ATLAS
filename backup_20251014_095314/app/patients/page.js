// src/app/patients/page.js
'use client';

import PatientList from '../../components/PatientList';
import StyleWrapper from '../../components/StyleWrapper';

export default function PatientsPage() {
	// Define styles
	const styles = {
		container: {
			maxWidth: '1280px',
			margin: '0 auto',
			padding: '1rem',
		},
		heading: {
			fontSize: '1.5rem',
			fontWeight: 'bold',
			color: '#1f2937',
			marginBottom: '1.5rem',
		}
	};

	return (
		<StyleWrapper>
			<div style={styles.container}>
				<h1 style={styles.heading}>Patient Records</h1>
				<PatientList />
			</div>
		</StyleWrapper>
	);
}