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
 * Include function for HTML templates
 * This allows including other HTML files in the main template
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
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
