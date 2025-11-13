// components/auth/UserSelection.jsx - CLEANED & SIMPLIFIED
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

	return (
		<div className="atlas-backdrop">
			{/* Simple centered container - no need for atlas-page-container */}
			<div className="min-h-screen flex flex-col items-center justify-center p-4">

				{/* Centered Header */}
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

				{/* User Cards Grid - Simple & Clean */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl w-full">
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

				{/* Simple Footer Info */}
				<div className="text-center mt-8 max-w-md">
					<p className="text-sm text-gray-500 mb-4">
						Don't see your name? Ask your supervisor to add you to the system.
					</p>

					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
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