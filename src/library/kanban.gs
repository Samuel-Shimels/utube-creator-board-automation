/**
 * YouTube Content Manager Library - Kanban Board Management
 * Handles Kanban board rendering and drag-and-drop functionality
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Get content organized by workflow phases for Kanban display
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} pillar - Optional pillar filter
   * @returns {object} Kanban data organized by phases
   */
  self.getKanbanData = function(spreadsheetId, pillar) {
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
          data: self._getEmptyKanbanData()
        };
      }

      const headers = data[0];
      const kanbanData = {
        phases: {},
        totalItems: 0,
        filteredBy: pillar || 'all'
      };

      // Initialize phases
      const workflowPhases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
      workflowPhases.forEach(phase => {
        kanbanData.phases[phase] = {
          name: phase,
          items: [],
          count: 0,
          color: self._getPhaseColor(phase)
        };
      });

      // Process content items
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const contentItem = self._mapRowToContentItem(row, headers);
        
        // Filter by pillar if specified
        if (pillar && contentItem.pillar !== pillar) {
          continue;
        }

        const phase = contentItem.workflowPhase;
        if (kanbanData.phases[phase]) {
          kanbanData.phases[phase].items.push(contentItem);
          kanbanData.phases[phase].count++;
          kanbanData.totalItems++;
        }
      }

      // Sort items within each phase by due date
      Object.keys(kanbanData.phases).forEach(phase => {
        kanbanData.phases[phase].items.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
      });

      return {
        success: true,
        data: kanbanData
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'KANBAN_ERROR'
        }
      };
    }
  };

  /**
   * Update content phase (for drag-and-drop)
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @param {string} newPhase - New workflow phase
   * @returns {object} Update result
   */
  self.updateContentPhase = function(spreadsheetId, contentId, newPhase) {
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

      // Find the content item
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

      // Validate new phase
      const workflowPhases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
      if (!workflowPhases.includes(newPhase)) {
        throw new Error('Invalid workflow phase: ' + newPhase);
      }

      // Update the phase and timestamp
      sheet.getRange(rowIndex + 1, phaseIndex + 1).setValue(newPhase);
      sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

      return {
        success: true,
        message: 'Content phase updated successfully',
        data: {
          contentId: contentId,
          newPhase: newPhase,
          updatedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'UPDATE_ERROR'
        }
      };
    }
  };

  /**
   * Get content item details for modal display
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @returns {object} Content item details
   */
  self.getContentDetails = function(spreadsheetId, contentId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      if (!sheet) {
        throw new Error('ContentAssets sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const contentIdIndex = headers.indexOf('ID');

      // Find the content item
      for (let i = 1; i < data.length; i++) {
        if (data[i][contentIdIndex] === contentId) {
          const contentItem = self._mapRowToContentItem(data[i], headers);
          return {
            success: true,
            data: contentItem
          };
        }
      }

      throw new Error('Content not found with ID: ' + contentId);

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'DETAILS_ERROR'
        }
      };
    }
  };

  /**
   * Map sheet row to content item object
   * @private
   * @param {Array} row - Sheet row data
   * @param {Array} headers - Column headers
   * @returns {object} Content item object
   */
  self._mapRowToContentItem = function(row, headers) {
    const getValue = (columnName) => {
      const index = headers.indexOf(columnName);
      return index !== -1 ? row[index] : null;
    };

    return {
      id: getValue('ID'),
      title: getValue('Title'),
      pillar: getValue('Pillar'),
      workflowPhase: getValue('WorkflowPhase'),
      assignedTo: getValue('AssignedTo'),
      dueDate: getValue('DueDate'),
      assets: getValue('Assets'),
      notes: getValue('Notes'),
      publishedUrl: getValue('PublishedURL'),
      createdAt: getValue('CreatedAt'),
      updatedAt: getValue('UpdatedAt'),
      isOverdue: self._isOverdue(getValue('DueDate')),
      daysUntilDue: self._getDaysUntilDue(getValue('DueDate'))
    };
  };

  /**
   * Get phase color for UI display
   * @private
   * @param {string} phase - Workflow phase
   * @returns {string} Color code
   */
  self._getPhaseColor = function(phase) {
    const colors = {
      'Idea': '#6b7280',
      'Script': '#3b82f6',
      'Recording': '#8b5cf6',
      'Editing': '#f59e0b',
      'Review': '#ef4444',
      'Published': '#10b981'
    };
    return colors[phase] || '#6b7280';
  };

  /**
   * Check if content is overdue
   * @private
   * @param {Date} dueDate - Due date
   * @returns {boolean} True if overdue
   */
  self._isOverdue = function(dueDate) {
    if (!dueDate || !(dueDate instanceof Date)) return false;
    return dueDate < new Date();
  };

  /**
   * Get days until due
   * @private
   * @param {Date} dueDate - Due date
   * @returns {number} Days until due
   */
  self._getDaysUntilDue = function(dueDate) {
    if (!dueDate || !(dueDate instanceof Date)) return null;
    const now = new Date();
    const diffTime = dueDate - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  /**
   * Get empty Kanban data structure
   * @private
   * @returns {object} Empty Kanban data
   */
  self._getEmptyKanbanData = function() {
    const workflowPhases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
    const phases = {};
    
    workflowPhases.forEach(phase => {
      phases[phase] = {
        name: phase,
        items: [],
        count: 0,
        color: self._getPhaseColor(phase)
      };
    });

    return {
      phases: phases,
      totalItems: 0,
      filteredBy: 'all'
    };
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
