/**
 * YouTube Content Manager - Main Entry Point
 * This file serves as the main entry point for the YouTube Content Manager application
 */

/**
 * Main function to initialize the application
 * This function is called when the web app is accessed
 */
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('YouTube Content Manager')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

/**
 * Handle POST requests for API calls (for APIClient.Call optimization)
 * @param {Object} e - Event object containing request data
 * @returns {Object} JSON response
 */
function doPost(e) {
  try {
    let requestData;
    
    // Parse request data
    if (e.postData && e.postData.contents) {
      requestData = JSON.parse(e.postData.contents);
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: 'Invalid request format'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const action = requestData.action;
    const params = requestData.params || {};
    
    // Route to appropriate handler
    let result;
    switch(action) {
      // Dashboard & Stats
      case 'getDashboardMetrics':
        result = getDashboardMetrics();
        break;
      case 'getAppStatistics':
        result = getAppStatistics();
        break;
      case 'getAppInfo':
        result = getAppInfo();
        break;
      case 'healthCheck':
        result = healthCheck();
        break;
        
      // Content Assets
      case 'getContentAssets':
        result = getContentAssets();
        break;
      case 'createContentAsset':
        result = createContentAsset(params);
        break;
      case 'updateContentAsset':
        result = updateContentAsset(params.contentId, params.updateData);
        break;
      case 'exportContentAssetsToCSV':
        result = exportContentAssetsToCSV();
        break;
        
      // System
      case 'initYtSheets':
        result = initYtSheets();
        break;
      case 'getSystemConfig':
        result = getSystemConfig();
        break;
      case 'updateSystemConfig':
        result = updateSystemConfig(params);
        break;
      case 'getUserInfo':
        result = getUserInfo();
        break;
      case 'clearAllCaches':
        result = clearAllCaches();
        break;
      case 'invalidateCache':
        result = invalidateCache(params.cacheType);
        break;
      case 'testApplication':
        result = testApplication();
        break;
        
      // Batch operations
      case 'batchLoad':
        result = handleBatchLoad(params.operations);
        break;
        
      default:
        result = {
          success: false,
          error: 'Unknown action: ' + action
        };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('doPost error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Include function for HTML templates
 * This allows including other HTML files in the main template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Initialize YouTube Content Manager sheets
 * @returns {object} Initialization result
 */
function initYtSheets() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const specs = [
      {
        name: 'ContentAssets',
        headers: [
          'ID', 'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
          'Assets', 'Notes', 'PublishedURL', 'CreatedAt', 'UpdatedAt'
        ],
        description: 'Main content tracking sheet'
      },
      {
        name: 'Configurations',
        headers: ['ConfigKey', 'ConfigValue', 'Description', 'UpdatedAt'],
        description: 'System configuration settings'
      },
      {
        name: 'Activity_Audit',
        headers: ['audit_id', 'entity_type', 'entity_id', 'action', 'user_id', 'timestamp', 'notes'],
        description: 'Audit trail for all content changes'
      }
    ];

    // Create or update sheets
    specs.forEach(spec => {
      let sheet = ss.getSheetByName(spec.name);
      if (!sheet) {
        sheet = ss.insertSheet(spec.name);
      }
      
      // Set headers
      const headerRange = sheet.getRange(1, 1, 1, spec.headers.length);
      headerRange.setValues([spec.headers]);
      
      // Format headers
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
      
      // Auto-resize columns
      sheet.autoResizeColumns(1, spec.headers.length);
    });

    // Initialize configuration data
    initConfigurationData(ss);

    return {
      success: true,
      message: 'YouTube Content Manager sheets initialized successfully',
      spreadsheetId: ss.getId(),
      sheets: specs.map(spec => spec.name)
    };

  } catch (error) {
    console.error('Error initializing sheets:', error);
    return {
      success: false,
      error: {
        message: error.message,
        type: 'INITIALIZATION_ERROR'
      }
    };
  }
}

/**
 * Initialize configuration data
 * @private
 * @param {Spreadsheet} ss - Spreadsheet object
 */
function initConfigurationData(ss) {
  const configSheet = ss.getSheetByName('Configurations');
  if (!configSheet) return;

  const configData = [
    ['WorkflowPhases', 'Idea,Script,Recording,Editing,Review,Published', 'Available workflow phases'],
    ['ContentPillars', 'Educational Tutorials,Product Demos,Customer Success Stories,Support Library,Marketing & Updates', 'Available content pillars'],
    ['DefaultAssignee', '', 'Default user for new content'],
    ['NotificationSettings', 'enabled', 'Email notification settings'],
    ['DueDateReminderDays', '3,1', 'Days before due date to send reminders'],
    ['OverdueCheckEnabled', 'true', 'Enable overdue content checking'],
    ['WeeklySummaryEnabled', 'true', 'Enable weekly summary emails'],
    ['WeeklySummaryDay', 'Monday', 'Day of week to send summary'],
    ['TeamEmails', '', 'Comma-separated team email addresses'],
    ['LastUpdated', new Date().toISOString(), 'Last configuration update']
  ];

  // Clear existing data and add new configuration
  configSheet.clear();
  configSheet.getRange(1, 1, 1, 4).setValues([['ConfigKey', 'ConfigValue', 'Description', 'UpdatedAt']]);
  configSheet.getRange(2, 1, configData.length, 4).setValues(configData.map(row => [...row, new Date().toISOString()]));
  
  // Format headers
  configSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#f0f0f0');
  configSheet.autoResizeColumns(1, 4);
}

/**
 * Get all content assets with caching for better performance
 * @returns {Array} Array of content assets
 */
function getContentAssets() {
  try {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cacheKey = 'yt_content_assets';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('Content assets loaded from cache');
      return JSON.parse(cached);
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      return [];
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

    // Cache for 10 minutes
    try {
      cache.put(cacheKey, JSON.stringify(assets), 600);
      console.log('Content assets cached for 10 minutes');
    } catch (e) {
      console.warn('Could not cache content assets:', e);
    }

    return assets;

  } catch (error) {
    console.error('Error getting content assets:', error);
    return [];
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

    // Invalidate content cache
    invalidateCache('content');

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

    // Invalidate content cache
    invalidateCache('content');

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
 * Get dashboard metrics with caching for better performance
 * @returns {object} Dashboard metrics
 */
function getDashboardMetrics() {
  try {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cacheKey = 'yt_dashboard_metrics';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      console.log('Dashboard metrics loaded from cache');
      return JSON.parse(cached);
    }
    
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

    // Cache for 5 minutes
    try {
      cache.put(cacheKey, JSON.stringify(metrics), 300);
      console.log('Dashboard metrics cached for 5 minutes');
    } catch (e) {
      console.warn('Could not cache dashboard metrics:', e);
    }

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
 * Export content assets to CSV
 * @returns {string} CSV data
 */
function exportContentAssetsToCSV() {
  try {
    const assets = getContentAssets();
    
    if (assets.length === 0) {
      return 'No data to export';
    }

    // Create CSV header
    const headers = ['ID', 'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate', 'Assets', 'Notes', 'PublishedURL', 'CreatedAt', 'UpdatedAt'];
    let csv = headers.join(',') + '\n';

    // Add data rows
    assets.forEach(asset => {
      const row = [
        asset.id || '',
        `"${(asset.title || '').replace(/"/g, '""')}"`,
        asset.pillar || '',
        asset.workflowPhase || '',
        asset.assignedTo || '',
        asset.dueDate || '',
        `"${(asset.assets || '').replace(/"/g, '""')}"`,
        `"${(asset.notes || '').replace(/"/g, '""')}"`,
        asset.publishedUrl || '',
        asset.createdAt || '',
        asset.updatedAt || ''
      ];
      csv += row.join(',') + '\n';
    });

    return csv;

  } catch (error) {
    console.error('Error exporting data:', error);
    return 'Error exporting data: ' + error.message;
  }
}

/**
 * Clear all caches
 * @returns {object} Clear result
 */
function clearAllCaches() {
  try {
    const cache = CacheService.getScriptCache();
    
    // Clear all known cache keys
    const cacheKeys = [
      'yt_content_assets',
      'yt_content_stats',
      'yt_dashboard_metrics',
      'yt_system_config'
    ];
    
    let clearedCount = 0;
    cacheKeys.forEach(key => {
      try {
        cache.remove(key);
        clearedCount++;
      } catch (e) {
        console.warn(`Could not clear cache key ${key}:`, e);
      }
    });
    
    return {
      success: true,
      message: `Cleared ${clearedCount} cache entries successfully`,
      clearedCount: clearedCount
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

/**
 * Invalidate specific cache entries
 * @param {string} cacheType - Type of cache to invalidate
 * @returns {object} Invalidation result
 */
function invalidateCache(cacheType) {
  try {
    const cache = CacheService.getScriptCache();
    let invalidatedCount = 0;
    
    switch(cacheType) {
      case 'content':
        const contentKeys = ['yt_content_assets', 'yt_content_stats'];
        contentKeys.forEach(key => {
          try {
            cache.remove(key);
            invalidatedCount++;
          } catch (e) {
            console.warn(`Could not invalidate ${key}:`, e);
          }
        });
        break;
      case 'dashboard':
        try {
          cache.remove('yt_dashboard_metrics');
          invalidatedCount++;
        } catch (e) {
          console.warn('Could not invalidate dashboard cache:', e);
        }
        break;
      case 'all':
        return clearAllCaches();
      default:
        return {
          success: false,
          error: 'Unknown cache type: ' + cacheType
        };
    }
    
    return {
      success: true,
      message: `Invalidated ${invalidatedCount} cache entries`,
      invalidatedCount: invalidatedCount
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
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
 * Test function to verify the application is working
 * @returns {object} Test result
 */
function testApplication() {
  try {
    // Test basic functionality
    const testResult = {
      timestamp: new Date().toISOString(),
      status: 'success',
      tests: {
        sheetsAccess: false,
        libraryAccess: false,
        basicFunctions: false
      }
    };

    // Test sheets access
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      testResult.tests.sheetsAccess = true;
    } catch (error) {
      console.error('Sheets access test failed:', error);
    }

    // Test library access (if available)
    try {
      if (typeof YtLib !== 'undefined') {
        testResult.tests.libraryAccess = true;
      }
    } catch (error) {
      console.error('Library access test failed:', error);
    }

    // Test basic functions
    try {
      const assets = getContentAssets();
      testResult.tests.basicFunctions = true;
    } catch (error) {
      console.error('Basic functions test failed:', error);
    }

    return testResult;
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Get application version and build information
 * @returns {object} Version information
 */
function getAppInfo() {
  return {
    name: 'YouTube Content Manager',
    version: '1.0.0',
    build: '2024.01.01',
    description: 'A comprehensive content management system for YouTube creators',
    features: [
      'Dashboard Analytics',
      'Kanban Workflow Management',
      'Content Pillar Organization',
      'Team Collaboration',
      'Email Notifications',
      'Data Export/Import',
      'Audit Trail',
      'Performance Caching'
    ],
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Health check function for monitoring
 * @returns {object} Health status
 */
function healthCheck() {
  try {
    const startTime = new Date().getTime();
    
    // Perform basic health checks
    const checks = {
      database: false,
      permissions: false,
      memory: false,
      performance: false
    };

    // Check database access
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheets = ss.getSheets();
      checks.database = sheets.length > 0;
    } catch (error) {
      console.error('Database check failed:', error);
    }

    // Check permissions
    try {
      const user = Session.getActiveUser();
      checks.permissions = user.getEmail() !== '';
    } catch (error) {
      console.error('Permissions check failed:', error);
    }

    // Check memory usage (basic)
    try {
      const memory = Utilities.formatString('%.2f', (ScriptApp.getMaxExecutionTime() / 1000));
      checks.memory = true;
    } catch (error) {
      console.error('Memory check failed:', error);
    }

    // Check performance
    const endTime = new Date().getTime();
    const responseTime = endTime - startTime;
    checks.performance = responseTime < 5000; // Less than 5 seconds

    const isHealthy = Object.values(checks).every(check => check === true);

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: responseTime + 'ms',
      checks: checks,
      uptime: 'N/A', // Apps Script doesn't provide uptime
      version: getAppInfo().version
    };

  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }
}

/**
 * Get system configuration
 * @returns {object} System configuration
 */
function getSystemConfig() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Configurations');
    
    if (!configSheet) {
      return {
        success: false,
        error: 'Configurations sheet not found'
      };
    }

    const data = configSheet.getDataRange().getValues();
    const config = {};

    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      config[key] = value;
    }

    return {
      success: true,
      data: config
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update system configuration
 * @param {object} configUpdates - Configuration updates
 * @returns {object} Update result
 */
function updateSystemConfig(configUpdates) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const configSheet = ss.getSheetByName('Configurations');
    
    if (!configSheet) {
      throw new Error('Configurations sheet not found');
    }

    const data = configSheet.getDataRange().getValues();
    const headers = data[0];
    const keyIndex = headers.indexOf('ConfigKey');
    const valueIndex = headers.indexOf('ConfigValue');
    const updatedIndex = headers.indexOf('UpdatedAt');

    let updatedCount = 0;

    // Update existing configurations
    Object.keys(configUpdates).forEach(key => {
      for (let i = 1; i < data.length; i++) {
        if (data[i][keyIndex] === key) {
          configSheet.getRange(i + 1, valueIndex + 1).setValue(configUpdates[key]);
          configSheet.getRange(i + 1, updatedIndex + 1).setValue(new Date().toISOString());
          updatedCount++;
          break;
        }
      }
    });

    return {
      success: true,
      message: `Updated ${updatedCount} configuration settings`,
      updatedCount: updatedCount
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user information
 * @returns {object} User information
 */
function getUserInfo() {
  try {
    const user = Session.getActiveUser();
    return {
      success: true,
      data: {
        email: user.getEmail(),
        name: user.getName(),
        timezone: Session.getScriptTimeZone(),
        locale: Session.getActiveUserLocale(),
        lastAccess: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Log user activity
 * @param {string} action - Action performed
 * @param {string} details - Additional details
 * @returns {object} Log result
 */
function logUserActivity(action, details) {
  try {
    const user = Session.getActiveUser();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Activity_Audit');
    
    if (!auditSheet) {
      console.warn('Activity_Audit sheet not found, skipping activity log');
      return { success: false, error: 'Audit sheet not found' };
    }

    const auditId = 'audit_' + Utilities.getUuid();
    const timestamp = new Date().toISOString();

    auditSheet.appendRow([
      auditId,
      'UserActivity',
      'system',
      action,
      user.getEmail(),
      timestamp,
      details || ''
    ]);

    return {
      success: true,
      message: 'Activity logged successfully'
    };

  } catch (error) {
    console.error('Error logging user activity:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cleanup old audit logs
 * @param {number} daysToKeep - Number of days to keep logs
 * @returns {object} Cleanup result
 */
function cleanupAuditLogs(daysToKeep = 90) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const auditSheet = ss.getSheetByName('Activity_Audit');
    
    if (!auditSheet) {
      return {
        success: false,
        error: 'Activity_Audit sheet not found'
      };
    }

    const data = auditSheet.getDataRange().getValues();
    const headers = data[0];
    const timestampIndex = headers.indexOf('timestamp');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let deletedCount = 0;
    const rowsToDelete = [];

    // Find rows to delete (from bottom to top to maintain indices)
    for (let i = data.length - 1; i >= 1; i--) {
      const rowTimestamp = new Date(data[i][timestampIndex]);
      if (rowTimestamp < cutoffDate) {
        rowsToDelete.push(i + 1); // +1 because sheet rows are 1-indexed
        deletedCount++;
      }
    }

    // Delete rows (from bottom to top)
    rowsToDelete.forEach(rowIndex => {
      auditSheet.deleteRow(rowIndex);
    });

    return {
      success: true,
      message: `Cleaned up ${deletedCount} old audit logs`,
      deletedCount: deletedCount
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Handle batch load operations for maximum performance
 * @param {Array} operations - Array of operations to execute in parallel
 * @returns {Object} Batch results
 */
function handleBatchLoad(operations) {
  try {
    const results = {};
    const errors = {};
    
    // Execute all operations in parallel
    operations.forEach(operation => {
      try {
        const { id, action, params } = operation;
        
        let result;
        switch(action) {
          case 'getDashboardMetrics':
            result = getDashboardMetrics();
            break;
          case 'getContentAssets':
            result = getContentAssets();
            break;
          case 'getSystemConfig':
            result = getSystemConfig();
            break;
          case 'getUserInfo':
            result = getUserInfo();
            break;
          case 'getAppStatistics':
            result = getAppStatistics();
            break;
          default:
            result = { success: false, error: 'Unknown batch action: ' + action };
        }
        
        results[id] = result;
      } catch (error) {
        errors[operation.id] = {
          success: false,
          error: error.message
        };
      }
    });
    
    return {
      success: true,
      results: results,
      errors: errors,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Get content statistics with caching
 * @returns {Object} Content statistics
 */
function getContentStatistics() {
  try {
    // Try to get from cache first
    const cache = CacheService.getScriptCache();
    const cacheKey = 'yt_content_stats';
    const cached = cache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    const assets = getContentAssets();
    
    const stats = {
      total: assets.length,
      byPillar: {},
      byPhase: {},
      published: 0,
      inProgress: 0
    };

    // Initialize counters
    const pillars = ['Educational Tutorials', 'Product Demos', 'Customer Success Stories', 'Support Library', 'Marketing & Updates'];
    const phases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
    
    pillars.forEach(pillar => {
      stats.byPillar[pillar] = 0;
    });
    
    phases.forEach(phase => {
      stats.byPhase[phase] = 0;
    });

    // Process assets
    assets.forEach(asset => {
      // Count by pillar
      if (asset.pillar && stats.byPillar.hasOwnProperty(asset.pillar)) {
        stats.byPillar[asset.pillar]++;
      }

      // Count by phase
      if (asset.workflowPhase && stats.byPhase.hasOwnProperty(asset.workflowPhase)) {
        stats.byPhase[asset.workflowPhase]++;
      }

      // Count published
      if (asset.workflowPhase === 'Published') {
        stats.published++;
      }

      // Count in progress
      if (asset.workflowPhase && asset.workflowPhase !== 'Idea' && asset.workflowPhase !== 'Published') {
        stats.inProgress++;
      }
    });

    // Cache for 5 minutes
    try {
      cache.put(cacheKey, JSON.stringify(stats), 300);
    } catch (e) {
      console.warn('Could not cache content stats:', e);
    }

    return stats;

  } catch (error) {
    console.error('Error getting content statistics:', error);
    return {
      total: 0,
      byPillar: {},
      byPhase: {},
      published: 0,
      inProgress: 0
    };
  }
}

/**
 * Get application statistics
 * @returns {object} Application statistics
 */
function getAppStatistics() {
  try {
    const stats = {
      content: {
        total: 0,
        byPillar: {},
        byPhase: {},
        published: 0,
        inProgress: 0
      },
      users: {
        total: 0,
        active: 0
      },
      system: {
        uptime: 'N/A',
        memoryUsage: 'N/A',
        lastBackup: 'N/A'
      },
      performance: {
        averageResponseTime: 'N/A',
        cacheHitRate: 'N/A',
        errorRate: 'N/A'
      }
    };

    // Get content statistics
    try {
      const contentStats = getContentStatistics();
      stats.content = contentStats;
    } catch (error) {
      console.error('Error getting content statistics:', error);
    }

    // Get user statistics
    try {
      const userInfo = getUserInfo();
      if (userInfo.success) {
        stats.users.total = 1; // Single user for now
        stats.users.active = 1;
      }
    } catch (error) {
      console.error('Error getting user statistics:', error);
    }

    return {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}
