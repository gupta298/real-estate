require('dotenv').config();
const mlsService = require('../services/mlsService');

async function syncMLS() {
  try {
    console.log('🔄 Starting MLS sync...');
    const result = await mlsService.syncListings();
    console.log('✅ MLS sync completed:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ MLS sync failed:', error);
    process.exit(1);
  }
}

syncMLS();

