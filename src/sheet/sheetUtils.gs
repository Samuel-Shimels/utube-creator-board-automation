/**
 * YouTube Content Manager - Sheet Utilities
 * Provides utility functions for sheet operations, caching, and performance optimization
 */

/**
 * Cache service for performance optimization
 */
const CacheService = {
  CACHE_PREFIX: 'yt_content_',
  DEFAULT_TTL: 300, // 5 minutes

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get: function(key) {
    try {
      const cache = CacheService.getScriptCache();
      const cached = cache.get(CacheService.CACHE_PREFIX + key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.warn('Cache get error:', error);
      return null;
    }
  },

  /**
   * Set cached value
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  set: function(key, value, ttl) {
    try {
      const cache = CacheService.getScriptCache();
      cache.put(CacheService.CACHE_PREFIX + key, JSON.stringify(value), ttl || CacheService.DEFAULT_TTL);
    } catch (error) {
      console.warn('Cache set error:', error);
    }
  },

  /**
   * Remove cached value
   * @param {string} key - Cache key
   */
  remove: function(key) {
    try {
      const cache = CacheService.getScriptCache();
      cache.remove(CacheService.CACHE_PREFIX + key);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  },

  /**
   * Clear all cached values
   */
  clear: function() {
    try {
      const cache = CacheService.getScriptCache();
      cache.removeAll([CacheService.CACHE_PREFIX + '*']);
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  },

  /**
   * Get script cache instance
   * @returns {Cache} Script cache
   */
  getScriptCache: function() {
    return CacheService.getScriptCache();
  }
};

/**
 * Get content assets with caching
 * @param {boolean} useCache - Whether to use cache
 * @returns {Array} Content assets
 */
function getContentAssetsCached(useCache = true) {
  const cacheKey = 'content_assets';
  
  if (useCache) {
    const cached = CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const assets = getContentAssets();
  
  if (useCache) {
    CacheService.set(cacheKey, assets, 300); // Cache for 5 minutes
  }
  
  return assets;
}

/**
 * Get dashboard metrics with caching
 * @param {boolean} useCache - Whether to use cache
 * @returns {object} Dashboard metrics
 */
function getDashboardMetricsCached(useCache = true) {
  const cacheKey = 'dashboard_metrics';
  
  if (useCache) {
    const cached = CacheService.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const metrics = getDashboardMetrics();
  
  if (useCache) {
    CacheService.set(cacheKey, metrics, 180); // Cache for 3 minutes
  }
  
  return metrics;
}

/**
 * Batch update content assets
 * @param {Array} updates - Array of update objects {id, data}
 * @returns {object} Batch update result
 */
function batchUpdateContentAssets(updates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');
    const updatedAtIndex = headers.indexOf('UpdatedAt');
    const now = new Date();

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each update
    updates.forEach(update => {
      try {
        // Find the row
        let rowIndex = -1;
        for (let i = 1; i < data.length; i++) {
          if (data[i][idIndex] === update.id) {
            rowIndex = i;
            break;
          }
        }

        if (rowIndex === -1) {
          throw new Error('Content not found with ID: ' + update.id);
        }

        // Update fields
        const fieldsToUpdate = [
          'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
          'Assets', 'Notes', 'PublishedURL'
        ];

        fieldsToUpdate.forEach(field => {
          if (update.data.hasOwnProperty(field)) {
            const columnIndex = headers.indexOf(field);
            if (columnIndex !== -1) {
              sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(update.data[field]);
            }
          }
        });

        // Update timestamp
        sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(now);

        results.successful++;

      } catch (error) {
        results.failed++;
        results.errors.push({
          id: update.id,
          error: error.message
        });
      }
    });

    // Clear cache after batch update
    CacheService.remove('content_assets');
    CacheService.remove('dashboard_metrics');

    return {
      success: true,
      message: `Batch update completed: ${results.successful} successful, ${results.failed} failed`,
      data: results
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'BATCH_UPDATE_ERROR'
      }
    };
  }
}

/**
 * Export content assets to CSV
 * @param {object} filters - Optional filters
 * @returns {string} CSV data
 */
function exportContentAssetsToCSV(filters = {}) {
  try {
    let assets = getContentAssetsCached(false); // Don't use cache for export
    
    // Apply filters
    if (filters.pillar) {
      assets = assets.filter(asset => asset.pillar === filters.pillar);
    }
    if (filters.workflowPhase) {
      assets = assets.filter(asset => asset.workflowPhase === filters.workflowPhase);
    }
    if (filters.assignedTo) {
      assets = assets.filter(asset => asset.assignedTo === filters.assignedTo);
    }

    // Convert to CSV
    const headers = [
      'ID', 'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
      'Assets', 'Notes', 'PublishedURL', 'CreatedAt', 'UpdatedAt'
    ];

    const csvRows = [headers.join(',')];
    
    assets.forEach(asset => {
      const row = [
        asset.id,
        `"${(asset.title || '').replace(/"/g, '""')}"`,
        `"${(asset.pillar || '').replace(/"/g, '""')}"`,
        `"${(asset.workflowPhase || '').replace(/"/g, '""')}"`,
        `"${(asset.assignedTo || '').replace(/"/g, '""')}"`,
        asset.dueDate ? new Date(asset.dueDate).toISOString() : '',
        `"${(asset.assets || '').replace(/"/g, '""')}"`,
        `"${(asset.notes || '').replace(/"/g, '""')}"`,
        `"${(asset.publishedUrl || '').replace(/"/g, '""')}"`,
        asset.createdAt ? new Date(asset.createdAt).toISOString() : '',
        asset.updatedAt ? new Date(asset.updatedAt).toISOString() : ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');

  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return '';
  }
}

/**
 * Import content assets from CSV
 * @param {string} csvData - CSV data
 * @returns {object} Import result
 */
function importContentAssetsFromCSV(csvData) {
  try {
    const lines = csvData.split('\n');
    if (lines.length < 2) {
      throw new Error('CSV data must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.replace(/"/g, ''));
    const expectedHeaders = [
      'ID', 'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
      'Assets', 'Notes', 'PublishedURL', 'CreatedAt', 'UpdatedAt'
    ];

    // Validate headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error('Missing required headers: ' + missingHeaders.join(', '));
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.replace(/"/g, ''));
        if (values.length !== headers.length) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            error: 'Column count mismatch'
          });
          continue;
        }

        // Create asset object
        const assetData = {};
        headers.forEach((header, index) => {
          assetData[header] = values[index];
        });

        // Convert date strings to Date objects
        if (assetData.DueDate) {
          assetData.DueDate = new Date(assetData.DueDate);
        }
        if (assetData.CreatedAt) {
          assetData.CreatedAt = new Date(assetData.CreatedAt);
        }
        if (assetData.UpdatedAt) {
          assetData.UpdatedAt = new Date(assetData.UpdatedAt);
        }

        // Create or update the asset
        if (assetData.ID) {
          // Check if asset exists
          const existingAsset = getContentAssetById(assetData.ID);
          if (existingAsset) {
            updateContentAsset(assetData.ID, assetData);
          } else {
            createContentAsset(assetData);
          }
        } else {
          // Generate new ID
          assetData.ID = 'content_' + Utilities.getUuid();
          createContentAsset(assetData);
        }

        results.imported++;

      } catch (error) {
        results.skipped++;
        results.errors.push({
          row: i + 1,
          error: error.message
        });
      }
    }

    // Clear cache after import
    CacheService.remove('content_assets');
    CacheService.remove('dashboard_metrics');

    return {
      success: true,
      message: `Import completed: ${results.imported} imported, ${results.skipped} skipped`,
      data: results
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'IMPORT_ERROR'
      }
    };
  }
}

/**
 * Get content statistics
 * @returns {object} Content statistics
 */
function getContentStatistics() {
  try {
    const assets = getContentAssetsCached();
    
    const stats = {
      total: assets.length,
      byPillar: {},
      byPhase: {},
      byAssignee: {},
      published: 0,
      inProgress: 0,
      overdue: 0,
      thisWeek: 0,
      thisMonth: 0,
      averageTimeToPublish: 0
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let totalPublishTime = 0;
    let publishedCount = 0;

    assets.forEach(asset => {
      // Count by pillar
      if (asset.pillar) {
        stats.byPillar[asset.pillar] = (stats.byPillar[asset.pillar] || 0) + 1;
      }

      // Count by phase
      if (asset.workflowPhase) {
        stats.byPhase[asset.workflowPhase] = (stats.byPhase[asset.workflowPhase] || 0) + 1;
      }

      // Count by assignee
      if (asset.assignedTo) {
        stats.byAssignee[asset.assignedTo] = (stats.byAssignee[asset.assignedTo] || 0) + 1;
      }

      // Count published
      if (asset.workflowPhase === 'Published') {
        stats.published++;
        
        // Calculate time to publish
        if (asset.createdAt && asset.updatedAt) {
          const timeToPublish = new Date(asset.updatedAt) - new Date(asset.createdAt);
          totalPublishTime += timeToPublish;
          publishedCount++;
        }
      }

      // Count in progress
      if (asset.workflowPhase && asset.workflowPhase !== 'Idea' && asset.workflowPhase !== 'Published') {
        stats.inProgress++;
      }

      // Check due dates
      if (asset.dueDate) {
        const dueDate = new Date(asset.dueDate);
        if (dueDate < now) {
          stats.overdue++;
        }
      }

      // Check creation dates
      if (asset.createdAt) {
        const createdAt = new Date(asset.createdAt);
        if (createdAt >= oneWeekAgo) {
          stats.thisWeek++;
        }
        if (createdAt >= oneMonthAgo) {
          stats.thisMonth++;
        }
      }
    });

    // Calculate average time to publish
    if (publishedCount > 0) {
      stats.averageTimeToPublish = Math.round(totalPublishTime / publishedCount / (1000 * 60 * 60 * 24)); // Days
    }

    return stats;

  } catch (error) {
    console.error('Error getting content statistics:', error);
    return {
      total: 0,
      byPillar: {},
      byPhase: {},
      byAssignee: {},
      published: 0,
      inProgress: 0,
      overdue: 0,
      thisWeek: 0,
      thisMonth: 0,
      averageTimeToPublish: 0
    };
  }
}

/**
 * Validate content asset data
 * @param {object} assetData - Asset data to validate
 * @returns {object} Validation result
 */
function validateContentAsset(assetData) {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!assetData.title || assetData.title.trim() === '') {
    errors.push('Title is required');
  }

  if (!assetData.pillar) {
    errors.push('Pillar is required');
  } else {
    const validPillars = [
      'Educational Tutorials',
      'Product Demos',
      'Customer Success Stories',
      'Support Library',
      'Marketing & Updates'
    ];
    if (!validPillars.includes(assetData.pillar)) {
      errors.push('Invalid pillar selected');
    }
  }

  if (!assetData.workflowPhase) {
    errors.push('Workflow phase is required');
  } else {
    const validPhases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
    if (!validPhases.includes(assetData.workflowPhase)) {
      errors.push('Invalid workflow phase selected');
    }
  }

  // Optional field validations
  if (assetData.dueDate) {
    const dueDate = new Date(assetData.dueDate);
    if (isNaN(dueDate.getTime())) {
      errors.push('Invalid due date format');
    } else if (dueDate < new Date()) {
      warnings.push('Due date is in the past');
    }
  }

  if (assetData.publishedUrl) {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(assetData.publishedUrl)) {
      errors.push('Published URL must be a valid HTTP/HTTPS URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
    warnings: warnings
  };
}

/**
 * Clear all caches
 * @returns {object} Clear result
 */
function clearAllCaches() {
  try {
    CacheService.clear();
    return {
      success: true,
      message: 'All caches cleared successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'CACHE_CLEAR_ERROR'
      }
    };
  }
}
