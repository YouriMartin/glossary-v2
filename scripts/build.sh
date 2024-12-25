#!/bin/bash

echo "Starting build process..."

# Vérifier les prérequis
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }
command -v zip >/dev/null 2>&1 || { echo "zip is required but not installed. Aborting." >&2; exit 1; }

# Nettoyer les builds précédents
rm -rf dist/
rm -rf build/

# Installer les dépendances
echo "Installing dependencies..."
npm install

# Exécuter les tests
echo "Running tests..."
npm run test

# Vérifier si les tests ont réussi
if [ $? -ne 0 ]; then
    echo "Tests failed. Aborting build."
    exit 1
fi

# Lancer l'audit de sécurité
echo "Running security audit..."
./scripts/security-audit.sh

# Build du projet
echo "Building project..."
npm run build

# Créer les packages pour chaque navigateur
echo "Creating browser packages..."

# Chrome
echo "Building Chrome package..."
mkdir -p dist/chrome
cp -r build/* dist/chrome/
cp manifest.chrome.json dist/chrome/manifest.json
cd dist/chrome && zip -r ../glossary-chrome.zip . && cd ../..

# Firefox
echo "Building Firefox package..."
mkdir -p dist/firefox
cp -r build/* dist/firefox/
cp manifest.firefox.json dist/firefox/manifest.json
cd dist/firefox && zip -r ../glossary-firefox.zip . && cd ../..

# Edge
echo "Building Edge package..."
mkdir -p dist/edge
cp -r build/* dist/edge/
cp manifest.edge.json dist/edge/manifest.json
cd dist/edge && zip -r ../glossary-edge.zip . && cd ../..

echo "Build process completed successfully!"
echo "Extension packages are available in the dist directory:"
echo "- Chrome: dist/glossary-chrome.zip"
echo "- Firefox: dist/glossary-firefox.zip"
echo "- Edge: dist/glossary-edge.zip"
