# Environment Variables

This document explains the environment variables used in the BlueFlag Indy real estate website.

## Production Environment Variables

When deploying the application to production, configure the following environment variables in your Render dashboard:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `NODE_ENV` | `production` | Sets the Node.js environment to production mode |
| `PORT` | `10000` | The port on which the server will listen |
| `NEXT_PUBLIC_API_URL` | `https://blueflagindy.com/api` | The URL for API calls from the client side |
| `CORS_ORIGIN` | `https://blueflagindy.com,https://www.blueflagindy.com,https://offmarket.blueflagindy.com,https://blog.blueflagindy.com` | Allowed origins for CORS |

## Environment Variable Details

### NODE_ENV

- **Required**: Yes
- **Default**: none
- **Description**: Tells the application to run in production mode, enabling optimizations, disabling development features, and modifying behavior for a production environment.

### PORT

- **Required**: Yes
- **Default**: `5000`
- **Description**: The port number on which the Express server will listen for incoming requests. Render may require a specific port.

### NEXT_PUBLIC_API_URL

- **Required**: Yes
- **Default**: Calculated based on the hostname
- **Description**: The base URL for API calls made from the client side. In production, this should point to the API endpoint of your main domain. Any variable starting with `NEXT_PUBLIC_` is accessible from both client and server code.

### CORS_ORIGIN

- **Required**: Yes
- **Default**: `http://localhost:3000`
- **Description**: A comma-separated list of domains allowed to make cross-origin requests to your API. Include your main domain and all subdomains that need API access.

## Special Subdomain Configuration

For subdomains to work correctly, the application now uses smart detection in `apiConfig.js` that sets the API URL based on the current hostname:

- Main domain (`blueflagindy.com`): Uses its own API
- Subdomains (`*.blueflagindy.com`): Uses the main domain API
- Render previews (`*.render.com`): Uses their own API
- Local development (`localhost`): Uses `http://localhost:5000/api`

## Setting Environment Variables

### In Render

1. Go to your Render dashboard
2. Select your web service
3. Click the "Environment" tab
4. Add each environment variable as a key-value pair
5. Click "Save Changes" and redeploy your application

### For Local Development

Create a `.env.local` file in your project root with the following content:

```
NODE_ENV=development
PORT=5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
CORS_ORIGIN=http://localhost:3000
```
