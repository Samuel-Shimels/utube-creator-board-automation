/**
 * YouTube Content Manager - Sheet Configuration
 * Handles Google Sheets structure and metadata configuration
 */

/**
 * Initialize YouTube Content Manager sheets
 * @param {string} spreadsheetId - Optional spreadsheet ID, uses active if not provided
 * @returns {object} Initialization result
 */
function initYtSheets(spreadsheetId) {
  try {
    const ss = spreadsheetId ? SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
    
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

    // Set up data validation for ContentAssets sheet
    setupDataValidation(ss);

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
 * Set up data validation for ContentAssets sheet
 * @private
 * @param {Spreadsheet} ss - Spreadsheet object
 */
function setupDataValidation(ss) {
  const contentSheet = ss.getSheetByName('ContentAssets');
  if (!contentSheet) return;

  // Workflow phases validation
  const phaseRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'])
    .setAllowInvalid(false)
    .setHelpText('Select a workflow phase')
    .build();

  // Content pillars validation
  const pillarRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      'Educational Tutorials',
      'Product Demos', 
      'Customer Success Stories',
      'Support Library',
      'Marketing & Updates'
    ])
    .setAllowInvalid(false)
    .setHelpText('Select a content pillar')
    .build();

  // Apply validation rules
  const phaseColumn = contentSheet.getRange('D:D'); // WorkflowPhase column
  const pillarColumn = contentSheet.getRange('C:C'); // Pillar column
  
  phaseColumn.setDataValidation(phaseRule);
  pillarColumn.setDataValidation(pillarRule);
}

/**
 * Get sheet configuration
 * @param {string} spreadsheetId - Spreadsheet ID
 * @returns {object} Sheet configuration
 */
function getSheetConfig(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    const config = {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheets: [],
      lastModified: ss.getLastModified()
    };

    // Get all sheets
    const sheets = ss.getSheets();
    sheets.forEach(sheet => {
      config.sheets.push({
        name: sheet.getName(),
        id: sheet.getSheetId(),
        lastRow: sheet.getLastRow(),
        lastColumn: sheet.getLastColumn(),
        isHidden: sheet.isSheetHidden()
      });
    });

    return {
      success: true,
      data: config
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'CONFIG_ERROR'
      }
    };
  }
}

/**
 * Get configuration value
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} configKey - Configuration key
 * @returns {string|null} Configuration value
 */
function getConfigValue(spreadsheetId, configKey) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const configSheet = ss.getSheetByName('Configurations');
    
    if (!configSheet) {
      throw new Error('Configurations sheet not found');
    }

    const data = configSheet.getDataRange().getValues();
    const keyIndex = data[0].indexOf('ConfigKey');
    const valueIndex = data[0].indexOf('ConfigValue');

    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] === configKey) {
        return data[i][valueIndex];
      }
    }

    return null;

  } catch (error) {
    console.error('Error getting config value:', error);
    return null;
  }
}

/**
 * Set configuration value
 * @param {string} spreadsheetId - Spreadsheet ID
 * @param {string} configKey - Configuration key
 * @param {string} configValue - Configuration value
 * @param {string} description - Optional description
 * @returns {object} Update result
 */
function setConfigValue(spreadsheetId, configKey, configValue, description) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const configSheet = ss.getSheetByName('Configurations');
    
    if (!configSheet) {
      throw new Error('Configurations sheet not found');
    }

    const data = configSheet.getDataRange().getValues();
    const keyIndex = data[0].indexOf('ConfigKey');
    const valueIndex = data[0].indexOf('ConfigValue');
    const descIndex = data[0].indexOf('Description');
    const updatedIndex = data[0].indexOf('UpdatedAt');

    // Find existing row or add new one
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][keyIndex] === configKey) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      // Add new row
      configSheet.appendRow([
        configKey,
        configValue,
        description || '',
        new Date().toISOString()
      ]);
    } else {
      // Update existing row
      configSheet.getRange(rowIndex + 1, valueIndex + 1).setValue(configValue);
      if (description) {
        configSheet.getRange(rowIndex + 1, descIndex + 1).setValue(description);
      }
      configSheet.getRange(rowIndex + 1, updatedIndex + 1).setValue(new Date().toISOString());
    }

    return {
      success: true,
      message: 'Configuration updated successfully'
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'CONFIG_UPDATE_ERROR'
      }
    };
  }
}

/**
 * Validate sheet structure
 * @param {string} spreadsheetId - Spreadsheet ID
 * @returns {object} Validation result
 */
function validateSheetStructure(spreadsheetId) {
  try {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const requiredSheets = ['ContentAssets', 'Configurations', 'Activity_Audit'];
    const validation = {
      isValid: true,
      missingSheets: [],
      invalidStructures: [],
      warnings: []
    };

    // Check for required sheets
    requiredSheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        validation.isValid = false;
        validation.missingSheets.push(sheetName);
      }
    });

    // Validate ContentAssets structure
    const contentSheet = ss.getSheetByName('ContentAssets');
    if (contentSheet) {
      const headers = contentSheet.getRange(1, 1, 1, contentSheet.getLastColumn()).getValues()[0];
      const requiredHeaders = [
        'ID', 'Title', 'Pillar', 'WorkflowPhase', 'AssignedTo', 'DueDate',
        'Assets', 'Notes', 'PublishedURL', 'CreatedAt', 'UpdatedAt'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
      if (missingHeaders.length > 0) {
        validation.isValid = false;
        validation.invalidStructures.push({
          sheet: 'ContentAssets',
          issue: 'Missing headers',
          details: missingHeaders
        });
      }
    }

    return {
      success: true,
      data: validation
    };

  } catch (error) {
    return {
      success: false,
      error: {
        message: error.message,
        type: 'VALIDATION_ERROR'
      }
    };
  }
}
