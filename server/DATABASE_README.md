# Database Setup Guide

## Overview

This project supports two database configurations:

1. **SQLite** - Used for local development
2. **PostgreSQL** - Used for production deployment on Render

The application will automatically detect which database to use based on the presence of the `DATABASE_URL` environment variable or if `NODE_ENV` is set to `production`.

## PostgreSQL on Render

When deploying to Render, a PostgreSQL database is automatically provisioned via the `render.yaml` configuration. This ensures your database persists between deployments.

### Benefits of PostgreSQL on Render

- **Persistent Storage**: Data survives between deployments
- **Scalability**: Better suited for production traffic 
- **Reliability**: Professional database service with backups

## Minimal Seed Data

The `simple-seed.js` script creates minimal data for testing:

1. One blog post with an image
2. One off-market listing with an image
3. An admin user (email: admin@blueflagrealty.com, default password: admin123)

You can override the admin credentials using environment variables:

- `ADMIN_EMAIL`: Custom admin email
- `ADMIN_PASSWORD`: Custom admin password

## Database Scripts

- `npm run init-db`: Initialize the database schema (uses appropriate schema for SQLite or PostgreSQL)
- `npm run simple-seed`: Create minimal seed data (blog post, off-market listing, and admin user)
- `npm run create-admin`: Create a custom admin user (usage: `npm run create-admin -- user@example.com password123`)
- `npm run setup`: Full setup - initializes database and creates minimal seed data

## Deployment Process

### Initial PostgreSQL Setup (Handled Separately)

When deploying to Render for the first time, you need to manually set up the database:

1. Deploy the application first (the PostgreSQL service will be created)  
2. Then connect to the database using SSH from Render's dashboard
3. Run the following commands to set up the database:
   ```bash
   # SSH into your web service from Render Dashboard
   cd server
   npm run init-db    # Creates the database schema
   npm run simple-seed # Creates admin user, blog post, and listing
   ```

### Subsequent Deployments

For subsequent deployments, the application will:

1. Connect to the existing PostgreSQL database service
2. Start the server without attempting to modify the database

This ensures that database contents persist between deployments.

## Testing PostgreSQL Locally

If you want to test PostgreSQL locally:

1. Run a local PostgreSQL instance: `docker run -e POSTGRES_PASSWORD=password -p 5432:5432 postgres`
2. Set the environment variable: `export DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres`
3. Initialize the database: `npm run init-db`
4. Add seed data: `npm run simple-seed`

## Schema Files

- `schema.sql`: SQLite schema (used in development)
- `schema.postgres.sql`: PostgreSQL schema (used in production)

The application automatically selects the appropriate schema file based on the environment.
