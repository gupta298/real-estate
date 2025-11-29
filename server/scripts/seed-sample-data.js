require('dotenv').config();
const db = require('../database/db');

const sampleProperties = [
  {
    mlsNumber: 'MLS-001',
    title: 'Modern Luxury Home in Downtown',
    description: 'Stunning modern home with panoramic city views. Features open floor plan, high-end finishes, and smart home technology throughout. Located in the heart of downtown with easy access to restaurants, shopping, and entertainment.',
    price: 850000,
    address: '123 Main Street',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46202',
    latitude: 39.7684,
    longitude: -86.1581,
    bedrooms: 4,
    bathrooms: 3.5,
    squareFeet: 3200,
    lotSize: 0.25,
    propertyType: 'House',
    status: 'active',
    yearBuilt: 2020,
    garage: 2,
    parkingSpaces: 2,
    propertyTax: 8500,
    hoaFee: 0,
    featured: 1,
    mlsStatus: 'Active',
    listingDate: '2024-01-15',
    lastModified: new Date().toISOString()
  },
  {
    mlsNumber: 'MLS-002',
    title: 'Charming Victorian Home',
    description: 'Beautifully restored Victorian home with original character and modern updates. Perfect blend of historic charm and contemporary comfort. Large front porch, hardwood floors throughout, and updated kitchen.',
    price: 425000,
    address: '456 Oak Avenue',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46203',
    latitude: 39.7710,
    longitude: -86.1600,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 2400,
    lotSize: 0.3,
    propertyType: 'House',
    status: 'active',
    yearBuilt: 1895,
    garage: 1,
    parkingSpaces: 1,
    propertyTax: 4200,
    hoaFee: 0,
    featured: 1,
    mlsStatus: 'Active',
    listingDate: '2024-02-01',
    lastModified: new Date().toISOString()
  },
  {
    mlsNumber: 'MLS-003',
    title: 'Downtown Luxury Condo',
    description: 'Sophisticated penthouse condo with floor-to-ceiling windows, premium amenities, and concierge service. Walk to restaurants and entertainment. Includes parking and storage.',
    price: 625000,
    address: '789 Market Street',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46204',
    latitude: 39.7650,
    longitude: -86.1550,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1800,
    lotSize: 0,
    propertyType: 'Condo',
    status: 'active',
    yearBuilt: 2018,
    garage: 1,
    parkingSpaces: 1,
    propertyTax: 6200,
    hoaFee: 350,
    featured: 1,
    mlsStatus: 'Active',
    listingDate: '2024-01-20',
    lastModified: new Date().toISOString()
  },
  {
    mlsNumber: 'MLS-004',
    title: 'Spacious Family Home',
    description: 'Perfect for growing families. Large yard, updated kitchen, and finished basement. Great neighborhood with excellent schools nearby.',
    price: 375000,
    address: '321 Elm Drive',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46205',
    latitude: 39.7800,
    longitude: -86.1700,
    bedrooms: 5,
    bathrooms: 3,
    squareFeet: 2800,
    lotSize: 0.4,
    propertyType: 'House',
    status: 'active',
    yearBuilt: 2010,
    garage: 2,
    parkingSpaces: 2,
    propertyTax: 3700,
    hoaFee: 0,
    featured: 0,
    mlsStatus: 'Active',
    listingDate: '2024-02-10',
    lastModified: new Date().toISOString()
  },
  {
    mlsNumber: 'MLS-005',
    title: 'Modern Townhouse',
    description: 'Low-maintenance townhouse with modern design. Open concept living, updated appliances, and attached garage. Perfect for first-time buyers or downsizers.',
    price: 295000,
    address: '654 Pine Court',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46206',
    latitude: 39.7750,
    longitude: -86.1650,
    bedrooms: 3,
    bathrooms: 2.5,
    squareFeet: 1900,
    lotSize: 0.1,
    propertyType: 'Townhouse',
    status: 'active',
    yearBuilt: 2015,
    garage: 1,
    parkingSpaces: 1,
    propertyTax: 2900,
    hoaFee: 150,
    featured: 0,
    mlsStatus: 'Active',
    listingDate: '2024-02-15',
    lastModified: new Date().toISOString()
  },
  {
    mlsNumber: 'MLS-006',
    title: 'Historic Brownstone',
    description: 'Elegant brownstone with original architectural details. Recently renovated with high-end finishes while preserving historic character. Prime location.',
    price: 550000,
    address: '987 Heritage Lane',
    city: 'Indianapolis',
    state: 'IN',
    zipCode: '46207',
    latitude: 39.7700,
    longitude: -86.1620,
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2600,
    lotSize: 0.2,
    propertyType: 'House',
    status: 'active',
    yearBuilt: 1920,
    garage: 0,
    parkingSpaces: 1,
    propertyTax: 5500,
    hoaFee: 0,
    featured: 1,
    mlsStatus: 'Active',
    listingDate: '2024-01-25',
    lastModified: new Date().toISOString()
  }
];

const sampleImages = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=800'
];

const sampleFeatures = [
  'Hardwood Floors',
  'Granite Countertops',
  'Stainless Steel Appliances',
  'Fireplace',
  'Walk-in Closet',
  'Master Suite',
  'Finished Basement',
  'Deck/Patio',
  'Fenced Yard',
  'Central Air',
  'Garage',
  'Updated Kitchen',
  'Updated Bathrooms',
  'High Ceilings',
  'Natural Light',
  'Energy Efficient'
];

async function seedDatabase() {
  console.log('🌱 Seeding database with sample data...');

  // Insert properties
  const propertyStmt = db.prepare(`
    INSERT INTO properties (
      mlsNumber, title, description, price, address, city, state, zipCode,
      latitude, longitude, bedrooms, bathrooms, squareFeet, lotSize,
      propertyType, status, yearBuilt, garage, parkingSpaces,
      propertyTax, hoaFee, featured, mlsStatus, listingDate, lastModified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const propertyIds = [];

  for (const prop of sampleProperties) {
    propertyStmt.run(
      prop.mlsNumber, prop.title, prop.description, prop.price, prop.address,
      prop.city, prop.state, prop.zipCode, prop.latitude, prop.longitude,
      prop.bedrooms, prop.bathrooms, prop.squareFeet, prop.lotSize,
      prop.propertyType, prop.status, prop.yearBuilt, prop.garage,
      prop.parkingSpaces, prop.propertyTax, prop.hoaFee, prop.featured ? 1 : 0,
      prop.mlsStatus, prop.listingDate, prop.lastModified
    );
    propertyIds.push(propertyStmt.lastID);
  }

  propertyStmt.finalize();

  // Insert images
  const imageStmt = db.prepare(`
    INSERT INTO property_images (propertyId, mlsNumber, imageUrl, thumbnailUrl, isPrimary, displayOrder)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  sampleProperties.forEach((prop, propIndex) => {
    const propertyId = propertyIds[propIndex];
    const numImages = Math.floor(Math.random() * 2) + 3; // 3-4 images per property
    
    for (let i = 0; i < numImages; i++) {
      const imageIndex = (propIndex * 3 + i) % sampleImages.length;
      imageStmt.run(
        propertyId,
        prop.mlsNumber,
        sampleImages[imageIndex],
        sampleImages[imageIndex],
        i === 0 ? 1 : 0,
        i
      );
    }
  });

  imageStmt.finalize();

  // Insert features
  const featureStmt = db.prepare(`
    INSERT INTO property_features (propertyId, mlsNumber, feature, category)
    VALUES (?, ?, ?, ?)
  `);

  sampleProperties.forEach((prop, propIndex) => {
    const propertyId = propertyIds[propIndex];
    const numFeatures = Math.floor(Math.random() * 4) + 5; // 5-8 features per property
    const shuffled = [...sampleFeatures].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < numFeatures && i < shuffled.length; i++) {
      featureStmt.run(propertyId, prop.mlsNumber, shuffled[i], 'General');
    }
  });

  featureStmt.finalize();

  console.log('✅ Sample data seeded successfully!');
  console.log(`   - ${sampleProperties.length} properties`);
  console.log('   - Images and features added');
  process.exit(0);
}

// Check if database is initialized
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='properties'", (err, row) => {
  if (err) {
    console.error('❌ Error checking database:', err.message);
    process.exit(1);
  }
  
  if (!row) {
    console.error('❌ Database not initialized. Please run: npm run init-db');
    process.exit(1);
  }
  
  seedDatabase();
});

