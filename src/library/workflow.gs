/**
 * YouTube Content Manager Library - Workflow Management
 * Handles content workflow phases and transitions
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Workflow phases in order
   */
  self.WORKFLOW_PHASES = [
    'Idea',
    'Script', 
    'Recording',
    'Editing',
    'Review',
    'Published'
  ];

  /**
   * Content pillars
   */
  self.CONTENT_PILLARS = [
    'Educational Tutorials',
    'Product Demos',
    'Customer Success Stories',
    'Support Library',
    'Marketing & Updates'
  ];

  /**
   * Move content to next phase
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @returns {object} Result object
   */
  self.moveToNextPhase = function(spreadsheetId, contentId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      if (!sheet) {
        throw new Error('ContentAssets sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const contentIdIndex = headers.indexOf('ID');
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const updatedAtIndex = headers.indexOf('UpdatedAt');

      if (contentIdIndex === -1 || phaseIndex === -1 || updatedAtIndex === -1) {
        throw new Error('Required columns not found in ContentAssets sheet');
      }

      // Find the row with the content ID
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][contentIdIndex] === contentId) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error('Content not found with ID: ' + contentId);
      }

      const currentPhase = data[rowIndex][phaseIndex];
      const currentPhaseIndex = self.WORKFLOW_PHASES.indexOf(currentPhase);
      
      if (currentPhaseIndex === -1) {
        throw new Error('Invalid current phase: ' + currentPhase);
      }

      if (currentPhaseIndex >= self.WORKFLOW_PHASES.length - 1) {
        throw new Error('Content is already in the final phase');
      }

      const nextPhase = self.WORKFLOW_PHASES[currentPhaseIndex + 1];
      
      // Update the phase and timestamp
      sheet.getRange(rowIndex + 1, phaseIndex + 1).setValue(nextPhase);
      sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

      return {
        success: true,
        message: 'Content moved to ' + nextPhase,
        data: {
          contentId: contentId,
          previousPhase: currentPhase,
          currentPhase: nextPhase,
          updatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'WORKFLOW_ERROR'
        }
      };
    }
  };

  /**
   * Move content to previous phase
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @returns {object} Result object
   */
  self.moveToPreviousPhase = function(spreadsheetId, contentId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      if (!sheet) {
        throw new Error('ContentAssets sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const contentIdIndex = headers.indexOf('ID');
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const updatedAtIndex = headers.indexOf('UpdatedAt');

      // Find the row with the content ID
      let rowIndex = -1;
      for (let i = 1; i < data.length; i++) {
        if (data[i][contentIdIndex] === contentId) {
          rowIndex = i;
          break;
        }
      }

      if (rowIndex === -1) {
        throw new Error('Content not found with ID: ' + contentId);
      }

      const currentPhase = data[rowIndex][phaseIndex];
      const currentPhaseIndex = self.WORKFLOW_PHASES.indexOf(currentPhase);
      
      if (currentPhaseIndex <= 0) {
        throw new Error('Content is already in the first phase');
      }

      const previousPhase = self.WORKFLOW_PHASES[currentPhaseIndex - 1];
      
      // Update the phase and timestamp
      sheet.getRange(rowIndex + 1, phaseIndex + 1).setValue(previousPhase);
      sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

      return {
        success: true,
        message: 'Content moved to ' + previousPhase,
        data: {
          contentId: contentId,
          previousPhase: currentPhase,
          currentPhase: previousPhase,
          updatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'WORKFLOW_ERROR'
        }
      };
    }
  };

  /**
   * Get workflow statistics
   * @param {string} spreadsheetId - Spreadsheet ID
   * @returns {object} Workflow statistics
   */
  self.getWorkflowStats = function(spreadsheetId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      if (!sheet) {
        throw new Error('ContentAssets sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return {
          success: true,
          data: {
            phases: {},
            pillars: {},
            total: 0
          }
        };
      }

      const headers = data[0];
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const pillarIndex = headers.indexOf('Pillar');

      const stats = {
        phases: {},
        pillars: {},
        total: data.length - 1
      };

      // Initialize counters
      self.WORKFLOW_PHASES.forEach(phase => {
        stats.phases[phase] = 0;
      });
      self.CONTENT_PILLARS.forEach(pillar => {
        stats.pillars[pillar] = 0;
      });

      // Count content by phase and pillar
      for (let i = 1; i < data.length; i++) {
        const phase = data[i][phaseIndex];
        const pillar = data[i][pillarIndex];
        
        if (phase && stats.phases.hasOwnProperty(phase)) {
          stats.phases[phase]++;
        }
        if (pillar && stats.pillars.hasOwnProperty(pillar)) {
          stats.pillars[pillar]++;
        }
      }

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'STATS_ERROR'
        }
      };
    }
  };

  /**
   * Validate workflow phase
   * @param {string} phase - Phase to validate
   * @returns {boolean} True if valid
   */
  self.isValidPhase = function(phase) {
    return self.WORKFLOW_PHASES.includes(phase);
  };

  /**
   * Validate content pillar
   * @param {string} pillar - Pillar to validate
   * @returns {boolean} True if valid
   */
  self.isValidPillar = function(pillar) {
    return self.CONTENT_PILLARS.includes(pillar);
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
