// src/app/patients/add/page.js - CENTERED VERSION
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { add as addPatient } from '../../../lib/db/patients';
import { Card, CardHeader, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input, TextArea, Select } from '../../../components/ui/Input';

export default function AddPatientPage() {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState({
		name: '',
		age: '',
		gender: '',
		medicalHistory: '',
		allergies: '',
		currentMedications: ''
	});
	const [errors, setErrors] = useState({});

	const handleInputChange = (field) => (e) => {
		const value = e.target.value;
		setFormData(prev => ({
			...prev,
			[field]: value
		}));

		if (errors[field]) {
			setErrors(prev => ({
				...prev,
				[field]: ''
			}));
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.name.trim()) {
			newErrors.name = 'Full name is required';
		}

		if (!formData.age.trim()) {
			newErrors.age = 'Age is required';
		} else if (isNaN(formData.age) || parseInt(formData.age) < 0 || parseInt(formData.age) > 120) {
			newErrors.age = 'Please enter a valid age between 0 and 120';
		}

		if (!formData.gender) {
			newErrors.gender = 'Gender is required';
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}

		setLoading(true);

		try {
			const patientId = await addPatient({
				...formData,
				age: parseInt(formData.age),
				lastVisit: new Date().toISOString()
			});

			// Navigate to the patient detail page
			router.push(`/patients/${patientId}`);
		} catch (error) {
			console.error('Error adding patient:', error);
			alert('Error adding patient. Please try again.');
			setLoading(false);
		}
	};

	const genderOptions = [
		{ value: '', label: 'Select Gender' },
		{ value: 'Male', label: 'Male' },
		{ value: 'Female', label: 'Female' },
		{ value: 'Other', label: 'Other' }
	];

	return (
		<div className="atlas-backdrop">
			<div className="atlas-page-container">
				<div className="atlas-content-wrapper">
					<div className="atlas-header-center mb-6">
						<h1 className="text-2xl font-bold text-gray-900 mb-2">Add New Patient</h1>
						<p className="text-sm text-gray-600">
							Enter patient information to create a new medical record.
						</p>
					</div>

					<Card className="atlas-card-primary">
						<CardHeader>
							<h2 className="text-lg font-semibold text-gray-900">Patient Information</h2>
						</CardHeader>

						<CardContent>
							<form onSubmit={handleSubmit} className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<Input
										label="Full Name"
										type="text"
										value={formData.name}
										onChange={handleInputChange('name')}
										error={errors.name}
										required
										placeholder="Enter patient's full name"
									/>

									<Input
										label="Age"
										type="number"
										min="0"
										max="120"
										value={formData.age}
										onChange={handleInputChange('age')}
										error={errors.age}
										required
										placeholder="Enter age in years"
									/>

									<Select
										label="Gender"
										value={formData.gender}
										onChange={handleInputChange('gender')}
										options={genderOptions}
										error={errors.gender}
										required
									/>

									<Input
										label="Known Allergies"
										type="text"
										value={formData.allergies}
										onChange={handleInputChange('allergies')}
										placeholder="List allergies, separated by commas"
										helperText="Leave blank if no known allergies"
									/>
								</div>

								<Input
									label="Current Medications"
									type="text"
									value={formData.currentMedications}
									onChange={handleInputChange('currentMedications')}
									placeholder="List current medications, separated by commas"
									helperText="Include dosages if known"
								/>

								<TextArea
									label="Medical History"
									value={formData.medicalHistory}
									onChange={handleInputChange('medicalHistory')}
									rows={4}
									placeholder="Relevant medical history, previous conditions, surgeries, etc."
									helperText="Include any relevant past medical history"
								/>

								<div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
									<Button
										as={Link}
										href="/patients"
										variant="secondary"
										disabled={loading}
									>
										Cancel
									</Button>

									<Button
										type="submit"
										variant="primary"
										loading={loading}
										disabled={loading}
									>
										Save Patient
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>

					{/* Help Text */}
					<div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
								</svg>
							</div>
							<div className="ml-3">
								<h3 className="text-sm font-medium text-blue-800">
									Data Privacy Notice
								</h3>
								<div className="mt-2 text-sm text-blue-700">
									<p>
										Patient data is stored locally on this device and will sync when online.
										Ensure you comply with local privacy regulations and obtain appropriate consent.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}