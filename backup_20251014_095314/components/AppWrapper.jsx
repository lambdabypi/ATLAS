// src/components/AppWrapper.jsx
'use client';

import { useEffect, useState } from 'react';
import Navigation from './Navigation';
import { setupAutoSync } from '../lib/sync';
import { seedInitialData } from '../lib/db';
import StyleWrapper from './StyleWrapper';

export default function AppWrapper({ children }) {
	const [isDbInitialized, setIsDbInitialized] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [syncStatus, setSyncStatus] = useState({
		inProgress: false,
		lastSync: null,
		message: null
	});

	// Initialize database and set up sync
	useEffect(() => {
		async function initializeApp() {
			try {
				// Check online status
				setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

				// Enable debug logging in development (move this outside the try-catch)
				if (process.env.NODE_ENV === 'development') {
					try {
						const { enableFetchLogging } = await import('../lib/debug/fetchLogger');
						enableFetchLogging();
						console.log('🔧 Debug logging enabled');
					} catch (err) {
						console.log('Debug logging not available:', err.message);
					}
				}

				// Seed initial medical data
				await seedInitialData();
				setIsDbInitialized(true);

				// Set up automatic sync
				setupAutoSync(15); // Try to sync every 15 minutes when online
			} catch (error) {
				console.error('Error initializing app:', error);
				setIsDbInitialized(true); // Allow app to continue even if initialization fails
			}
		}

		initializeApp();

		// Set up online/offline detection
		const handleOnline = () => {
			setIsOnline(true);
			setSyncStatus(prev => ({
				...prev,
				message: 'Back online. Syncing data...'
			}));

			// Clear message after 3 seconds
			setTimeout(() => {
				setSyncStatus(prev => ({ ...prev, message: null }));
			}, 3000);
		};

		const handleOffline = () => {
			setIsOnline(false);
			setSyncStatus(prev => ({
				...prev,
				message: 'You are offline. Changes will be saved locally.'
			}));
		};

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

	// Styles
	const styles = {
		syncMessage: {
			position: 'fixed',
			top: 0,
			left: 0,
			right: 0,
			padding: '0.5rem',
			textAlign: 'center',
			fontSize: '0.875rem',
			fontWeight: 500
		},
		onlineMessage: {
			backgroundColor: '#dbeafe',
			color: '#1e40af'
		},
		offlineMessage: {
			backgroundColor: '#fef9c3',
			color: '#854d0e'
		},
		mainContent: {
			paddingTop: '4rem',
			paddingBottom: '1rem'
		},
		loadingContainer: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			minHeight: '50vh'
		},
		loadingContent: {
			textAlign: 'center'
		},
		spinner: {
			display: 'block',
			width: '3rem',
			height: '3rem',
			margin: '0 auto 1rem auto',
			borderRadius: '50%',
			border: '2px solid transparent',
			borderBottomColor: '#1e40af',
			animation: 'spin 1s linear infinite'
		},
		offlineIndicator: {
			position: 'fixed',
			bottom: 0,
			left: 0,
			right: 0,
			backgroundColor: '#fef9c3',
			color: '#854d0e',
			padding: '0.5rem',
			textAlign: 'center',
			fontSize: '0.875rem',
			fontWeight: 500
		}
	};

	return (
		<StyleWrapper>
			<Navigation isOnline={isOnline} />

			{syncStatus.message && (
				<div style={{
					...styles.syncMessage,
					...(isOnline ? styles.onlineMessage : styles.offlineMessage)
				}}>
					{syncStatus.message}
				</div>
			)}

			<main style={styles.mainContent}>
				{!isDbInitialized ? (
					<div style={styles.loadingContainer}>
						<div style={styles.loadingContent}>
							<div style={styles.spinner}></div>
							<p>Initializing clinical database...</p>
						</div>
					</div>
				) : (
					children
				)}
			</main>

			{!isOnline && (
				<div style={styles.offlineIndicator}>
					Working offline
				</div>
			)}
		</StyleWrapper>
	);
}