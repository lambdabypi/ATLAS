# Add Missing Essential Files Script
# Run this AFTER the main restructure script

Write-Host "Adding missing essential files..." -ForegroundColor Green

# Check if we're in the right place
if (!(Test-Path "src")) {
    Write-Host "ERROR: Please run this from your project root (where src/ is located)" -ForegroundColor Red
    exit 1
}

Write-Host "Creating missing UI components..." -ForegroundColor Cyan

# Create Input component
$inputContent = @'
// src/components/ui/Input.jsx
import { forwardRef } from 'react';

export const Input = forwardRef(function Input({
  label,
  error,
  helperText,
  className = '',
  required = false,
  ...props
}, ref) {
  const inputClasses = [
    'input',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});
'@

if (!(Test-Path "src/components/ui/Input.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/Input.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/Input.jsx" -Value $inputContent -Encoding UTF8
    Write-Host "Created: Input.jsx" -ForegroundColor Green
}

# Create TextArea component
$textAreaContent = @'
// src/components/ui/TextArea.jsx
import { forwardRef } from 'react';

export const TextArea = forwardRef(function TextArea({
  label,
  error,
  helperText,
  className = '',
  required = false,
  rows = 4,
  ...props
}, ref) {
  const textareaClasses = [
    'input',
    'textarea',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={textareaClasses}
        rows={rows}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});
'@

if (!(Test-Path "src/components/ui/TextArea.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/TextArea.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/TextArea.jsx" -Value $textAreaContent -Encoding UTF8
    Write-Host "Created: TextArea.jsx" -ForegroundColor Green
}

# Create Select component
$selectContent = @'
// src/components/ui/Select.jsx
import { forwardRef } from 'react';

export const Select = forwardRef(function Select({
  label,
  error,
  helperText,
  options = [],
  placeholder,
  className = '',
  required = false,
  ...props
}, ref) {
  const selectClasses = [
    'input',
    'select',
    error ? 'error' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        ref={ref}
        className={selectClasses}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});
'@

if (!(Test-Path "src/components/ui/Select.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/Select.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/Select.jsx" -Value $selectContent -Encoding UTF8
    Write-Host "Created: Select.jsx" -ForegroundColor Green
}

# Create Badge component
$badgeContent = @'
// src/components/ui/Badge.jsx
export function Badge({ children, variant = 'primary', className = '' }) {
  const classes = [
    'badge',
    `badge-${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
}
'@

if (!(Test-Path "src/components/ui/Badge.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/Badge.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/Badge.jsx" -Value $badgeContent -Encoding UTF8
    Write-Host "Created: Badge.jsx" -ForegroundColor Green
}

# Create EmptyState component
$emptyStateContent = @'
// src/components/ui/EmptyState.jsx
export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action, 
  className = '' 
}) {
  return (
    <div className={`text-center p-8 ${className}`}>
      {Icon && (
        <div className="mx-auto w-12 h-12 text-gray-400 mb-4">
          <Icon className="w-full h-full" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">{description}</p>
      )}
      {action}
    </div>
  );
}
'@

if (!(Test-Path "src/components/ui/EmptyState.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/EmptyState.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/EmptyState.jsx" -Value $emptyStateContent -Encoding UTF8
    Write-Host "Created: EmptyState.jsx" -ForegroundColor Green
}

Write-Host "Creating utility files..." -ForegroundColor Cyan

# Create constants.js
$constantsContent = @'
// src/lib/utils/constants.js
export const COMMON_SYMPTOMS = [
  'Fever', 'Cough', 'Headache', 'Nausea', 'Vomiting', 'Diarrhea',
  'Abdominal pain', 'Chest pain', 'Shortness of breath', 'Fatigue',
  'Joint pain', 'Rash', 'Dizziness', 'Sore throat'
];

export const VITAL_SIGNS = [
  { key: 'temperature', label: 'Temperature (°C)', type: 'number', step: '0.1' },
  { key: 'bloodPressure', label: 'Blood Pressure', type: 'text', placeholder: '120/80' },
  { key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' },
  { key: 'respiratoryRate', label: 'Respiratory Rate', type: 'number' },
  { key: 'oxygenSat', label: 'O₂ Saturation (%)', type: 'number', max: '100' },
  { key: 'weight', label: 'Weight (kg)', type: 'number', step: '0.1' }
];

export const GENDER_OPTIONS = [
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' }
];
'@

if (!(Test-Path "src/lib/utils/constants.js")) {
    New-Item -ItemType File -Path "src/lib/utils/constants.js" -Force | Out-Null
    Set-Content -Path "src/lib/utils/constants.js" -Value $constantsContent -Encoding UTF8
    Write-Host "Created: constants.js" -ForegroundColor Green
}

# Create date.js utility
$dateContent = @'
// src/lib/utils/date.js
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString();
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

export function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export function isToday(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function isThisWeek(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  return date >= weekStart;
}
'@

if (!(Test-Path "src/lib/utils/date.js")) {
    New-Item -ItemType File -Path "src/lib/utils/date.js" -Force | Out-Null
    Set-Content -Path "src/lib/utils/date.js" -Value $dateContent -Encoding UTF8
    Write-Host "Created: date.js" -ForegroundColor Green
}

# Create validation.js utility
$validationContent = @'
// src/lib/utils/validation.js
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateAge(age) {
  const numAge = parseInt(age);
  return !isNaN(numAge) && numAge >= 0 && numAge <= 150;
}

export function validateRequired(value) {
  return value && value.toString().trim().length > 0;
}

export function validateBloodPressure(bp) {
  if (!bp) return false;
  const bpRegex = /^\d{2,3}\/\d{2,3}$/;
  return bpRegex.test(bp);
}

export function validateTemperature(temp) {
  const numTemp = parseFloat(temp);
  return !isNaN(numTemp) && numTemp >= 30 && numTemp <= 45; // Celsius
}
'@

if (!(Test-Path "src/lib/utils/validation.js")) {
    New-Item -ItemType File -Path "src/lib/utils/validation.js" -Force | Out-Null
    Set-Content -Path "src/lib/utils/validation.js" -Value $validationContent -Encoding UTF8
    Write-Host "Created: validation.js" -ForegroundColor Green
}

Write-Host "Creating hook files..." -ForegroundColor Cyan

# Create useOnlineStatus hook
$onlineStatusContent = @'
// src/lib/hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
'@

if (!(Test-Path "src/lib/hooks/useOnlineStatus.js")) {
    New-Item -ItemType File -Path "src/lib/hooks/useOnlineStatus.js" -Force | Out-Null
    Set-Content -Path "src/lib/hooks/useOnlineStatus.js" -Value $onlineStatusContent -Encoding UTF8
    Write-Host "Created: useOnlineStatus.js" -ForegroundColor Green
}

# Create useLocalStorage hook
$localStorageContent = @'
// src/lib/hooks/useLocalStorage.js
import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  // Get value from localStorage or use initial value
  const [storedValue, setStoredValue] = useState(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Update localStorage when state changes
  const setValue = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
'@

if (!(Test-Path "src/lib/hooks/useLocalStorage.js")) {
    New-Item -ItemType File -Path "src/lib/hooks/useLocalStorage.js" -Force | Out-Null
    Set-Content -Path "src/lib/hooks/useLocalStorage.js" -Value $localStorageContent -Encoding UTF8
    Write-Host "Created: useLocalStorage.js" -ForegroundColor Green
}

Write-Host "Creating database files..." -ForegroundColor Cyan

# Create reference.js database file
$referenceContent = @'
// src/lib/db/reference.js
import db from './index';

/**
 * Database operations for medical reference data
 * Consolidates medications, conditions, and guidelines
 */
export const referenceDb = {
  // Medication operations
  async searchMedications(query) {
    return await db.medications
      .filter(med =>
        med.name.toLowerCase().includes(query.toLowerCase()) ||
        med.indications.some(i => i.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async getMedicationById(id) {
    return await db.medications.get(id);
  },

  async getAllMedications() {
    return await db.medications.toArray();
  },

  // Condition operations
  async searchConditions(query) {
    return await db.conditions
      .filter(condition =>
        condition.name.toLowerCase().includes(query.toLowerCase()) ||
        condition.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      )
      .toArray();
  },

  async getConditionById(id) {
    return await db.conditions.get(id);
  },

  async getAllConditions() {
    return await db.conditions.toArray();
  },

  // Guideline operations
  async searchGuidelines(query) {
    return await db.guidelines
      .filter(guide =>
        guide.title.toLowerCase().includes(query.toLowerCase()) ||
        guide.content.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  },

  async getGuidelinesByCategory(category) {
    return await db.guidelines
      .where('category')
      .equals(category)
      .toArray();
  },

  async getGuidelineById(id) {
    return await db.guidelines.get(id);
  },

  async getAllGuidelines() {
    return await db.guidelines.toArray();
  }
};
'@

if (!(Test-Path "src/lib/db/reference.js")) {
    New-Item -ItemType File -Path "src/lib/db/reference.js" -Force | Out-Null
    Set-Content -Path "src/lib/db/reference.js" -Value $referenceContent -Encoding UTF8
    Write-Host "Created: reference.js" -ForegroundColor Green
}

Write-Host "Creating missing page files..." -ForegroundColor Cyan

# Create consultations/new/page.js
$consultationsNewContent = @'
// src/app/consultations/new/page.js
'use client';

export default function NewConsultationPage() {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">New Consultation</h1>
      <p className="text-gray-600">Select a patient first, then start the consultation.</p>
    </div>
  );
}
'@

if (!(Test-Path "src/app/consultations/new/page.js")) {
    New-Item -ItemType File -Path "src/app/consultations/new/page.js" -Force | Out-Null
    Set-Content -Path "src/app/consultations/new/page.js" -Value $consultationsNewContent -Encoding UTF8
    Write-Host "Created: consultations/new/page.js" -ForegroundColor Green
}

# Create consultations/[id]/page.js
$consultationsDetailContent = @'
// src/app/consultations/[id]/page.js
'use client';

export default function ConsultationDetailPage({ params }) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Consultation Detail</h1>
      <p className="text-gray-600">Consultation ID: {params.id}</p>
    </div>
  );
}
'@

if (!(Test-Path "src/app/consultations/[id]/page.js")) {
    New-Item -ItemType File -Path "src/app/consultations/[id]/page.js" -Force | Out-Null
    Set-Content -Path "src/app/consultations/[id]/page.js" -Value $consultationsDetailContent -Encoding UTF8
    Write-Host "Created: consultations/[id]/page.js" -ForegroundColor Green
}

# Create patients/[id]/consultation/page.js
$patientConsultationContent = @'
// src/app/patients/[id]/consultation/page.js
'use client';

export default function PatientConsultationPage({ params }) {
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">New Consultation</h1>
      <p className="text-gray-600">Creating consultation for patient ID: {params.id}</p>
    </div>
  );
}
'@

if (!(Test-Path "src/app/patients/[id]/consultation/page.js")) {
    New-Item -ItemType File -Path "src/app/patients/[id]/consultation/page.js" -Force | Out-Null
    Set-Content -Path "src/app/patients/[id]/consultation/page.js" -Value $patientConsultationContent -Encoding UTF8
    Write-Host "Created: patients/[id]/consultation/page.js" -ForegroundColor Green
}

Write-Host ""
Write-Host "Essential files added successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Summary of what was created:" -ForegroundColor Cyan
Write-Host "  UI Components: Input, TextArea, Select, Badge, EmptyState" -ForegroundColor White
Write-Host "  Utilities: constants, date, validation" -ForegroundColor White
Write-Host "  Hooks: useOnlineStatus, useLocalStorage" -ForegroundColor White
Write-Host "  Database: reference.js" -ForegroundColor White
Write-Host "  Pages: consultation routes" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Replace your globals.css with the enhanced mobile-first version" -ForegroundColor White
Write-Host "  2. Update import statements in existing components" -ForegroundColor White
Write-Host "  3. Test the application" -ForegroundColor White