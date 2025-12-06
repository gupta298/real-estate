# Render Deployment Guide

This guide explains how to deploy the Real Estate Website to Render.com.

## Deployment Commands

When setting up your Render deployment, use these commands:

### Build Command
```
npm run production:build
```

### Start Command
```
npm run production:deploy
```

## What These Commands Do

1. **Build Command (`npm run production:build`)**
   - Checks Node.js and npm versions
   - Installs all dependencies for both server and client
   - Builds the Next.js app as static files
   - Prepares the server for production

2. **Start Command (`npm run production:deploy`)**
   - Initializes the SQLite database if needed
   - Runs all migrations to set up the database schema
   - Serves both the API and the Next.js frontend from a single Express server
   - The frontend is served as static files from the build directory

## Environment Variables

Set these environment variables in your Render dashboard:

- `NODE_ENV`: `production`
- `PORT`: `10000` (or let Render assign one)
- `CORS_ORIGIN`: Your frontend URL (if different from the main URL)

## Database Setup

The application uses SQLite, which is automatically set up during deployment. The database file will be stored in the persistent disk provided by Render.

## Health Checks

The application provides a health check endpoint at `/api/health` that Render can use to verify the application is running correctly.

## Manual Deployment

If you prefer to deploy manually instead of using the `render.yaml` file:

1. Create a new Web Service in the Render dashboard
2. Connect your GitHub repository
3. Select the Node environment
4. Enter the build and start commands as listed above
5. Set the necessary environment variables
6. Deploy the service

## Troubleshooting

If you encounter issues during deployment:

1. Check the Render logs for specific error messages
2. Verify that the database initialization completed successfully
3. Ensure that the static build for the client was generated correctly
4. Confirm that the environment variables are set correctly

For database-specific issues, you can SSH into your Render instance and check the database file in the `/server/database/` directory.
