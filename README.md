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

This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International License (CC BY-NC 4.0).

### You are free to:
- Share: Copy and redistribute the material in any medium or format
- Adapt: Remix, transform, and build upon the material

### Under the following terms:
- Attribution: You must give appropriate credit, provide a link to the license, and indicate if changes were made
- NonCommercial: You may not use the material for commercial purposes
- No additional restrictions: You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits

For more information, see the full license text at:
[Creative Commons BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

## 🤝 Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
