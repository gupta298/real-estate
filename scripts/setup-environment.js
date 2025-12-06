#!/usr/bin/env node

/**
 * This script checks and ensures the correct Node.js and npm versions are installed
 * It's used during the build process to verify compatibility
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Required versions
const REQUIRED_NODE_VERSION = 18;
const REQUIRED_NPM_VERSION = 9;

// Colors for terminal output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Print a colored message
function print(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  
  print('bright', '📋 Checking Node.js version...');
  print('blue', `Required: ${REQUIRED_NODE_VERSION}+ | Current: ${nodeVersion}`);
  
  if (majorVersion < REQUIRED_NODE_VERSION) {
    print('red', `❌ Error: Node.js version ${REQUIRED_NODE_VERSION}+ is required.`);
    print('yellow', 'Please upgrade Node.js using one of these methods:');
    print('yellow', '- Using volta: volta install node@18.17.0');
    print('yellow', '- Using nvm: nvm install 18.17.0 && nvm use 18.17.0');
    print('yellow', '- Direct install: Visit https://nodejs.org/');
    process.exit(1);
  }
  
  print('green', '✅ Node.js version is compatible!');
  return true;
}

// Check npm version
function checkNpmVersion() {
  let npmVersion;
  
  try {
    npmVersion = execSync('npm --version').toString().trim();
    const majorVersion = parseInt(npmVersion.split('.')[0], 10);
    
    print('bright', '📋 Checking npm version...');
    print('blue', `Required: ${REQUIRED_NPM_VERSION}+ | Current: ${npmVersion}`);
    
    if (majorVersion < REQUIRED_NPM_VERSION) {
      print('yellow', `⚠️ Warning: npm version ${REQUIRED_NPM_VERSION}+ is recommended.`);
      print('yellow', 'Your version may work but is not officially supported.');
      print('yellow', 'To upgrade npm: npm install -g npm@9');
      // Just a warning, don't exit
    } else {
      print('green', '✅ npm version is compatible!');
    }
  } catch (error) {
    print('red', '❌ Error checking npm version:');
    console.error(error);
    process.exit(1);
  }
}

// Main function
function checkEnvironment() {
  print('bright', '🔍 Checking development environment...');
  
  checkNodeVersion();
  checkNpmVersion();
  
  print('green', '✅ Environment check completed successfully!');
}

// Run the check
checkEnvironment();
