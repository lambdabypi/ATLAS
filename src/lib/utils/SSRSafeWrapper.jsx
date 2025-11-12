// src/components/utils/SSRSafeWrapper.jsx
// Utility component to safely load browser-dependent components
'use client';

import { useState, useEffect } from 'react';

/**
 * SSRSafeWrapper - Ensures components with browser dependencies only render on client
 * 
 * @param {Object} props
 * @param {React.Component} props.children - The component to render safely
 * @param {React.Component} props.fallback - Loading component to show during SSR
 * @param {number} props.delay - Delay before showing content (default: 0)
 * @returns {React.Component}
 */
export default function SSRSafeWrapper({
	children,
	fallback = <div>Loading...</div>,
	delay = 0
}) {
	const [isClientSide, setIsClientSide] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsClientSide(true);
		}, delay);

		return () => clearTimeout(timer);
	}, [delay]);

	if (!isClientSide) {
		return fallback;
	}

	return children;
}

/**
 * Hook to safely check if we're on client-side
 */
export function useIsClient() {
	const [isClient, setIsClient] = useState(false);

	useEffect(() => {
		setIsClient(true);
	}, []);

	return isClient;
}

/**
 * Hook to safely access localStorage
 */
export function useSafeLocalStorage(key, initialValue) {
	const [value, setValue] = useState(initialValue);
	const [isLoaded, setIsLoaded] = useState(false);
	const isClient = useIsClient();

	useEffect(() => {
		if (!isClient) return;

		try {
			const item = window.localStorage.getItem(key);
			if (item) {
				setValue(JSON.parse(item));
			}
		} catch (error) {
			console.error('Error reading from localStorage:', error);
		} finally {
			setIsLoaded(true);
		}
	}, [key, isClient]);

	const setStoredValue = (newValue) => {
		try {
			setValue(newValue);
			if (isClient) {
				window.localStorage.setItem(key, JSON.stringify(newValue));
			}
		} catch (error) {
			console.error('Error writing to localStorage:', error);
		}
	};

	return [value, setStoredValue, isLoaded];
}

/**
 * Dynamic import wrapper for components with browser dependencies
 */
export function withSSRSafe(Component, fallback) {
	return function SSRSafeComponent(props) {
		return (
			<SSRSafeWrapper fallback={fallback}>
				<Component {...props} />
			</SSRSafeWrapper>
		);
	};
}