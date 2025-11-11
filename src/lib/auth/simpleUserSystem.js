// lib/auth/simpleUserSystem.js - FIXED USER SWITCHING
/**
 * Simple User Selection System for ATLAS
 * No passwords, just user identification for device sharing
 * SSR-compatible version with FIXED user switching
 */

import { useState, useEffect, useCallback } from 'react';

// Predefined user roles for healthcare settings
export const USER_ROLES = {
	DOCTOR: 'doctor',
	NURSE: 'nurse',
	CLINICAL_OFFICER: 'clinical_officer',
	COMMUNITY_HEALTH_WORKER: 'chw',
	ADMIN: 'admin'
};

export const DEFAULT_USERS = [
	{ id: 'dr_smith', name: 'Dr. Sarah Smith', role: USER_ROLES.DOCTOR, badge: '👩‍⚕️' },
	{ id: 'nurse_james', name: 'James Ochieng', role: USER_ROLES.NURSE, badge: '👨‍⚕️' },
	{ id: 'co_mary', name: 'Mary Wanjiku', role: USER_ROLES.CLINICAL_OFFICER, badge: '🩺' },
	{ id: 'chw_paul', name: 'Paul Kimani', role: USER_ROLES.COMMUNITY_HEALTH_WORKER, badge: '🏥' }
];

// Check if we're in browser environment
const isBrowser = () => typeof window !== 'undefined';

class SimpleUserSystem {
	constructor() {
		this.currentUser = null;
		this.users = DEFAULT_USERS;
		this.storageKey = 'atlas_current_user';
		this.usersKey = 'atlas_users';
		this.initialized = false;
		this.listeners = new Set(); // For state change notifications

		// DON'T call loadFromStorage in constructor for SSR compatibility
	}

	// Add listener for state changes
	addListener(callback) {
		this.listeners.add(callback);
		return () => this.listeners.delete(callback);
	}

	// Notify listeners of state changes
	notifyListeners() {
		this.listeners.forEach(callback => {
			try {
				callback(this.currentUser);
			} catch (error) {
				console.error('Error in user system listener:', error);
			}
		});
	}

	// Initialize user system (call from client-side only)
	initialize() {
		if (this.initialized || !isBrowser()) {
			return this.currentUser;
		}

		try {
			// Load users from localStorage if they exist
			const savedUsers = localStorage.getItem(this.usersKey);
			if (savedUsers) {
				this.users = JSON.parse(savedUsers);
			}

			// Check for active session
			const savedUser = localStorage.getItem(this.storageKey);
			if (savedUser) {
				this.currentUser = JSON.parse(savedUser);
			}

			this.initialized = true;
		} catch (error) {
			console.error('Error initializing user system:', error);
		}

		return this.currentUser;
	}

	// Select active user (no password required)
	selectUser(userId) {
		if (!isBrowser()) {
			throw new Error('User selection only available in browser');
		}

		const user = this.users.find(u => u.id === userId);
		if (!user) {
			throw new Error(`User not found: ${userId}`);
		}

		this.currentUser = {
			...user,
			sessionStart: new Date().toISOString(),
			sessionId: this.generateSessionId()
		};

		// Save to localStorage
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));

			// Log user activity
			this.logUserActivity('login', { userId, timestamp: new Date().toISOString() });
		} catch (error) {
			console.error('Error saving user session:', error);
		}

		// Notify listeners of the change
		this.notifyListeners();

		return this.currentUser;
	}

	// Switch user (for shared device scenarios) - FIXED
	switchUser() {
		if (!isBrowser()) return;

		try {
			// Log the switch activity before clearing
			if (this.currentUser) {
				this.logUserActivity('logout', {
					userId: this.currentUser.id,
					sessionDuration: this.getSessionDuration()
				});
			}

			// Clear current user
			this.currentUser = null;
			localStorage.removeItem(this.storageKey);

			// Notify listeners IMMEDIATELY of the change
			this.notifyListeners();

			console.log('User switched successfully');
		} catch (error) {
			console.error('Error during user switch:', error);
		}
	}

	// Get current user
	getCurrentUser() {
		return this.currentUser;
	}

	// Add custom user (for facilities to add their staff)
	addUser(userData) {
		if (!isBrowser()) {
			throw new Error('User management only available in browser');
		}

		const newUser = {
			id: this.generateUserId(userData.name),
			name: userData.name,
			role: userData.role,
			badge: this.getRoleBadge(userData.role),
			customUser: true,
			createdAt: new Date().toISOString()
		};

		this.users.push(newUser);
		this.saveUsers();
		return newUser;
	}

	// Get all available users
	getUsers() {
		return this.users;
	}

	// Check if user has permission for action
	hasPermission(action) {
		if (!this.currentUser) return false;

		const permissions = {
			[USER_ROLES.DOCTOR]: ['create_patient', 'edit_patient', 'create_consultation', 'edit_consultation', 'prescribe', 'refer'],
			[USER_ROLES.NURSE]: ['create_patient', 'edit_patient', 'create_consultation', 'vital_signs', 'basic_treatment'],
			[USER_ROLES.CLINICAL_OFFICER]: ['create_patient', 'edit_patient', 'create_consultation', 'edit_consultation', 'basic_prescribe'],
			[USER_ROLES.COMMUNITY_HEALTH_WORKER]: ['create_patient', 'basic_consultation', 'vital_signs', 'refer'],
			[USER_ROLES.ADMIN]: ['all']
		};

		const userPermissions = permissions[this.currentUser.role] || [];
		return userPermissions.includes('all') || userPermissions.includes(action);
	}

	// Helper methods
	generateSessionId() {
		return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
	}

	generateUserId(name) {
		return name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
	}

	getRoleBadge(role) {
		const badges = {
			[USER_ROLES.DOCTOR]: '👩‍⚕️',
			[USER_ROLES.NURSE]: '👨‍⚕️',
			[USER_ROLES.CLINICAL_OFFICER]: '🩺',
			[USER_ROLES.COMMUNITY_HEALTH_WORKER]: '🏥',
			[USER_ROLES.ADMIN]: '⚙️'
		};
		return badges[role] || '👤';
	}

	getSessionDuration() {
		if (!this.currentUser?.sessionStart) return 0;
		return new Date() - new Date(this.currentUser.sessionStart);
	}

	saveUsers() {
		if (!isBrowser()) return;

		try {
			localStorage.setItem(this.usersKey, JSON.stringify(this.users));
		} catch (error) {
			console.error('Error saving users:', error);
		}
	}

	logUserActivity(action, data) {
		if (!isBrowser()) return;

		try {
			const activityLog = JSON.parse(localStorage.getItem('atlas_user_activity') || '[]');
			activityLog.push({
				action,
				...data,
				timestamp: new Date().toISOString()
			});

			// Keep only last 100 activities
			if (activityLog.length > 100) {
				activityLog.splice(0, activityLog.length - 100);
			}

			localStorage.setItem('atlas_user_activity', JSON.stringify(activityLog));
		} catch (error) {
			console.error('Error logging user activity:', error);
		}
	}

	getUserActivity() {
		if (!isBrowser()) return [];

		try {
			return JSON.parse(localStorage.getItem('atlas_user_activity') || '[]');
		} catch (error) {
			console.error('Error getting user activity:', error);
			return [];
		}
	}
}

// Create singleton instance (SSR-safe)
export const userSystem = new SimpleUserSystem();

// React hook for using user system - FIXED with proper state updates
export const useUserSystem = () => {
	const [currentUser, setCurrentUser] = useState(null);
	const [isInitialized, setIsInitialized] = useState(false);
	const [forceUpdate, setForceUpdate] = useState(0);

	// Initialize and set up listener
	useEffect(() => {
		if (!isBrowser()) return;

		// Initialize the user system
		userSystem.initialize();
		setCurrentUser(userSystem.getCurrentUser());
		setIsInitialized(true);

		// Add listener for user changes
		const unsubscribe = userSystem.addListener((newUser) => {
			console.log('User system state changed:', newUser);
			setCurrentUser(newUser);
			setForceUpdate(prev => prev + 1); // Force re-render
		});

		return unsubscribe;
	}, []);

	const selectUser = useCallback((userId) => {
		console.log('Hook: Selecting user', userId);
		const user = userSystem.selectUser(userId);
		// State will be updated via the listener
		return user;
	}, []);

	const switchUser = useCallback(() => {
		console.log('Hook: Switching user');
		userSystem.switchUser();
		// State will be updated via the listener
	}, []);

	const hasPermission = useCallback((action) => {
		return userSystem.hasPermission(action);
	}, [currentUser]); // Depend on currentUser to re-compute when it changes

	return {
		currentUser,
		users: userSystem.getUsers(),
		selectUser,
		switchUser,
		hasPermission,
		addUser: userSystem.addUser.bind(userSystem),
		isInitialized,
		forceUpdate // For debugging
	};
};

// Update IndexedDB operations to include user context - SSR COMPATIBLE  
export const withUserContext = (operation) => {
	return async (...args) => {
		// Only check for user context in browser environment
		if (!isBrowser()) {
			// For SSR, just run the operation without user context
			return operation(...args);
		}

		const currentUser = userSystem.getCurrentUser();
		if (!currentUser) {
			throw new Error('No active user session. Please select a user.');
		}

		// Add user context to the operation
		const userContext = {
			userId: currentUser.id,
			userName: currentUser.name,
			userRole: currentUser.role,
			sessionId: currentUser.sessionId,
			timestamp: new Date().toISOString()
		};

		// If the last argument is an object, add user context to it
		const lastArg = args[args.length - 1];
		if (typeof lastArg === 'object' && lastArg !== null) {
			args[args.length - 1] = { ...lastArg, userContext };
		} else {
			args.push({ userContext });
		}

		return operation(...args);
	};
};

export default SimpleUserSystem;