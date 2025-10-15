# Clinical Decision Support System

![Clinical Support](https://img.shields.io/badge/Clinical%20Support-v0.1.0-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-brightgreen)
![Offline Mode](https://img.shields.io/badge/Offline%20Mode-Enabled-orange)

An AI-powered clinical decision support system designed for healthcare providers in resource-limited settings. This progressive web application (PWA) works offline and provides clinical guidance based on established protocols.

## Features

- **Offline-first architecture** with data synchronization when online
- **Patient record management** with medical history tracking
- **Clinical consultations** with AI-assisted recommendations
- **Built-in medical reference** with clinical guidelines and protocols
- **Progressive Web App** capabilities for installation on devices

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Database**: IndexedDB (via Dexie.js)
- **AI Integration**: Google Generative AI (Gemini)
- **Offline Support**: Service Workers, PWA

## Getting Started

### Prerequisites

- Node.js 14.x or higher
- npm 7.x or higher
- Google API key for Gemini (optional)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/clinical-decision-support.git
   cd clinical-decision-support
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your API keys
   ```
   NEXT_PUBLIC_API_URL=https://your-api-url.com
   NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-api-key
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Offline Capabilities

This application is designed to work offline with the following features:

- Local storage of patient data using IndexedDB
- Caching of clinical guidelines and reference materials
- Sync queue for operations performed while offline
- Automatic synchronization when connection is restored

## Project Structure

```
/
├── public/                 # Static assets
│   ├── icons/              # PWA icons
│   ├── manifest.json       # PWA manifest
│   ├── service-worker.js   # Service worker
│   └── offline.html        # Offline fallback page
├── src/
│   ├── app/                # Next.js app router pages
│   ├── components/         # React components
│   └── lib/                # Library code
│       ├── ai/             # AI integration
│       ├── db/             # IndexedDB operations
│       └── sync/           # Data synchronization
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── package.json            # Project dependencies
```

## Key Components

### Patient Management

- Create and update patient records
- View patient history and demographics
- Search and filter patient database

### Consultation Workflow

- Record patient symptoms and examination findings
- Get AI-assisted differential diagnoses
- Receive treatment recommendations based on established guidelines
- Save and track consultations over time

### Clinical Reference

- Access medical guidelines adapted for resource-limited settings
- Browse medication information and treatment protocols
- Reference disease information and diagnostic criteria

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- World Health Organization guidelines for clinical protocols
- Contributors and maintainers
- Healthcare providers in resource-limited settings whose feedback inspired this project