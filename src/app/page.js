// src/app/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { seedInitialData } from '../lib/db';
import { setupAutoSync } from '../lib/sync';
import { initializeEnhancedAtlas } from '../lib/initializeEnhancedAtlas';

export default function Home() {
	const [isDbInitialized, setIsDbInitialized] = useState(false);
	const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

	useEffect(() => {
		async function initializeApp() {
			try {
				const result = await initializeEnhancedAtlas();
				setIsDbInitialized(result.success);

				if (!result.success) {
					console.error('Initialization failed:', result.error);
				}
			} catch (error) {
				console.error('Error initializing enhanced app:', error);
			}
		}

		initializeApp();

		const handleOnline = () => setIsOnline(true);
		const handleOffline = () => setIsOnline(false);

		window.addEventListener('online', handleOnline);
		window.addEventListener('offline', handleOffline);

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

	const cardData = [
		{
			title: 'Dashboard',
			description: 'View patient overview, recent consultations, and clinical metrics.',
			href: '/dashboard',
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
				</svg>
			)
		},
		{
			title: 'Patient Records',
			description: 'Manage patients, view medical history, and start new consultations.',
			href: '/patients',
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
				</svg>
			)
		},
		{
			title: 'New Consultation',
			description: 'Start a new patient consultation with AI-assisted clinical decision support.',
			href: '/consultation/new',
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
				</svg>
			)
		},
		{
			title: 'Clinical Reference',
			description: 'Access clinical guidelines, medication information, and treatment protocols.',
			href: '/reference',
			icon: (
				<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
				</svg>
			)
		}
	];

	return (
		<main className="text-center min-h-screen p-4">
			<div className="text-center max-w-4xl mx-auto">
				<header className="text-center mb-12">
					<h1 className="text-3xl font-bold text-primary-700 mb-4">
						Clinical Decision Support System
					</h1>
					<p className="text-gray-600 max-w-2xl mx-auto">
						AI-powered clinical decision support designed for healthcare providers in resource-limited settings
					</p>

					{!isOnline && (
						<div className="mt-4 inline-block px-4 py-2 bg-yellow-50 text-yellow-800 rounded-md">
							You are currently offline. Most features will still work.
						</div>
					)}
				</header>

				{!isDbInitialized ? (
					<div className="text-center py-8">
						<div className="loading-spinner loading-spinner-lg mx-auto mb-4"></div>
						<p>Initializing clinical database...</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{cardData.map((card) => (
							<Link key={card.href} href={card.href} className="block">
								<div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
									<div className="card-content">
										<div className="flex items-start mb-3">
											<div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mr-4">
												{card.icon}
											</div>
											<div className="flex-1">
												<h2 className="text-xl font-bold text-primary-700 mb-2">
													{card.title}
												</h2>
												<p className="text-gray-600 mb-4">
													{card.description}
												</p>
												<div className="text-blue-600 font-semibold">
													Open {card.title} →
												</div>
											</div>
										</div>
									</div>
								</div>
							</Link>
						))}
					</div>
				)}

				<div className="card mt-10">
					<div className="card-header">
						<h2 className="text-xl font-bold text-primary-700">
							Offline Capabilities
						</h2>
					</div>
					<div className="card-content">
						<p className="text-gray-600 mb-4">
							This application is designed to work offline. Key features available without internet connection:
						</p>

						<ul className="space-y-2 mb-6">
							<li className="flex items-start">
								<span className="text-green-500 mr-2 flex-shrink-0">✓</span>
								<span>Access to patient records and medical history</span>
							</li>
							<li className="flex items-start">
								<span className="text-green-500 mr-2 flex-shrink-0">✓</span>
								<span>Clinical reference materials and guidelines</span>
							</li>
							<li className="flex items-start">
								<span className="text-green-500 mr-2 flex-shrink-0">✓</span>
								<span>Create and update patient consultations</span>
							</li>
							<li className="flex items-start">
								<span className="text-green-500 mr-2 flex-shrink-0">✓</span>
								<span>Basic clinical decision support from locally stored guidelines</span>
							</li>
							<li className="flex items-start">
								<span className="text-yellow-500 mr-2 flex-shrink-0">⚠</span>
								<span>Advanced AI recommendations (queued for processing when online)</span>
							</li>
						</ul>

						<p className="text-sm text-gray-500">
							Data entered while offline will automatically sync when internet connection is restored.
						</p>
					</div>
				</div>
			</div>
		</main>
	);
}