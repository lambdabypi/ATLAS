// src/components/clinical/ClinicalGuidelines.jsx
'use client';

import { useState, useEffect } from 'react';
import { medicalDb } from '../../lib/db';

export default function ClinicalGuidelines() {
	const [guidelines, setGuidelines] = useState([]);
	const [selectedGuideline, setSelectedGuideline] = useState(null);
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState('all');
	const [searchQuery, setSearchQuery] = useState('');
	const [loading, setLoading] = useState(true);

	// Load guidelines from IndexedDB
	useEffect(() => {
		async function loadGuidelines() {
			try {
				// Get all guidelines
				const allGuidelines = await medicalDb.searchGuidelines('');
				console.log('🔍 Loaded guidelines:', allGuidelines.length);
				setGuidelines(allGuidelines);

				// Extract unique categories
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

	// Filter guidelines based on category and search query
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

	// Handle category selection
	const handleCategoryChange = (e) => {
		setSelectedCategory(e.target.value);
		setSelectedGuideline(null);
	};

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
		setSelectedGuideline(null);
	};

	// Select a guideline to display
	const handleSelectGuideline = (guide) => {
		setSelectedGuideline(guide);
	};

	// FIXED: Handle both object and JSON string content
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

	// Enhanced function to render guideline content with all sections
	function renderGuidelineContent(content) {
		if (!content) return <p>No content available</p>;

		if (content.error) {
			return <p className="text-red-500">{content.error}</p>;
		}

		return (
			<div className="space-y-6">
				{/* Overview Section */}
				{content.overview && (
					<div>
						<h4 className="text-lg font-semibold text-blue-800 mb-2">Overview</h4>
						<p className="text-gray-700">{content.overview}</p>
					</div>
				)}

				{/* Danger Signs */}
				{content.dangerSigns && Array.isArray(content.dangerSigns) && (
					<div>
						<h4 className="text-lg font-semibold text-red-700 mb-2">⚠️ Danger Signs</h4>
						<div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
							<ul className="list-disc pl-5 space-y-1">
								{content.dangerSigns.map((sign, index) => (
									<li key={index} className="text-red-800">{sign}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Clinical Features */}
				{content.clinicalFeatures && Array.isArray(content.clinicalFeatures) && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Clinical Features</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.clinicalFeatures.map((feature, index) => (
								<li key={index} className="text-gray-700">{feature}</li>
							))}
						</ul>
					</div>
				)}

				{/* Assessment */}
				{content.assessment && Array.isArray(content.assessment) && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Assessment</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.assessment.map((item, index) => (
								<li key={index} className="text-gray-700">{item}</li>
							))}
						</ul>
					</div>
				)}

				{/* Diagnosis/Classification */}
				{content.diagnosis && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Diagnosis</h4>
						{Array.isArray(content.diagnosis) ? (
							<ul className="list-disc pl-5 space-y-1">
								{content.diagnosis.map((item, index) => (
									<li key={index} className="text-gray-700">{item}</li>
								))}
							</ul>
						) : (
							<p className="text-gray-700">{content.diagnosis}</p>
						)}
					</div>
				)}

				{/* Classification */}
				{content.classification && typeof content.classification === 'object' && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Classification</h4>
						<div className="bg-blue-50 p-4 rounded-lg">
							{Object.entries(content.classification).map(([key, value]) => (
								<div key={key} className="mb-2">
									<span className="font-medium text-blue-800 capitalize">
										{key.replace(/([A-Z])/g, ' $1').trim()}:
									</span>
									<span className="text-gray-700 ml-2">{value}</span>
								</div>
							))}
						</div>
					</div>
				)}

				{/* Management */}
				{content.management && (
					<div>
						<h4 className="text-lg font-semibold text-green-700 mb-2">💊 Management</h4>
						{Array.isArray(content.management) ? (
							<div className="bg-green-50 p-4 rounded-lg">
								<ul className="list-disc pl-5 space-y-1">
									{content.management.map((item, index) => (
										<li key={index} className="text-green-800">{item}</li>
									))}
								</ul>
							</div>
						) : typeof content.management === 'object' ? (
							<div className="space-y-4">
								{Object.entries(content.management).map(([key, value]) => (
									<div key={key} className="bg-green-50 p-4 rounded-lg">
										<h5 className="font-medium text-green-800 capitalize mb-2">
											{key.replace(/([A-Z])/g, ' $1').trim()}
										</h5>
										{Array.isArray(value) ? (
											<ul className="list-disc pl-5 space-y-1">
												{value.map((item, index) => (
													<li key={index} className="text-green-700">{item}</li>
												))}
											</ul>
										) : (
											<p className="text-green-700">{value}</p>
										)}
									</div>
								))}
							</div>
						) : (
							<p className="text-gray-700 bg-green-50 p-4 rounded-lg">{content.management}</p>
						)}
					</div>
				)}

				{/* Medications */}
				{content.medications && Array.isArray(content.medications) && (
					<div>
						<h4 className="text-lg font-semibold text-purple-700 mb-2">💉 Medications</h4>
						<div className="space-y-3">
							{content.medications.map((med, index) => (
								<div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
									<h5 className="font-medium text-purple-800">{med.name}</h5>
									{med.dosage && (
										<p className="text-purple-700"><strong>Dosage:</strong> {med.dosage}</p>
									)}
									{med.duration && (
										<p className="text-purple-700"><strong>Duration:</strong> {med.duration}</p>
									)}
									{med.alternatives && Array.isArray(med.alternatives) && (
										<div className="mt-2">
											<strong className="text-purple-700">Alternatives:</strong>
											<ul className="list-disc pl-5 mt-1">
												{med.alternatives.map((alt, altIndex) => (
													<li key={altIndex} className="text-purple-600">{alt}</li>
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
					<div>
						<h4 className="text-lg font-semibold text-green-700 mb-2">Treatment</h4>
						<div className="space-y-4">
							{Object.entries(content.treatment).map(([key, value]) => (
								<div key={key} className="bg-green-50 p-4 rounded-lg">
									<h5 className="font-medium text-green-800 capitalize mb-2">
										{key.replace(/([A-Z])/g, ' $1').trim()}
									</h5>
									{Array.isArray(value) ? (
										<ul className="list-disc pl-5 space-y-1">
											{value.map((item, index) => (
												<li key={index} className="text-green-700">{item}</li>
											))}
										</ul>
									) : (
										<p className="text-green-700">{value}</p>
									)}
								</div>
							))}
						</div>
					</div>
				)}

				{/* Follow-up */}
				{content.followUp && (
					<div>
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Follow-up</h4>
						<p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{content.followUp}</p>
					</div>
				)}

				{/* Red Flags */}
				{content.redFlags && Array.isArray(content.redFlags) && (
					<div>
						<h4 className="text-lg font-semibold text-red-700 mb-2">🚩 Red Flags</h4>
						<div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-500">
							<ul className="list-disc pl-5 space-y-1">
								{content.redFlags.map((flag, index) => (
									<li key={index} className="text-red-800">{flag}</li>
								))}
							</ul>
						</div>
					</div>
				)}

				{/* Complications */}
				{content.complications && Array.isArray(content.complications) && (
					<div>
						<h4 className="text-lg font-semibold text-orange-700 mb-2">Complications</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.complications.map((comp, index) => (
								<li key={index} className="text-orange-800">{comp}</li>
							))}
						</ul>
					</div>
				)}

				{/* Prevention */}
				{content.prevention && Array.isArray(content.prevention) && (
					<div>
						<h4 className="text-lg font-semibold text-teal-700 mb-2">Prevention</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.prevention.map((prev, index) => (
								<li key={index} className="text-teal-800">{prev}</li>
							))}
						</ul>
					</div>
				)}

				{/* Render any other sections */}
				{Object.entries(content).map(([key, value]) => {
					// Skip already rendered sections
					const renderedSections = [
						'overview', 'assessment', 'management', 'followUp', 'dangerSigns',
						'clinicalFeatures', 'diagnosis', 'classification', 'medications',
						'treatment', 'redFlags', 'complications', 'prevention', 'error'
					];

					if (renderedSections.includes(key)) {
						return null;
					}

					const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

					return (
						<div key={key} className="mb-6">
							<h4 className="text-lg font-semibold text-gray-800 mb-2">
								{sectionTitle}
							</h4>

							{Array.isArray(value) ? (
								<ul className="list-disc pl-5 space-y-1">
									{value.map((item, index) => (
										<li key={index} className="text-gray-700">{item}</li>
									))}
								</ul>
							) : typeof value === 'object' && value !== null ? (
								<div className="bg-gray-50 p-4 rounded-lg">
									{Object.entries(value).map(([subKey, subValue]) => (
										<div key={subKey} className="mb-2">
											<h5 className="font-medium text-gray-800 capitalize">
												{subKey.replace(/([A-Z])/g, ' $1').trim()}:
											</h5>
											{typeof subValue === 'string' ? (
												<p className="text-gray-700 ml-2">{subValue}</p>
											) : Array.isArray(subValue) ? (
												<ul className="list-disc pl-7 space-y-1">
													{subValue.map((item, index) => (
														<li key={index} className="text-gray-700">{item}</li>
													))}
												</ul>
											) : (
												<p className="text-gray-700 ml-2">{JSON.stringify(subValue)}</p>
											)}
										</div>
									))}
								</div>
							) : (
								<p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{value}</p>
							)}
						</div>
					);
				})}
			</div>
		);
	}

	if (loading) {
		return (
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
					<p className="text-gray-500">Loading clinical guidelines...</p>
				</div>
			</div>
		);
	}

	return (
		<div className="max-w-7xl mx-auto px-4 py-6">
			<div className="mb-6">
				<h2 className="text-3xl font-bold text-gray-800 mb-2">Clinical Guidelines</h2>
				<p className="text-gray-600">
					WHO-based clinical protocols and evidence-based treatment guidelines
				</p>
			</div>

			{/* Search and Filter Controls */}
			<div className="mb-6 bg-white p-4 rounded-lg shadow-sm border">
				<div className="flex flex-col md:flex-row gap-4">
					<div className="flex-1">
						<label htmlFor="search-guidelines" className="block text-sm font-medium text-gray-700 mb-1">
							Search Guidelines
						</label>
						<input
							type="text"
							id="search-guidelines"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Search by condition, symptom, or treatment..."
							value={searchQuery}
							onChange={handleSearchChange}
						/>
					</div>

					<div className="w-full md:w-64">
						<label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
							Category
						</label>
						<select
							id="category-select"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={selectedCategory}
							onChange={handleCategoryChange}
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

				<div className="mt-2 text-sm text-gray-500">
					{filteredGuidelines.length} guidelines found
				</div>
			</div>

			{/* Main Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Guidelines List */}
				<div className="lg:col-span-1">
					<div className="bg-white rounded-lg shadow-md max-h-[600px] overflow-hidden">
						<div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
							<h3 className="font-semibold text-gray-800">
								Available Guidelines
							</h3>
							<p className="text-sm text-gray-500">
								Click to view details
							</p>
						</div>

						{filteredGuidelines.length === 0 ? (
							<div className="p-6 text-center">
								<p className="text-gray-500">No guidelines found matching your criteria</p>
								{searchQuery && (
									<button
										onClick={() => setSearchQuery('')}
										className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
									>
										Clear search
									</button>
								)}
							</div>
						) : (
							<div className="overflow-y-auto max-h-[500px]">
								{filteredGuidelines.map((guide) => {
									const isActive = selectedGuideline?.id === guide.id;

									return (
										<div
											key={guide.id}
											className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-blue-50 transition-colors ${isActive ? 'bg-blue-100 border-l-4 border-blue-500' : ''
												}`}
											onClick={() => handleSelectGuideline(guide)}
										>
											<h4 className="font-medium text-gray-900 mb-1">{guide.title}</h4>
											<div className="flex items-center justify-between">
												<span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
													{guide.category}
												</span>
												{guide.subcategory && (
													<span className="text-xs text-gray-500">
														{guide.subcategory}
													</span>
												)}
											</div>
											{guide.resourceLevel && (
												<div className="mt-1">
													<span className="text-xs text-gray-400 capitalize">
														{guide.resourceLevel} level
													</span>
												</div>
											)}
										</div>
									);
								})}
							</div>
						)}
					</div>
				</div>

				{/* Guideline Details */}
				<div className="lg:col-span-2">
					{selectedGuideline ? (
						<div className="bg-white rounded-lg shadow-md">
							{/* Header */}
							<div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
								<h3 className="text-xl font-semibold mb-2">{selectedGuideline.title}</h3>
								<div className="flex flex-wrap gap-2">
									<span className="bg-blue-400 text-blue-100 text-xs px-2 py-1 rounded-full">
										{selectedGuideline.category}
									</span>
									{selectedGuideline.subcategory && (
										<span className="bg-blue-400 text-blue-100 text-xs px-2 py-1 rounded-full">
											{selectedGuideline.subcategory}
										</span>
									)}
									{selectedGuideline.resourceLevel && (
										<span className="bg-green-400 text-green-100 text-xs px-2 py-1 rounded-full capitalize">
											{selectedGuideline.resourceLevel} level
										</span>
									)}
								</div>
							</div>

							{/* Content */}
							<div className="p-6 max-h-[600px] overflow-y-auto">
								{renderGuidelineContent(parseGuidelineContent(selectedGuideline.content))}
							</div>
						</div>
					) : (
						<div className="bg-white rounded-lg shadow-md p-8 text-center">
							<div className="text-gray-400 mb-4">
								<svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
							</div>
							<h3 className="text-lg font-medium text-gray-900 mb-2">Select a Clinical Guideline</h3>
							<p className="text-gray-500 mb-4">
								Choose a guideline from the list to view comprehensive clinical protocols,
								management strategies, and medication information.
							</p>
							<div className="text-sm text-gray-400">
								💡 Use the search box to find specific conditions or treatments
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}