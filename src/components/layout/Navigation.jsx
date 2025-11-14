// src/components/layout/Navigation.jsx - UPDATED WITH CENTRALIZED ONLINE STATUS
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useOnlineStatus } from '../../lib/hooks/useOnlineStatus'; // 🎯 CENTRALIZED HOOK

export default function Navigation() {
	const pathname = usePathname();
	const [isOpen, setIsOpen] = useState(false);

	// 🎯 USE CENTRALIZED ONLINE STATUS
	const { isOnline, getStatusInfo } = useOnlineStatus();
	const statusInfo = getStatusInfo();

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

	// Check if a nav item is active
	const isActive = (href) => {
		if (href === '/') return pathname === '/';
		return pathname.startsWith(href);
	};

	// Styles with enhanced status indicators
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
		// 🎯 ENHANCED STATUS INDICATOR WITH DYNAMIC COLORS
		statusIndicator: {
			display: 'flex',
			alignItems: 'center',
			marginRight: '1rem',
			padding: '0.375rem 0.75rem',
			borderRadius: '0.5rem',
			border: '1px solid',
			backgroundColor:
				statusInfo.statusColor === 'green' ? '#f0f9ff' :
					statusInfo.statusColor === 'yellow' ? '#fefbf2' :
						'#fef2f2',
			borderColor:
				statusInfo.statusColor === 'green' ? '#bfdbfe' :
					statusInfo.statusColor === 'yellow' ? '#fed7aa' :
						'#fecaca',
		},
		statusDot: {
			height: '0.5rem',
			width: '0.5rem',
			borderRadius: '50%',
			marginRight: '0.5rem',
			backgroundColor:
				statusInfo.statusColor === 'green' ? '#10b981' :
					statusInfo.statusColor === 'yellow' ? '#f59e0b' :
						'#ef4444',
			// Add pulse animation for offline status
			animation: !isOnline ? 'pulse 2s infinite' : 'none',
		},
		statusText: {
			fontSize: '0.75rem',
			fontWeight: '500',
			color:
				statusInfo.statusColor === 'green' ? '#065f46' :
					statusInfo.statusColor === 'yellow' ? '#92400e' :
						'#dc2626',
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
		// 🎯 ENHANCED OFFLINE BANNER WITH BETTER STYLING
		offlineBanner: {
			backgroundColor: statusInfo.statusColor === 'red' ? '#fef2f2' : '#fef3c7',
			color: statusInfo.statusColor === 'red' ? '#dc2626' : '#92400e',
			padding: '0.75rem',
			textAlign: 'center',
			fontSize: '0.875rem',
			fontWeight: '500',
			display: !isOnline ? 'block' : 'none',
			borderBottom: `1px solid ${statusInfo.statusColor === 'red' ? '#fecaca' : '#fed7aa'}`,
		},
	};

	return (
		<>
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
				.status-slow-connection {
					animation: pulse 3s infinite;
				}
			`}</style>

			<nav style={styles.nav}>
				{/* 🎯 ENHANCED OFFLINE/CONNECTION BANNER */}
				{!isOnline && (
					<div style={styles.offlineBanner}>
						<div className="flex items-center justify-center">
							<span className="mr-2">⚠️</span>
							<span>You're currently offline. Data will sync when connection is restored.</span>
							{statusInfo.lastConnectivityCheck && (
								<span className="ml-2 text-xs opacity-75">
									(Last check: {new Date(statusInfo.lastConnectivityCheck).toLocaleTimeString()})
								</span>
							)}
						</div>
					</div>
				)}

				{/* Show slow connection warning */}
				{isOnline && statusInfo.isSlowConnection && (
					<div style={{
						...styles.offlineBanner,
						backgroundColor: '#fef3c7',
						color: '#92400e',
						display: 'block'
					}}>
						<div className="flex items-center justify-center">
							<span className="mr-2">🐌</span>
							<span>Slow connection detected. Some features may be slower than usual.</span>
						</div>
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
										<Link key={item.name} href={item.href} style={navLinkStyle}>
											<svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
											</svg>
											{item.name}
										</Link>
									);
								})}
							</div>
						</div>

						<div style={{ display: 'flex', alignItems: 'center' }}>
							{/* 🎯 ENHANCED STATUS INDICATOR */}
							<div
								style={styles.statusIndicator}
								className={statusInfo.isSlowConnection ? 'status-slow-connection' : ''}
								title={`${statusInfo.statusText}${statusInfo.lastConnectivityCheck ? ` - Last check: ${new Date(statusInfo.lastConnectivityCheck).toLocaleString()}` : ''}`}
							>
								<div style={styles.statusDot}></div>
								<span style={styles.statusText}>
									{statusInfo.statusText}
								</span>
								{statusInfo.isSlowConnection && (
									<span style={{
										...styles.statusText,
										marginLeft: '0.5rem',
										opacity: 0.8
									}}>
										(Slow)
									</span>
								)}
							</div>

							{/* Action button - only show if online */}
							{isOnline && (
								<Link href="/consultation/new" style={styles.actionButton}>
									New Consultation
								</Link>
							)}

							{/* Mobile menu button */}
							<button
								id="mobile-menu-button"
								style={styles.mobileMenuButton}
								onClick={() => setIsOpen(!isOpen)}
							>
								<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
								</svg>
							</button>
						</div>
					</div>

					{/* Mobile menu */}
					{isOpen && (
						<div className="sm:hidden">
							<div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 rounded-lg mt-2">
								{navItems.map((item) => {
									const active = isActive(item.href);
									return (
										<Link
											key={item.name}
											href={item.href}
											className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${active
												? 'text-gray-900 bg-gray-200'
												: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
												}`}
											onClick={() => setIsOpen(false)}
										>
											<div className="flex items-center">
												<svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
												</svg>
												{item.name}
											</div>
										</Link>
									);
								})}

								{/* Mobile status display */}
								<div className="px-3 py-2 text-sm">
									<div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.statusColor === 'green' ? 'bg-green-100 text-green-800' :
										statusInfo.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
											'bg-red-100 text-red-800'
										}`}>
										<span className="mr-1">{statusInfo.statusIcon}</span>
										{statusInfo.statusText}
									</div>
								</div>

								{/* Mobile action button */}
								{isOnline && (
									<div className="px-3 py-2">
										<Link
											href="/consultation/new"
											className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
											onClick={() => setIsOpen(false)}
										>
											New Consultation
										</Link>
									</div>
								)}
							</div>
						</div>
					)}
				</div>
			</nav>
		</>
	);
}