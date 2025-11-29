# Google Maps API Setup for Address Autocomplete

The seller inquiry form uses Google Places API for address autocomplete. To enable this feature, you need to set up a Google Maps API key.

## Steps to Get Google Maps API Key

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/

2. **Create a New Project (or select existing)**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Enter a project name (e.g., "Real Estate Website")
   - Click "Create"

3. **Enable Required APIs**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for and enable:
     - **Places API**
     - **Maps JavaScript API**

4. **Create API Key**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

5. **Restrict API Key (Recommended for Production)**
   - Click on the API key you just created
   - Under "API restrictions", select "Restrict key"
   - Choose:
     - Places API
     - Maps JavaScript API
   - Under "Application restrictions", you can restrict by HTTP referrer for web apps

6. **Add API Key to Environment Variables**
   - Create or edit `client/.env.local` file
   - Add:
     ```
     NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
     ```
   - Restart your development server

## Free Tier Limits

Google Maps Platform offers a free tier:
- **$200 free credit per month**
- Places API: $17 per 1,000 requests
- Maps JavaScript API: $7 per 1,000 requests

This typically covers thousands of address autocomplete requests per month for free.

## Alternative: Using Without API Key

If you don't want to use Google Maps API, the form will still work but without address autocomplete. Users will need to manually enter their address, city, state, and ZIP code.

## Phone Number Validation

Phone numbers are validated using `libphonenumber-js` library, which validates US phone numbers and formats them in E.164 format (e.g., +13175551234) for storage.

