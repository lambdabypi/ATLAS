# Complete Clinical Support App Restructure
# Run this from your project root directory (D:\ATLAS)

Write-Host "Starting complete project restructure..." -ForegroundColor Green

# Check if we're in the right place
if (!(Test-Path "src")) {
    Write-Host "ERROR: Please run this from your project root (where src/ is located)" -ForegroundColor Red
    exit 1
}

# Create backup first
$backup = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Host "Creating backup: $backup" -ForegroundColor Yellow
Copy-Item -Path "src" -Destination $backup -Recurse

Write-Host ""
Write-Host "Creating new directory structure..." -ForegroundColor Cyan

# Create all required directories
$directories = @(
    "src/components/ui",
    "src/components/layout", 
    "src/components/patient",
    "src/components/consultation",
    "src/components/clinical",
    "src/components/dashboard",
    "src/lib/utils",
    "src/lib/hooks",
    "src/app/patients/[id]/consultation",
    "src/styles"
)

foreach ($dir in $directories) {
    if (!(Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Moving and reorganizing files..." -ForegroundColor Cyan

# 1. Fix app routing structure
Write-Host "Fixing app routes..." -ForegroundColor Yellow

# Move consultation -> consultations (if not done already)
if (Test-Path "src/app/consultation") {
    if (!(Test-Path "src/app/consultations/page.js")) {
        # Move the entire consultation directory
        robocopy "src/app/consultation" "src/app/consultations" /E /MOVE > $null
        Write-Host "Moved: consultation -> consultations" -ForegroundColor Green
    }
}

# Fix patients/new structure (remove nested add folder)
if (Test-Path "src/app/patients/new/add/page.js") {
    Move-Item "src/app/patients/new/add/page.js" "src/app/patients/new/page.js" -Force
    Remove-Item "src/app/patients/new/add" -Force
    Write-Host "Fixed: patients/new/add -> patients/new" -ForegroundColor Green
}

# 2. Move and organize components
Write-Host "Organizing components..." -ForegroundColor Yellow

# Move existing components to appropriate folders
$componentMoves = @{
    "src/components/ClinicalGuidelines.jsx" = "src/components/clinical/ClinicalGuidelines.jsx"
    "src/components/VoiceInput.jsx" = "src/components/clinical/VoiceInput.jsx" 
    "src/components/PatientList.jsx" = "src/components/patient/PatientList.jsx"
    "src/components/ConsultationForm.jsx" = "src/components/consultation/ConsultationForm.jsx"
    "src/components/Navigation.jsx" = "src/components/layout/Navigation.jsx"
}

foreach ($source in $componentMoves.Keys) {
    $destination = $componentMoves[$source]
    if ((Test-Path $source) -and !(Test-Path $destination)) {
        Move-Item $source $destination -Force
        Write-Host "Moved: $source -> $destination" -ForegroundColor Green
    }
}

# 3. Clean up lib directory
Write-Host "Organizing lib directory..." -ForegroundColor Yellow

# Rename resourceAwareAI.js to resource-aware.js
if (Test-Path "src/lib/ai/resourceAwareAI.js") {
    Move-Item "src/lib/ai/resourceAwareAI.js" "src/lib/ai/resource-aware.js" -Force
    Write-Host "Renamed: resourceAwareAI.js -> resource-aware.js" -ForegroundColor Green
}

# Rename sync files to kebab-case
$syncRenames = @{
    "src/lib/sync/consultationSync.js" = "src/lib/sync/consultation-sync.js"
    "src/lib/sync/patientSync.js" = "src/lib/sync/patient-sync.js"
    "src/lib/sync/prioritizedSync.js" = "src/lib/sync/prioritized-sync.js"
}

foreach ($source in $syncRenames.Keys) {
    $destination = $syncRenames[$source]
    if ((Test-Path $source) -and !(Test-Path $destination)) {
        Move-Item $source $destination -Force
        Write-Host "Renamed: $(Split-Path $source -Leaf) -> $(Split-Path $destination -Leaf)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Removing old/redundant files..." -ForegroundColor Yellow

# Remove old files that are no longer needed
$filesToRemove = @(
    "src/components/AppWrapper.jsx",
    "src/components/ClinicalConsultationInterface.jsx",
    "src/components/PatientRecord.jsx", 
    "src/lib/clinical/whoGuidelines.js",
    "src/lib/debug/fetchLogger.js"
)

foreach ($file in $filesToRemove) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "Removed: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Creating basic component files..." -ForegroundColor Cyan

# Create Button component
$buttonContent = @"
// src/components/ui/Button.jsx
'use client';

import Link from 'next/link';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  loading = false,
  className = '',
  as: Component = 'button',
  ...props 
}) {
  const baseClass = 'btn';
  const variantClass = 'btn-' + variant;
  const sizeClass = size !== 'md' ? 'btn-' + size : '';
  const classes = [baseClass, variantClass, sizeClass, className].filter(Boolean).join(' ');

  if (Component === Link) {
    return (
      React.createElement(Link, { className: classes, ...props },
        loading && React.createElement('span', { className: 'loading-spinner mr-2' }),
        children
      )
    );
  }

  return (
    React.createElement(Component, {
      className: classes,
      disabled: disabled || loading,
      ...props
    },
      loading && React.createElement('span', { className: 'loading-spinner mr-2' }),
      children
    )
  );
}
"@

if (!(Test-Path "src/components/ui/Button.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/Button.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/Button.jsx" -Value $buttonContent -Encoding UTF8
    Write-Host "Created: Button.jsx" -ForegroundColor Green
}

# Create Card component
$cardContent = @"
// src/components/ui/Card.jsx
export function Card({ children, className = '', ...props }) {
  const classes = ['card', className].filter(Boolean).join(' ');
  
  return (
    React.createElement('div', { className: classes, ...props }, children)
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    React.createElement('div', { 
      className: 'px-6 py-4 border-b border-gray-200 ' + className 
    }, children)
  );
}

export function CardContent({ children, className = '', padding = true }) {
  return (
    React.createElement('div', { 
      className: (padding ? 'px-6 py-4 ' : '') + className 
    }, children)
  );
}
"@

if (!(Test-Path "src/components/ui/Card.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/Card.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/Card.jsx" -Value $cardContent -Encoding UTF8
    Write-Host "Created: Card.jsx" -ForegroundColor Green
}

# Create LoadingSpinner component
$spinnerContent = @"
// src/components/ui/LoadingSpinner.jsx
export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  };

  return (
    React.createElement('div', { 
      className: 'loading-spinner ' + sizeClasses[size] + ' ' + className 
    })
  );
}
"@

if (!(Test-Path "src/components/ui/LoadingSpinner.jsx")) {
    New-Item -ItemType File -Path "src/components/ui/LoadingSpinner.jsx" -Force | Out-Null
    Set-Content -Path "src/components/ui/LoadingSpinner.jsx" -Value $spinnerContent -Encoding UTF8
    Write-Host "Created: LoadingSpinner.jsx" -ForegroundColor Green
}

# Create AppShell component
$appShellContent = @"
// src/components/layout/AppShell.jsx
'use client';

import Navigation from './Navigation';

export default function AppShell({ children }) {
  return (
    React.createElement('div', { className: 'min-h-screen bg-gray-50' },
      React.createElement(Navigation),
      React.createElement('main', { className: 'container py-6' }, children)
    )
  );
}
"@

if (!(Test-Path "src/components/layout/AppShell.jsx")) {
    New-Item -ItemType File -Path "src/components/layout/AppShell.jsx" -Force | Out-Null
    Set-Content -Path "src/components/layout/AppShell.jsx" -Value $appShellContent -Encoding UTF8
    Write-Host "Created: AppShell.jsx" -ForegroundColor Green
}

# Create missing page files
$consultationsPage = @"
// src/app/consultations/page.js
'use client';

export default function ConsultationsPage() {
  return (
    React.createElement('div', null,
      React.createElement('h1', null, 'Consultations'),
      React.createElement('p', null, 'List of all consultations will be here.')
    )
  );
}
"@

if (!(Test-Path "src/app/consultations/page.js")) {
    New-Item -ItemType File -Path "src/app/consultations/page.js" -Force | Out-Null
    Set-Content -Path "src/app/consultations/page.js" -Value $consultationsPage -Encoding UTF8
    Write-Host "Created: consultations/page.js" -ForegroundColor Green
}

# Create styles/components.css
$componentsCss = @"
/* src/styles/components.css */
/* Component-specific styles */
/* Add any custom component styles here that can't be handled by the utility classes */
"@

if (!(Test-Path "src/styles/components.css")) {
    New-Item -ItemType File -Path "src/styles/components.css" -Force | Out-Null
    Set-Content -Path "src/styles/components.css" -Value $componentsCss -Encoding UTF8
    Write-Host "Created: components.css" -ForegroundColor Green
}

Write-Host ""
Write-Host "Restructure completed successfully!" -ForegroundColor Green
Write-Host "Backup created in: $backup" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Replace globals.css with enhanced mobile-first version" -ForegroundColor White
Write-Host "   2. Update import statements in existing files" -ForegroundColor White  
Write-Host "   3. Add remaining UI components" -ForegroundColor White
Write-Host "   4. Test the application thoroughly" -ForegroundColor White