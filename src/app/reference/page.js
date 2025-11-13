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

		// Handle both object and string content for searching
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

	// Handle both object and JSON string content
	const parseGuidelineContent = (contentInput) => {
		try {
			// If it's already an object, return it directly
			if (typeof contentInput === 'object' && contentInput !== null) {
				return contentInput;
			}

			// If it's a string, try to parse it as JSON
			if (typeof contentInput === 'string') {
				return JSON.parse(contentInput);
			}

			// Fallback
			return { error: 'Invalid content format' };
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
			<div className="space-y-8">
				{/* Overview Section */}
				{content.overview && (
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-blue-900 mb-3 flex items-center">
							<span className="text-blue-600 mr-2">ℹ️</span>
							Overview
						</h4>
						<p className="text-blue-800 leading-relaxed">{content.overview}</p>
					</div>
				)}

				{/* Danger Signs */}
				{content.dangerSigns && Array.isArray(content.dangerSigns) && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
							<span className="text-red-600 mr-2">⚠️</span>
							Danger Signs - Immediate Action Required
						</h4>
						<div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
							<ul className="space-y-2">
								{content.dangerSigns.map((sign, index) => (
									<li key={index} className="text-red-900 font-medium flex items-start">
										<span className="inline-block w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										{sign}
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Clinical Features */}
				{content.clinicalFeatures && Array.isArray(content.clinicalFeatures) && (
					<div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-gray-900 mb-4">Clinical Features</h4>
						<ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{content.clinicalFeatures.map((feature, index) => (
								<li key={index} className="text-gray-700 flex items-center">
									<span className="text-green-500 mr-3 flex-shrink-0">✓</span>
									{feature}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Assessment */}
				{content.assessment && Array.isArray(content.assessment) && (
					<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center">
							<span className="text-indigo-600 mr-2">📋</span>
							Clinical Assessment
						</h4>
						<ul className="space-y-3">
							{content.assessment.map((item, index) => (
								<li key={index} className="text-indigo-800 flex items-start">
									<span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-200 text-indigo-800 rounded-full text-sm font-medium mr-3 flex-shrink-0 mt-0.5">
										{index + 1}
									</span>
									{item}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Diagnosis/Classification */}
				{content.diagnosis && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
							<span className="text-yellow-600 mr-2">🔍</span>
							Diagnosis
						</h4>
						{Array.isArray(content.diagnosis) ? (
							<ul className="space-y-2">
								{content.diagnosis.map((item, index) => (
									<li key={index} className="text-yellow-800 flex items-start">
										<span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
										{item}
									</li>
								))}
							</ul>
						) : (
							<p className="text-yellow-800">{content.diagnosis}</p>
						)}
					</div>
				)}

				{/* Classification */}
				{content.classification && typeof content.classification === 'object' && (
					<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-purple-900 mb-4">Classification</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{Object.entries(content.classification).map(([key, value]) => (
								<div key={key} className="bg-white rounded-lg p-4 border border-purple-100">
									<h5 className="font-semibold text-purple-800 capitalize mb-2">
										{key.replace(/([A-Z])/g, ' $1').trim()}
									</h5>
									<p className="text-purple-700">{value}</p>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Management */}
				{content.management && (
					<div className="bg-green-50 border border-green-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
							<span className="text-green-600 mr-2">💊</span>
							Clinical Management
						</h4>
						{Array.isArray(content.management) ? (
							<div className="bg-green-100 rounded-lg p-4">
								<ul className="space-y-3">
									{content.management.map((item, index) => (
										<li key={index} className="text-green-800 flex items-start">
											<span className="text-green-600 mr-3 flex-shrink-0 mt-0.5">✓</span>
											{item}
										</li>
									))}
								</ul>
							</div>
						) : typeof content.management === 'object' ? (
							<div className="space-y-4">
								{Object.entries(content.management).map(([key, value]) => (
									<div key={key} className="bg-white rounded-lg p-4 border border-green-200">
										<h5 className="font-semibold text-green-800 capitalize mb-3 text-base">
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</h5>
										{Array.isArray(value) ? (
											<ul className="space-y-2">
												{value.map((item, index) => (
													<li key={index} className="text-green-700 flex items-start">
														<span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
														{item}
													</li>
												))}
											</ul>
										) : (
											<p className="text-green-700">{value}</p>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-green-800 bg-green-100 p-4 rounded-lg">{content.management}</p>
						)}
					</div>
				)}

				{/* Medications */}
				{content.medications && Array.isArray(content.medications) && (
					<div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
							<span className="text-purple-600 mr-2">💉</span>
							Medications & Dosing
						</h4>
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
							{content.medications.map((med, index) => (
								<div key={index} className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
									<div className="flex items-center mb-3">
										<div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
										<h5 className="font-semibold text-purple-900 text-lg">{med.name}</h5>
									</div>

									{med.dosage && (
										<div className="mb-3">
											<span className="text-sm font-medium text-purple-700 uppercase tracking-wide">Dosage:</span>
											{typeof med.dosage === 'object' ? (
												<div className="mt-2 space-y-2">
													{Object.entries(med.dosage).map(([key, value]) => (
														<div key={key} className="bg-purple-50 rounded p-2">
															<span className="font-medium text-purple-800 capitalize">{key}:</span>
															<span className="text-purple-700 ml-2">{value}</span>
														</div>
													))}
												</div>
											) : (
												<div className="text-purple-800 font-mono text-sm mt-1 bg-purple-50 p-2 rounded">
													{med.dosage}
												</div>
											)}
										</div>
									)}

									{med.duration && (
										<div className="mb-3">
											<span className="text-sm font-medium text-purple-700 uppercase tracking-wide">Duration:</span>
											<div className="text-purple-800 mt-1">{med.duration}</div>
										</div>
									)}

									{med.alternatives && Array.isArray(med.alternatives) && (
										<div>
											<span className="text-sm font-medium text-purple-700 uppercase tracking-wide">Alternatives:</span>
											<ul className="mt-2 space-y-1">
												{med.alternatives.map((alt, altIndex) => (
													<li key={altIndex} className="text-purple-600 text-sm flex items-start">
														<span className="inline-block w-1 h-1 bg-purple-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
														{alt}
													</li>
												))}
											</ul>
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Treatment */}
				{content.treatment && typeof content.treatment === 'object' && (
					<div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-teal-900 mb-4 flex items-center">
							<span className="text-teal-600 mr-2">🩺</span>
							Treatment Protocols
						</h4>
						<div className="space-y-4">
							{Object.entries(content.treatment).map(([key, value]) => (
								<div key={key} className="bg-white rounded-lg p-4 border border-teal-200">
									<h5 className="font-semibold text-teal-800 capitalize mb-3 text-base flex items-center">
										<span className="w-2 h-2 bg-teal-500 rounded-full mr-3"></span>
										{key.replace(/([A-Z])/g, ' $1').trim()}
									</h5>
									{Array.isArray(value) ? (
										<ul className="space-y-2">
											{value.map((item, index) => (
												<li key={index} className="text-teal-700 flex items-start">
													<span className="text-teal-500 mr-3 flex-shrink-0 mt-0.5">✓</span>
													{item}
												</li>
											))}
										</ul>
									) : typeof value === 'object' && value !== null ? (
										<div className="bg-teal-50 rounded p-3">
											{Object.entries(value).map(([subKey, subValue]) => (
												<div key={subKey} className="mb-2 last:mb-0">
													<span className="font-medium text-teal-800 capitalize">{subKey}:</span>
													<span className="text-teal-700 ml-2">{subValue}</span>
												</div>
											))}
										</div>
									) : (
										<p className="text-teal-700">{value}</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Follow-up */}
				{content.followUp && (
					<div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
							<span className="text-amber-600 mr-2">⏰</span>
							Follow-up Care
						</h4>
						<div className="bg-amber-100 rounded-lg p-4">
							<p className="text-amber-800 leading-relaxed">{content.followUp}</p>
						</div>
					</div>
				)}

				{/* Red Flags */}
				{content.redFlags && Array.isArray(content.redFlags) && (
					<div className="bg-red-50 border border-red-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
							<span className="text-red-600 mr-2">🚩</span>
							Red Flags - Urgent Referral Required
						</h4>
						<div className="bg-red-100 border-l-4 border-red-500 rounded p-4">
							<ul className="space-y-3">
								{content.redFlags.map((flag, index) => (
									<li key={index} className="text-red-900 font-medium flex items-start">
										<span className="text-red-600 mr-3 flex-shrink-0 mt-0.5">⚠️</span>
										{flag}
									</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Complications */}
				{content.complications && Array.isArray(content.complications) && (
					<div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
							<span className="text-orange-600 mr-2">⚠️</span>
							Potential Complications
						</h4>
						<ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
							{content.complications.map((comp, index) => (
								<li key={index} className="text-orange-800 flex items-start">
									<span className="inline-block w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
									{comp}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Prevention */}
				{content.prevention && Array.isArray(content.prevention) && (
					<div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
						<h4 className="text-lg font-semibold text-emerald-900 mb-4 flex items-center">
							<span className="text-emerald-600 mr-2">🛡️</span>
							Prevention Strategies
						</h4>
						<ul className="space-y-3">
							{content.prevention.map((prev, index) => (
								<li key={index} className="text-emerald-800 flex items-start">
									<span className="text-emerald-600 mr-3 flex-shrink-0 mt-0.5">✓</span>
									{prev}
								</li>
							))}
						</ul>
					</div>
				)}

				{/* Render any other sections with enhanced styling */}
				{Object.entries(content).map(([key, value]) => {
					// Skip already rendered sections
					const renderedSections = [
						'overview', 'assessment', 'management', 'followUp', 'dangerSigns',
						'medications', 'treatment', 'redFlags', 'error', 'clinicalFeatures',
						'diagnosis', 'classification', 'complications', 'prevention'
					];

					if (renderedSections.includes(key)) {
						return null;
					}

					const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

					return (
						<div key={key} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
							<h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
								<span className="text-gray-600 mr-2">📄</span>
								{sectionTitle}
							</h4>

							{Array.isArray(value) ? (
								<ul className="space-y-2">
									{value.map((item, index) => (
										<li key={index} className="text-gray-700 flex items-start">
											<span className="inline-block w-2 h-2 bg-gray-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
											{typeof item === 'object' && item !== null
												? JSON.stringify(item)
												: item
											}
										</li>
									))}
								</ul>
							) : typeof value === 'object' && value !== null ? (
								<div className="bg-white rounded-lg p-4 border border-gray-200">
									{Object.entries(value).map(([subKey, subValue]) => (
										<div key={subKey} className="mb-3 last:mb-0">
											<h5 className="font-medium text-gray-800 capitalize mb-1">
												{subKey.replace(/([A-Z])/g, ' $1').trim()}:
											</h5>
											{typeof subValue === 'string' ? (
												<p className="text-gray-700 ml-4">{subValue}</p>
											) : Array.isArray(subValue) ? (
												<ul className="ml-4 space-y-1">
													{subValue.map((item, index) => (
														<li key={index} className="text-gray-700 flex items-start">
															<span className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
															{typeof item === 'object' && item !== null
																? JSON.stringify(item)
																: item
															}
														</li>
													))}
												</ul>
											) : typeof subValue === 'object' && subValue !== null ? (
												<div className="ml-4 text-gray-700 bg-gray-50 p-3 rounded">
													{Object.entries(subValue).map(([nestedKey, nestedValue]) => (
														<div key={nestedKey} className="mb-1 last:mb-0">
															<span className="font-medium capitalize">{nestedKey}:</span> {' '}
															{typeof nestedValue === 'object' && nestedValue !== null
																? JSON.stringify(nestedValue)
																: nestedValue
															}
														</div>
													))}
												</div>
											) : (
												<p className="text-gray-700 ml-4">{subValue}</p>
											)}
										</div>
									))}
								</div>
							) : (
								<p className="text-gray-700 bg-white p-4 rounded-lg border border-gray-200">
									{typeof value === 'object' && value !== null
										? JSON.stringify(value)
										: value
									}
								</p>
							)}
						</div>
					);
				})}
			</div>
		);
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="max-w-6xl mx-auto px-4 py-12">
					<div className="flex flex-col items-center justify-center min-h-[400px]">
						<LoadingSpinner />
						<p className="text-gray-600 mt-4 text-lg">Loading clinical reference materials...</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-6xl mx-auto px-4 py-8">
				{/* Header Section */}
				<div className="text-center mb-10">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
						<span className="text-2xl">📚</span>
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-3">Clinical Reference</h1>
					<p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
						Comprehensive WHO-based clinical guidelines and evidence-based treatment protocols
						for healthcare professionals
					</p>
				</div>

				{/* Search and Filter Section */}
				<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
					<div className="flex flex-col lg:flex-row gap-4 items-end">
						<div className="flex-1 space-y-2">
							<label className="text-sm font-medium text-gray-700 block">
								Search Clinical Guidelines
							</label>
							<Input
								placeholder="Search by condition, symptom, medication, or treatment protocol..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="text-base"
							/>
						</div>
						<div className="w-full lg:w-80 space-y-2">
							<label className="text-sm font-medium text-gray-700 block">
								Filter by Category
							</label>
							<select
								className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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

					{/* Results Count */}
					<div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
						<div className="text-sm text-gray-600">
							<span className="font-medium text-blue-600">{filteredGuidelines.length}</span> guidelines available
							{selectedCategory !== 'all' && (
								<span className="ml-2">
									in <span className="font-medium">{selectedCategory}</span>
								</span>
							)}
						</div>
						{searchQuery && (
							<button
								onClick={() => setSearchQuery('')}
								className="text-sm text-gray-500 hover:text-gray-700 underline"
							>
								Clear search
							</button>
						)}
					</div>
				</div>

				{/* Main Content Grid */}
				<div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
					{/* Guidelines Sidebar */}
					<div className="xl:col-span-2">
						<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-4">
							{/* Sidebar Header */}
							<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
								<h3 className="text-lg font-semibold text-white flex items-center">
									<span className="mr-2">📋</span>
									Available Guidelines
								</h3>
								<p className="text-blue-100 text-sm mt-1">Select to view detailed protocols</p>
							</div>

							{/* Guidelines List */}
							<div className="max-h-[600px] overflow-y-auto">
								{filteredGuidelines.length === 0 ? (
									<div className="p-8 text-center">
										<span className="text-6xl text-gray-300 mb-4 block">📚</span>
										<h4 className="font-medium text-gray-900 mb-1">No guidelines found</h4>
										<p className="text-gray-500 text-sm">
											Try adjusting your search terms or category filter
										</p>
									</div>
								) : (
									<div className="divide-y divide-gray-100">
										{filteredGuidelines.map((guide) => {
											const isActive = selectedGuideline?.id === guide.id;
											return (
												<div
													key={guide.id}
													className={`p-4 cursor-pointer hover:bg-blue-50 transition-all duration-200 ${isActive ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:shadow-sm'
														}`}
													onClick={() => handleSelectGuideline(guide)}
												>
													<h4 className="font-semibold text-gray-900 mb-2 leading-snug">
														{guide.title}
													</h4>
													<div className="flex flex-wrap items-center gap-2 mb-2">
														<Badge
															variant="secondary"
															className="text-xs bg-blue-100 text-blue-800 border-blue-200"
														>
															{guide.category}
														</Badge>
														{guide.subcategory && (
															<Badge
																variant="outline"
																className="text-xs text-gray-600 border-gray-300"
															>
																{guide.subcategory}
															</Badge>
														)}
													</div>
													{guide.resourceLevel && (
														<div className="text-xs text-gray-500 flex items-center">
															<span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
															<span className="capitalize font-medium">{guide.resourceLevel}</span> level
														</div>
													)}
												</div>
											);
										})}
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Main Content Area */}
					<div className="xl:col-span-3">
						{selectedGuideline ? (
							<div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
								{/* Content Header */}
								<div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
									<h2 className="text-2xl font-bold text-white mb-3 leading-tight">
										{selectedGuideline.title}
									</h2>
									<div className="flex flex-wrap gap-2">
										<Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
											{selectedGuideline.category}
										</Badge>
										{selectedGuideline.subcategory && (
											<Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
												{selectedGuideline.subcategory}
											</Badge>
										)}
										{selectedGuideline.resourceLevel && (
											<Badge className="bg-green-500/90 text-white border-green-400/50 hover:bg-green-500">
												<span className="capitalize">{selectedGuideline.resourceLevel}</span> Level
											</Badge>
										)}
									</div>
								</div>

								{/* Content Body */}
								<div className="p-8 max-h-[700px] overflow-y-auto">
									{renderGuidelineContent(parseGuidelineContent(selectedGuideline.content))}
								</div>
							</div>
						) : (
							<div className="bg-white rounded-xl shadow-sm border border-gray-200 flex items-center justify-center min-h-[500px]">
								<div className="text-center max-w-md mx-auto p-8">
									<div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
										<span className="text-3xl">📚</span>
									</div>
									<h3 className="text-xl font-semibold text-gray-900 mb-3">
										Select a Clinical Guideline
									</h3>
									<p className="text-gray-600 mb-6 leading-relaxed">
										Choose a guideline from the sidebar to view comprehensive clinical protocols,
										evidence-based management strategies, and detailed medication information.
									</p>
									<div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
										<span className="text-blue-600 mr-2">💡</span>
										<span className="text-blue-700 text-sm font-medium">
											Use search to find specific conditions or treatments
										</span>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}