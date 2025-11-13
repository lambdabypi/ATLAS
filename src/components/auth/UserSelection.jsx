// components/auth/UserSelection.jsx - FIXED CENTERING ONLY
/**
 * User Selection Component for ATLAS
 * Simple user switching interface for shared devices
 */

import React, { useState } from 'react';
import { useUserSystem } from '../../lib/auth/simpleUserSystem';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';

export const UserSelection = ({ onUserSelected }) => {
	const { users, selectUser, currentUser } = useUserSystem();
	const [selectedUserId, setSelectedUserId] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleUserSelect = async (userId) => {
		try {
			setIsLoading(true);
			console.log('Selecting user:', userId);

			const user = await selectUser(userId);
			console.log('User selected successfully:', user);

			// Call the callback if provided
			if (onUserSelected) {
				onUserSelected(user);
			}
		} catch (error) {
			console.error('User selection failed:', error);
			alert('Failed to select user. Please try again.');
		} finally {
			setIsLoading(false);
		}
	};

	const getRoleColor = (role) => {
		const colors = {
			doctor: 'bg-blue-500',
			nurse: 'bg-green-500',
			clinical_officer: 'bg-purple-500',
			chw: 'bg-orange-500',
			admin: 'bg-gray-500'
		};
		return colors[role] || 'bg-gray-400';
	};

	const getRoleLabel = (role) => {
		const labels = {
			doctor: 'Doctor',
			nurse: 'Nurse',
			clinical_officer: 'Clinical Officer',
			chw: 'Community Health Worker',
			admin: 'Administrator'
		};
		return labels[role] || 'Healthcare Worker';
	};

	// Show user selection interface
	return (
		<div className="atlas-backdrop">
			{/* Fixed: Replace atlas-page-container with proper centering */}
			<div className="min-h-screen flex flex-col items-center justify-center p-4">
				<div className="text-center mb-8">
					<div className="atlas-logo w-16 h-16 mx-auto mb-4">
						<span className="text-white font-bold text-3xl">A</span>
					</div>
					<h1 className="text-4xl font-bold text-gray-800 mb-2">ATLAS</h1>
					<p className="text-gray-600">Select your user profile to continue</p>
					{currentUser && (
						<p className="text-sm text-gray-500 mt-2">
							Currently logged in as: {currentUser.name}
						</p>
					)}
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
					{users.map((user) => (
						<Card
							key={user.id}
							className={`cursor-pointer transition-all hover:shadow-lg border-2 ${selectedUserId === user.id ? 'border-blue-500 shadow-lg' : 'border-gray-200'
								} ${isLoading ? 'opacity-50' : ''}`}
							onClick={() => !isLoading && setSelectedUserId(user.id)}
						>
							<CardContent className="p-6 text-center">
								<div className="mb-4">
									<div className="text-5xl mb-3">{user.badge}</div>
									<h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>

									<div className={`inline-block px-3 py-1 rounded-full text-white text-sm mt-2 ${getRoleColor(user.role)}`}>
										{getRoleLabel(user.role)}
									</div>
								</div>

								<div className="text-sm text-gray-500 mb-4">
									{user.role === 'doctor' && 'Full clinical access'}
									{user.role === 'nurse' && 'Patient care & vital signs'}
									{user.role === 'clinical_officer' && 'Clinical consultations'}
									{user.role === 'chw' && 'Basic assessment & referral'}
									{user.role === 'admin' && 'System administration'}
								</div>

								{selectedUserId === user.id && (
									<Button
										onClick={(e) => {
											e.stopPropagation();
											handleUserSelect(user.id);
										}}
										className="w-full bg-blue-600 hover:bg-blue-700 mt-2"
										disabled={isLoading}
									>
										{isLoading ? 'Switching...' : `Continue as ${user.name}`}
									</Button>
								)}
							</CardContent>
						</Card>
					))}
				</div>

				<div className="text-center mt-8">
					<p className="text-sm text-gray-500 mb-4">
						Don't see your name? Ask your supervisor to add you to the system.
					</p>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
						<p className="text-sm text-blue-700">
							<strong>Multi-User Device:</strong> This system is designed for shared use.
							Your session and data will be associated with your selected profile.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// Header component showing current user - FIXED SWITCHING
export const UserHeader = ({ onSwitchUser }) => {
	const { currentUser, hasPermission, switchUser } = useUserSystem();
	const [isSwitching, setIsSwitching] = useState(false);

	if (!currentUser) return null;

	const handleSwitchUser = async () => {
		try {
			setIsSwitching(true);
			console.log('Switching user...');

			// Call the user system switch function
			switchUser();

			// Call the callback to trigger parent re-render
			if (onSwitchUser) {
				onSwitchUser();
			}

			// Force page reload as fallback to ensure clean state
			setTimeout(() => {
				window.location.reload();
			}, 100);

		} catch (error) {
			console.error('Error switching user:', error);
			setIsSwitching(false);
		}
	};

	const getRoleLabel = (role) => {
		const labels = {
			doctor: 'Doctor',
			nurse: 'Nurse',
			clinical_officer: 'Clinical Officer',
			chw: 'Community Health Worker',
			admin: 'Administrator'
		};
		return labels[role] || 'Healthcare Worker';
	};

	const getSessionDuration = () => {
		return new Date().toLocaleTimeString();
	};

	return (
		<div className="bg-white border-b border-gray-200 px-4 py-2">
			<div className="flex justify-between items-center">
				<div className="flex items-center space-x-3">
					<span className="text-2xl">{currentUser.badge}</span>
					<div>
						<div className="font-medium text-gray-900">{currentUser.name}</div>
						<div className="text-sm text-gray-500">
							{getRoleLabel(currentUser.role)} • Session: {getSessionDuration()}
						</div>
					</div>
				</div>

				<div className="flex items-center space-x-4">
					{/* Permission indicators */}
					<div className="text-xs text-gray-500">
						{hasPermission('prescribe') && <span className="mr-2">💊 Prescribe</span>}
						{hasPermission('refer') && <span className="mr-2">🏥 Refer</span>}
					</div>

					<Button
						variant="outline"
						size="sm"
						onClick={handleSwitchUser}
						className="text-sm"
						disabled={isSwitching}
					>
						{isSwitching ? 'Switching...' : 'Switch User'}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default UserSelection;