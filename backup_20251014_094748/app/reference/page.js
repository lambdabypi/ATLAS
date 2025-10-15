// src/app/reference/page.js
'use client';

import ClinicalGuidelines from '../../components/ClinicalGuidelines';
import StyleWrapper from '../../components/StyleWrapper';

export default function ReferencePage() {
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
				<h1 style={styles.heading}>Clinical Reference</h1>
				<ClinicalGuidelines />
			</div>
		</StyleWrapper>
	);
}