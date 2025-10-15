// src/lib/utils/constants.js
export const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Nausea', 'Vomiting', 'Diarrhea',
  'Abdominal pain', 'Chest pain', 'Shortness of breath', 'Fatigue',
  'Joint pain', 'Rash', 'Dizziness', 'Sore throat'
];

export const VITAL_SIGNS = [
  { key: 'temperature', label: 'Temperature (Â°C)', type: 'number', step: '0.1' },
  { key: 'bloodPressure', label: 'Blood Pressure', type: 'text', placeholder: '120/80' },
  { key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', type: 'number' },
  { key: 'oxygenSat', label: 'Oâ‚‚ Saturation (%)', type: 'number', max: '100' },
  { key: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1' }
];

export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];
