# Glossary V2

A secure browser extension for managing technical glossaries with integrated synchronization capabilities. Compatible with Chrome and Firefox browsers.

## 🌟 Features

- CSV glossary management with easy import/export
- Secure local storage using IndexedDB
- Online synchronization capabilities
- Real-time word definition display on highlight
- Strong security measures with AES-GCM encryption
- Clean Architecture implementation

## 🏗️ Project Structure

```
src/
├── domain/       # Enterprise business rules
├── data/         # Data layer implementations
├── presentation/ # UI components
└── infrastructure/ # External interfaces
```

## 🚀 Getting Started

### Prerequisites

- Node.js (Latest LTS version)
- Chrome or Firefox browser
- Git

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd glossary-v2
```

2. Install dependencies:
```bash
npm install
```

3. Build the extension:
```bash
npm run build
```

4. Load the extension in your browser:
   - Chrome: Open chrome://extensions/
   - Enable Developer mode
   - Click "Load unpacked" and select the dist/ directory

## 📝 License

[License Information]

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
