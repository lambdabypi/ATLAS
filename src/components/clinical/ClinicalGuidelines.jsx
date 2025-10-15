// src/components/ClinicalGuidelines.jsx
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
		const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			guide.content.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesCategory && matchesSearch;
	});

	// Handle category selection
	const handleCategoryChange = (e) => {
		setSelectedCategory(e.target.value);
		setSelectedGuideline(null); // Reset selected guideline
	};

	// Handle search input change
	const handleSearchChange = (e) => {
		setSearchQuery(e.target.value);
		setSelectedGuideline(null); // Reset selected guideline
	};

	// Select a guideline to display
	const handleSelectGuideline = (guide) => {
		setSelectedGuideline(guide);
	};

	// Parse JSON content from guideline
	const parseGuidelineContent = (contentJson) => {
		try {
			return JSON.parse(contentJson);
		} catch (error) {
			console.error('Error parsing guideline content:', error);
			return { error: 'Unable to parse guideline content' };
		}
	};

	// Function to render guideline content based on its structure
	function renderGuidelineContent(content) {
		if (!content) return <p>No content available</p>;

		if (content.error) {
			return <p className="text-red-500">{content.error}</p>;
		}

		return (
			<div>
				{content.overview && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Overview</h4>
						<p className="text-gray-700">{content.overview}</p>
					</div>
				)}

				{content.assessment && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Assessment</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.assessment.map((item, index) => (
								<li key={index} className="text-gray-700">{item}</li>
							))}
						</ul>
					</div>
				)}

				{content.management && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Management</h4>
						<ul className="list-disc pl-5 space-y-1">
							{content.management.map((item, index) => (
								<li key={index} className="text-gray-700">{item}</li>
							))}
						</ul>
					</div>
				)}

				{content.followUp && (
					<div className="mb-6">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">Follow-up</h4>
						<p className="text-gray-700">{content.followUp}</p>
					</div>
				)}

				{/* Render any additional sections */}
				{Object.entries(content).map(([key, value]) => {
					// Skip already rendered sections
					if (['overview', 'assessment', 'management', 'followUp'].includes(key)) {
						return null;
					}

					const sectionTitle = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');

					// Render section based on value type
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
							) : typeof value === 'object' ? (
								<div>
									{Object.entries(value).map(([subKey, subValue]) => (
										<div key={subKey} className="mb-2">
											<h5 className="font-medium text-gray-800">{subKey}</h5>
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

	return (
		<div className="max-w-7xl mx-auto px-4">
			<h2 className="text-2xl font-bold text-gray-800 mb-6">Clinical Guidelines</h2>

			<div className="mb-6">
				<div id="filter-row" className="flex flex-col md:flex-row gap-4">
					<div className="w-full md:w-1/2">
						<label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
							Category
						</label>
						<select
							id="category-select"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							value={selectedCategory}
							onChange={handleCategoryChange}
						>
							<option value="all">All Categories</option>
							{categories.map(category => (
								<option key={category} value={category}>
									{category}
								</option>
							))}
						</select>
					</div>

					<div className="w-full md:w-1/2">
						<label htmlFor="search-guidelines" className="block text-sm font-medium text-gray-700 mb-1">
							Search Guidelines
						</label>
						<input
							type="text"
							id="search-guidelines"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="Search by keyword..."
							value={searchQuery}
							onChange={handleSearchChange}
						/>
					</div>
				</div>
			</div>

			{loading ? (
				<div className="text-center py-8">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-800 mx-auto mb-4"></div>
					<p className="text-gray-500">Loading clinical guidelines...</p>
				</div>
			) : (
				<div id="main-content" className="grid grid-cols-1 md:grid-cols-3 gap-6">
					<div className="bg-white rounded-lg shadow-md overflow-hidden md:col-span-1">
						<div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
							<h3 className="font-semibold text-gray-800">
								Guidelines {selectedCategory !== 'all' ? `- ${selectedCategory}` : ''}
							</h3>
							<p className="text-sm text-gray-500">
								{filteredGuidelines.length} guidelines available
							</p>
						</div>

						{filteredGuidelines.length === 0 ? (
							<div className="p-6 text-center">
								<p className="text-gray-500">No guidelines found</p>
							</div>
						) : (
							<div className="max-h-[500px] overflow-y-auto">
								{filteredGuidelines.map(guide => {
									const isActive = selectedGuideline?.id === guide.id;

									return (
										<div
											key={guide.id}
											className={`p-4 cursor-pointer border-b border-gray-200 hover:bg-blue-50 ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''
												}`}
											onClick={() => handleSelectGuideline(guide)}
										>
											<h4 className="font-medium text-gray-900">{guide.title}</h4>
											<p className="text-sm text-gray-500 mt-1">{guide.category}</p>
											<p className="text-xs text-gray-400 mt-1">
												Updated: {new Date(guide.lastUpdated).toLocaleDateString()}
											</p>
										</div>
									);
								})}
							</div>
						)}
					</div>

					<div className="md:col-span-2">
						{selectedGuideline ? (
							<div className="bg-white rounded-lg shadow-md p-6">
								<h3 className="text-xl font-semibold text-gray-800 mb-3">{selectedGuideline.title}</h3>
								<div className="flex flex-wrap gap-2 mb-4">
									<span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
										{selectedGuideline.category}
									</span>
									<span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
										Last updated: {new Date(selectedGuideline.lastUpdated).toLocaleDateString()}
									</span>
								</div>

								<div className="prose max-w-none">
									{renderGuidelineContent(parseGuidelineContent(selectedGuideline.content))}
								</div>
							</div>
						) : (
							<div className="bg-white rounded-lg shadow-md p-8 text-center">
								<svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<h3 className="text-lg font-medium text-gray-900 mb-2">No guideline selected</h3>
								<p className="text-gray-500">
									Select a guideline from the list to view its details
								</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}