/**
 * YouTube Content Manager - Sheet Service
 * Handles CRUD operations on sheet data with caching and error handling
 */

/**
 * Get all content assets
 * @returns {Array} Array of content assets
 */
function getContentAssets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }

    const headers = data[0];
    const assets = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const asset = {
        id: row[headers.indexOf('ID')],
        title: row[headers.indexOf('Title')],
        pillar: row[headers.indexOf('Pillar')],
        workflowPhase: row[headers.indexOf('WorkflowPhase')],
        assignedTo: row[headers.indexOf('AssignedTo')],
        dueDate: row[headers.indexOf('DueDate')],
        assets: row[headers.indexOf('Assets')],
        notes: row[headers.indexOf('Notes')],
        publishedUrl: row[headers.indexOf('PublishedURL')],
        createdAt: row[headers.indexOf('CreatedAt')],
        updatedAt: row[headers.indexOf('UpdatedAt')]
      };
      assets.push(asset);
    }

    return assets;

  } catch (error) {
    console.error('Error getting content assets:', error);
    return [];
  }
}

/**
 * Get content asset by ID
 * @param {string} contentId - Content ID
 * @returns {object|null} Content asset or null if not found
 */
function getContentAssetById(contentId) {
  try {
    const assets = getContentAssets();
    return assets.find(asset => asset.id === contentId) || null;
  } catch (error) {
    console.error('Error getting content asset by ID:', error);
    return null;
  }
}

/**
 * Create new content asset
 * @param {object} assetData - Asset data
 * @returns {object} Creation result
 */
function createContentAsset(assetData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    // Generate unique ID
    const contentId = 'content_' + Utilities.getUuid();
    const now = new Date();

    // Prepare row data
    const rowData = [
      contentId,
      assetData.title || '',
      assetData.pillar || '',
      assetData.workflowPhase || 'Idea',
      assetData.assignedTo || '',
      assetData.dueDate || '',
      assetData.assets || '',
      assetData.notes || '',
      assetData.publishedUrl || '',
      now,
      now
    ];

    // Append row
    sheet.appendRow(rowData);

    // Log audit event
    logAuditEvent('ContentAssets', contentId, 'CREATE', Session.getActiveUser().getEmail(), 'Content asset created');

    return {
      success: true,
      message: 'Content asset created successfully',
      data: {
        id: contentId,
        ...assetData,
        createdAt: now,
        updatedAt: now
      }
    };

  } catch (error) {
    console.error('Error creating content asset:', error);
    return {
      success: false,
      error: {
        message: error.message,
        type: 'CREATE_ERROR'
      }
    };
  }
}

/**
 * Update content asset
 * @param {string} contentId - Content ID
 * @param {object} updateData - Update data
 * @returns {object} Update result
 */
function updateContentAsset(contentId, updateData) {
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

    // Find the row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === contentId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Content asset not found with ID: ' + contentId);
    }

    // Update fields
    const fieldsToUpdate = [
      'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
      'Assets', 'Notes', 'PublishedURL'
    ];

    fieldsToUpdate.forEach(field => {
      if (updateData.hasOwnProperty(field)) {
        const columnIndex = headers.indexOf(field);
        if (columnIndex !== -1) {
          sheet.getRange(rowIndex + 1, columnIndex + 1).setValue(updateData[field]);
        }
      }
    });

    // Update timestamp
    sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

    // Log audit event
    logAuditEvent('ContentAssets', contentId, 'UPDATE', Session.getActiveUser().getEmail(), 'Content asset updated');

    return {
      success: true,
      message: 'Content asset updated successfully',
      data: {
        id: contentId,
        ...updateData,
        updatedAt: new Date()
      }
    };

  } catch (error) {
    console.error('Error updating content asset:', error);
    return {
      success: false,
      error: {
        message: error.message,
        type: 'UPDATE_ERROR'
      }
    };
  }
}

/**
 * Delete content asset
 * @param {string} contentId - Content ID
 * @returns {object} Deletion result
 */
function deleteContentAsset(contentId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('ID');

    // Find the row
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === contentId) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      throw new Error('Content asset not found with ID: ' + contentId);
    }

    // Delete the row
    sheet.deleteRow(rowIndex + 1);

    // Log audit event
    logAuditEvent('ContentAssets', contentId, 'DELETE', Session.getActiveUser().getEmail(), 'Content asset deleted');

    return {
      success: true,
      message: 'Content asset deleted successfully'
    };

  } catch (error) {
    console.error('Error deleting content asset:', error);
    return {
      success: false,
      error: {
        message: error.message,
        type: 'DELETE_ERROR'
      }
    };
  }
}

/**
 * Search content assets
 * @param {object} searchCriteria - Search criteria
 * @returns {Array} Filtered content assets
 */
function searchContentAssets(searchCriteria) {
  try {
    const assets = getContentAssets();
    let filteredAssets = assets;

    // Filter by pillar
    if (searchCriteria.pillar) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.pillar === searchCriteria.pillar
      );
    }

    // Filter by workflow phase
    if (searchCriteria.workflowPhase) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.workflowPhase === searchCriteria.workflowPhase
      );
    }

    // Filter by assigned user
    if (searchCriteria.assignedTo) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.assignedTo === searchCriteria.assignedTo
      );
    }

    // Filter by title (partial match)
    if (searchCriteria.title) {
      const titleFilter = searchCriteria.title.toLowerCase();
      filteredAssets = filteredAssets.filter(asset => 
        asset.title && asset.title.toLowerCase().includes(titleFilter)
      );
    }

    // Filter by date range
    if (searchCriteria.dateFrom) {
      const fromDate = new Date(searchCriteria.dateFrom);
      filteredAssets = filteredAssets.filter(asset => 
        asset.createdAt && new Date(asset.createdAt) >= fromDate
      );
    }

    if (searchCriteria.dateTo) {
      const toDate = new Date(searchCriteria.dateTo);
      filteredAssets = filteredAssets.filter(asset => 
        asset.createdAt && new Date(asset.createdAt) <= toDate
      );
    }

    // Sort results
    const sortBy = searchCriteria.sortBy || 'createdAt';
    const sortOrder = searchCriteria.sortOrder || 'desc';
    
    filteredAssets.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filteredAssets;

  } catch (error) {
    console.error('Error searching content assets:', error);
    return [];
  }
}

/**
 * Get dashboard metrics
 * @returns {object} Dashboard metrics
 */
function getDashboardMetrics() {
  try {
    const assets = getContentAssets();
    
    const metrics = {
      totalContent: assets.length,
      publishedCount: 0,
      inProgressCount: 0,
      overdueCount: 0,
      upcomingDueCount: 0,
      pillars: {},
      phases: {},
      thisWeek: 0,
      thisMonth: 0
    };

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Initialize counters
    const pillars = ['Educational Tutorials', 'Product Demos', 'Customer Success Stories', 'Support Library', 'Marketing & Updates'];
    const phases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
    
    pillars.forEach(pillar => {
      metrics.pillars[pillar] = 0;
    });
    
    phases.forEach(phase => {
      metrics.phases[phase] = 0;
    });

    // Process assets
    assets.forEach(asset => {
      // Count by pillar
      if (asset.pillar && metrics.pillars.hasOwnProperty(asset.pillar)) {
        metrics.pillars[asset.pillar]++;
      }

      // Count by phase
      if (asset.workflowPhase && metrics.phases.hasOwnProperty(asset.workflowPhase)) {
        metrics.phases[asset.workflowPhase]++;
      }

      // Count published
      if (asset.workflowPhase === 'Published') {
        metrics.publishedCount++;
      }

      // Count in progress
      if (asset.workflowPhase && asset.workflowPhase !== 'Idea' && asset.workflowPhase !== 'Published') {
        metrics.inProgressCount++;
      }

      // Check due dates
      if (asset.dueDate) {
        const dueDate = new Date(asset.dueDate);
        if (dueDate < now) {
          metrics.overdueCount++;
        } else if (dueDate <= oneWeekFromNow) {
          metrics.upcomingDueCount++;
        }
      }

      // Check creation dates
      if (asset.createdAt) {
        const createdAt = new Date(asset.createdAt);
        if (createdAt >= oneWeekAgo) {
          metrics.thisWeek++;
        }
        if (createdAt >= oneMonthAgo) {
          metrics.thisMonth++;
        }
      }
    });

    // Calculate completion rate
    metrics.completionRate = metrics.totalContent > 0 ? 
      Math.round((metrics.publishedCount / metrics.totalContent) * 100) : 0;

    return metrics;

  } catch (error) {
    console.error('Error getting dashboard metrics:', error);
    return {
      totalContent: 0,
      publishedCount: 0,
      inProgressCount: 0,
      overdueCount: 0,
      upcomingDueCount: 0,
      pillars: {},
      phases: {},
      thisWeek: 0,
      thisMonth: 0,
      completionRate: 0
    };
  }
}

/**
 * Log audit event
 * @param {string} entityType - Type of entity
 * @param {string} entityId - Entity ID
 * @param {string} action - Action performed
 * @param {string} userId - User ID
 * @param {string} notes - Optional notes
 */
function logAuditEvent(entityType, entityId, action, userId, notes) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Activity_Audit');
    
    if (!auditSheet) {
      console.warn('Activity_Audit sheet not found, skipping audit log');
      return;
    }

    const auditId = 'audit_' + Utilities.getUuid();
    const timestamp = new Date().toISOString();

    auditSheet.appendRow([
      auditId,
      entityType,
      entityId,
      action,
      userId,
      timestamp,
      notes || ''
    ]);

  } catch (error) {
    console.error('Error logging audit event:', error);
  }
}

/**
 * Get audit trail for content
 * @param {string} contentId - Content ID
 * @returns {Array} Audit trail
 */
function getContentAuditTrail(contentId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Activity_Audit');
    
    if (!auditSheet) {
      return [];
    }

    const data = auditSheet.getDataRange().getValues();
    if (data.length <= 1) {
      return [];
    }

    const headers = data[0];
    const entityIdIndex = headers.indexOf('entity_id');
    const auditTrail = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[entityIdIndex] === contentId) {
        auditTrail.push({
          auditId: row[headers.indexOf('audit_id')],
          entityType: row[headers.indexOf('entity_type')],
          entityId: row[headers.indexOf('entity_id')],
          action: row[headers.indexOf('action')],
          userId: row[headers.indexOf('user_id')],
          timestamp: row[headers.indexOf('timestamp')],
          notes: row[headers.indexOf('notes')]
        });
      }
    }

    // Sort by timestamp (newest first)
    auditTrail.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return auditTrail;

  } catch (error) {
    console.error('Error getting audit trail:', error);
    return [];
  }
}
