# Database Setup and Seeding Instructions

This document explains the updated database initialization, migration, and seeding process.

## New Integrated Command

The `migrate-all` command has been enhanced to automatically seed the database after running migrations. This single command will:

1. Run all necessary database migrations
2. Seed off-market deals
3. Seed blog posts
4. Create an admin user

### Usage

```bash
# From the project root
npm run migrate-seed-all

# Or directly from the server directory
cd server
npm run migrate-all
```

## Individual Commands

If you need to run individual steps manually:

```bash
# Initialize the database schema
npm run init-db

# Run all migrations
npm run migrate-all

# Seed specific data
npm run seed-off-market  # Seed off-market deals
npm run seed-blogs       # Seed blog posts
npm run create-admin     # Create admin user
npm run seed-agents      # Seed agent profiles

# Run all seeding commands
npm run seed-all
```

## Production Deployment

During production deployment, the updated `migrate-all` command will be executed automatically as part of the initialization process, ensuring that the database is properly migrated and seeded with sample data.

## What's Changed

Previously, the `migrate-all` command only ran database migrations. The script has been enhanced to also run:
- Off-market deals seeding
- Blog posts seeding
- Admin user creation

This ensures that the subdomains (`offmarket.blueflagindy.com` and `blog.blueflagindy.com`) will have content to display once the site is deployed.

## Troubleshooting

If you encounter issues:

1. Check the console output for specific error messages
2. Verify database file permissions
3. Ensure the database file exists and is accessible
4. Try running the individual commands manually to isolate the problem
