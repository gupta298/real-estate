const express = require('express');
const cors = require('cors');
const path = require('path');
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

