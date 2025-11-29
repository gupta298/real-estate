require('dotenv').config();
const db = require('../database/db');

// Sample off-market deals based on typical real estate off-market listings
const offMarketDeals = [
  {
    title: '🔥Hot Deal Alert:🔥 🚀Liquor & Smoke Store Combo-Prime Location- INDIANAPOLIS',
    content: `🔥 DEAL OF THE TOWN! 🔥

🍾 Premium Liquor Store + Smoke Shop Combo
📍 Prime Indianapolis Location

A powerhouse business opportunity now on the market! 💼💰

💨 Best Combo Deal
🚀 High Potential for Growth
💵 Perfect for entrepreneurs looking for a strong cash-flow business in a busy area!

📑 NDA + Proof of Funds Required
⚠️ Serious Inquiries Only

Contact Today:`,
    propertyType: 'business',
    propertySubType: 'alcohol business',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir "Jesse" Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 0,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400',
        displayOrder: 0,
        caption: 'Store Front'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?w=400',
        displayOrder: 1,
        caption: 'Interior View'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=400',
        displayOrder: 2,
        caption: 'Product Display'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?w=400',
        displayOrder: 3,
        caption: 'Store Layout'
      }
    ]
  },
  {
    title: '🏢 Prime Commercial Space - Downtown Indianapolis',
    content: `Excellent opportunity for retail or office space in the heart of downtown Indianapolis!

✨ Features:
• 2,500 sq ft prime location
• High foot traffic area
• Recently renovated
• Flexible lease terms available
• Perfect for retail, restaurant, or professional services

📍 Located in the bustling downtown district with easy access to major highways and public transportation.

💼 Investment Opportunity:
This space offers tremendous potential for growth and visibility. Ideal for established businesses looking to expand or new entrepreneurs ready to make their mark.

📞 Contact us today to schedule a private viewing!`,
    propertyType: 'business',
    propertySubType: 'commercial space',
    area: 'Downtown Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 1,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400',
        displayOrder: 0,
        caption: 'Main Entrance'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=400',
        displayOrder: 1,
        caption: 'Interior Space'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&seed=2',
        thumbnailUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&seed=2',
        displayOrder: 2,
        caption: 'Office Area'
      }
    ]
  },
  {
    title: '🔥 HOT DEAL: Multi-Unit Investment Property - Cash Flow Opportunity',
    content: `🔥 EXCLUSIVE OFF-MARKET OPPORTUNITY 🔥

💰 Exceptional Multi-Unit Investment Property
📍 Prime Location in Indianapolis

🏠 Property Details:
• 4-Unit Residential Building
• Fully Occupied with Long-Term Tenants
• Strong Rental Income
• Well-Maintained Property
• Excellent ROI Potential

💵 Investment Highlights:
• Positive Cash Flow from Day 1
• Established Tenant Base
• Low Vacancy Rate
• Appreciation Potential
• Tax Benefits

📊 Perfect for:
• First-time investors
• Portfolio expansion
• Retirement income
• 1031 Exchange

⚠️ Serious Investors Only
📑 NDA Required
💰 Proof of Funds Required

This is a rare opportunity that won't last long!`,
    propertyType: 'home',
    propertySubType: 'multi-family',
    area: 'Indianapolis, IN',
    status: 'pending',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 2,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400',
        displayOrder: 0,
        caption: 'Property Exterior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400',
        displayOrder: 1,
        caption: 'Unit Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560448075-cbc16ba4a9b4?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560448075-cbc16ba4a9b4?w=400',
        displayOrder: 2,
        caption: 'Kitchen'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560449752-7eda3b1c4c0e?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560449752-7eda3b1c4c0e?w=400',
        displayOrder: 3,
        caption: 'Bathroom'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1560448076-0ad8d4c2c0c0?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1560448076-0ad8d4c2c0c0?w=400',
        displayOrder: 4,
        caption: 'Living Room'
      }
    ]
  },
  {
    title: '🏪 Established Restaurant Business - Turnkey Operation',
    content: `🍽️ Fully Operational Restaurant for Sale

Turnkey restaurant business in high-traffic Indianapolis location!

✨ What's Included:
• Fully equipped kitchen
• All furniture and fixtures
• Established customer base
• Trained staff available
• Prime location with parking
• Liquor license included

📈 Business Highlights:
• Proven track record
• Strong revenue stream
• Established brand
• Growth potential
• Immediate income opportunity

💼 Perfect for:
• Experienced restaurateurs
• Entrepreneurs ready to own
• Investors seeking cash flow

📞 Contact us for more details and financials!`,
    propertyType: 'business',
    propertySubType: 'restaurant',
    area: 'Indianapolis, IN',
    status: 'closed',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 3,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
        displayOrder: 0,
        caption: 'Restaurant Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400',
        displayOrder: 1,
        caption: 'Dining Area'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&seed=kitchen',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&seed=kitchen',
        displayOrder: 2,
        caption: 'Kitchen'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&seed=bar',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&seed=bar',
        displayOrder: 3,
        caption: 'Bar Area'
      }
    ]
  },
  {
    title: '🔥 HOT DEAL: Gas Station & Convenience Store - High Traffic Location',
    content: `🔥 EXCLUSIVE OPPORTUNITY 🔥

⛽ Gas Station & Convenience Store
📍 High-Traffic Indianapolis Location

💰 Exceptional Business Opportunity!

✨ Features:
• Prime corner location
• High daily traffic volume
• Established customer base
• Multiple revenue streams
• Well-maintained equipment
• Strong cash flow

💵 Revenue Streams:
• Gas sales
• Convenience store
• Car wash (optional)
• Food service area
• ATM services

📊 Investment Highlights:
• Immediate cash flow
• Proven business model
• Growth potential
• Recession-resistant
• Long-term stability

⚠️ Serious Buyers Only
📑 NDA + Financials Required
💰 Proof of Funds Required

This is a rare opportunity in a prime location!`,
    propertyType: 'business',
    propertySubType: 'gas station',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 4,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=400',
        displayOrder: 0,
        caption: 'Gas Station Exterior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=800&seed=2',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=400&seed=2',
        displayOrder: 1,
        caption: 'Convenience Store Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=800&seed=3',
        thumbnailUrl: 'https://images.unsplash.com/photo-1606811971618-4486c44f21e1?w=400&seed=3',
        displayOrder: 2,
        caption: 'Pump Area'
      }
    ]
  },
  {
    title: '🏭 Warehouse/Storage Facility - Investment Opportunity',
    content: `🏭 Commercial Warehouse & Storage Facility

Excellent investment opportunity for warehouse/storage business!

✨ Property Features:
• 15,000 sq ft warehouse space
• High ceilings for storage
• Loading docks
• Office space included
• Fenced parking area
• Prime industrial location

💼 Business Potential:
• Self-storage facility
• Distribution center
• Manufacturing space
• Logistics hub
• Multi-tenant warehouse

💰 Investment Benefits:
• Strong rental demand
• Multiple use options
• Appreciation potential
• Tax advantages
• Long-term income

📍 Located in growing industrial district with easy highway access.

📞 Contact for more details and viewing!`,
    propertyType: 'business',
    propertySubType: 'warehouse',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 5,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400',
        displayOrder: 0,
        caption: 'Warehouse Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=400',
        displayOrder: 1,
        caption: 'Loading Dock'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&seed=office',
        thumbnailUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&seed=office',
        displayOrder: 2,
        caption: 'Office Space'
      }
    ]
  },
  {
    title: '🔥 HOT DEAL: Medical Office Building - Prime Healthcare Location',
    content: `🔥 EXCLUSIVE MEDICAL OFFICE OPPORTUNITY 🔥

🏥 Medical Office Building
📍 Prime Healthcare District - Indianapolis

💼 Perfect for Healthcare Professionals!

✨ Building Features:
• 3,500 sq ft medical facility
• Multiple exam rooms
• Reception area
• Private offices
• Parking for patients
• ADA compliant

🏥 Ideal For:
• Medical practices
• Dental offices
• Physical therapy
• Specialty clinics
• Healthcare services

💰 Investment Highlights:
• Stable healthcare tenant base
• Long-term leases
• Recession-resistant
• Growing healthcare market
• Prime location

📊 Location Benefits:
• Near major hospitals
• High visibility
• Easy patient access
• Professional setting
• Established healthcare district

⚠️ Serious Healthcare Investors Only
📑 NDA Required

Contact us today!`,
    propertyType: 'business',
    propertySubType: 'medical office',
    area: 'Indianapolis, IN',
    status: 'pending',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 6,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400',
        displayOrder: 0,
        caption: 'Medical Office Reception'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&seed=exam',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&seed=exam',
        displayOrder: 1,
        caption: 'Exam Room'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&seed=waiting',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&seed=waiting',
        displayOrder: 2,
        caption: 'Waiting Area'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=800&seed=parking',
        thumbnailUrl: 'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&seed=parking',
        displayOrder: 3,
        caption: 'Parking Area'
      }
    ]
  },
  {
    title: '🏨 Motel/Hotel Property - Turnkey Hospitality Business',
    content: `🏨 Established Motel/Hotel Property

Turnkey hospitality business opportunity!

✨ Property Features:
• 25+ Units
• Fully operational
• Established clientele
• On-site management
• Prime highway location
• Parking included

💼 Business Highlights:
• Proven revenue stream
• Year-round operation
• Multiple income sources
• Growth potential
• Established brand

💰 Revenue Streams:
• Room rentals
• Extended stays
• Event hosting
• Additional services

📊 Investment Benefits:
• Immediate cash flow
• Hospitality industry stability
• Appreciation potential
• Tax benefits
• Portfolio diversification

📍 Located on major highway with high visibility and easy access.

📞 Contact for financials and viewing!`,
    propertyType: 'business',
    propertySubType: 'hotel',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 7,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        displayOrder: 0,
        caption: 'Hotel Exterior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400',
        displayOrder: 1,
        caption: 'Hotel Room'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&seed=lobby',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&seed=lobby',
        displayOrder: 2,
        caption: 'Lobby'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&seed=bathroom',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&seed=bathroom',
        displayOrder: 3,
        caption: 'Bathroom'
      }
    ]
  },
  {
    title: '🔥 HOT DEAL: Auto Repair Shop - Established Business',
    content: `🔥 EXCLUSIVE AUTO REPAIR OPPORTUNITY 🔥

🔧 Established Auto Repair Shop
📍 High-Traffic Indianapolis Location

💰 Proven Business with Strong Cash Flow!

✨ Business Features:
• Fully equipped service bays
• Professional tools & equipment
• Established customer base
• Experienced staff available
• Prime location
• Parking for customers

💼 Services Offered:
• General auto repair
• Oil changes
• Brake service
• Tire service
• Diagnostics
• And more!

📈 Business Highlights:
• Strong repeat customer base
• Consistent revenue
• Growing demand
• Expansion potential
• Immediate income

💰 Investment Benefits:
• Turnkey operation
• Proven track record
• Multiple revenue streams
• Growth opportunities
• Recession-resistant

⚠️ Serious Buyers Only
📑 NDA + Financials Required

Contact us today!`,
    propertyType: 'business',
    propertySubType: 'auto repair',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 8,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400',
        displayOrder: 0,
        caption: 'Auto Shop Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&seed=bay',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&seed=bay',
        displayOrder: 1,
        caption: 'Service Bay'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&seed=tools',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&seed=tools',
        displayOrder: 2,
        caption: 'Tool Area'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&seed=reception',
        thumbnailUrl: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&seed=reception',
        displayOrder: 3,
        caption: 'Reception Area'
      }
    ]
  },
  {
    title: '🏗️ Development Land - Prime Commercial Site',
    content: `🏗️ Prime Commercial Development Land

Excellent opportunity for commercial development!

✨ Land Features:
• 2.5 acres prime location
• Zoned for commercial use
• High visibility location
• Easy highway access
• Utilities available
• Development ready

💼 Development Potential:
• Retail center
• Office complex
• Mixed-use development
• Restaurant/entertainment
• Service businesses

💰 Investment Highlights:
• Prime location
• Development potential
• Appreciation opportunity
• Flexible use options
• Long-term value

📍 Located in growing commercial corridor with excellent visibility and access.

📊 Perfect for:
• Developers
• Investors
• Business owners
• Land banking

📞 Contact for more details and site visit!`,
    propertyType: 'business',
    propertySubType: 'land',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 9,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400',
        displayOrder: 0,
        caption: 'Development Land'
      }
    ]
  },
  {
    title: '🔥 HOT DEAL: Car Wash Business - Automated & Self-Service',
    content: `🔥 EXCLUSIVE CAR WASH OPPORTUNITY 🔥

🚗 Automated & Self-Service Car Wash
📍 Prime High-Traffic Location

💰 High Cash Flow Business!

✨ Business Features:
• Automated wash bays
• Self-service stations
• Vacuum stations
• Vending machines
• Prime location
• High daily traffic

💼 Revenue Streams:
• Automated washes
• Self-service bays
• Vacuum services
• Vending sales
• Membership programs

📈 Business Highlights:
• Low overhead
• High profit margins
• Recurring revenue
• Minimal staffing needed
• Weather-resistant income

💰 Investment Benefits:
• Strong cash flow
• Proven business model
• Growth potential
• Low maintenance
• Long-term stability

⚠️ Serious Investors Only
📑 NDA + Financials Required
💰 Proof of Funds Required

This opportunity won't last!`,
    propertyType: 'business',
    propertySubType: 'car wash',
    area: 'Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: true,
    isActive: true,
    displayOrder: 10,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        displayOrder: 0,
        caption: 'Car Wash Facility'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&seed=bay',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&seed=bay',
        displayOrder: 1,
        caption: 'Wash Bay'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&seed=vacuum',
        thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&seed=vacuum',
        displayOrder: 2,
        caption: 'Vacuum Station'
      }
    ]
  },
  {
    title: '🏪 Retail Storefront - Downtown Location',
    content: `🏪 Prime Retail Storefront

Excellent retail opportunity in downtown Indianapolis!

✨ Space Features:
• 1,800 sq ft retail space
• High foot traffic
• Large display windows
• Storage area
• Restroom facilities
• Prime downtown location

💼 Perfect For:
• Boutique shops
• Specialty stores
• Service businesses
• Professional offices
• Showrooms

💰 Location Benefits:
• High visibility
• Strong foot traffic
• Downtown exposure
• Easy access
• Professional setting

📊 Investment Highlights:
• Prime location
• Strong rental demand
• Appreciation potential
• Flexible use
• Long-term value

📍 Located in the heart of downtown with excellent visibility and access.

📞 Contact for viewing and lease terms!`,
    propertyType: 'business',
    propertySubType: 'retail',
    area: 'Downtown Indianapolis, IN',
    status: 'open',
    contactName: 'Jasvir Singh',
    contactPhone: '317.499.1516',
    contactEmail: 'jsj@blueflagrealty.net',
    contactTitle: 'CEO / Broker',
    isHotDeal: false,
    isActive: true,
    displayOrder: 11,
    images: [
      {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
        displayOrder: 0,
        caption: 'Retail Storefront'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&seed=interior',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&seed=interior',
        displayOrder: 1,
        caption: 'Store Interior'
      },
      {
        imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&seed=window',
        thumbnailUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&seed=window',
        displayOrder: 2,
        caption: 'Display Window'
      }
    ]
  }
];

function seedOffMarketDeals() {
  console.log('🌱 Seeding off-market deals...');

  db.serialize(() => {
    // Clear existing off-market deals
    db.run('DELETE FROM off_market_deal_images', (err) => {
      if (err) {
        console.error('Error clearing existing images:', err);
        process.exit(1);
      }
    });

    db.run('DELETE FROM off_market_deals', (err) => {
      if (err) {
        console.error('Error clearing existing deals:', err);
        process.exit(1);
      }

      const dealStmt = db.prepare(`
        INSERT INTO off_market_deals (
          title, content, propertyType, propertySubType, area, status, contactName, contactPhone, contactEmail, contactTitle,
          isActive, isHotDeal, displayOrder
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const imageStmt = db.prepare(`
        INSERT INTO off_market_deal_images (
          dealId, imageUrl, thumbnailUrl, displayOrder, caption
        ) VALUES (?, ?, ?, ?, ?)
      `);

      let dealCount = 0;
      const totalDeals = offMarketDeals.length;
      let processedDeals = 0;

      offMarketDeals.forEach((deal, index) => {
        dealStmt.run(
          deal.title,
          deal.content,
          deal.propertyType || null,
          deal.propertySubType || null,
          deal.area || null,
          deal.status || 'open',
          deal.contactName,
          deal.contactPhone,
          deal.contactEmail,
          deal.contactTitle,
          deal.isActive ? 1 : 0,
          deal.isHotDeal ? 1 : 0,
          deal.displayOrder,
          function(err) {
            if (err) {
              console.error(`Error inserting deal ${index + 1}:`, err);
              return;
            }

            const dealId = this.lastID;

            // Insert images for this deal
            if (deal.images && deal.images.length > 0) {
              deal.images.forEach((img) => {
                imageStmt.run(
                  dealId,
                  img.imageUrl,
                  img.thumbnailUrl || img.imageUrl,
                  img.displayOrder,
                  img.caption || null
                );
              });
            }

            dealCount++;
            processedDeals++;

            // Check if all deals are processed
            if (processedDeals === totalDeals) {
              dealStmt.finalize((err) => {
                if (err) {
                  console.error('Error finalizing deals:', err);
                  process.exit(1);
                }

                imageStmt.finalize((err) => {
                  if (err) {
                    console.error('Error finalizing images:', err);
                    process.exit(1);
                  } else {
                    console.log(`✅ ${dealCount} off-market deals seeded successfully!`);
                    console.log(`   - ${offMarketDeals.filter(d => d.isHotDeal).length} hot deals`);
                    console.log(`   - ${offMarketDeals.reduce((sum, d) => sum + (d.images?.length || 0), 0)} images added`);
                    process.exit(0);
                  }
                });
              });
            }
          }
        );
      });
    });
  });
}

// Check if database is initialized
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='off_market_deals'", (err, row) => {
  if (err) {
    console.error('❌ Error checking database:', err.message);
    process.exit(1);
  }
  
  if (!row) {
    console.error('❌ Database not initialized. Please run: npm run init-db');
    process.exit(1);
  }
  
  seedOffMarketDeals();
});

