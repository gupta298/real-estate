const axios = require('axios');
const db = require('../database/db');

class MLSService {
  constructor() {
    this.apiKey = process.env.MLS_API_KEY;
    this.apiUrl = process.env.MLS_API_URL || 'https://api.mls.com/v1';
    this.baseHeaders = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Fetch listings from MLS API
   * This is a mock implementation - replace with actual MLS API integration
   */
  async fetchListings(params = {}) {
    try {
      // Mock MLS API call - replace with actual API endpoint
      // Example: const response = await axios.get(`${this.apiUrl}/listings`, {
      //   headers: this.baseHeaders,
      //   params: params
      // });

      // For now, return mock data structure that matches MLS format
      // In production, this would be the actual API response
      console.log('📡 Fetching listings from MLS API...');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Return mock data - replace with actual API response
      return {
        success: true,
        listings: [],
        total: 0,
        page: params.page || 1,
        limit: params.limit || 50
      };
    } catch (error) {
      console.error('Error fetching MLS listings:', error.message);
      throw error;
    }
  }

  /**
   * Transform MLS listing data to our database format
   */
  transformMLSListing(mlsListing) {
    return {
      mlsNumber: mlsListing.MLSNumber || mlsListing.mlsNumber || mlsListing.id,
      title: mlsListing.ListingTitle || mlsListing.title || `${mlsListing.Bedrooms}BR ${mlsListing.Bathrooms}BA ${mlsListing.PropertyType}`,
      description: mlsListing.Remarks || mlsListing.description || mlsListing.Description || '',
      price: parseFloat(mlsListing.ListPrice || mlsListing.price || 0),
      address: mlsListing.UnparsedAddress || mlsListing.address || mlsListing.Address || '',
      city: mlsListing.City || mlsListing.city || '',
      state: mlsListing.StateOrProvince || mlsListing.state || '',
      zipCode: mlsListing.PostalCode || mlsListing.zipCode || mlsListing.zip || '',
      latitude: parseFloat(mlsListing.Latitude || mlsListing.latitude || 0),
      longitude: parseFloat(mlsListing.Longitude || mlsListing.longitude || 0),
      bedrooms: parseInt(mlsListing.BedroomsTotal || mlsListing.bedrooms || 0),
      bathrooms: parseFloat(mlsListing.BathroomsTotalInteger || mlsListing.bathrooms || 0),
      squareFeet: parseInt(mlsListing.LivingArea || mlsListing.squareFeet || 0),
      lotSize: parseFloat(mlsListing.LotSizeAcres || mlsListing.lotSize || 0),
      propertyType: mlsListing.PropertyType || mlsListing.propertyType || 'Unknown',
      status: this.mapMLSStatus(mlsListing.StandardStatus || mlsListing.status),
      yearBuilt: parseInt(mlsListing.YearBuilt || mlsListing.yearBuilt || 0),
      garage: parseInt(mlsListing.GarageSpaces || mlsListing.garage || 0),
      parkingSpaces: parseInt(mlsListing.ParkingTotal || mlsListing.parkingSpaces || 0),
      propertyTax: parseFloat(mlsListing.TaxAmount || mlsListing.propertyTax || 0),
      hoaFee: parseFloat(mlsListing.AssociationFee || mlsListing.hoaFee || 0),
      mlsStatus: mlsListing.StandardStatus || mlsListing.status || 'Active',
      listingDate: mlsListing.ListingContractDate || mlsListing.listingDate || null,
      lastModified: mlsListing.ModificationTimestamp || mlsListing.lastModified || new Date().toISOString()
    };
  }

  /**
   * Map MLS status to our status format
   */
  mapMLSStatus(mlsStatus) {
    const statusMap = {
      'Active': 'active',
      'Pending': 'pending',
      'Sold': 'sold',
      'Withdrawn': 'withdrawn',
      'Expired': 'expired',
      'Cancelled': 'cancelled',
      'Coming Soon': 'coming_soon'
    };
    return statusMap[mlsStatus] || 'active';
  }

  /**
   * Transform MLS images to our format
   */
  transformMLSImages(mlsListing, propertyId) {
    const images = mlsListing.Media || mlsListing.images || mlsListing.Photos || [];
    return images.map((img, index) => ({
      propertyId: propertyId,
      mlsNumber: mlsListing.MLSNumber || mlsListing.mlsNumber,
      imageUrl: img.Url || img.url || img,
      thumbnailUrl: img.ThumbnailUrl || img.thumbnailUrl || img,
      isPrimary: index === 0,
      displayOrder: index,
      caption: img.Caption || img.caption || ''
    }));
  }

  /**
   * Transform MLS features to our format
   */
  transformMLSFeatures(mlsListing, propertyId) {
    const features = [];
    const mlsFeatures = mlsListing.Features || mlsListing.features || mlsListing.Amenities || [];
    
    mlsFeatures.forEach(feature => {
      features.push({
        propertyId: propertyId,
        mlsNumber: mlsListing.MLSNumber || mlsListing.mlsNumber,
        feature: typeof feature === 'string' ? feature : (feature.Name || feature.name || ''),
        category: typeof feature === 'object' ? (feature.Category || feature.category || 'General') : 'General'
      });
    });

    return features;
  }

  /**
   * Sync listings from MLS to database
   */
  async syncListings(options = {}) {
    const syncLogId = await this.startSyncLog('full');
    let recordsProcessed = 0;
    let recordsAdded = 0;
    let recordsUpdated = 0;
    let recordsDeleted = 0;

    try {
      const params = {
        page: 1,
        limit: options.limit || 100,
        status: options.status || 'Active'
      };

      let hasMore = true;
      while (hasMore) {
        const response = await this.fetchListings(params);
        const listings = response.listings || [];

        for (const mlsListing of listings) {
          recordsProcessed++;
          const propertyData = this.transformMLSListing(mlsListing);
          
          // Check if property exists
          const existing = await this.getPropertyByMLS(propertyData.mlsNumber);
          
          if (existing) {
            // Update existing property
            await this.updateProperty(existing.id, propertyData);
            recordsUpdated++;
          } else {
            // Insert new property
            const propertyId = await this.insertProperty(propertyData);
            
            // Insert images
            const images = this.transformMLSImages(mlsListing, propertyId);
            await this.insertImages(images);
            
            // Insert features
            const features = this.transformMLSFeatures(mlsListing, propertyId);
            await this.insertFeatures(features);
            
            recordsAdded++;
          }
        }

        // Check if there are more pages
        hasMore = listings.length === params.limit;
        params.page++;
      }

      await this.completeSyncLog(syncLogId, 'success', {
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        recordsDeleted
      });

      return {
        success: true,
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        recordsDeleted
      };
    } catch (error) {
      await this.completeSyncLog(syncLogId, 'error', {
        recordsProcessed,
        recordsAdded,
        recordsUpdated,
        recordsDeleted,
        errorMessage: error.message
      });
      throw error;
    }
  }

  /**
   * Database helper methods
   */
  async getPropertyByMLS(mlsNumber) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM properties WHERE mlsNumber = $1',
        [mlsNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  async insertProperty(propertyData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO properties (
          mlsNumber, title, description, price, address, city, state, zipCode,
          latitude, longitude, bedrooms, bathrooms, squareFeet, lotSize,
          propertyType, status, yearBuilt, garage, parkingSpaces,
          propertyTax, hoaFee, mlsStatus, listingDate, lastModified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
        RETURNING id
      `;
      
      db.run(sql, [
        propertyData.mlsNumber, propertyData.title, propertyData.description,
        propertyData.price, propertyData.address, propertyData.city,
        propertyData.state, propertyData.zipCode, propertyData.latitude,
        propertyData.longitude, propertyData.bedrooms, propertyData.bathrooms,
        propertyData.squareFeet, propertyData.lotSize, propertyData.propertyType,
        propertyData.status, propertyData.yearBuilt, propertyData.garage,
        propertyData.parkingSpaces, propertyData.propertyTax, propertyData.hoaFee,
        propertyData.mlsStatus, propertyData.listingDate, propertyData.lastModified
      ], function(err, result) {
        if (err) reject(err);
        else resolve(result && result.rows && result.rows[0] ? result.rows[0].id : null);
      });
    });
  }

  async updateProperty(propertyId, propertyData) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE properties SET
          title = $1, description = $2, price = $3, address = $4, city = $5,
          state = $6, zipCode = $7, latitude = $8, longitude = $9,
          bedrooms = $10, bathrooms = $11, squareFeet = $12, lotSize = $13,
          propertyType = $14, status = $15, yearBuilt = $16, garage = $17,
          parkingSpaces = $18, propertyTax = $19, hoaFee = $20,
          mlsStatus = $21, listingDate = $22, lastModified = $23,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = $24
      `;
      
      db.run(sql, [
        propertyData.title, propertyData.description, propertyData.price,
        propertyData.address, propertyData.city, propertyData.state,
        propertyData.zipCode, propertyData.latitude, propertyData.longitude,
        propertyData.bedrooms, propertyData.bathrooms, propertyData.squareFeet,
        propertyData.lotSize, propertyData.propertyType, propertyData.status,
        propertyData.yearBuilt, propertyData.garage, propertyData.parkingSpaces,
        propertyData.propertyTax, propertyData.hoaFee, propertyData.mlsStatus,
        propertyData.listingDate, propertyData.lastModified, propertyId
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async insertImages(images) {
    if (images.length === 0) return;
    
    // PostgreSQL doesn't handle prepare/finalize like SQLite does with multiple executions
    // so we'll use individual inserts or a transaction
    return new Promise(async (resolve, reject) => {
      try {
        // Start a transaction for better performance with multiple inserts
        await db.run('BEGIN;');
        
        const sql = `
          INSERT INTO property_images (propertyId, mlsNumber, imageUrl, thumbnailUrl, isPrimary, displayOrder, caption)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        // Insert each image individually
        for (const img of images) {
          await db.run(sql, [
            img.propertyId, img.mlsNumber, img.imageUrl, img.thumbnailUrl,
            img.isPrimary ? true : false, // Using boolean instead of 0/1
            img.displayOrder, img.caption
          ]);
        }
        
        // Commit the transaction
        await db.run('COMMIT;');
        resolve();
      } catch (err) {
        // Rollback on error
        await db.run('ROLLBACK;');
        reject(err);
      }
    });
  }

  async insertFeatures(features) {
    if (features.length === 0) return;
    
    // PostgreSQL approach similar to insertImages
    return new Promise(async (resolve, reject) => {
      try {
        // Start a transaction for better performance
        await db.run('BEGIN;');
        
        const sql = `
          INSERT INTO property_features (propertyId, mlsNumber, feature, category)
          VALUES ($1, $2, $3, $4)
        `;
        
        // Insert each feature individually
        for (const feat of features) {
          await db.run(sql, [
            feat.propertyId, feat.mlsNumber, feat.feature, feat.category
          ]);
        }
        
        // Commit the transaction
        await db.run('COMMIT;');
        resolve();
      } catch (err) {
        // Rollback on error
        await db.run('ROLLBACK;');
        reject(err);
      }
    });
  }

  async startSyncLog(syncType) {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO mls_sync_log (syncType, status) VALUES ($1, $2) RETURNING id',
        [syncType, 'in_progress'],
        function(err, result) {
          if (err) reject(err);
          else resolve(result && result.rows && result.rows[0] ? result.rows[0].id : null);
        }
      );
    });
  }

  async completeSyncLog(syncLogId, status, stats) {
    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE mls_sync_log SET
          status = $1, recordsProcessed = $2, recordsAdded = $3,
          recordsUpdated = $4, recordsDeleted = $5, errorMessage = $6,
          completedAt = CURRENT_TIMESTAMP
        WHERE id = $7`,
        [
          status, stats.recordsProcessed, stats.recordsAdded,
          stats.recordsUpdated, stats.recordsDeleted,
          stats.errorMessage || null, syncLogId
        ],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
}

module.exports = new MLSService();

