// src/app/reference/page.js
'use client';

import { useState, useEffect } from 'react';
import { medicalDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';

export default function ReferencePage() {
	const [guidelines, setGuidelines] = useState([]);
	const [selectedGuideline, setSelectedGuideline] = useState(null);
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function loadGuidelines() {
			try {
				const allGuidelines = await medicalDb.searchGuidelines('');
				setGuidelines(allGuidelines);

				const uniqueCategories = [...new Set(allGuidelines.map(guide => guide.category))];
				setCategories(uniqueCategories.sort());

				setLoading(false);
			} catch (error) {
				console.error('Error loading guidelines:', error);
				setLoading(false);
			}
		}

		loadGuidelines();
	}, []);

	const filteredGuidelines = guidelines.filter(guide => {
		const matchesCategory = selectedCategory === 'all' || guide.category === selectedCategory;
		const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			guide.content.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesCategory && matchesSearch;
	});

	const handleSelectGuideline = (guide) => {
		setSelectedGuideline(guide);
	};

	const parseGuidelineContent = (contentJson) => {
		try {
			return JSON.parse(contentJson);
		} catch (error) {
			console.error('Error parsing guideline content:', error);
			return { error: 'Unable to parse guideline content' };
		}
	};

	function renderGuidelineContent(content) {
		if (!content) return <p className="text-gray-500">No content available</p>;

		if (content.error) {
			return <p className="text-red-500">{content.error}</p>;
		}

		return (
			<div className="space-y-6">
				{content.overview && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
						<p className="text-gray-700">{content.overview}</p>
					</div>
				)}

				{content.assessment && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Assessment</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.assessment.map((item, index) => (
								<li key={index} className="text-gray-700">{item}</li>
							))}
						</ul>
					</div>
				)}

				{content.management && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Management</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.management.map((item, index) => (
								<li key={index} className="text-gray-700">{item}</li>
							))}
						</ul>
					</div>
				)}

				{content.followUp && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Follow-up</h4>
						<p className="text-gray-700">{content.followUp}</p>
					</div>
				)}

				{content.redFlags && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Red Flags</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.redFlags.map((item, index) => (
								<li key={index} className="text-red-700 font-medium">{item}</li>
							))}
						</ul>
					</div>
				)}

				{Object.entries(content).map(([key, value]) => {
					if (['overview', 'assessment', 'management', 'followUp', 'redFlags'].includes(key)) {
						return null;
					}

					const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

					return (
						<div key={key}>
							<h4 className="text-lg font-semibold text-gray-800 mb-2">
								{sectionTitle}
							</h4>

							{Array.isArray(value) ? (
								<ul className="list-disc pl-5 space-y-1">
									{value.map((item, index) => (
										<li key={index} className="text-gray-700">{item}</li>
									))}
								</ul>
							) : typeof value === 'object' ? (
								<div className="space-y-3">
									{Object.entries(value).map(([subKey, subValue]) => (
										<div key={subKey}>
											<h5 className="font-medium text-gray-800 mb-1">{subKey}</h5>
											{typeof subValue === 'string' ? (
												<p className="text-gray-700">{subValue}</p>
											) : Array.isArray(subValue) ? (
												<ul className="list-disc pl-5 space-y-1">
													{subValue.map((item, index) => (
														<li key={index} className="text-gray-700">{item}</li>
													))}
												</ul>
											) : (
												<p className="text-gray-700">{JSON.stringify(subValue)}</p>
											)}
										</div>
									))}
								</div>
							) : (
								<p className="text-gray-700">{value}</p>
							)}
						</div>
					);
				})}
			</div>
		);
	}

	const BookIcon = () => (
		<svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
		</svg>
	);

	const categoryOptions = [
		{ value: 'all', label: 'All Categories' },
		...categories.map(category => ({ value: category, label: category }))
	];

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto p-6">
				<div className="flex justify-center items-center min-h-64">
					<LoadingSpinner size="lg" />
					<span className="ml-3 text-gray-600">Loading clinical guidelines...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold text-gray-900">Clinical Reference</h1>
				<p className="mt-1 text-gray-600">Access clinical guidelines, protocols, and reference materials for evidence-based care.</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Guidelines List */}
				<div className="lg:col-span-1">
					<Card>
						<CardHeader>
							<h2 className="text-lg font-semibold text-gray-900">Clinical Guidelines</h2>
							<div className="flex items-center justify-between mt-2">
								<Badge variant="secondary">
									{filteredGuidelines.length} guidelines
								</Badge>
								{selectedCategory !== 'all' && (
									<Badge variant="primary">{selectedCategory}</Badge>
								)}
							</div>
						</CardHeader>

						<CardContent>
							<div className="space-y-4">
								<Select
									label="Category"
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
									options={categoryOptions}
								/>

								<Input
									label="Search Guidelines"
									type="text"
									placeholder="Search by keyword..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
							</div>
						</CardContent>

						<CardContent padding={false}>
							{filteredGuidelines.length === 0 ? (
								<div className="p-6">
									<EmptyState
										icon={BookIcon}
										title="No guidelines found"
										description={searchQuery ? `No guidelines found matching "${searchQuery}"` : "No guidelines available for the selected category."}
										action={searchQuery && (
											<Button onClick={() => setSearchQuery('')} variant="secondary">
												Clear Search
											</Button>
										)}
									/>
								</div>
							) : (
								<div className="max-h-96 overflow-y-auto">
									{filteredGuidelines.map(guide => {
										const isActive = selectedGuideline?.id === guide.id;
										return (
											<div
												key={guide.id}
												className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
												onClick={() => handleSelectGuideline(guide)}
											>
												<h4 className="font-medium text-gray-900">{guide.title}</h4>
												<div className="flex items-center justify-between mt-2">
													<Badge variant="secondary" className="text-xs">{guide.category}</Badge>
													<p className="text-xs text-gray-400">
														Updated: {new Date(guide.lastUpdated).toLocaleDateString()}
													</p>
												</div>
											</div>
										);
									})}
								</div>
							)}
						</CardContent>
					</Card>
				</div>

				{/* Guideline Content */}
				<div className="lg:col-span-2">
					<Card>
						{selectedGuideline ? (
							<>
								<CardHeader>
									<h2 className="text-xl font-semibold text-gray-900">{selectedGuideline.title}</h2>
									<div className="flex flex-wrap gap-2 mt-3">
										<Badge variant="primary">{selectedGuideline.category}</Badge>
										<Badge variant="secondary">
											Last updated: {new Date(selectedGuideline.lastUpdated).toLocaleDateString()}
										</Badge>
									</div>
								</CardHeader>

								<CardContent>
									<div className="prose max-w-none">
										{renderGuidelineContent(parseGuidelineContent(selectedGuideline.content))}
									</div>
								</CardContent>
							</>
						) : (
							<CardContent>
								<EmptyState
									icon={BookIcon}
									title="No guideline selected"
									description="Select a guideline from the list to view its details and clinical recommendations."
									className="py-16"
								/>
							</CardContent>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}