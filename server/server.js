const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const propertyRoutes = require('./routes/properties');
const searchRoutes = require('./routes/search');
const mlsRoutes = require('./routes/mls');
const { router: authRoutes } = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const inquiryRoutes = require('./routes/inquiries');
const sellerInquiryRoutes = require('./routes/seller-inquiries');
const adminRoutes = require('./routes/admin');
const offMarketRoutes = require('./routes/off-market');
const blogRoutes = require('./routes/blogs');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Define CORS options for reuse
const corsOptions = {
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if(!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.CORS_ORIGIN || 'http://localhost:3000',
      'https://blueflagindy.com',
      'https://www.blueflagindy.com',
      'https://blog.blueflagindy.com',
      'https://offmarket.blueflagindy.com',
      // Allow any Render.com preview domains
      /.*\.onrender\.com$/
    ];
    
    // Check if the origin is allowed
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Request']
};

// Apply CORS to all requests
app.use(cors(corsOptions));

// Handle OPTIONS requests explicitly for all API routes
app.options('*', cors(corsOptions));

// We'll configure static file serving after middleware setup

// Define static file patterns to skip redirects for
const STATIC_FILE_PATTERNS = [
  /^\/_next\//,
  /^\/static\//,
  /^\/api\//,
  /\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|json|map|webp)$/
];

// Enhanced subdomain routing with better path handling
app.use((req, res, next) => {
  const host = req.hostname || req.headers.host || '';
  const url = req.url;
  
  // Check if this is a static file request
  const isStaticFile = STATIC_FILE_PATTERNS.some(pattern => pattern.test(url));
  
  // Skip routing logic for static files and API requests
  if (isStaticFile) {
    console.log(`🔍 [${new Date().toISOString()}] Static file request (bypassing redirect): ${url}`);
    return next();
  }
  
  // Log all incoming requests with full details
  console.log(`📝 [${new Date().toISOString()}] Request: ${host}${url}`);
  
  // Check if on offmarket subdomain
  const isOffmarketSubdomain = host === 'offmarket.blueflagindy.com' || host.startsWith('offmarket.');
  
  // Check if on blog subdomain
  const isBlogSubdomain = host === 'blog.blueflagindy.com' || host.startsWith('blog.');
  
  // Handle offmarket subdomain
  if (isOffmarketSubdomain) {
    // Make sure any request on the subdomain properly shows the off-market content
    // Only redirect if not already on the off-market path and not a static asset
    if (!url.startsWith('/off-market') && !url.startsWith('/api/')) {
      console.log(`🔜 Redirecting ${host}${url} to /off-market`);
      return res.redirect('/off-market');
    } else {
      console.log(`✅ Already on off-market path: ${url}`);
    }
  }
  
  // Handle blog subdomain
  if (isBlogSubdomain) {
    // Only redirect if not already on the blogs path and not a static asset
    if (!url.startsWith('/blogs') && !url.startsWith('/api/')) {
      console.log(`🔜 Redirecting ${host}${url} to /blogs`);
      return res.redirect('/blogs');
    } else {
      console.log(`✅ Already on blogs path: ${url}`);
    }
  }
  next();
});

// Allow iframe embedding only from blueflagindy.com
app.use((req, res, next) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Content-Security-Policy', "frame-ancestors https://blueflagindy.com;");
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the Next.js static files
// List of possible build directories to check
const possibleBuildPaths = [
  path.join(__dirname, '..', 'client', 'out'),
  path.join(__dirname, '..', 'client', '.next'),
  path.join(__dirname, '..', 'client', 'build'),
  path.join(__dirname, '..', 'client', 'dist')
];

// Find the first existing build directory
let clientBuildPath = null;
for (const buildPath of possibleBuildPaths) {
  if (fs.existsSync(buildPath)) {
    clientBuildPath = buildPath;
    console.log('✅ Serving Next.js static build from:', clientBuildPath);
    break;
  }
}

if (clientBuildPath) {
  // Add a MIME type map to ensure files are served with the correct Content-Type
  const mimeTypes = {
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.html': 'text/html',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
  };
  
  // Serve static assets with FULL control over MIME types and headers
  app.use(express.static(clientBuildPath, {
    maxAge: '1h', // Cache static assets for 1 hour
    setHeaders: (res, filePath) => {
      // Get the file extension
      const ext = path.extname(filePath).toLowerCase();
      
      // Set the correct Content-Type if we have it mapped
      if (mimeTypes[ext]) {
        res.setHeader('Content-Type', mimeTypes[ext]);
      }
      
      // For JS files, add important security headers
      if (ext === '.js') {
        res.setHeader('X-Content-Type-Options', 'nosniff');
      }
      
      // Allow cross-origin access to fix subdomain issues
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Vary', 'Origin');
      
      // Log content type for debugging
      console.log(`🔤 Serving ${ext} file with type: ${mimeTypes[ext] || 'default'}`);
    },
    fallthrough: true // Fallthrough to other handlers if file not found
  }));
    
    // Special handler just for known problematic static resources
    app.get('/_next/static/**/*', (req, res, next) => {
      const fullPath = path.join(clientBuildPath, req.path);
      console.log(`⭐ Special handling for Next.js asset: ${req.path}`);
      
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        // Get the file extension
        const ext = path.extname(fullPath).toLowerCase();
        
        // Set appropriate content type
        if (ext === '.js') {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (ext === '.css') {
          res.setHeader('Content-Type', 'text/css');
        }
        
        return res.sendFile(fullPath);
      }
      
      // If file doesn't exist, continue to next handler
      next();
    });
    
    // For all routes except API routes, serve the appropriate HTML file
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Special handling for Next.js static assets that might have been missed
      if (req.path.includes('/_next/') || req.path.match(/\.(js|css|json|map)$/)) {
        console.log(`🔍 Detected missed static file: ${req.path}`);
        const fullPath = path.join(clientBuildPath, req.path);
        
        if (fs.existsSync(fullPath)) {
          const ext = path.extname(fullPath).toLowerCase();
          if (ext === '.js') {
            res.setHeader('Content-Type', 'application/javascript');
          } else if (ext === '.css') {
            res.setHeader('Content-Type', 'text/css');
          } else if (ext === '.json') {
            res.setHeader('Content-Type', 'application/json');
          }
          return res.sendFile(fullPath);
        }
      }
      
      console.log(`🔄 Handling HTML route: ${req.path}`);
      
      // First check if the path maps directly to an HTML file
      // (like /about.html or /blogs/page1.html)
      const htmlPath = req.path.endsWith('.html') ? 
        path.join(clientBuildPath, req.path) : 
        path.join(clientBuildPath, `${req.path}.html`);
      
      if (fs.existsSync(htmlPath) && fs.statSync(htmlPath).isFile()) {
        console.log(`📄 Serving HTML file: ${htmlPath}`);
        return res.sendFile(htmlPath);
      }
      
      // Next check if there's an index.html in a directory matching the path
      const dirIndexPath = path.join(clientBuildPath, req.path, 'index.html');
      if (fs.existsSync(dirIndexPath) && fs.statSync(dirIndexPath).isFile()) {
        console.log(`📄 Serving directory index: ${dirIndexPath}`);
        return res.sendFile(dirIndexPath);
      }
      
      // Finally, fall back to the main index.html for client-side routing
      const indexPath = path.join(clientBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        console.log(`📄 Serving main index.html for: ${req.path}`);
        return res.sendFile(indexPath);
      }
      
      // If we can't find any suitable file, generate a simple error page
      console.warn(`⚠️ No suitable file found for: ${req.path}`);
      
      // Generate a helpful debug page
      const debugPage = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Debug Info - ${req.hostname}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; background: #f7f7f7; padding: 20px; border-radius: 5px; }
            h1 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
            pre { background: #eee; padding: 10px; overflow: auto; border-radius: 3px; }
            .path { font-weight: bold; color: #0066cc; }
            .error { color: #cc0000; }
            .info { background: #e6f7ff; border-left: 4px solid #1890ff; padding: 10px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Debug Information</h1>
            <p class="info">This page is shown because the server could not find a suitable file to serve for this request.</p>
            
            <h2>Request Details</h2>
            <ul>
              <li><strong>Hostname:</strong> ${req.hostname}</li>
              <li><strong>Path:</strong> <span class="path">${req.path}</span></li>
              <li><strong>Method:</strong> ${req.method}</li>
              <li><strong>IP:</strong> ${req.ip}</li>
              <li><strong>Is Subdomain:</strong> ${req.hostname.includes('.blueflagindy.com')}</li>
            </ul>
            
            <h2>File Search Attempts</h2>
            <p>The server looked for the following files:</p>
            <pre>${htmlPath}\n${dirIndexPath}\n${indexPath}</pre>
            
            <p>Please check the server logs for more information.</p>
          </div>
        </body>
        </html>
      `;
      
      res.setHeader('Content-Type', 'text/html');
      return res.status(404).send(debugPage);
    });
  } else {
    console.warn('⚠️ Next.js static build not found in any of the expected locations');
}

// Define subdomain routing middleware
app.use((req, res, next) => {
  // Skip for static files, API requests, and direct API calls
  if (req.path.startsWith('/_next/') || 
      req.path.startsWith('/static/') ||
      req.path.startsWith('/api/') ||
      (req.headers.accept && req.headers.accept.includes('application/json'))) {
    console.log(`🔍 [${new Date().toISOString()}] Static file or API request (bypassing redirect): ${req.path}`);
    return next();
  }
  
  // Special handling for blog subdomain
  if (req.hostname === 'blog.blueflagindy.com' || req.hostname.startsWith('blog.')) {
    // Don't redirect already-on-blogs paths
    if (req.path === '/' || req.path === '') {
      console.log(`📍 [${new Date().toISOString()}] Blog root request - ensuring /blogs/ path`);
      req.url = '/blogs/';
    }
  }
  
  // Log all incoming requests with full details
  console.log(`📝 [${new Date().toISOString()}] Request: ${req.hostname}${req.url}`);
  
  next();
});

// Routes - mount at both /api/ path and direct root path for flexibility
// Original // API Routes - Mount both at /api prefix and root paths for subdomain compatibility
// Main API routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/off-market', offMarketRoutes);
app.use('/api/seller-inquiries', sellerInquiryRoutes);
app.use('/api/agents', agentRoutes);

// Blogs API needs special handling to avoid conflicts with the /blogs route
app.use('/api/blogs', cors(corsOptions), (req, res, next) => {
  console.log(`🔧 [${new Date().toISOString()}] API blogs request: ${req.path} from ${req.headers['host'] || 'unknown'}`);
  
  // Ensure we always respond with JSON, not HTML
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Pass to the blog routes handler
  return blogRoutes(req, res, next);
});

app.use('/api/upload', uploadRoutes);

// Also mount the same routes directly at root for// Direct routes (no /api prefix) - Used for subdomain access
app.use('/auth', authRoutes);
app.use('/properties', propertyRoutes);
app.use('/admin', adminRoutes);
app.use('/off-market', offMarketRoutes);
app.use('/seller-inquiries', sellerInquiryRoutes);
app.use('/agents', agentRoutes);

// Handle OPTIONS requests for /blogs endpoint explicitly
app.options('/blogs*', cors(corsOptions));

// Special handling for /blogs route to distinguish API calls from page requests
app.use('/blogs', (req, res, next) => {
  // Check if this is an API request or a page request using multiple signals
  const isApiRequest = (
    // Check for JSON Accept header
    (req.headers.accept && req.headers.accept.includes('application/json')) || 
    // Check for XHR request
    req.xhr || 
    // Check for explicit XHR header
    req.headers['x-requested-with'] === 'XMLHttpRequest' ||
    // Check for our custom API header
    req.headers['x-api-request'] === 'true' ||
    // Check for query params that suggest API usage
    req.query.format === 'json'
  );

  console.log(`🔎 [${new Date().toISOString()}] Blogs request: ${req.path} - API: ${isApiRequest} (Headers: ${JSON.stringify(req.headers['x-requested-with'] || {})})`);
  
  if (isApiRequest) {
    // For API requests, set JSON content type and pass to API handler
    console.log(`✅ [${new Date().toISOString()}] Handling as API request: ${req.path}`);
    res.setHeader('Content-Type', 'application/json');
    return blogRoutes(req, res, next);
  }
  
  console.log(`📄 [${new Date().toISOString()}] Handling as page request: ${req.path}`);
  // For page requests, continue to the HTML handler
  next();
});

app.use('/upload', uploadRoutes);

// Health check - available at both /api/health and /health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString()
  });
});

// Duplicate health check at root path
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Real Estate API is running',
    timestamp: new Date().toISOString()
  });
});

const db = require('./database/db');

// Test database connection
db.get('SELECT 1 AS test', (err, row) => {
  if (err) {
    console.error('❌ Database connection error:', err);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Production mode: Serving both API and frontend`);
  }
});

