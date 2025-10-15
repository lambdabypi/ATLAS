// src/components/Navigation.jsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);
	const [isOnline, setIsOnline] = useState(true);
	const [connectionType, setConnectionType] = useState('unknown');

	// Navigation items
	const navItems = [
		{
			name: 'Dashboard',
			href: '/dashboard',
			icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
		},
		{
			name: 'Patients',
			href: '/patients',
			icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
		},
		{
			name: 'Consultations',
			href: '/consultation',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
		},
		{
			name: 'Clinical Reference',
			href: '/reference',
			icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
		},
	];

	// Internet connectivity detection
	useEffect(() => {
		// Check initial online status
		const updateOnlineStatus = () => {
			const online = navigator.onLine;
			setIsOnline(online);

			// Check connection quality if online
			if (online) {
				detectConnectionQuality();
			}
		};

		// Detect connection type and quality
		const detectConnectionQuality = () => {
			// Use Network Information API if available
			if ('connection' in navigator) {
				const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
				if (connection) {
					setConnectionType(connection.effectiveType || 'unknown');
				}
			}

			// Fallback: Test actual connectivity with a small request
			testRealConnectivity();
		};

		// Test real connectivity by trying to fetch a small resource
		const testRealConnectivity = async () => {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

				const response = await fetch('https://www.google.com/favicon.ico', {
					method: 'HEAD',
					mode: 'no-cors',
					signal: controller.signal,
					cache: 'no-cache'
				});

				clearTimeout(timeoutId);
				setIsOnline(true);
			} catch (error) {
				if (error.name !== 'AbortError') {
					console.warn('Real connectivity test failed:', error.message);
					setIsOnline(false);
				}
			}
		};

		// Initial check
		updateOnlineStatus();

		// Event listeners for online/offline events
		const handleOnline = () => {
			console.log('🟢 Network: Back online');
			setIsOnline(true);
			detectConnectionQuality();
		};

		const handleOffline = () => {
			console.log('🔴 Network: Gone offline');
			setIsOnline(false);
			setConnectionType('offline');
		};

		// Connection change handler (for mobile networks)
		const handleConnectionChange = () => {
			console.log('📶 Network: Connection changed');
			updateOnlineStatus();
		};

		// Add event listeners
		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

		// Listen for connection changes (Network Information API)
		if ('connection' in navigator) {
			const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
			if (connection) {
				connection.addEventListener('change', handleConnectionChange);
			}
		}

		// Periodic connectivity check (every 30 seconds when online)
		const connectivityCheckInterval = setInterval(() => {
			if (navigator.onLine) {
				testRealConnectivity();
			}
		}, 30000);

		// Cleanup function
		return () => {
			window.removeEventListener('online', handleOnline);
			window.removeEventListener('offline', handleOffline);

			if ('connection' in navigator) {
				const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
				if (connection) {
					connection.removeEventListener('change', handleConnectionChange);
				}
			}

			clearInterval(connectivityCheckInterval);
		};
	}, []);

	// Check if a nav item is active
	const isActive = (href) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	// Apply responsive behavior with useEffect
	useEffect(() => {
		const handleResize = () => {
			const desktopMenu = document.getElementById('desktop-menu');
			const mobileMenuButton = document.getElementById('mobile-menu-button');

			if (desktopMenu && mobileMenuButton) {
				if (window.innerWidth >= 640) {
					desktopMenu.style.display = 'flex';
					mobileMenuButton.style.display = 'none';
				} else {
					desktopMenu.style.display = 'none';
					mobileMenuButton.style.display = 'inline-flex';
				}
			}
		};

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	// Get connection quality indicator
	const getConnectionIcon = () => {
		if (!isOnline) {
			return '🔴'; // Red circle for offline
		}

		switch (connectionType) {
			case 'slow-2g':
			case '2g':
				return '🔴'; // Red for very slow
			case '3g':
				return '🟡'; // Yellow for moderate
			case '4g':
			case '5g':
				return '🟢'; // Green for fast
			default:
				return '🟢'; // Green for unknown but online
		}
	};

	// Get status text
	const getStatusText = () => {
		if (!isOnline) {
			return 'Offline';
		}

		if (connectionType && connectionType !== 'unknown') {
			return `Online (${connectionType.toUpperCase()})`;
		}

		return 'Online';
	};

	// Styles
	const styles = {
		nav: {
			backgroundColor: 'white',
			boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
			position: 'sticky',
			top: 0,
			zIndex: 50,
		},
		container: {
			maxWidth: '1280px',
			margin: '0 auto',
			padding: '0 1rem',
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			height: '4rem',
		},
		logoContainer: {
			display: 'flex',
			alignItems: 'center',
		},
		logo: {
			color: '#2563eb',
			fontWeight: 'bold',
			fontSize: '1.25rem',
			textDecoration: 'none',
		},
		desktopMenu: {
			display: 'none', // Will be controlled by useEffect
			marginLeft: '1.5rem',
			alignItems: 'center',
		},
		navLinkContainer: {
			display: 'flex',
			alignItems: 'center',
		},
		navLink: {
			display: 'inline-flex',
			alignItems: 'center',
			padding: '0.25rem',
			marginRight: '2rem',
			fontSize: '0.875rem',
			fontWeight: '500',
			textDecoration: 'none',
			borderBottom: '2px solid transparent',
			transition: 'all 0.2s ease',
		},
		navLinkActive: {
			color: '#1f2937',
			borderBottomColor: '#3b82f6',
		},
		navLinkInactive: {
			color: '#6b7280',
			borderBottomColor: 'transparent',
		},
		statusIndicator: {
			display: 'flex',
			alignItems: 'center',
			marginRight: '1rem',
			padding: '0.25rem 0.5rem',
			backgroundColor: isOnline ? '#f0f9ff' : '#fef2f2',
			borderRadius: '0.375rem',
			border: `1px solid ${isOnline ? '#dbeafe' : '#fecaca'}`,
		},
		statusDot: {
			height: '0.5rem',
			width: '0.5rem',
			borderRadius: '50%',
			marginRight: '0.5rem',
			backgroundColor: isOnline ? '#10b981' : '#ef4444',
			animation: isOnline ? 'none' : 'pulse 2s infinite',
		},
		statusText: {
			fontSize: '0.75rem',
			color: isOnline ? '#1e40af' : '#dc2626',
			fontWeight: '500',
		},
		actionButton: {
			display: 'inline-flex',
			alignItems: 'center',
			padding: '0.5rem 1rem',
			backgroundColor: '#2563eb',
			color: 'white',
			fontSize: '0.875rem',
			fontWeight: '500',
			borderRadius: '0.375rem',
			border: 'none',
			cursor: 'pointer',
			textDecoration: 'none',
			transition: 'background-color 0.2s ease',
		},
		mobileMenuButton: {
			display: 'inline-flex', // Will be controlled by useEffect
			alignItems: 'center',
			justifyContent: 'center',
			padding: '0.5rem',
			color: '#9ca3af',
			backgroundColor: 'transparent',
			border: 'none',
			cursor: 'pointer',
		},
		offlineBanner: {
			backgroundColor: '#fef3c7',
			color: '#92400e',
			padding: '0.5rem',
			textAlign: 'center',
			fontSize: '0.875rem',
			fontWeight: '500',
			display: isOnline ? 'none' : 'block',
		},
	};

	return (
		<>
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
			`}</style>

			<nav style={styles.nav}>
				{/* Offline banner */}
				{!isOnline && (
					<div style={styles.offlineBanner}>
						⚠️ You're currently offline. Data will sync when connection is restored.
					</div>
				)}

				<div style={styles.container}>
					<div style={styles.header}>
						<div style={styles.logoContainer}>
							<Link href="/" style={styles.logo}>
								Clinical Support
							</Link>

							{/* Desktop menu */}
							<div id="desktop-menu" style={styles.desktopMenu}>
								{navItems.map((item) => {
									const active = isActive(item.href);
									const navLinkStyle = {
										...styles.navLink,
										...(active ? styles.navLinkActive : styles.navLinkInactive)
									};

									return (
										<Link
											key={item.name}
											href={item.href}
											style={navLinkStyle}
										>
											{item.name}
										</Link>
									);
								})}
							</div>
						</div>

						<div style={styles.navLinkContainer}>
							{/* Enhanced Online/Offline indicator */}
							<div style={styles.statusIndicator} title={`Connection: ${getStatusText()}`}>
								<div style={styles.statusDot}></div>
								<span style={styles.statusText}>{getStatusText()}</span>
							</div>

							{/* Quick actions */}
							<Link
								href="/consultation/new"
								style={styles.actionButton}
								onMouseOver={(e) => e.target.style.backgroundColor = '#1d4ed8'}
								onMouseOut={(e) => e.target.style.backgroundColor = '#2563eb'}
							>
								New Consultation
							</Link>
						</div>

						{/* Mobile menu button */}
						<button
							id="mobile-menu-button"
							type="button"
							style={styles.mobileMenuButton}
							onClick={() => setIsOpen(!isOpen)}
						>
							<span style={{ position: 'absolute', width: '1px', height: '1px', overflow: 'hidden' }}>
								Open main menu
							</span>
							{isOpen ? (
								<svg style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							) : (
								<svg style={{ height: '1.5rem', width: '1.5rem' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							)}
						</button>
					</div>

					{/* Mobile menu */}
					{isOpen && (
						<div style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}>
							{/* Mobile status indicator */}
							<div style={{
								...styles.statusIndicator,
								margin: '0.5rem 1rem',
								justifyContent: 'center',
							}}>
								<div style={styles.statusDot}></div>
								<span style={styles.statusText}>{getStatusText()}</span>
							</div>

							{navItems.map((item) => {
								const active = isActive(item.href);

								return (
									<Link
										key={item.name}
										href={item.href}
										style={{
											display: 'block',
											padding: '0.75rem 1rem',
											fontSize: '1rem',
											fontWeight: '500',
											textDecoration: 'none',
											borderLeftWidth: '4px',
											borderLeftColor: active ? '#3b82f6' : 'transparent',
											backgroundColor: active ? '#eff6ff' : 'transparent',
											color: active ? '#1d4ed8' : '#4b5563',
										}}
										onClick={() => setIsOpen(false)}
									>
										{item.name}
									</Link>
								);
							})}

							{/* Mobile action button */}
							<div style={{ padding: '1rem' }}>
								<Link
									href="/consultation/new"
									style={{
										...styles.actionButton,
										width: '100%',
										justifyContent: 'center',
									}}
									onClick={() => setIsOpen(false)}
								>
									New Consultation
								</Link>
							</div>
						</div>
					)}
				</div>
			</nav>
		</>
	);
}