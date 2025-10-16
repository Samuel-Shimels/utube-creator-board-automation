/**
 * YouTube Content Manager Library - Advanced Features
 * Provides advanced functionality like bulk operations, templates, and automation
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Content templates for quick creation
   */
  self.CONTENT_TEMPLATES = {
    'Educational Tutorial': {
      title: 'How to [TOPIC] - Step by Step Guide',
      pillar: 'Educational Tutorials',
      workflowPhase: 'Idea',
      notes: 'Create a comprehensive tutorial covering:\n1. Introduction to the topic\n2. Prerequisites and setup\n3. Step-by-step instructions\n4. Common pitfalls and solutions\n5. Best practices and tips',
      estimatedDuration: '10-15 minutes',
      targetAudience: 'Beginners to intermediate users',
      keyPoints: [
        'Clear introduction and context',
        'Prerequisites clearly stated',
        'Step-by-step walkthrough',
        'Visual aids and screenshots',
        'Troubleshooting section'
      ]
    },
    'Product Demo': {
      title: '[PRODUCT] Demo - [USE CASE]',
      pillar: 'Product Demos',
      workflowPhase: 'Idea',
      notes: 'Demonstrate product capabilities:\n1. Problem statement\n2. Product overview\n3. Live demonstration\n4. Key features highlighted\n5. Call to action',
      estimatedDuration: '5-8 minutes',
      targetAudience: 'Potential customers and decision makers',
      keyPoints: [
        'Clear problem identification',
        'Product value proposition',
        'Live demonstration',
        'Feature highlights',
        'Strong call to action'
      ]
    },
    'Success Story': {
      title: 'How [COMPANY] Achieved [RESULT] with [SOLUTION]',
      pillar: 'Customer Success Stories',
      workflowPhase: 'Idea',
      notes: 'Customer success case study:\n1. Company background\n2. Challenge faced\n3. Solution implemented\n4. Results achieved\n5. Lessons learned',
      estimatedDuration: '6-10 minutes',
      targetAudience: 'Prospects and existing customers',
      keyPoints: [
        'Compelling story narrative',
        'Quantifiable results',
        'Customer testimonials',
        'Before/after comparison',
        'ROI demonstration'
      ]
    },
    'Support Guide': {
      title: 'Troubleshooting: [COMMON ISSUE]',
      pillar: 'Support Library',
      workflowPhase: 'Idea',
      notes: 'Support and troubleshooting guide:\n1. Issue description\n2. Root cause analysis\n3. Step-by-step solution\n4. Prevention tips\n5. Additional resources',
      estimatedDuration: '3-6 minutes',
      targetAudience: 'End users and support team',
      keyPoints: [
        'Clear issue identification',
        'Systematic troubleshooting',
        'Visual step-by-step guide',
        'Prevention strategies',
        'Additional resources'
      ]
    },
    'Marketing Update': {
      title: 'Announcement: [NEW FEATURE/UPDATE]',
      pillar: 'Marketing & Updates',
      workflowPhase: 'Idea',
      notes: 'Marketing announcement:\n1. Exciting news introduction\n2. Feature/update details\n3. Benefits and value\n4. How to access/use\n5. Next steps',
      estimatedDuration: '2-4 minutes',
      targetAudience: 'All users and subscribers',
      keyPoints: [
        'Engaging introduction',
        'Clear value proposition',
        'Easy access instructions',
        'Encouraging next steps',
        'Community engagement'
      ]
    }
  };

  /**
   * Get content template by name
   * @param {string} templateName - Name of the template
   * @returns {object} Template object
   */
  self.getContentTemplate = function(templateName) {
    return self.CONTENT_TEMPLATES[templateName] || null;
  };

  /**
   * Get all available templates
   * @returns {Array} Array of template objects
   */
  self.getAllTemplates = function() {
    return Object.keys(self.CONTENT_TEMPLATES).map(name => ({
      name: name,
      ...self.CONTENT_TEMPLATES[name]
    }));
  };

  /**
   * Create content from template
   * @param {string} templateName - Template name
   * @param {object} customizations - Custom values to replace placeholders
   * @returns {object} Content object ready for creation
   */
  self.createFromTemplate = function(templateName, customizations = {}) {
    const template = self.getContentTemplate(templateName);
    if (!template) {
      throw new Error('Template not found: ' + templateName);
    }

    const content = Utils.deepClone(template);
    
    // Replace placeholders with customizations
    Object.keys(customizations).forEach(key => {
      if (content[key]) {
        content[key] = content[key].replace(/\[([^\]]+)\]/g, (match, placeholder) => {
          return customizations[placeholder] || match;
        });
      }
    });

    return content;
  };

  /**
   * Bulk operations for content management
   */
  self.BulkOperations = {
    /**
     * Bulk update content phase
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Array} contentIds - Array of content IDs
     * @param {string} newPhase - New workflow phase
     * @returns {object} Bulk update result
     */
    bulkUpdatePhase: function(spreadsheetId, contentIds, newPhase) {
      try {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        const sheet = ss.getSheetByName('ContentAssets');
        
        if (!sheet) {
          throw new Error('ContentAssets sheet not found');
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idIndex = headers.indexOf('ID');
        const phaseIndex = headers.indexOf('WorkflowPhase');
        const updatedAtIndex = headers.indexOf('UpdatedAt');

        const results = {
          successful: 0,
          failed: 0,
          errors: []
        };

        contentIds.forEach(contentId => {
          try {
            // Find the row
            let rowIndex = -1;
            for (let i = 1; i < data.length; i++) {
              if (data[i][idIndex] === contentId) {
                rowIndex = i;
                break;
              }
            }

            if (rowIndex === -1) {
              throw new Error('Content not found with ID: ' + contentId);
            }

            // Update phase and timestamp
            sheet.getRange(rowIndex + 1, phaseIndex + 1).setValue(newPhase);
            sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

            results.successful++;

          } catch (error) {
            results.failed++;
            results.errors.push({
              contentId: contentId,
              error: error.message
            });
          }
        });

        return {
          success: true,
          message: `Bulk update completed: ${results.successful} successful, ${results.failed} failed`,
          data: results
        };

      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'BULK_UPDATE_ERROR'
          }
        };
      }
    },

    /**
     * Bulk assign content
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Array} contentIds - Array of content IDs
     * @param {string} assignee - Assignee email
     * @returns {object} Bulk assign result
     */
    bulkAssign: function(spreadsheetId, contentIds, assignee) {
      try {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        const sheet = ss.getSheetByName('ContentAssets');
        
        if (!sheet) {
          throw new Error('ContentAssets sheet not found');
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idIndex = headers.indexOf('ID');
        const assigneeIndex = headers.indexOf('AssignedTo');
        const updatedAtIndex = headers.indexOf('UpdatedAt');

        const results = {
          successful: 0,
          failed: 0,
          errors: []
        };

        contentIds.forEach(contentId => {
          try {
            // Find the row
            let rowIndex = -1;
            for (let i = 1; i < data.length; i++) {
              if (data[i][idIndex] === contentId) {
                rowIndex = i;
                break;
              }
            }

            if (rowIndex === -1) {
              throw new Error('Content not found with ID: ' + contentId);
            }

            // Update assignee and timestamp
            sheet.getRange(rowIndex + 1, assigneeIndex + 1).setValue(assignee);
            sheet.getRange(rowIndex + 1, updatedAtIndex + 1).setValue(new Date());

            results.successful++;

          } catch (error) {
            results.failed++;
            results.errors.push({
              contentId: contentId,
              error: error.message
            });
          }
        });

        return {
          success: true,
          message: `Bulk assignment completed: ${results.successful} successful, ${results.failed} failed`,
          data: results
        };

      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'BULK_ASSIGN_ERROR'
          }
        };
      }
    },

    /**
     * Bulk delete content
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {Array} contentIds - Array of content IDs
     * @returns {object} Bulk delete result
     */
    bulkDelete: function(spreadsheetId, contentIds) {
      try {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        const sheet = ss.getSheetByName('ContentAssets');
        
        if (!sheet) {
          throw new Error('ContentAssets sheet not found');
        }

        const data = sheet.getDataRange().getValues();
        const headers = data[0];
        const idIndex = headers.indexOf('ID');

        const results = {
          successful: 0,
          failed: 0,
          errors: []
        };

        // Sort row indices in descending order to avoid index shifting
        const rowsToDelete = [];
        contentIds.forEach(contentId => {
          try {
            // Find the row
            for (let i = 1; i < data.length; i++) {
              if (data[i][idIndex] === contentId) {
                rowsToDelete.push(i + 1); // +1 for 1-based indexing
                break;
              }
            }
          } catch (error) {
            results.failed++;
            results.errors.push({
              contentId: contentId,
              error: error.message
            });
          }
        });

        // Delete rows (from bottom to top)
        rowsToDelete.sort((a, b) => b - a).forEach(rowIndex => {
          try {
            sheet.deleteRow(rowIndex);
            results.successful++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              contentId: 'Unknown',
              error: error.message
            });
          }
        });

        return {
          success: true,
          message: `Bulk delete completed: ${results.successful} successful, ${results.failed} failed`,
          data: results
        };

      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'BULK_DELETE_ERROR'
          }
        };
      }
    }
  };

  /**
   * Advanced filtering and search
   */
  self.AdvancedFilters = {
    /**
     * Search content with advanced criteria
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {object} criteria - Search criteria
     * @returns {Array} Filtered content
     */
    searchContent: function(spreadsheetId, criteria) {
      try {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        const sheet = ss.getSheetByName('ContentAssets');
        
        if (!sheet) {
          throw new Error('ContentAssets sheet not found');
        }

        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          return [];
        }

        const headers = data[0];
        let filteredData = data.slice(1);

        // Apply filters
        if (criteria.pillar) {
          const pillarIndex = headers.indexOf('Pillar');
          filteredData = filteredData.filter(row => row[pillarIndex] === criteria.pillar);
        }

        if (criteria.workflowPhase) {
          const phaseIndex = headers.indexOf('WorkflowPhase');
          filteredData = filteredData.filter(row => row[phaseIndex] === criteria.workflowPhase);
        }

        if (criteria.assignedTo) {
          const assigneeIndex = headers.indexOf('AssignedTo');
          filteredData = filteredData.filter(row => 
            row[assigneeIndex] && row[assigneeIndex].toLowerCase().includes(criteria.assignedTo.toLowerCase())
          );
        }

        if (criteria.title) {
          const titleIndex = headers.indexOf('Title');
          filteredData = filteredData.filter(row => 
            row[titleIndex] && row[titleIndex].toLowerCase().includes(criteria.title.toLowerCase())
          );
        }

        if (criteria.dateFrom) {
          const createdIndex = headers.indexOf('CreatedAt');
          const fromDate = new Date(criteria.dateFrom);
          filteredData = filteredData.filter(row => 
            row[createdIndex] && new Date(row[createdIndex]) >= fromDate
          );
        }

        if (criteria.dateTo) {
          const createdIndex = headers.indexOf('CreatedAt');
          const toDate = new Date(criteria.dateTo);
          filteredData = filteredData.filter(row => 
            row[createdIndex] && new Date(row[createdIndex]) <= toDate
          );
        }

        if (criteria.status) {
          const dueIndex = headers.indexOf('DueDate');
          const phaseIndex = headers.indexOf('WorkflowPhase');
          const now = new Date();
          
          filteredData = filteredData.filter(row => {
            const phase = row[phaseIndex];
            const dueDate = row[dueIndex];
            
            switch (criteria.status) {
              case 'overdue':
                return dueDate && new Date(dueDate) < now && phase !== 'Published';
              case 'due-soon':
                const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
                return dueDate && new Date(dueDate) <= threeDaysFromNow && phase !== 'Published';
              case 'on-track':
                return phase !== 'Published' && (!dueDate || new Date(dueDate) >= now);
              case 'completed':
                return phase === 'Published';
              default:
                return true;
            }
          });
        }

        // Convert to objects
        const result = filteredData.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = row[index];
          });
          return obj;
        });

        // Sort results
        if (criteria.sortBy) {
          const sortIndex = headers.indexOf(criteria.sortBy);
          if (sortIndex !== -1) {
            result.sort((a, b) => {
              let aVal = a[criteria.sortBy];
              let bVal = b[criteria.sortBy];
              
              if (aVal instanceof Date) aVal = aVal.getTime();
              if (bVal instanceof Date) bVal = bVal.getTime();
              
              if (criteria.sortOrder === 'asc') {
                return aVal > bVal ? 1 : -1;
              } else {
                return aVal < bVal ? 1 : -1;
              }
            });
          }
        }

        return result;

      } catch (error) {
        console.error('Error in advanced search:', error);
        return [];
      }
    }
  };

  /**
   * Automation features
   */
  self.Automation = {
    /**
     * Auto-assign content based on pillar
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {object} assignmentRules - Rules for auto-assignment
     * @returns {object} Auto-assignment result
     */
    autoAssignContent: function(spreadsheetId, assignmentRules) {
      try {
        const ss = SpreadsheetApp.openById(spreadsheetId);
        const sheet = ss.getSheetByName('ContentAssets');
        
        if (!sheet) {
          throw new Error('ContentAssets sheet not found');
        }

        const data = sheet.getDataRange().getValues();
        if (data.length <= 1) {
          return { success: true, message: 'No content to process', data: { assigned: 0 } };
        }

        const headers = data[0];
        const pillarIndex = headers.indexOf('Pillar');
        const assigneeIndex = headers.indexOf('AssignedTo');
        const updatedAtIndex = headers.indexOf('UpdatedAt');

        let assignedCount = 0;

        for (let i = 1; i < data.length; i++) {
          const row = data[i];
          const pillar = row[pillarIndex];
          const currentAssignee = row[assigneeIndex];

          // Skip if already assigned
          if (currentAssignee) continue;

          // Find assignment rule for this pillar
          const rule = assignmentRules[pillar];
          if (rule && rule.assignee) {
            // Update assignee
            sheet.getRange(i + 1, assigneeIndex + 1).setValue(rule.assignee);
            sheet.getRange(i + 1, updatedAtIndex + 1).setValue(new Date());
            assignedCount++;
          }
        }

        return {
          success: true,
          message: `Auto-assigned ${assignedCount} content items`,
          data: { assigned: assignedCount }
        };

      } catch (error) {
        return {
          success: false,
          error: {
            message: error.message,
            type: 'AUTO_ASSIGN_ERROR'
          }
        };
      }
    },

    /**
     * Generate content suggestions based on existing content
     * @param {string} spreadsheetId - Spreadsheet ID
     * @param {string} pillar - Content pillar
     * @returns {Array} Content suggestions
     */
    generateContentSuggestions: function(spreadsheetId, pillar) {
      try {
        const existingContent = self.AdvancedFilters.searchContent(spreadsheetId, { pillar: pillar });
        
        const suggestions = [];
        const titles = existingContent.map(item => item.Title).filter(title => title);

        // Generate variations based on existing titles
        const commonWords = self._extractCommonWords(titles);
        const templates = self.CONTENT_TEMPLATES;

        Object.keys(templates).forEach(templateName => {
          const template = templates[templateName];
          if (template.pillar === pillar) {
            suggestions.push({
              title: template.title,
              pillar: template.pillar,
              description: template.notes,
              estimatedDuration: template.estimatedDuration,
              targetAudience: template.targetAudience,
              keyPoints: template.keyPoints,
              confidence: 0.8
            });
          }
        });

        // Add AI-generated suggestions based on common words
        if (commonWords.length > 0) {
          suggestions.push({
            title: `Advanced Guide: ${commonWords.slice(0, 3).join(' ')}`,
            pillar: pillar,
            description: 'Advanced content based on popular topics',
            estimatedDuration: '12-18 minutes',
            targetAudience: 'Advanced users',
            keyPoints: ['In-depth analysis', 'Advanced techniques', 'Expert tips'],
            confidence: 0.6
          });
        }

        return suggestions.sort((a, b) => b.confidence - a.confidence);

      } catch (error) {
        console.error('Error generating content suggestions:', error);
        return [];
      }
    }
  };

  /**
   * Helper function to extract common words from titles
   * @private
   * @param {Array} titles - Array of titles
   * @returns {Array} Common words
   */
  self._extractCommonWords = function(titles) {
    const wordCount = {};
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'how', 'to', 'step', 'guide', 'tutorial'];

    titles.forEach(title => {
      const words = title.toLowerCase().split(/\W+/).filter(word => 
        word.length > 3 && !stopWords.includes(word)
      );
      
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
    });

    return Object.keys(wordCount)
      .sort((a, b) => wordCount[b] - wordCount[a])
      .slice(0, 10);
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
