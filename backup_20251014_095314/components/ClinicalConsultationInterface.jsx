import { useState, useEffect } from 'react';
import { getResourceAwareRecommendations } from '../lib/ai/resourceAwareAI';

export default function ClinicalConsultationInterface({ patient, resourceLevel = 'LEVEL_2' }) {
	const [currentStep, setCurrentStep] = useState(0);
	const [consultationData, setConsultationData] = useState({
		chiefComplaint: '',
		symptoms: [],
		vitals: {},
		examination: '',
		workingDiagnosis: '',
		plan: ''
	});
	const [aiRecommendations, setAiRecommendations] = useState(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [selectedSymptoms, setSelectedSymptoms] = useState([]);

	// Pre-defined common symptoms for quick selection
	const commonSymptoms = [
		'Fever', 'Cough', 'Headache', 'Vomiting', 'Diarrhea',
		'Abdominal pain', 'Chest pain', 'Shortness of breath',
		'Weakness', 'Loss of appetite', 'Joint pain', 'Rash'
	];

	const steps = [
		{ id: 'chief-complaint', title: 'Chief Complaint', required: true },
		{ id: 'symptoms', title: 'Symptoms', required: true },
		{ id: 'vitals', title: 'Vital Signs', required: false },
		{ id: 'examination', title: 'Physical Exam', required: false },
		{ id: 'assessment', title: 'Assessment & Plan', required: true }
	];

	const handleSymptomToggle = (symptom) => {
		setSelectedSymptoms(prev =>
			prev.includes(symptom)
				? prev.filter(s => s !== symptom)
				: [...prev, symptom]
		);
	};

	const processWithAI = async () => {
		setIsProcessing(true);
		try {
			const query = `
Patient: ${patient?.age} year old ${patient?.gender}
Chief Complaint: ${consultationData.chiefComplaint}
Symptoms: ${selectedSymptoms.join(', ')}
Vitals: ${JSON.stringify(consultationData.vitals)}
Physical Examination: ${consultationData.examination}

Please provide differential diagnosis and treatment recommendations.
      `;

			const result = await getResourceAwareRecommendations(
				query,
				patient,
				null,
				resourceLevel
			);

			setAiRecommendations(result);
		} catch (error) {
			console.error('AI processing failed:', error);
		} finally {
			setIsProcessing(false);
		}
	};

	const renderStepContent = () => {
		switch (steps[currentStep].id) {
			case 'chief-complaint':
				return (
					<div className="space-y-4">
						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								What is the main reason for today's visit?
							</label>
							<textarea
								className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
								rows="3"
								placeholder="Describe the chief complaint in the patient's words..."
								value={consultationData.chiefComplaint}
								onChange={(e) => setConsultationData(prev => ({
									...prev,
									chiefComplaint: e.target.value
								}))}
								autoFocus
							/>
						</div>
					</div>
				);

			case 'symptoms':
				return (
					<div className="space-y-6">
						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								Select all symptoms present:
							</label>
							<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
								{commonSymptoms.map(symptom => (
									<button
										key={symptom}
										onClick={() => handleSymptomToggle(symptom)}
										className={`p-3 text-left rounded-lg border-2 transition-colors ${selectedSymptoms.includes(symptom)
												? 'bg-blue-100 border-blue-500 text-blue-900'
												: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
											}`}
									>
										{symptom}
									</button>
								))}
							</div>
						</div>

						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								Additional symptoms:
							</label>
							<textarea
								className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
								rows="3"
								placeholder="Describe any additional symptoms not listed above..."
								value={consultationData.additionalSymptoms || ''}
								onChange={(e) => setConsultationData(prev => ({
									...prev,
									additionalSymptoms: e.target.value
								}))}
							/>
						</div>
					</div>
				);

			case 'vitals':
				return (
					<div className="space-y-4">
						<h3 className="text-lg font-semibold mb-4 text-gray-800">Vital Signs</h3>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{[
								{ key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' },
								{ key: 'bloodPressure', label: 'Blood Pressure', type: 'text', placeholder: '120/80' },
								{ key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' },
								{ key: 'respiratoryRate', label: 'Respiratory Rate', type: 'number' },
								{ key: 'oxygenSat', label: 'O2 Saturation (%)', type: 'number' },
								{ key: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1' }
							].map(({ key, label, type, step, placeholder }) => (
								<div key={key}>
									<label className="block text-sm font-medium mb-2 text-gray-700">
										{label}
									</label>
									<input
										type={type}
										step={step}
										placeholder={placeholder}
										className="w-full p-3 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
										value={consultationData.vitals[key] || ''}
										onChange={(e) => setConsultationData(prev => ({
											...prev,
											vitals: { ...prev.vitals, [key]: e.target.value }
										}))}
									/>
								</div>
							))}
						</div>
					</div>
				);

			case 'examination':
				return (
					<div className="space-y-4">
						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								Physical Examination Findings
							</label>
							<textarea
								className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
								rows="6"
								placeholder="Document physical examination findings by system:&#10;• General appearance:&#10;• HEENT:&#10;• Cardiovascular:&#10;• Respiratory:&#10;• Abdomen:&#10;• Neurological:&#10;• Skin:"
								value={consultationData.examination}
								onChange={(e) => setConsultationData(prev => ({
									...prev,
									examination: e.target.value
								}))}
							/>
						</div>

						<button
							onClick={processWithAI}
							disabled={isProcessing}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg text-lg transition-colors"
						>
							{isProcessing ? (
								<span className="flex items-center justify-center">
									<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Generating AI Recommendations...
								</span>
							) : (
								'Get AI-Assisted Recommendations'
							)}
						</button>
					</div>
				);

			case 'assessment':
				return (
					<div className="space-y-6">
						{aiRecommendations && (
							<div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
								<h4 className="text-lg font-semibold text-blue-900 mb-3">
									AI Recommendations ({aiRecommendations.resourceLevel})
								</h4>
								<div className="text-blue-800 whitespace-pre-wrap text-sm">
									{aiRecommendations.text}
								</div>

								{aiRecommendations.adaptedRecommendations?.length > 0 && (
									<div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
										<h5 className="font-semibold text-yellow-800 mb-2">Resource Adaptations:</h5>
										{aiRecommendations.adaptedRecommendations.map((adaptation, idx) => (
											<div key={idx} className="text-sm text-yellow-700">
												• {adaptation.unavailable} → {adaptation.alternative} ({adaptation.reason})
											</div>
										))}
									</div>
								)}
							</div>
						)}

						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								Working Diagnosis
							</label>
							<textarea
								className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
								rows="3"
								placeholder="Primary diagnosis and differential diagnoses..."
								value={consultationData.workingDiagnosis}
								onChange={(e) => setConsultationData(prev => ({
									...prev,
									workingDiagnosis: e.target.value
								}))}
							/>
						</div>

						<div>
							<label className="block text-lg font-semibold mb-3 text-gray-800">
								Treatment Plan
							</label>
							<textarea
								className="w-full p-4 text-lg border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
								rows="4"
								placeholder="Treatment plan, medications, follow-up instructions, and patient education..."
								value={consultationData.plan}
								onChange={(e) => setConsultationData(prev => ({
									...prev,
									plan: e.target.value
								}))}
							/>
						</div>
					</div>
				);

			default:
				return null;
		}
	};

	const canProceed = () => {
		const step = steps[currentStep];
		if (!step.required) return true;

		switch (step.id) {
			case 'chief-complaint':
				return consultationData.chiefComplaint.trim().length > 0;
			case 'symptoms':
				return selectedSymptoms.length > 0;
			case 'assessment':
				return consultationData.workingDiagnosis.trim().length > 0;
			default:
				return true;
		}
	};

	return (
		<div className="max-w-4xl mx-auto p-6">
			{/* Patient Header */}
			<div className="bg-white rounded-lg shadow-md p-6 mb-6">
				<h1 className="text-2xl font-bold text-gray-800 mb-2">
					Consultation: {patient?.name}
				</h1>
				<p className="text-gray-600">
					{patient?.age} years old • {patient?.gender} • Resource Level: {resourceLevel}
				</p>
			</div>

			{/* Progress Indicator */}
			<div className="mb-8">
				<div className="flex justify-between items-center mb-4">
					{steps.map((step, index) => (
						<div key={step.id} className="flex-1 text-center">
							<div className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-2 ${index < currentStep
									? 'bg-green-500 text-white'
									: index === currentStep
										? 'bg-blue-500 text-white'
										: 'bg-gray-300 text-gray-600'
								}`}>
								{index < currentStep ? '✓' : index + 1}
							</div>
							<p className={`text-xs ${index <= currentStep ? 'text-gray-800 font-medium' : 'text-gray-500'
								}`}>
								{step.title}
							</p>
						</div>
					))}
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-blue-500 h-2 rounded-full transition-all duration-300"
						style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
					/>
				</div>
			</div>

			{/* Step Content */}
			<div className="bg-white rounded-lg shadow-md p-6 min-h-[400px]">
				{renderStepContent()}
			</div>

			{/* Navigation */}
			<div className="flex justify-between mt-6">
				<button
					onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
					disabled={currentStep === 0}
					className="px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-semibold rounded-lg text-lg transition-colors"
				>
					Previous
				</button>

				{currentStep < steps.length - 1 ? (
					<button
						onClick={() => setCurrentStep(prev => prev + 1)}
						disabled={!canProceed()}
						className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg text-lg transition-colors"
					>
						Next
					</button>
				) : (
					<button
						onClick={() => console.log('Save consultation:', consultationData)}
						disabled={!canProceed()}
						className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg text-lg transition-colors"
					>
						Complete Consultation
					</button>
				)}
			</div>
		</div>
	);
}