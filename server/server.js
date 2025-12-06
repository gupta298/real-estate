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
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Subdomain routing - handle offmarket.blueflagindy.com and blog.blueflagindy.com
app.use((req, res, next) => {
  const host = req.hostname || req.headers.host || '';
  
  // Log incoming requests to help with debugging
  console.log(`📝 Request: ${host}${req.url}`);
  
  // Check if this is a special path (/off-market or /blogs) that shouldn't be redirected
  const isOffMarketPath = req.url.startsWith('/off-market');
  const isBlogsPath = req.url.startsWith('/blogs');
  
  // Handle offmarket subdomain
  if (host === 'offmarket.blueflagindy.com' || host.startsWith('offmarket.')) {
    // Only redirect if not already on an off-market path
    if (!isOffMarketPath) {
      // For root path, redirect to /off-market
      if (req.url === '/' || req.url === '') {
        console.log(`🔜 Redirecting ${host}${req.url} to /off-market`);
        return res.redirect('/off-market');
      }
      // For other paths, prefix with /off-market
      console.log(`🔜 Redirecting ${host}${req.url} to /off-market${req.url}`);
      return res.redirect(`/off-market${req.url}`);
    } else {
      console.log(`✅ Already on off-market path: ${req.url}`);
    }
  }
  
  // Handle blog subdomain
  if (host === 'blog.blueflagindy.com' || host.startsWith('blog.')) {
    // Only redirect if not already on a blogs path
    if (!isBlogsPath) {
      // For root path, redirect to /blogs
      if (req.url === '/' || req.url === '') {
        console.log(`🔜 Redirecting ${host}${req.url} to /blogs`);
        return res.redirect('/blogs');
      }
      // For other paths, prefix with /blogs
      console.log(`🔜 Redirecting ${host}${req.url} to /blogs${req.url}`);
      return res.redirect(`/blogs${req.url}`);
    } else {
      console.log(`✅ Already on blogs path: ${req.url}`);
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

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// In production, serve the Next.js static files
if (process.env.NODE_ENV === 'production') {
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
    // Serve static assets
    app.use(express.static(clientBuildPath));
    
    // For all other routes, serve index.html (for client-side routing)
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      // Check if the specific path exists as a file
      const filePath = path.join(clientBuildPath, req.path);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return res.sendFile(filePath);
      }
      
      // Try to find index.html
      const indexPath = path.join(clientBuildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      
      // If no index.html, try other common entry files
      const alternativeFiles = ['_index.html', 'main.html', 'app.html'];
      for (const file of alternativeFiles) {
        const altPath = path.join(clientBuildPath, file);
        if (fs.existsSync(altPath)) {
          return res.sendFile(altPath);
        }
      }
      
      // If we can't find any suitable file, pass to next handler
      next();
    });
  } else {
    console.warn('⚠️ Next.js static build not found in any of the expected locations');
  }
}

// Routes
app.use('/api/properties', propertyRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/mls', mlsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/seller-inquiries', sellerInquiryRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/off-market', offMarketRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/api/health', (req, res) => {
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

