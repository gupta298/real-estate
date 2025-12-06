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
   - Installs all dependencies for both server and client using `npm install`
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

## Subdomain Routing

The application is configured to handle subdomain routing for specialized content paths. The following subdomains are configured:

- `offmarket.blueflagindy.com`: Redirects to the `/off-market` path
- `blog.blueflagindy.com`: Redirects to the `/blogs` path

### How it works

1. The Express server checks the incoming request's hostname
2. Based on the subdomain, it redirects to the appropriate path:
   - `offmarket.blueflagindy.com` → `/off-market` path
   - `blog.blueflagindy.com` → `/blogs` path
3. This ensures users see the relevant content when visiting each subdomain

### Custom Domain Configuration

In the `render.yaml` file, the following domains are configured:
- blueflagindy.com (main domain)
- www.blueflagindy.com (www subdomain)
- offmarket.blueflagindy.com (off-market subdomain)
- blog.blueflagindy.com (blog subdomain)

Make sure these domains are also configured in your DNS settings at GoDaddy to point to your Render service.

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

## Common Deployment Issues and Solutions

### Issue: `npm ci` fails with missing package-lock.json

We've updated the scripts to use `npm install` instead of `npm ci` to avoid this issue. If you're manually modifying the scripts, make sure to use `npm install` unless you've committed package-lock.json files to your repository.

### Issue: Node.js version incompatibility

Render automatically detects the Node.js version from your package.json. Make sure the `engines` field in your package.json is correctly set to `"node": ">=18.17.0"`.

### Issue: Static files not found

If the frontend isn't showing up, check that the Next.js build was successful and that the static files were generated in the expected location (`client/out` directory). You can SSH into your Render instance to verify this.

### Issue: Database initialization failed

Make sure your Render service has enough disk space for the SQLite database and that the database directory is writable. You can check the logs for any specific errors related to database initialization.
