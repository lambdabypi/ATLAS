// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { seedInitialData } from '../lib/db';
import { setupAutoSync } from '../lib/sync';
import StyleWrapper from '../components/StyleWrapper';

export default function Home() {
	const [isDbInitialized, setIsDbInitialized] = useState(false);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	// Initialize database and set up sync
	useEffect(() => {
		async function initializeApp() {
			try {
				// Seed initial medical data
				await seedInitialData();
				setIsDbInitialized(true);

				// Set up automatic sync
				setupAutoSync(15); // Try to sync every 15 minutes when online
			} catch (error) {
				console.error('Error initializing app:', error);
			}
		}

		initializeApp();

		// Set up online/offline detection
		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Register service worker for PWA functionality
		if ('serviceWorker' in navigator && typeof window !== 'undefined') {
			window.addEventListener('load', () => {
				navigator.serviceWorker.register('/service-worker.js').then(
					(registration) => {
						console.log('Service Worker registered with scope:', registration.scope);
					},
					(err) => {
						console.log('Service Worker registration failed:', err);
					}
				);
			});
		}

		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);
		};
	}, []);

	// Define styles
	const styles = {
		main: {
			minHeight: '100vh',
			padding: '1rem'
		},
		container: {
			maxWidth: '64rem',
			margin: '0 auto',
		},
		header: {
			textAlign: 'center',
			marginBottom: '3rem',
		},
		title: {
			fontSize: '1.875rem',
			fontWeight: 'bold',
			color: '#1e40af',
			marginBottom: '1rem',
		},
		subtitle: {
			color: '#4b5563',
			maxWidth: '36rem',
			margin: '0 auto',
		},
		offlineWarning: {
			marginTop: '1rem',
			padding: '0.5rem',
			backgroundColor: '#fef9c3',
			color: '#854d0e',
			borderRadius: '0.375rem',
			display: 'inline-block',
		},
		loadingContainer: {
			textAlign: 'center',
			padding: '2rem',
		},
		spinner: {
			animation: 'spin 1s linear infinite',
			height: '3rem',
			width: '3rem',
			borderRadius: '50%',
			borderWidth: '2px',
			borderStyle: 'solid',
			borderColor: 'transparent',
			borderBottomColor: '#1e40af',
			margin: '0 auto 1rem auto',
		},
		cardsGrid: {
			display: 'grid',
			gridTemplateColumns: '1fr',
			gap: '1.5rem',
		},
		card: {
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			padding: '1.5rem',
			transition: 'box-shadow 0.3s ease',
			cursor: 'pointer',
		},
		cardHover: {
			boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
		},
		cardTitle: {
			fontSize: '1.25rem',
			fontWeight: 'bold',
			color: '#1d4ed8',
			marginBottom: '0.75rem',
		},
		cardDescription: {
			color: '#4b5563',
			marginBottom: '1rem',
		},
		cardLink: {
			color: '#2563eb',
			fontWeight: '600',
		},
		offlineCapabilities: {
			marginTop: '2.5rem',
			backgroundColor: 'white',
			borderRadius: '0.5rem',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			padding: '1.5rem',
		},
		sectionTitle: {
			fontSize: '1.25rem',
			fontWeight: 'bold',
			color: '#1d4ed8',
			marginBottom: '1rem',
		},
		sectionDescription: {
			color: '#4b5563',
			marginBottom: '1rem',
		},
		featuresList: {
			marginTop: '0.5rem',
			marginBottom: '1.5rem',
		},
		featureItem: {
			display: 'flex',
			alignItems: 'flex-start',
			marginBottom: '0.5rem',
		},
		checkMarkGreen: {
			color: '#10b981',
			marginRight: '0.5rem',
		},
		checkMarkYellow: {
			color: '#f59e0b',
			marginRight: '0.5rem',
		},
		footnote: {
			fontSize: '0.875rem',
			color: '#6b7280',
		},
		// Media query styles will be applied using the applyMediaStyles helper
		mediaStyles: {
			cardsGridTablet: {
				gridTemplateColumns: 'repeat(2, 1fr)',
			}
		}
	};

	// Apply media queries for responsive design
	useEffect(() => {
		const applyMediaStyles = () => {
			const cardsGrid = document.getElementById('cards-grid');
			if (cardsGrid) {
				if (window.innerWidth >= 768) {
					cardsGrid.style.gridTemplateColumns = 'repeat(2, 1fr)';
				} else {
					cardsGrid.style.gridTemplateColumns = '1fr';
				}
			}
		};

		applyMediaStyles();
		window.addEventListener('resize', applyMediaStyles);
		return () => window.removeEventListener('resize', applyMediaStyles);
	}, []);

	// Create hover effect for cards
	const createCardHover = (e) => {
		e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
	};

	const removeCardHover = (e) => {
		e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)';
	};

	return (
		<StyleWrapper>
			<main style={styles.main}>
				<div style={styles.container}>
					<header style={styles.header}>
						<h1 style={styles.title}>
							Clinical Decision Support System
						</h1>
						<p style={styles.subtitle}>
							AI-powered clinical decision support designed for healthcare providers in resource-limited settings
						</p>

						{!isOnline && (
							<div style={styles.offlineWarning}>
								You are currently offline. Most features will still work.
							</div>
						)}
					</header>

					{!isDbInitialized ? (
						<div style={styles.loadingContainer}>
							<div style={styles.spinner}></div>
							<p>Initializing clinical database...</p>
						</div>
					) : (
						<div id="cards-grid" style={styles.cardsGrid}>
							<Link href="/dashboard" style={{ textDecoration: 'none' }}>
								<div
									style={styles.card}
									onMouseEnter={createCardHover}
									onMouseLeave={removeCardHover}
								>
									<h2 style={styles.cardTitle}>Dashboard</h2>
									<p style={styles.cardDescription}>
										View patient overview, recent consultations, and clinical metrics.
									</p>
									<div style={styles.cardLink}>
										Open Dashboard →
									</div>
								</div>
							</Link>

							<Link href="/patients" style={{ textDecoration: 'none' }}>
								<div
									style={styles.card}
									onMouseEnter={createCardHover}
									onMouseLeave={removeCardHover}
								>
									<h2 style={styles.cardTitle}>Patient Records</h2>
									<p style={styles.cardDescription}>
										Manage patients, view medical history, and start new consultations.
									</p>
									<div style={styles.cardLink}>
										View Patients →
									</div>
								</div>
							</Link>

							<Link href="/consultation/new" style={{ textDecoration: 'none' }}>
								<div
									style={styles.card}
									onMouseEnter={createCardHover}
									onMouseLeave={removeCardHover}
								>
									<h2 style={styles.cardTitle}>New Consultation</h2>
									<p style={styles.cardDescription}>
										Start a new patient consultation with AI-assisted clinical decision support.
									</p>
									<div style={styles.cardLink}>
										Start Consultation →
									</div>
								</div>
							</Link>

							<Link href="/reference" style={{ textDecoration: 'none' }}>
								<div
									style={styles.card}
									onMouseEnter={createCardHover}
									onMouseLeave={removeCardHover}
								>
									<h2 style={styles.cardTitle}>Clinical Reference</h2>
									<p style={styles.cardDescription}>
										Access clinical guidelines, medication information, and treatment protocols.
									</p>
									<div style={styles.cardLink}>
										Browse Reference →
									</div>
								</div>
							</Link>
						</div>
					)}

					<div style={styles.offlineCapabilities}>
						<h2 style={styles.sectionTitle}>Offline Capabilities</h2>
						<p style={styles.sectionDescription}>
							This application is designed to work offline. Key features available without internet connection:
						</p>

						<ul style={styles.featuresList}>
							<li style={styles.featureItem}>
								<span style={styles.checkMarkGreen}>✓</span>
								<span>Access to patient records and medical history</span>
							</li>
							<li style={styles.featureItem}>
								<span style={styles.checkMarkGreen}>✓</span>
								<span>Clinical reference materials and guidelines</span>
							</li>
							<li style={styles.featureItem}>
								<span style={styles.checkMarkGreen}>✓</span>
								<span>Create and update patient consultations</span>
							</li>
							<li style={styles.featureItem}>
								<span style={styles.checkMarkGreen}>✓</span>
								<span>Basic clinical decision support from locally stored guidelines</span>
							</li>
							<li style={styles.featureItem}>
								<span style={styles.checkMarkYellow}>⚠</span>
								<span>Advanced AI recommendations (queued for processing when online)</span>
							</li>
						</ul>

						<p style={styles.footnote}>
							Data entered while offline will automatically sync when internet connection is restored.
						</p>
					</div>
				</div>
			</main>
		</StyleWrapper>
	);
}