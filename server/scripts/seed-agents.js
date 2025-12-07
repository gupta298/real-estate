require('dotenv').config();
const db = require('../database/db');

// First names pool
const firstNames = [
  'Jasvir', 'Aman', 'Amanpreet', 'Amrinder', 'Channpreet', 'Dhruv', 'Harpreett',
  'Sarah', 'Michael', 'Emily', 'David', 'Jennifer', 'Robert', 'Lisa', 'James',
  'Maria', 'Christopher', 'Patricia', 'Daniel', 'Nancy', 'Mark', 'Karen', 'Steven',
  'Betty', 'Anthony', 'Jessica', 'Matthew', 'Ashley', 'Andrew', 'Amanda', 'Joshua',
  'Melissa', 'Kevin', 'Michelle', 'Brian', 'Nicole', 'Ryan', 'Stephanie', 'Jason',
  'Rebecca', 'Eric', 'Laura', 'Justin', 'Kimberly', 'Brandon', 'Amy', 'Benjamin',
  'Angela', 'Jonathan', 'Samantha', 'Samuel', 'Brittany', 'Timothy', 'Megan',
  'Nathan', 'Rachel', 'Adam', 'Lauren', 'Zachary', 'Christina', 'Tyler', 'Emma',
  'Jacob', 'Olivia', 'Noah', 'Sophia', 'Ethan', 'Isabella', 'Mason', 'Ava',
  'Lucas', 'Mia', 'Alexander', 'Charlotte', 'Daniel', 'Amelia', 'Henry', 'Harper',
  'Sebastian', 'Evelyn', 'Aiden', 'Abigail', 'Jackson', 'Emily', 'Logan', 'Elizabeth',
  'Oliver', 'Sofia', 'William', 'Avery', 'James', 'Ella', 'Benjamin', 'Scarlett',
  'Lucas', 'Victoria', 'Mason', 'Aria', 'Ethan', 'Grace', 'Alexander', 'Chloe'
];

// Last names pool
const lastNames = [
  'Singh', 'Hundal', 'Toor', 'Cheema', 'Barnala', 'Patel', 'Gill',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
  'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
  'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green',
  'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter',
  'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz',
  'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook',
  'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey', 'Reed',
  'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson', 'Watson',
  'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz'
];

// Specialties pool
const specialtiesOptions = [
  'Luxury Homes, Investment Properties, Commercial Real Estate',
  'Residential Sales, First-Time Homebuyers',
  'Family Homes, Suburban Properties',
  'Residential Sales, Condos',
  'Luxury Homes, Investment Properties',
  'Family Homes, Suburban Properties, New Construction',
  'First-Time Homebuyers, Residential Sales, Condos',
  'Family Homes, Suburban Properties, New Construction',
  'Historic Homes, Restoration Projects, Victorian Properties',
  'Downtown Condos, Urban Living, Luxury Apartments',
  'Luxury Homes, Estates, Waterfront Properties',
  'Commercial Real Estate, Investment Properties',
  'New Construction, Modern Homes, Energy Efficient',
  'Luxury Condos, High-Rise Living, Downtown Properties',
  'Investment Properties, Rental Properties, Multi-Family',
  'Senior Living, Retirement Communities, Single Story',
  'Suburban Properties, Family Homes, Schools',
  'Waterfront Properties, Lakefront, Vacation Homes',
  'Luxury Estates, High-End Properties, Gated Communities',
  'First-Time Homebuyers, Starter Homes, Condos',
  'Commercial Real Estate, Investment Properties, Land'
];

// Bio templates
const bioTemplates = [
  'Experienced real estate professional specializing in residential properties.',
  'Dedicated real estate agent helping clients find their perfect home.',
  'Real estate professional with a focus on client satisfaction.',
  'Passionate about helping first-time homebuyers find their perfect home.',
  'Focuses on helping families find their dream homes in great neighborhoods.',
  'Specializes in historic homes and properties with character.',
  'Expert in downtown condos and urban living.',
  'Experienced agent specializing in luxury and investment properties.',
  'Real estate agent helping clients navigate the market with confidence.',
  'Dedicated professional specializing in family homes and suburban properties.',
  'Helping clients find their perfect home with personalized service.',
  'Commercial real estate specialist with extensive market knowledge.',
  'Specializing in new construction and modern homes.',
  'Expert in luxury condos and high-rise living.',
  'Investment property specialist helping clients build wealth.',
  'Dedicated to helping seniors find the perfect retirement home.',
  'Real estate professional with expertise in suburban markets.',
  'Specializing in waterfront and lakefront properties.',
  'Expert in luxury estates and high-end properties.',
  'Helping first-time buyers navigate the home buying process.'
];

// Generate 100 agents programmatically
function generateAgents() {
  const agents = [];
  
  // Keep the first agent as the main broker (Jasvir Singh)
  agents.push({
    firstName: 'Jasvir',
    lastName: 'Singh',
    email: 'jsj@blueflagrealty.net',
    phone: '(317) 499-1516',
    licenseNumber: 'RB22001424',
    bio: 'CEO/Managing Broker with extensive experience in the Indianapolis real estate market.',
    specialties: 'Luxury Homes, Investment Properties, Commercial Real Estate',
    yearsExperience: 15,
    profileImageUrl: 'https://i.pravatar.cc/300?img=1',
    isBroker: 1,
    isActive: 1,
    displayOrder: 0
  });

  // Generate 99 more agents
  const usedNames = new Set(['Jasvir Singh']);
  const usedImages = new Set([1]);
  let brokerCount = 0;
  const maxBrokers = 8; // Total of 9 brokers including Jasvir

  for (let i = 1; i < 100; i++) {
    let firstName, lastName, fullName;
    
    // Ensure unique names
    do {
      firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      fullName = `${firstName} ${lastName}`;
    } while (usedNames.has(fullName));
    
    usedNames.add(fullName);

    // Generate unique image number (1-100)
    let imgNum;
    do {
      imgNum = Math.floor(Math.random() * 100) + 1;
    } while (usedImages.has(imgNum));
    usedImages.add(imgNum);

    // Generate email
    const emailDomains = ['@blueflagrealty.net', '@blueflagrealty.com', '@gmail.com'];
    const emailDomain = emailDomains[Math.floor(Math.random() * emailDomains.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailDomain}`;

    // Generate phone number
    const areaCodes = ['317', '463', '859', '765', '812'];
    const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
    const exchange = Math.floor(Math.random() * 800) + 200;
    const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const phone = `(${areaCode}) ${exchange}-${number}`;

    // Generate license number
    const licenseNumber = `IN-${Math.floor(Math.random() * 9000000) + 1000000}`;

    // Generate years of experience (1-20)
    const yearsExperience = Math.floor(Math.random() * 20) + 1;

    // Select random bio and specialties
    const bio = bioTemplates[Math.floor(Math.random() * bioTemplates.length)];
    const specialties = specialtiesOptions[Math.floor(Math.random() * specialtiesOptions.length)];

    // Determine if broker (about 8% chance after first one, max 9 total)
    const isBroker = brokerCount < maxBrokers - 1 && Math.random() < 0.08 ? 1 : 0;
    if (isBroker) brokerCount++;

    agents.push({
      firstName,
      lastName,
      email,
      phone,
      licenseNumber,
      bio,
      specialties,
      yearsExperience,
      profileImageUrl: `https://i.pravatar.cc/300?img=${imgNum}`,
      isBroker,
      isActive: 1,
      displayOrder: i
    });
  }

  return agents;
}

const sampleAgents = generateAgents();

// Determine if we're using PostgreSQL or SQLite
const isPostgres = process.env.DATABASE_URL || process.env.NODE_ENV === 'production';

async function seedAgentsPostgres() {
  console.log('🌱 Seeding agents for PostgreSQL...');
  
  try {
    // In PostgreSQL, we can do this within a transaction
    await db.run('BEGIN;');
    
    // Clear existing agents - using CASCADE to handle foreign keys
    await db.run('DELETE FROM agents;');
    
    // Insert all agents
    for (const agent of sampleAgents) {
      await db.run(`
        INSERT INTO agents (
          firstName, lastName, email, phone, licenseNumber, bio,
          specialties, yearsExperience, profileImageUrl, isBroker, isActive, displayOrder
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        agent.firstName,
        agent.lastName,
        agent.email,
        agent.phone,
        agent.licenseNumber,
        agent.bio,
        agent.specialties,
        agent.yearsExperience,
        agent.profileImageUrl || null,
        agent.isBroker ? true : false,  // Use boolean for PostgreSQL
        agent.isActive ? true : false,  // Use boolean for PostgreSQL
        agent.displayOrder
      ]);
    }
    
    // Commit transaction
    await db.run('COMMIT;');
    console.log(`✅ ${sampleAgents.length} agents seeded successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding agents:', error);
    // Rollback on error
    try {
      await db.run('ROLLBACK;');
    } catch (rollbackError) {
      console.error('Error during rollback:', rollbackError);
    }
    process.exit(1);
  }
}

function seedAgentsSQLite() {
  console.log('🌱 Seeding agents for SQLite...');

  // Disable foreign key constraints temporarily to allow deletion
  db.run('PRAGMA foreign_keys = OFF', (err) => {
    if (err) {
      console.error('Error disabling foreign keys:', err);
      process.exit(1);
    }

    // Clear existing agents
    db.run('DELETE FROM agents', (err) => {
      if (err) {
        console.warn('Warning: Could not clear existing agents (may have foreign key references):', err.message);
        // Continue anyway - we'll insert new agents
      }

      // Re-enable foreign key constraints
      db.run('PRAGMA foreign_keys = ON', (err) => {
        if (err) {
          console.error('Error re-enabling foreign keys:', err);
          process.exit(1);
        }

        const stmt = db.prepare(`
          INSERT INTO agents (
            firstName, lastName, email, phone, licenseNumber, bio,
            specialties, yearsExperience, profileImageUrl, isBroker, isActive, displayOrder
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sampleAgents.forEach((agent) => {
          stmt.run(
            agent.firstName,
            agent.lastName,
            agent.email,
            agent.phone,
            agent.licenseNumber,
            agent.bio,
            agent.specialties,
            agent.yearsExperience,
            agent.profileImageUrl || null,
            agent.isBroker ? 1 : 0,
            agent.isActive ? 1 : 0,
            agent.displayOrder
          );
        });

        stmt.finalize((err) => {
          if (err) {
            console.error('Error seeding agents:', err);
            process.exit(1);
          } else {
            console.log(`✅ ${sampleAgents.length} agents seeded successfully!`);
            process.exit(0);
          }
        });
      });
    });
  });
}

async function seedAgents() {
  if (isPostgres) {
    await seedAgentsPostgres();
  } else {
    seedAgentsSQLite();
  }
}

// Check if database is initialized
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='agents'", (err, row) => {
  if (err) {
    console.error('❌ Error checking database:', err.message);
    process.exit(1);
  }
  
  if (!row) {
    console.error('❌ Database not initialized. Please run: npm run init-db');
    process.exit(1);
  }
  
  seedAgents();
});

