// src/app/layout.js
// No 'use client' directive here since we're using metadata export

import { Inter } from 'next/font/google';
import './globals.css'; // Keep global CSS file for basic styles
import AppShell from '../components/layout/AppShell';

const inter = Inter({ subsets: ['latin'] });

// Metadata must be in a server component (not marked with 'use client')
export const metadata = {
	title: 'Clinical Decision Support System',
	description: 'LLM-powered clinical decision support for resource-limited settings',
};

// Viewport configuration - move themeColor here to fix warning
export const viewport = {
	themeColor: '#2563eb',
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<head>
				<meta name="application-name" content="Clinical Support" />
				<meta name="apple-mobile-web-app-capable" content="yes" />
				<meta name="apple-mobile-web-app-status-bar-style" content="default" />
				<meta name="apple-mobile-web-app-title" content="Clinical Support" />
				<meta name="format-detection" content="telephone=no" />
				<meta name="mobile-web-app-capable" content="yes" />
				<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
				<link rel="manifest" href="/manifest.json" />
			</head>
			<body className={inter.className}>
				<div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
					<AppShell>
						{children}
					</AppShell>
				</div>
			</body>
		</html>
	);
}