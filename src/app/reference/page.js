// src/app/reference/page.js - CLEAN AND SIMPLE VERSION
'use client';

import { useState, useEffect } from 'react';
import { medicalDb } from '../../lib/db';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';

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
				console.log('🔍 Reference page loaded guidelines:', allGuidelines.length);
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
		const contentStr = typeof guide.content === 'object'
			? JSON.stringify(guide.content).toLowerCase()
			: guide.content.toLowerCase();
		const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			contentStr.includes(searchQuery.toLowerCase());
		return matchesCategory && matchesSearch;
	});

	const handleSelectGuideline = (guide) => {
		setSelectedGuideline(guide);
	};

	const formatDate = (dateString) => {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	};

	const GuidelinesIcon = () => (
		<span className="text-2xl text-gray-400">📋</span>
	);

	const parseGuidelineContent = (contentInput) => {
		try {
			if (typeof contentInput === 'object' && contentInput !== null) {
				return contentInput;
			}
			if (typeof contentInput === 'string') {
				return JSON.parse(contentInput);
			}
			return { error: 'Invalid content format' };
		} catch (error) {
			console.error('Error parsing guideline content:', error);
			return { error: 'Unable to parse guideline content' };
		}
	};

	const renderSection = (title, content, type = 'list') => {
		if (!content) return null;

		return (
			<div className="mb-6">
				<h4 className="text-lg font-semibold text-gray-900 mb-3">{title}</h4>
				<div className="bg-gray-50 rounded-lg p-4">
					{type === 'list' && Array.isArray(content) ? (
						<ul className="space-y-2">
							{content.map((item, index) => (
								<li key={index} className="text-gray-700 flex items-start">
									<span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
									{item}
								</li>
							))}
						</ul>
					) : type === 'text' ? (
						<p className="text-gray-700 leading-relaxed">{content}</p>
					) : type === 'object' && typeof content === 'object' ? (
						<div className="space-y-3">
							{Object.entries(content).map(([key, value]) => (
								<div key={key}>
									<h5 className="font-medium text-gray-800 capitalize mb-1">
										{key.replace(/([A-Z])/g, ' $1').trim()}:
									</h5>
									{Array.isArray(value) ? (
										<ul className="ml-4 space-y-1">
											{value.map((item, index) => (
												<li key={index} className="text-gray-600">• {item}</li>
											))}
										</ul>
									) : (
										<p className="text-gray-600 ml-4">{value}</p>
									)}
								</div>
							))}
						</div>
					) : (
						<p className="text-gray-700">{content}</p>
					)}
				</div>
			</div>
		);
	};

	const renderGuidelineContent = (content) => {
		if (!content) return <p className="text-gray-500">No content available</p>;
		if (content.error) return <p className="text-red-500">{content.error}</p>;

		return (
			<div className="space-y-6">
				{content.overview && renderSection('Overview', content.overview, 'text')}
				{content.dangerSigns && renderSection('⚠️ Danger Signs', content.dangerSigns)}
				{content.clinicalFeatures && renderSection('Clinical Features', content.clinicalFeatures)}
				{content.assessment && renderSection('Assessment', content.assessment)}
				{content.diagnosis && renderSection('Diagnosis', content.diagnosis, Array.isArray(content.diagnosis) ? 'list' : 'text')}
				{content.management && renderSection('Management', content.management, typeof content.management === 'object' ? 'object' : 'list')}
				{content.medications && renderSection('Medications', content.medications)}
				{content.treatment && renderSection('Treatment', content.treatment, 'object')}
				{content.followUp && renderSection('Follow-up Care', content.followUp, 'text')}
				{content.redFlags && renderSection('🚩 Red Flags', content.redFlags)}
				{content.complications && renderSection('Complications', content.complications)}
				{content.prevention && renderSection('Prevention', content.prevention)}
			</div>
		);
	};

	if (loading) {
		return (
			<div className="atlas-backdrop">
				<div className="atlas-content-wrapper">
					<div className="flex flex-col items-center justify-center min-h-[400px] py-12">
						<LoadingSpinner />
						<p className="text-gray-600 mt-4 text-lg">Loading clinical reference materials...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="atlas-backdrop">
			<div className="atlas-content-wrapper">
				<div className="py-8">
					{/* Header */}
					<div className="text-center mb-8">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
							<span className="text-2xl">📚</span>
						</div>
						<h1 className="text-3xl font-bold text-gray-900 mb-2">Clinical Reference</h1>
						<p className="text-gray-600 max-w-2xl mx-auto">
							WHO-based clinical guidelines and evidence-based treatment protocols
						</p>
					</div>

					{/* Search and Filter */}
					<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
						<div className="flex flex-col lg:flex-row gap-4">
							<div className="flex-1">
								<Input
									placeholder="Search guidelines by condition, symptoms, or treatment..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="text-base"
								/>
							</div>
							<div className="w-full lg:w-64">
								<select
									className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
									value={selectedCategory}
									onChange={(e) => setSelectedCategory(e.target.value)}
								>
									<option value="all">All Categories ({guidelines.length})</option>
									{categories.map(category => (
										<option key={category} value={category}>
											{category} ({guidelines.filter(g => g.category === category).length})
										</option>
									))}
								</select>
							</div>
						</div>

						<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
							<div className="text-sm text-gray-600">
								<span className="font-medium text-blue-600">{filteredGuidelines.length}</span> guidelines
								{selectedCategory !== 'all' && (
									<span className="ml-2">in {selectedCategory}</span>
								)}
							</div>
							{searchQuery && (
								<button
									onClick={() => setSearchQuery('')}
									className="text-sm text-blue-600 hover:text-blue-800 underline"
								>
									Clear search
								</button>
							)}
						</div>
					</div>

					{/* Main Content */}
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
						{/* Guidelines List */}
						<div className="lg:col-span-1">
							<Card className="atlas-card-primary">
								<CardHeader>
									<h3 className="font-semibold text-gray-800">Available Guidelines</h3>
								</CardHeader>

								<CardContent padding={false}>
									{filteredGuidelines.length === 0 ? (
										<div className="p-6">
											<EmptyState
												icon={GuidelinesIcon}
												title="No guidelines found"
												description={searchQuery ? `No guidelines match "${searchQuery}"` : "No guidelines available"}
												action={searchQuery && (
													<button
														onClick={() => setSearchQuery('')}
														className="text-blue-600 hover:text-blue-800 underline"
													>
														Clear Search
													</button>
												)}
											/>
										</div>
									) : (
										<div className="max-h-[600px] overflow-y-auto">
											<div className="divide-y divide-gray-200">
												{filteredGuidelines.map((guide) => {
													const isActive = selectedGuideline?.id === guide.id;
													return (
														<div
															key={guide.id}
															className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
																}`}
															onClick={() => handleSelectGuideline(guide)}
														>
															<h4 className="font-medium text-gray-900 mb-2">
																{guide.title}
															</h4>
															<div className="flex flex-wrap gap-2">
																<Badge variant="secondary" className="text-xs">
																	{guide.category}
																</Badge>
																{guide.subcategory && (
																	<Badge variant="outline" className="text-xs">
																		{guide.subcategory}
																	</Badge>
																)}
																{guide.resourceLevel && (
																	<Badge variant="outline" className="text-xs">
																		{guide.resourceLevel}
																	</Badge>
																)}
															</div>
														</div>
													);
												})}
											</div>
										</div>
									)}
								</CardContent>
							</Card>
						</div>

						{/* Guidelines Detail */}
						<div className="lg:col-span-2">
							{selectedGuideline ? (
								<Card className="atlas-card-primary">
									<CardHeader>
										<div className="flex justify-between items-start">
											<div>
												<h2 className="text-xl font-bold text-gray-900 mb-2">
													{selectedGuideline.title}
												</h2>
												<div className="flex flex-wrap gap-2">
													<Badge variant="primary">
														{selectedGuideline.category}
													</Badge>
													{selectedGuideline.subcategory && (
														<Badge variant="secondary">
															{selectedGuideline.subcategory}
														</Badge>
													)}
													{selectedGuideline.resourceLevel && (
														<Badge variant="outline">
															{selectedGuideline.resourceLevel} level
														</Badge>
													)}
												</div>
											</div>
										</div>
									</CardHeader>

									<CardContent>
										<div className="max-h-[600px] overflow-y-auto pr-2">
											{renderGuidelineContent(parseGuidelineContent(selectedGuideline.content))}
										</div>
									</CardContent>
								</Card>
							) : (
								<Card className="atlas-card-secondary">
									<CardContent>
										<EmptyState
											icon={GuidelinesIcon}
											title="Select a Guideline"
											description="Choose a clinical guideline from the list to view detailed protocols and treatment recommendations."
										/>
									</CardContent>
								</Card>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}