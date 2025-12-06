# Subdomain Configuration Guide

This document explains how subdomain routing works in this application and how to troubleshoot common issues.

## Subdomain Architecture

The application supports two subdomains:

1. `offmarket.blueflagindy.com` - Displays off-market properties
2. `blog.blueflagindy.com` - Displays blog content

## How It Works

### Server-Side Routing
When a request comes in to one of these subdomains:

1. The Express server checks the hostname to identify subdomain requests.
2. Static files (JS, CSS, images) are served without redirection.
3. For HTML routes on `offmarket.blueflagindy.com`, users are redirected to `/off-market`.
4. For HTML routes on `blog.blueflagindy.com`, users are redirected to `/blogs`.
5. API requests are passed through to the appropriate handler.

### Client-Side Handling
On the client side:

1. The `_app.js` component detects if it's running on a subdomain.
2. When on a subdomain, it uses a simplified layout without the header/footer.
3. The `apiConfig.js` utility ensures API requests go to the correct backend URL.
4. Special components (`SubdomainOffMarket.js` and `SubdomainBlogs.js`) provide simplified UI.

## Common Issues & Solutions

### 1. JavaScript/CSS Loading Errors

**Symptoms:** Console errors like `Unexpected token '<'` for JS files

**Solution:**
- Check that static file routing is properly configured in `server.js`
- Ensure proper Content-Type headers are being set
- Verify the paths to static assets are correct

### 2. API Requests Failing

**Symptoms:** Network errors, 404s on API calls

**Solution:**
- Check the API URL being used in the browser console
- Verify CORS settings allow requests from the subdomain
- Use the browser's Network tab to inspect requests/responses

### 3. Redirect Loops

**Symptoms:** Browser shows "too many redirects" error

**Solution:**
- Check the subdomain routing logic in `server.js`
- Ensure only non-static, non-API requests are being redirected
- Verify that redirects don't create loops

## Testing Subdomains Locally

To test subdomains locally:

1. Add entries to your `/etc/hosts` file:
   ```
   127.0.0.1 offmarket.localhost
   127.0.0.1 blog.localhost
   ```

2. Run the server and access `http://offmarket.localhost:5000` or `http://blog.localhost:5000`

3. Alternatively, use the query param approach for testing:
   ```
   http://localhost:5000/?subdomain=offmarket
   http://localhost:5000/?subdomain=blog
   ```

## Troubleshooting Steps

If you're seeing issues with subdomain routing:

1. Check server logs for request paths and any errors
2. Verify static files are being served with correct headers
3. Test API endpoints directly to confirm they're working
4. Clear browser cache and cookies
5. Try in an incognito/private browsing window
