# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm run install:all
```

This will install dependencies for root, server, and client.

## Step 2: Configure Environment Variables

### Server Configuration

Create `server/.env` file:

```env
PORT=5000
NODE_ENV=development
DB_PATH=./database/realestate.db
MLS_API_KEY=your_mls_api_key_here
MLS_API_URL=https://api.mls.com/v1
MLS_SYNC_INTERVAL=3600000
CORS_ORIGIN=http://localhost:3000
```

### Client Configuration

Create `client/.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Step 3: Initialize Database

```bash
npm run init-db
```

This creates the database schema and tables.

## Step 4: (Optional) Sync MLS Data

If you have MLS API credentials configured:

```bash
cd server && npm run sync-mls
```

Or trigger via API:
```bash
curl -X POST http://localhost:5000/api/mls/sync
```

## Step 5: Start Development Servers

Run both frontend and backend:

```bash
npm run dev
```

Or run separately:

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:client
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## MLS Integration Setup

1. **Get MLS API Credentials**: Contact your MLS provider to obtain API access
2. **Update MLS Service**: Edit `server/services/mlsService.js`:
   - Modify `fetchListings()` to match your MLS API endpoint
   - Adjust `transformMLSListing()` to match your MLS data format
   - Update field mappings in transformation methods

3. **Common MLS Providers**:
   - RETS (Real Estate Transaction Standard)
   - RESO Web API
   - Custom MLS APIs

4. **Test Integration**: Use the sync endpoint to test your MLS connection

## Troubleshooting

### Database Issues
- Ensure SQLite is installed
- Check file permissions for database directory
- Verify DB_PATH in .env matches actual path

### MLS Sync Issues
- Verify MLS_API_KEY is correct
- Check MLS_API_URL matches your provider
- Review sync logs: `GET /api/mls/sync/status`
- Check server console for detailed error messages

### Frontend Issues
- Clear Next.js cache: `rm -rf client/.next`
- Verify NEXT_PUBLIC_API_URL matches backend URL
- Check browser console for API errors

## Next Steps

1. Customize branding and styling
2. Add your MLS API integration
3. Configure image storage (currently uses external URLs)
4. Set up production database (PostgreSQL recommended)
5. Deploy to your hosting platform

