-- PostgreSQL compatible schema for real estate website
-- Converted from SQLite schema

-- Properties table (synced from MLS + off-market listings)
CREATE TABLE IF NOT EXISTS properties (
  id SERIAL PRIMARY KEY,
  mlsNumber TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12, 2) NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipCode TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL(3, 1) NOT NULL,
  squareFeet INTEGER,
  lotSize DECIMAL(10, 2),
  propertyType TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  yearBuilt INTEGER,
  garage INTEGER DEFAULT 0,
  parkingSpaces INTEGER DEFAULT 0,
  propertyTax DECIMAL(10, 2),
  hoaFee DECIMAL(10, 2),
  featured BOOLEAN DEFAULT false,
  isOffMarket BOOLEAN DEFAULT false,
  mlsStatus TEXT,
  listingDate TIMESTAMP,
  lastModified TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property images table
CREATE TABLE IF NOT EXISTS property_images (
  id SERIAL PRIMARY KEY,
  propertyId INTEGER NOT NULL,
  mlsNumber TEXT NOT NULL,
  imageUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  isPrimary BOOLEAN DEFAULT false,
  displayOrder INTEGER DEFAULT 0,
  caption TEXT,
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE
);

-- Property features/amenities table
CREATE TABLE IF NOT EXISTS property_features (
  id SERIAL PRIMARY KEY,
  propertyId INTEGER NOT NULL,
  mlsNumber TEXT NOT NULL,
  feature TEXT NOT NULL,
  category TEXT,
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE
);

-- MLS sync log table
CREATE TABLE IF NOT EXISTS mls_sync_log (
  id SERIAL PRIMARY KEY,
  syncType TEXT NOT NULL,
  status TEXT NOT NULL,
  recordsProcessed INTEGER DEFAULT 0,
  recordsAdded INTEGER DEFAULT 0,
  recordsUpdated INTEGER DEFAULT 0,
  recordsDeleted INTEGER DEFAULT 0,
  errorMessage TEXT,
  startedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completedAt TIMESTAMP
);

-- Users table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id SERIAL PRIMARY KEY,
  userId INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Agents table (brokerage agents)
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  licenseNumber TEXT,
  bio TEXT,
  specialties TEXT,
  yearsExperience INTEGER,
  profileImageUrl TEXT,
  isBroker BOOLEAN DEFAULT false,
  isActive BOOLEAN DEFAULT true,
  displayOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property inquiries table (required form submissions)
CREATE TABLE IF NOT EXISTS property_inquiries (
  id SERIAL PRIMARY KEY,
  propertyId INTEGER NOT NULL,
  mlsNumber TEXT,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  agentId INTEGER,
  userId INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (propertyId) REFERENCES properties(id) ON DELETE CASCADE,
  FOREIGN KEY (agentId) REFERENCES agents(id),
  FOREIGN KEY (userId) REFERENCES users(id)
);

-- Saved searches table (for users)
CREATE TABLE IF NOT EXISTS saved_searches (
  id SERIAL PRIMARY KEY,
  userId INTEGER,
  email TEXT NOT NULL,
  searchParams TEXT NOT NULL,
  name TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  lastNotified TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Seller inquiries table (for users wanting to sell their property)
CREATE TABLE IF NOT EXISTS seller_inquiries (
  id SERIAL PRIMARY KEY,
  firstName TEXT NOT NULL,
  lastName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  propertyAddress TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipCode TEXT NOT NULL,
  propertyType TEXT,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  squareFeet INTEGER,
  lotSize DECIMAL(10, 2),
  yearBuilt INTEGER,
  currentValueEstimate DECIMAL(12, 2),
  reasonForSelling TEXT,
  timeline TEXT,
  hasMortgage BOOLEAN,
  mortgageBalance DECIMAL(12, 2),
  needsRepairs BOOLEAN,
  repairDescription TEXT,
  additionalInfo TEXT,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed
  assignedAgentId INTEGER,
  adminNotes TEXT,
  userId INTEGER,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assignedAgentId) REFERENCES agents(id),
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_mls ON properties(mlsNumber);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_state ON properties(state);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(propertyType);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_offmarket ON properties(isOffMarket);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_images_property ON property_images(propertyId);
CREATE INDEX IF NOT EXISTS idx_images_mls ON property_images(mlsNumber);
CREATE INDEX IF NOT EXISTS idx_features_property ON property_features(propertyId);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(userId);
CREATE INDEX IF NOT EXISTS idx_agents_active ON agents(isActive);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_status ON seller_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_created ON seller_inquiries(createdAt);
CREATE INDEX IF NOT EXISTS idx_seller_inquiries_user ON seller_inquiries(userId);
CREATE INDEX IF NOT EXISTS idx_inquiries_property ON property_inquiries(propertyId);
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON property_inquiries(userId);

-- Off-market deals table (blog-style, flexible content)
CREATE TABLE IF NOT EXISTS off_market_deals (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  propertyType TEXT,
  propertySubType TEXT,
  area TEXT,
  status TEXT DEFAULT 'open',
  contactName TEXT,
  contactPhone TEXT,
  contactEmail TEXT,
  contactTitle TEXT,
  thumbnailUrl TEXT,
  thumbnailType TEXT,
  isActive BOOLEAN DEFAULT true,
  isHotDeal BOOLEAN DEFAULT false,
  displayOrder INTEGER DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Off-market deal images table
CREATE TABLE IF NOT EXISTS off_market_deal_images (
  id SERIAL PRIMARY KEY,
  dealId INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  displayOrder INTEGER DEFAULT 0,
  caption TEXT,
  FOREIGN KEY (dealId) REFERENCES off_market_deals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_offmarket_active ON off_market_deals(isActive);
CREATE INDEX IF NOT EXISTS idx_offmarket_hot ON off_market_deals(isHotDeal);
CREATE INDEX IF NOT EXISTS idx_offmarket_type ON off_market_deals(propertyType);
CREATE INDEX IF NOT EXISTS idx_offmarket_status ON off_market_deals(status);
CREATE INDEX IF NOT EXISTS idx_offmarket_images ON off_market_deal_images(dealId);

-- Blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  featuredImageUrl TEXT,
  thumbnailUrl TEXT,
  thumbnailType TEXT,
  isPublished BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog images table
CREATE TABLE IF NOT EXISTS blog_images (
  id SERIAL PRIMARY KEY,
  blogId INTEGER NOT NULL,
  imageUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  displayOrder INTEGER DEFAULT 0,
  caption TEXT,
  FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(isPublished);
CREATE INDEX IF NOT EXISTS idx_blogs_created ON blogs(createdAt);
CREATE INDEX IF NOT EXISTS idx_blog_images ON blog_images(blogId);

-- Blog videos table
CREATE TABLE IF NOT EXISTS blog_videos (
  id SERIAL PRIMARY KEY,
  blogId INTEGER NOT NULL,
  videoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  displayOrder INTEGER DEFAULT 0,
  caption TEXT,
  FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_blog_videos ON blog_videos(blogId);

-- Off-market deal videos table
CREATE TABLE IF NOT EXISTS off_market_deal_videos (
  id SERIAL PRIMARY KEY,
  dealId INTEGER NOT NULL,
  videoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  displayOrder INTEGER DEFAULT 0,
  caption TEXT,
  FOREIGN KEY (dealId) REFERENCES off_market_deals(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_offmarket_videos ON off_market_deal_videos(dealId);
