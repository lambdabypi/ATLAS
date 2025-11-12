// src/app/page.js - FULLY SSR COMPATIBLE VERSION
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { initializeEnhancedAtlas } from '../lib/initializeEnhancedAtlas';
import { useUserSystem } from '../lib/auth/simpleUserSystem';
import { UserSelection } from '../components/auth/UserSelection';

// Import performance monitor lazily to avoid SSR issues
let performanceMonitor = null;

// Card data moved outside component for better performance
const cardData = [
	{
		title: 'Dashboard',
		description: 'Patient overview and metrics',
		href: '/dashboard',
		icon: '📊',
		priority: 'high',
		shortcut: 'D'
	},
	{
		title: 'New Consultation',
		description: 'Start AI-assisted consultation',
		href: '/consultation',
		icon: '⚡',
		priority: 'high',
		shortcut: 'N'
	},
	{
		title: 'Patients',
		description: 'Manage patient records',
		href: '/patients',
		icon: '👤',
		priority: 'medium',
		shortcut: 'P'
	},
	{
		title: 'Guidelines',
		description: 'WHO SMART protocols',
		href: '/guidelines',
		icon: '📚',
		priority: 'medium',
		shortcut: 'G'
	},
	{
		title: 'Testing',
		description: 'System performance',
		href: '/testing',
		icon: '🔬',
		priority: 'low',
		shortcut: 'T'
	}
];

export default function Home() {
	// ✅ ALWAYS call all hooks at the top level - no conditional hooks
	const [isDbInitialized, setIsDbInitialized] = useState(false);
	const [isOnline, setIsOnline] = useState(true); // Default to true for SSR
	const [initializationError, setInitializationError] = useState(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [isClientSide, setIsClientSide] = useState(false); // Track if we're on client

	// Use ref to prevent double initialization in React StrictMode
	const hasInitialized = useRef(false);

	// ✅ ALWAYS call user system hook
	const { currentUser, isInitialized: userSystemInitialized } = useUserSystem();

	// ✅ Client-side detection effect - runs first
	useEffect(() => {
		setIsClientSide(true);
		// Initialize network status only on client-side
		if (typeof navigator !== 'undefined') {
			setIsOnline(navigator.onLine);
		}
	}, []);

	// ✅ Lazy load performance monitor (client-side only)
	useEffect(() => {
		if (!isClientSide) return;

		async function loadPerformanceMonitor() {
			try {
				const perfModule = await import('../lib/monitoring/performanceMonitor');
				performanceMonitor = perfModule.default;
			} catch (error) {
				console.warn('Performance monitor not available:', error);
			}
		}

		loadPerformanceMonitor();
	}, [isClientSide]);

	// Main initialization effect
	useEffect(() => {
		if (!isClientSide) return; // Don't run on server

		async function initializeApp() {
			// Prevent double initialization
			if (hasInitialized.current) {
				console.log('Skipping duplicate initialization (React StrictMode)');
				return;
			}
			hasInitialized.current = true;

			try {
				setIsInitializing(true);
				setInitializationError(null);

				// IMPORTANT: Set the monitor to initialization mode to block AI calls (if available)
				if (performanceMonitor?.setInitializing) {
					performanceMonitor.setInitializing(true);
				}

				console.log('Starting ATLAS initialization from page.js...');
				const result = await initializeEnhancedAtlas();

				setIsDbInitialized(result.success);

				if (!result.success) {
					console.error('Initialization failed:', result.error);
					setInitializationError(result.error);
				} else {
					console.log('ATLAS initialized successfully:', result.message);
				}
			} catch (error) {
				console.error('Error initializing enhanced app:', error);
				setInitializationError(error.message);
			} finally {
				setIsInitializing(false);
				// IMPORTANT: Allow AI calls after initialization completes (if available)
				if (performanceMonitor?.setInitializing) {
					performanceMonitor.setInitializing(false);
				}
			}
		}

		// Only initialize if user system is ready and we have a user
		if (userSystemInitialized && currentUser) {
			initializeApp();
		}
	}, [isClientSide, userSystemInitialized, currentUser]); // Include isClientSide dependency

	// Network status handlers - only in browser
	useEffect(() => {
		if (!isClientSide) return;

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Service worker registration
		if ('serviceWorker' in navigator) {
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
	}, [isClientSide]);

	// Handle keyboard shortcuts - only in browser
	useEffect(() => {
		if (!isClientSide) return;

		const handleKeyPress = (e) => {
			// Check if Alt key is pressed and it's a letter key
			if (e.altKey && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
				const pressedKey = e.key.toLowerCase();

				// Find matching card by shortcut
				const card = cardData.find(c => c.shortcut.toLowerCase() === pressedKey);

				if (card) {
					e.preventDefault(); // Prevent default Alt key behavior
					console.log(`Navigating to ${card.title} via Alt+${card.shortcut}`);
					window.location.href = card.href;
				}
			}
		};

		// Add event listener
		window.addEventListener('keydown', handleKeyPress);

		// Cleanup
		return () => window.removeEventListener('keydown', handleKeyPress);
	}, [isClientSide]); // Depend on isClientSide

	// ✅ Handle conditional rendering - SSR safe
	// Show loading during SSR or initial client hydration
	if (!isClientSide) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex justify-center items-center min-h-64">
							<div className="text-center">
								<div className="atlas-spinner mb-4"></div>
								<span className="text-gray-600">Loading ATLAS...</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Show user selection if user system is initialized but no user selected
	if (userSystemInitialized && !currentUser) {
		return <UserSelection onUserSelected={(user) => {
			// User selection handled by the hook, page will re-render
			console.log('User selected:', user);
		}} />;
	}

	// Show loading while user system initializes
	if (!userSystemInitialized) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-page-container">
					<div className="atlas-content-wrapper">
						<div className="flex justify-center items-center min-h-64">
							<div className="text-center">
								<div className="atlas-spinner mb-4"></div>
								<span className="text-gray-600">Initializing ATLAS...</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Main app UI
	return (
		<div className="atlas-backdrop">
			{/* Use the atlas-page-container class for centering */}
			<div className="atlas-page-container">
				<div className="atlas-content-wrapper">
					{/* Streamlined Header with proper centering */}
					<header className="atlas-header-center mb-16">
						<div className="inline-flex items-center gap-4 mb-6">
							<div className="atlas-logo w-14 h-14 flex items-center justify-center">
								<span className="text-white font-bold text-2xl">A</span>
							</div>
							<h1 className="atlas-title text-6xl">
								ATLAS
							</h1>
						</div>

						<p className="text-lg text-gray-600 max-w-xl mx-auto mb-8">
							Clinical decision support for resource-limited healthcare
						</p>

						{/* Show current user info */}
						{currentUser && (
							<div className="mb-4 text-center">
								<p className="text-sm text-gray-600">
									Logged in as: <span className="font-medium">{currentUser.badge} {currentUser.name}</span>
								</p>
							</div>
						)}

						{/* Clean Status Bar with centering */}
						<div className="atlas-status-bar">
							{/* System Status */}
							{isInitializing ? (
								<div className="atlas-status flex items-center gap-3 px-4 py-2 bg-blue-50/80 text-blue-700 rounded-full">
									<div className="atlas-spinner"></div>
									<span>Initializing System</span>
								</div>
							) : isDbInitialized ? (
								<div className="atlas-status flex items-center gap-3 px-4 py-2 bg-green-50/80 text-green-700 rounded-full">
									<div className="atlas-status-dot bg-green-500"></div>
									<span>System Ready</span>
								</div>
							) : (
								<div className="atlas-status flex items-center gap-3 px-4 py-2 bg-red-50/80 text-red-700 rounded-full">
									<div className="atlas-status-dot bg-red-500"></div>
									<span>System Error</span>
								</div>
							)}

							{/* Network Status */}
							<div className={`atlas-status flex items-center gap-3 px-4 py-2 rounded-full ${isOnline ? 'bg-green-50/80 text-green-700' : 'bg-amber-50/80 text-amber-700'
								}`}>
								<div className={`atlas-status-dot ${isOnline ? 'bg-green-500' : 'bg-amber-500'
									}`}></div>
								<span>{isOnline ? 'Online' : 'Offline'}</span>
							</div>
						</div>
					</header>

					{/* Speed-focused Navigation Grid */}
					<main className="space-y-12">
						{/* Priority Actions */}
						<section>
							<h2 className="atlas-section-header">
								Quick Actions
							</h2>
							<div className="grid grid-cols-1 gap-6">
								{cardData.filter(card => card.priority === 'high').map((card, index) => (
									<Link key={index} href={card.href} className="atlas-card group">
										<div className="atlas-card-primary p-8">
											<div className="flex items-center gap-6">
												<div className="atlas-icon-primary w-16 h-16 text-3xl">
													{card.icon}
												</div>
												<div className="flex-grow">
													<h3 className="text-2xl font-semibold text-gray-900 mb-2">
														{card.title}
													</h3>
													<p className="text-gray-600 text-lg">
														{card.description}
													</p>
												</div>
												<div className="atlas-shortcut">
													Alt+{card.shortcut}
												</div>
											</div>
										</div>
									</Link>
								))}
							</div>
						</section>

						{/* Secondary Actions */}
						<section>
							<h2 className="atlas-section-header">
								Additional Tools
							</h2>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
								{cardData.filter(card => card.priority !== 'high').map((card, index) => (
									<Link key={index} href={card.href} className="atlas-card group">
										<div className="atlas-card-secondary p-6">
											<div className="flex items-center gap-4 mb-4">
												<span className="atlas-icon-secondary text-2xl">{card.icon}</span>
												<h3 className="font-semibold text-gray-900 text-lg">
													{card.title}
												</h3>
											</div>
											<p className="text-gray-600 mb-4">
												{card.description}
											</p>
											<div className="atlas-shortcut">
												Alt+{card.shortcut}
											</div>
										</div>
									</Link>
								))}
							</div>
						</section>
					</main>

					{/* Quick Help */}
					<footer className="mt-16 text-center">
						<div className="atlas-help-footer inline-flex items-center gap-3">
							<span className="text-lg">💡</span>
							<span>Use Alt + letter shortcuts for faster navigation</span>
						</div>
					</footer>
				</div>
			</div>

			{/* Error Display */}
			{initializationError && (
				<div className="atlas-error-notification fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg">
					<div className="flex items-start gap-3">
						<span className="text-red-500 text-lg">⚠️</span>
						<div>
							<h4 className="font-medium text-red-900">Initialization Error</h4>
							<p className="text-sm text-red-700 mt-1">{initializationError}</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}