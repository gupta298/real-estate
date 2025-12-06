require('dotenv').config();
const db = require('../database/db');

// Generate 100 blog posts with varied real estate content
const blogTitles = [
  '10 Tips for First-Time Home Buyers in 2024',
  'Understanding Mortgage Rates: A Complete Guide',
  'The Ultimate Guide to Home Staging',
  'Real Estate Investment Strategies for Beginners',
  'How to Price Your Home Competitively',
  'Neighborhood Spotlight: Downtown Indianapolis',
  'The Benefits of Working with a Real Estate Agent',
  'Home Inspection Checklist: What to Look For',
  'Maximizing Your Home\'s Curb Appeal',
  'Understanding Property Taxes: What You Need to Know',
  'The Pros and Cons of Buying vs. Renting',
  'Home Renovation Ideas That Add Value',
  'Real Estate Market Trends: What to Expect in 2024',
  'How to Negotiate the Best Deal on Your Home',
  'Green Homes: Energy-Efficient Features Worth Investing In',
  'The Art of Open Houses: Tips for Sellers',
  'Commercial Real Estate: Investment Opportunities',
  'Understanding Homeowners Insurance',
  'Moving Checklist: A Complete Guide',
  'Real Estate Photography: Making Your Listing Stand Out',
  'The Importance of Location in Real Estate',
  'Financing Your Dream Home: Options Explained',
  'Home Maintenance: Seasonal Checklist',
  'Real Estate Contracts: What to Know Before Signing',
  'Luxury Real Estate: What Makes a Property Premium',
  'First-Time Landlord: Rental Property Management Tips',
  'The Future of Real Estate Technology',
  'Historic Homes: Preserving Character While Modernizing',
  'Real Estate Investment Trusts (REITs) Explained',
  'Home Security Systems: Protecting Your Investment',
  'The Psychology of Home Buying',
  'Real Estate Appraisals: Understanding the Process',
  'Sustainable Living: Eco-Friendly Home Features',
  'Real Estate Marketing: Digital Strategies That Work',
  'The Benefits of Pre-Approval for Home Buyers',
  'Home Equity: Building Wealth Through Real Estate',
  'Real Estate Auctions: What You Need to Know',
  'Smart Home Technology: Modern Living Features',
  'Real Estate Law: Common Legal Issues',
  'The Impact of Interest Rates on Real Estate',
  'Home Design Trends for 2024',
  'Real Estate Networking: Building Professional Relationships',
  'The Role of Real Estate in Retirement Planning',
  'Home Warranty vs. Home Insurance: Key Differences',
  'Real Estate Photography: Professional Tips',
  'The Benefits of New Construction Homes',
  'Real Estate Market Analysis: Understanding Data',
  'Home Improvement Projects with Best ROI',
  'Real Estate Ethics: Professional Standards',
  'The Art of Real Estate Negotiation',
  'Understanding Closing Costs: A Complete Breakdown',
  'Real Estate Investment: Risk Management Strategies',
  'Home Buying Process: Step-by-Step Guide',
  'Real Estate Technology: Tools for Agents',
  'The Psychology of Home Selling',
  'Real Estate Market Cycles: Timing Your Investment',
  'Home Energy Audits: Saving Money and the Environment',
  'Real Estate Partnerships: Joint Investment Strategies',
  'The Benefits of 1031 Exchanges',
  'Home Automation: Smart Features Worth Installing',
  'Real Estate Marketing: Social Media Strategies',
  'The Importance of Home Inspections',
  'Real Estate Investment: Long-term vs. Short-term',
  'Home Staging: Professional Tips and Tricks',
  'Real Estate Market Research: How to Analyze',
  'The Benefits of Working with a Buyer\'s Agent',
  'Real Estate Investment: Diversification Strategies',
  'Home Maintenance: Preventative Care Tips',
  'Real Estate Contracts: Understanding Terms',
  'The Future of Urban Living',
  'Real Estate Investment: Tax Benefits Explained',
  'Home Design: Creating Functional Spaces',
  'Real Estate Market Trends: Regional Analysis',
  'The Benefits of Pre-Listing Inspections',
  'Real Estate Investment: Cash Flow Strategies',
  'Home Renovation: Budget Planning Tips',
  'Real Estate Technology: Virtual Tours and More',
  'The Art of Real Estate Photography',
  'Real Estate Investment: Exit Strategies',
  'Home Buying: Red Flags to Watch For',
  'Real Estate Market: Supply and Demand Dynamics',
  'The Benefits of Real Estate Investment',
  'Home Selling: Preparing Your Property',
  'Real Estate Investment: Market Timing',
  'Home Improvement: DIY vs. Professional',
  'Real Estate Marketing: Email Campaigns',
  'The Psychology of Real Estate Pricing',
  'Real Estate Investment: Due Diligence',
  'Home Buying: Understanding Market Conditions',
  'Real Estate Technology: AI and Machine Learning',
  'The Benefits of Real Estate Portfolios',
  'Home Staging: Room-by-Room Guide',
  'Real Estate Investment: Leverage Strategies',
  'Home Maintenance: Seasonal Tasks',
  'Real Estate Market: Economic Indicators',
  'The Future of Real Estate Transactions',
  'Real Estate Investment: Property Types',
  'Home Buying: Financing Options',
  'Real Estate Marketing: Content Strategies',
  'The Benefits of Real Estate Education',
  'Home Selling: Marketing Your Property',
  'Real Estate Investment: Risk Assessment',
  'Home Improvement: Value-Adding Projects',
  'Real Estate Market: Local vs. National Trends',
  'The Art of Real Estate Negotiation',
  'Real Estate Investment: Building a Portfolio',
  'Home Buying: Common Mistakes to Avoid',
  'Real Estate Technology: Future Innovations'
];

const blogContentTemplates = [
  (title) => `Welcome to our comprehensive guide on ${title.toLowerCase()}. In today's real estate market, understanding these key concepts is essential for making informed decisions.

Whether you're a first-time buyer, experienced investor, or looking to sell your property, this article will provide you with valuable insights and practical advice.

Key Points:
• Understanding the fundamentals
• Practical tips and strategies
• Common pitfalls to avoid
• Expert recommendations

Real estate is one of the most significant investments most people will make in their lifetime. By staying informed and working with experienced professionals, you can navigate the market with confidence.

Remember, every real estate transaction is unique, and what works for one person may not work for another. Always consult with qualified professionals before making major decisions.`,

  (title) => `In this detailed exploration of ${title.toLowerCase()}, we'll dive deep into the nuances that can make or break your real estate success.

The real estate market is constantly evolving, and staying ahead of trends requires both knowledge and experience. This article breaks down complex topics into actionable insights.

What You'll Learn:
• Industry best practices
• Real-world examples
• Step-by-step guidance
• Expert insights

Success in real estate comes from a combination of market knowledge, timing, and working with the right team. Our goal is to empower you with the information you need to succeed.

As you read through this guide, take notes and consider how these strategies might apply to your specific situation. Real estate is both an art and a science, and understanding both aspects is crucial.`,

  (title) => `${title} is a topic that many people find overwhelming, but it doesn't have to be. This article simplifies complex concepts and provides clear, actionable advice.

The real estate industry has changed significantly over the years, and understanding current trends and practices is essential for anyone involved in buying, selling, or investing in property.

Important Considerations:
• Market conditions
• Financial implications
• Legal requirements
• Long-term planning

Whether you're looking to buy your first home, expand your investment portfolio, or sell a property, having the right information at your fingertips is crucial. This guide provides that foundation.

Remember, real estate is a long-term investment, and decisions made today will impact your financial future. Take the time to understand all aspects before committing.`,

  (title) => `When it comes to ${title.toLowerCase()}, knowledge truly is power. This comprehensive guide covers everything you need to know to make informed decisions.

The real estate market offers numerous opportunities, but success requires understanding the fundamentals and staying current with market trends. This article provides both.

Key Takeaways:
• Essential concepts explained
• Practical application tips
• Industry insights
• Future considerations

Real estate professionals play a crucial role in helping clients navigate complex transactions. However, being an informed consumer or investor is equally important.

As you explore this topic, keep in mind that real estate markets vary by location, and what works in one area may not work in another. Always consider local market conditions.`,

  (title) => `Exploring ${title.toLowerCase()} reveals the depth and complexity of the real estate industry. This article provides a thorough examination of the topic.

Success in real estate comes from understanding market dynamics, financial principles, and human psychology. This guide addresses all three aspects to give you a complete picture.

What Makes This Important:
• Current market relevance
• Practical applications
• Expert perspectives
• Actionable strategies

The real estate landscape continues to evolve with new technologies, changing regulations, and shifting market conditions. Staying informed is not just beneficial—it's essential.

Whether you're actively involved in real estate or simply planning for the future, the information in this guide will serve as a valuable resource for years to come.`
];

// Generate random blog posts
function generateBlogs() {
  const blogs = [];
  const imageUrls = [
    'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
    'https://images.unsplash.com/photo-1568605117035-5232c532c0a0?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1560448075-cbc16ba4a9b4?w=800',
    'https://images.unsplash.com/photo-1560448076-0ad8d4c2c0c0?w=800',
    'https://images.unsplash.com/photo-1560449752-7eda3b1c4c0e?w=800',
    'https://images.unsplash.com/photo-1568605117035-5232c532c0a0?w=800',
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
  ];

  for (let i = 0; i < 100; i++) {
    const title = blogTitles[i % blogTitles.length];
    const template = blogContentTemplates[i % blogContentTemplates.length];
    const content = template(title);
    
    // Generate excerpt (first 150 characters of content)
    const excerpt = content.substring(0, 150).replace(/\n/g, ' ') + '...';
    
    // Random featured image
    const featuredImageUrl = imageUrls[Math.floor(Math.random() * imageUrls.length)];
    
    // Some blogs have additional images
    const hasAdditionalImages = Math.random() > 0.5;
    const images = hasAdditionalImages ? [
      {
        imageUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
        thumbnailUrl: imageUrls[Math.floor(Math.random() * imageUrls.length)],
        displayOrder: 0,
        caption: 'Featured Image'
      }
    ] : [];
    
    // Most blogs are published, some are drafts
    const isPublished = Math.random() > 0.1; // 90% published
    
    blogs.push({
      title: `${title}${i >= blogTitles.length ? ` (Part ${Math.floor(i / blogTitles.length) + 1})` : ''}`,
      content,
      excerpt,
      featuredImageUrl,
      isPublished,
      images
    });
  }
  
  return blogs;
}

// Seed blogs
function seedBlogs() {
  const blogs = generateBlogs();
  let inserted = 0;
  let errors = 0;

  console.log(`Starting to seed ${blogs.length} blog posts...`);

  blogs.forEach((blog, index) => {
    // Insert blog
    db.run(
      `INSERT INTO blogs (title, content, excerpt, featuredImageUrl, isPublished, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, datetime('now', '-' || ? || ' days'), datetime('now', '-' || ? || ' days'))`,
      [
        blog.title,
        blog.content,
        blog.excerpt,
        blog.featuredImageUrl,
        blog.isPublished ? 1 : 0,
        Math.floor(Math.random() * 365), // Random date within last year
        Math.floor(Math.random() * 365)
      ],
      function(err) {
        if (err) {
          console.error(`Error inserting blog ${index + 1}:`, err);
          errors++;
          return;
        }

        const blogId = this.lastID;
        inserted++;

        // Insert images if any
        if (blog.images && blog.images.length > 0) {
          const imageStmt = db.prepare(`
            INSERT INTO blog_images (blogId, imageUrl, thumbnailUrl, displayOrder, caption)
            VALUES (?, ?, ?, ?, ?)
          `);

          blog.images.forEach((img, imgIndex) => {
            imageStmt.run(
              blogId,
              img.imageUrl,
              img.thumbnailUrl || img.imageUrl,
              img.displayOrder !== undefined ? img.displayOrder : imgIndex,
              img.caption || null
            );
          });

          imageStmt.finalize();
        }

        if (inserted % 10 === 0) {
          console.log(`Inserted ${inserted} blog posts...`);
        }

        // Close connection when done
        if (inserted + errors === blogs.length) {
          console.log(`\n✅ Seeding complete!`);
          console.log(`   Inserted: ${inserted} blog posts`);
          console.log(`   Errors: ${errors}`);
          db.close((err) => {
            if (err) {
              console.error('Error closing database:', err);
            }
            process.exit(0);
          });
        }
      }
    );
  });
}

// Run seeding
console.log('🌱 Starting blog seeding process...\n');
seedBlogs();

