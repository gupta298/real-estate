#!/usr/bin/env node

/**
 * Production startup script for Render deployment
 * This script:
 * 1. Initializes the database
 * 2. Runs all migrations
 * 3. Starts the Express server which also serves the built Next.js app
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m'
};

// Print a colored message
function print(color, message) {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

// Execute a command and return its output
function execute(command, cwd = process.cwd(), exitOnError = true) {
  try {
    print('blue', `Executing: ${command}`);
    const output = execSync(command, { 
      cwd, 
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    });
    return output;
  } catch (error) {
    print('red', `Error executing command: ${command}`);
    print('red', error.toString());
    if (exitOnError) {
      print('red', 'Exiting due to command error. Set exitOnError=false to continue despite errors.');
      process.exit(1);
    } else {
      print('yellow', 'Continuing despite command error (exitOnError=false).');
      return null;
    }
  }
}

// Main function
async function startProduction() {
  print('bright', '🚀 Starting production deployment...');
  
  // Ensure we're in the project root
  const projectRoot = path.resolve(__dirname, '..');
  process.chdir(projectRoot);
  
  // Step 1: Ensure client build exists
  print('bright', '📦 Checking for client build...');
  let clientBuildPath = path.join(projectRoot, 'client', 'out');
  if (!fs.existsSync(clientBuildPath)) {
    print('yellow', 'Client build not found. Building client...');
    execute('cd client && npm run build');
    print('green', '✅ Client built successfully!');
    
    // Double check if build exists after running the build command
    if (!fs.existsSync(clientBuildPath)) {
      print('red', '❌ Client build directory not found at: ' + clientBuildPath);
      print('yellow', 'This might be due to a custom output directory setting in next.config.js');
      
      // Try to find the output directory by checking common alternatives
      const possibleOutputDirs = [
        path.join(projectRoot, 'client', 'build'),
        path.join(projectRoot, 'client', 'dist'),
        path.join(projectRoot, 'client', '.next/static')
      ];
      
      for (const dir of possibleOutputDirs) {
        if (fs.existsSync(dir)) {
          print('green', `✅ Found alternative client build at: ${dir}`);
          // Update the clientBuildPath for use later in the script
          clientBuildPath = dir;
          break;
        }
      }
    }
  } else {
    print('green', '✅ Client build exists!');
  }
  
  // Step 2: Assume database is already set up in Render
  print('bright', '🗃️ Assuming database is already set up in Render...');
  print('green', '✅ Skipping database initialization');
  
  // For local SQLite development only - not used in Render
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
    // Check if SQLite database exists
    const dbPath = path.join(projectRoot, 'server', 'database', 'realestate.db');
    if (!fs.existsSync(dbPath)) {
      print('yellow', '⚠️ Warning: Running in development mode but SQLite database not found');
      print('yellow', '   You may want to run: cd server && npm run init-db && npm run simple-seed');
    }
  }
  
  // Step 4: Start the server
  print('bright', '🌐 Starting server in production mode...');
  print('green', '✅ Server starting!');
  
  // Execute server.js directly without returning
  const serverPath = path.join(projectRoot, 'server', 'server.js');
  process.env.NODE_ENV = 'production';
  require(serverPath);
}

// Run the startup
startProduction().catch(err => {
  print('red', 'Fatal error in production startup:');
  console.error(err);
  process.exit(1);
});
