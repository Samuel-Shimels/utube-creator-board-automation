/**
 * YouTube Content Manager Library - Dashboard & Analytics
 * Provides dashboard metrics and analytics for content management
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Get comprehensive dashboard metrics
   * @param {string} spreadsheetId - Spreadsheet ID
   * @returns {object} Dashboard metrics
   */
  self.getDashboardMetrics = function(spreadsheetId) {
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
          data: self._getEmptyMetrics()
        };
      }

      const headers = data[0];
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const pillarIndex = headers.indexOf('Pillar');
      const dueDateIndex = headers.indexOf('DueDate');
      const publishedUrlIndex = headers.indexOf('PublishedURL');
      const createdAtIndex = headers.indexOf('CreatedAt');

      const metrics = {
        // Content counts by pillar
        pillars: {},
        
        // Content counts by workflow phase
        phases: {},
        
        // Total content count
        totalContent: data.length - 1,
        
        // Published content count
        publishedCount: 0,
        
        // Upcoming due content (next 7 days)
        upcomingDue: 0,
        
        // Overdue content
        overdue: 0,
        
        // Content created this week
        thisWeek: 0,
        
        // Content created this month
        thisMonth: 0,
        
        // Published URLs
        publishedUrls: []
      };

      // Initialize counters
      const workflowPhases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
      const contentPillars = ['Educational Tutorials', 'Product Demos', 'Customer Success Stories', 'Support Library', 'Marketing & Updates'];
      
      workflowPhases.forEach(phase => {
        metrics.phases[phase] = 0;
      });
      
      contentPillars.forEach(pillar => {
        metrics.pillars[pillar] = 0;
      });

      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Process each content item
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const phase = row[phaseIndex];
        const pillar = row[pillarIndex];
        const dueDate = row[dueDateIndex];
        const publishedUrl = row[publishedUrlIndex];
        const createdAt = row[createdAtIndex];

        // Count by phase
        if (phase && metrics.phases.hasOwnProperty(phase)) {
          metrics.phases[phase]++;
        }

        // Count by pillar
        if (pillar && metrics.pillars.hasOwnProperty(pillar)) {
          metrics.pillars[pillar]++;
        }

        // Count published content
        if (phase === 'Published') {
          metrics.publishedCount++;
          if (publishedUrl) {
            metrics.publishedUrls.push({
              title: row[headers.indexOf('Title')],
              url: publishedUrl,
              publishedAt: row[headers.indexOf('UpdatedAt')]
            });
          }
        }

        // Check due dates
        if (dueDate instanceof Date) {
          if (dueDate < now) {
            metrics.overdue++;
          } else if (dueDate <= oneWeekFromNow) {
            metrics.upcomingDue++;
          }
        }

        // Check creation dates
        if (createdAt instanceof Date) {
          if (createdAt >= oneWeekAgo) {
            metrics.thisWeek++;
          }
          if (createdAt >= oneMonthAgo) {
            metrics.thisMonth++;
          }
        }
      }

      // Calculate completion rate
      metrics.completionRate = metrics.totalContent > 0 ? 
        Math.round((metrics.publishedCount / metrics.totalContent) * 100) : 0;

      // Calculate average time to publish (simplified)
      metrics.avgTimeToPublish = self._calculateAverageTimeToPublish(data, headers);

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'DASHBOARD_ERROR'
        }
      };
    }
  };

  /**
   * Get content performance metrics
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} pillar - Optional pillar filter
   * @returns {object} Performance metrics
   */
  self.getPerformanceMetrics = function(spreadsheetId, pillar) {
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
            pillarBreakdown: {},
            phaseDistribution: {},
            monthlyTrend: {},
            productivity: {}
          }
        };
      }

      const headers = data[0];
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const pillarIndex = headers.indexOf('Pillar');
      const createdAtIndex = headers.indexOf('CreatedAt');
      const updatedAtIndex = headers.indexOf('UpdatedAt');

      const metrics = {
        pillarBreakdown: {},
        phaseDistribution: {},
        monthlyTrend: {},
        productivity: {
          contentPerWeek: 0,
          contentPerMonth: 0,
          averagePhaseTime: {}
        }
      };

      // Initialize pillar breakdown
      const contentPillars = ['Educational Tutorials', 'Product Demos', 'Customer Success Stories', 'Support Library', 'Marketing & Updates'];
      contentPillars.forEach(p => {
        metrics.pillarBreakdown[p] = {
          total: 0,
          published: 0,
          inProgress: 0,
          completionRate: 0
        };
      });

      // Process data
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const phase = row[phaseIndex];
        const contentPillar = row[pillarIndex];
        const createdAt = row[createdAtIndex];

        // Filter by pillar if specified
        if (pillar && contentPillar !== pillar) {
          continue;
        }

        // Update pillar breakdown
        if (contentPillar && metrics.pillarBreakdown[contentPillar]) {
          metrics.pillarBreakdown[contentPillar].total++;
          if (phase === 'Published') {
            metrics.pillarBreakdown[contentPillar].published++;
          } else if (phase !== 'Idea') {
            metrics.pillarBreakdown[contentPillar].inProgress++;
          }
        }

        // Count content by week/month
        if (createdAt instanceof Date) {
          if (createdAt >= oneWeekAgo) {
            metrics.productivity.contentPerWeek++;
          }
          if (createdAt >= oneMonthAgo) {
            metrics.productivity.contentPerMonth++;
          }
        }
      }

      // Calculate completion rates
      Object.keys(metrics.pillarBreakdown).forEach(p => {
        const pillarData = metrics.pillarBreakdown[p];
        if (pillarData.total > 0) {
          pillarData.completionRate = Math.round((pillarData.published / pillarData.total) * 100);
        }
      });

      return {
        success: true,
        data: metrics
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'PERFORMANCE_ERROR'
        }
      };
    }
  };

  /**
   * Get empty metrics structure
   * @private
   * @returns {object} Empty metrics
   */
  self._getEmptyMetrics = function() {
    return {
      pillars: {},
      phases: {},
      totalContent: 0,
      publishedCount: 0,
      upcomingDue: 0,
      overdue: 0,
      thisWeek: 0,
      thisMonth: 0,
      publishedUrls: [],
      completionRate: 0,
      avgTimeToPublish: 0
    };
  };

  /**
   * Calculate average time to publish
   * @private
   * @param {Array} data - Sheet data
   * @param {Array} headers - Column headers
   * @returns {number} Average days to publish
   */
  self._calculateAverageTimeToPublish = function(data, headers) {
    const createdAtIndex = headers.indexOf('CreatedAt');
    const updatedAtIndex = headers.indexOf('UpdatedAt');
    const phaseIndex = headers.indexOf('WorkflowPhase');
    
    let totalDays = 0;
    let publishedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const phase = row[phaseIndex];
      
      if (phase === 'Published') {
        const createdAt = row[createdAtIndex];
        const updatedAt = row[updatedAtIndex];
        
        if (createdAt instanceof Date && updatedAt instanceof Date) {
          const daysDiff = Math.ceil((updatedAt - createdAt) / (1000 * 60 * 60 * 24));
          totalDays += daysDiff;
          publishedCount++;
        }
      }
    }

    return publishedCount > 0 ? Math.round(totalDays / publishedCount) : 0;
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
