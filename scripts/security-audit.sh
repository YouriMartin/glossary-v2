#!/bin/bash

echo "Starting Security Audit..."

# Vérifier si les outils nécessaires sont installés
command -v npm >/dev/null 2>&1 || { echo "npm is required but not installed. Aborting." >&2; exit 1; }

# Installer les dépendances d'audit si nécessaire
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev eslint-plugin-security

# Exécuter l'analyse statique avec ESLint
echo "Running ESLint security checks..."
npx eslint . --ext .ts --config .eslintrc.json

# Vérifier les dépendances avec npm audit
echo "Checking dependencies for known vulnerabilities..."
npm audit

# Exécuter SonarQube scanner si disponible
if command -v sonar-scanner >/dev/null 2>&1; then
  echo "Running SonarQube analysis..."
  sonar-scanner
else
  echo "SonarQube scanner not found. Skipping..."
fi

# Vérifier les secrets exposés avec git-secrets
if command -v git-secrets >/dev/null 2>&1; then
  echo "Checking for exposed secrets..."
  git secrets --scan
else
  echo "git-secrets not found. Skipping..."
fi

echo "Security audit completed."
