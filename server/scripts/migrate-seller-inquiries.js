require('dotenv').config();
const db = require('../database/db');

console.log('🔄 Migrating seller_inquiries table...');

db.serialize(() => {
  // Create seller_inquiries table
  db.run(`
    CREATE TABLE IF NOT EXISTS seller_inquiries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      status TEXT DEFAULT 'pending',
      assignedAgentId INTEGER,
      adminNotes TEXT,
      userId INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (assignedAgentId) REFERENCES agents(id),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating seller_inquiries table:', err);
      process.exit(1);
    }
    console.log('✅ seller_inquiries table created');

    // Create indexes
    db.run('CREATE INDEX IF NOT EXISTS idx_seller_inquiries_status ON seller_inquiries(status)', (err) => {
      if (err) console.error('Error creating status index:', err);
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_seller_inquiries_created ON seller_inquiries(createdAt)', (err) => {
      if (err) console.error('Error creating createdAt index:', err);
    });
    db.run('CREATE INDEX IF NOT EXISTS idx_seller_inquiries_user ON seller_inquiries(userId)', (err) => {
      if (err) console.error('Error creating userId index:', err);
    });

    console.log('✅ Migration complete!');
    process.exit(0);
  });
});

