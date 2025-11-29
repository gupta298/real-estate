# Real Estate Website with MLS Integration

A modern, full-stack real estate website with direct MLS (Multiple Listing Service) integration, similar to blueflagindy.com.

## Features

- 🏠 **MLS Integration**: Direct connection to MLS API for real-time property listings
- 🔍 **Advanced Search**: Filter by price, location, bedrooms, bathrooms, property type, and more
- 📱 **Responsive Design**: Beautiful, modern UI that works on all devices
- 🖼️ **Property Galleries**: Multiple images per property with thumbnail navigation
- 📊 **Property Details**: Comprehensive property information including features, amenities, and tax data
- ⚡ **Real-time Sync**: Automated MLS data synchronization
- 🎨 **Modern UI**: Built with Next.js, React, and Tailwind CSS

## Tech Stack

### Frontend
- **Next.js 14** - React framework
- **React 18** - UI library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **SQLite** - Database (easily upgradeable to PostgreSQL)
- **MLS Service** - Integration layer for MLS API

## Project Structure

```
real-estate-website/
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Next.js pages
│   │   ├── styles/        # Global styles
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── services/          # Business logic (MLS service)
│   ├── database/          # Database schema and connection
│   └── scripts/           # Utility scripts
└── package.json           # Root package.json
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MLS API credentials (if using real MLS integration)

### Installation

1. **Install dependencies:**
```bash
npm run install:all
```

2. **Set up environment variables:**

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

3. **Initialize the database:**
```bash
npm run init-db
```

4. **Sync MLS data (optional):**
```bash
cd server && npm run sync-mls
```

Or trigger via API:
```bash
curl -X POST http://localhost:5000/api/mls/sync
```

### Running the Application

**Development mode (runs both frontend and backend):**
```bash
npm run dev
```

**Or run separately:**

Backend:
```bash
npm run dev:server
```

Frontend:
```bash
npm run dev:client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## API Endpoints

### Properties
- `GET /api/properties` - Get all properties (with pagination and filters)
- `GET /api/properties/featured` - Get featured properties
- `GET /api/properties/:id` - Get property by ID
- `GET /api/properties/mls/:mlsNumber` - Get property by MLS number

### Search
- `POST /api/search` - Advanced property search
- `GET /api/search/suggestions` - Get search suggestions (cities, property types)

### MLS
- `POST /api/mls/sync` - Trigger MLS data synchronization
- `GET /api/mls/sync/status` - Get sync status and logs
- `GET /api/mls/config` - Get MLS configuration status

### Health
- `GET /api/health` - Health check endpoint

## MLS Integration

The MLS service (`server/services/mlsService.js`) provides:

1. **MLS API Connection**: Connects to MLS API to fetch listings
2. **Data Transformation**: Converts MLS data format to our database schema
3. **Automatic Sync**: Can be scheduled to sync data periodically
4. **Error Handling**: Comprehensive error handling and logging

### Setting Up MLS Integration

1. Obtain MLS API credentials from your MLS provider
2. Update `MLS_API_KEY` and `MLS_API_URL` in `server/.env`
3. Modify `fetchListings()` method in `mlsService.js` to match your MLS API format
4. Adjust data transformation methods to match your MLS data structure

### MLS Data Format

The service expects MLS listings in a standard format. Update the transformation methods in `mlsService.js` to match your specific MLS provider's data structure.

## Database Schema

The database includes tables for:
- **properties**: Main property data from MLS
- **property_images**: Property photos and images
- **property_features**: Features and amenities
- **mls_sync_log**: Sync operation logs
- **saved_searches**: User saved searches

## Frontend Pages

- `/` - Homepage with featured properties
- `/properties` - Browse all properties
- `/properties/[id]` - Property detail page
- `/search` - Advanced search page

## Customization

### Styling
- Modify `client/tailwind.config.js` for theme customization
- Update `client/src/styles/globals.css` for global styles

### Components
- All components are in `client/src/components/`
- Reusable components: Header, Footer, PropertyCard, SearchFilters

## Production Deployment

1. **Build the frontend:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start the server:**
```bash
npm start
```

## Notes

- The MLS integration is set up as a mock/service layer. Replace the `fetchListings()` method with your actual MLS API integration.
- SQLite is used for development. For production, consider PostgreSQL or MySQL.
- Image handling: Currently uses external URLs. For production, implement proper image upload and storage.

## License

MIT

