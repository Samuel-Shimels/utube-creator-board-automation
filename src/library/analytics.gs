/**
 * YouTube Content Manager Library - Advanced Analytics
 * Provides comprehensive analytics, reporting, and insights
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Get comprehensive analytics dashboard data
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {object} options - Analytics options
   * @returns {object} Analytics data
   */
  self.getAnalyticsDashboard = function(spreadsheetId, options = {}) {
    try {
      const {
        dateRange = '30d',
        groupBy = 'day',
        includeProjections = true
      } = options;

      const analytics = {
        overview: self._getOverviewMetrics(spreadsheetId, dateRange),
        trends: self._getTrendData(spreadsheetId, dateRange, groupBy),
        performance: self._getPerformanceMetrics(spreadsheetId, dateRange),
        insights: self._getInsights(spreadsheetId, dateRange),
        projections: includeProjections ? self._getProjections(spreadsheetId, dateRange) : null,
        charts: self._getChartData(spreadsheetId, dateRange)
      };

      return {
        success: true,
        data: analytics,
        generatedAt: new Date().toISOString(),
        dateRange: dateRange
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'ANALYTICS_ERROR'
        }
      };
    }
  };

  /**
   * Get overview metrics
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @returns {object} Overview metrics
   */
  self._getOverviewMetrics = function(spreadsheetId, dateRange) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('ContentAssets');
    
    if (!sheet) {
      throw new Error('ContentAssets sheet not found');
    }

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return self._getEmptyOverviewMetrics();
    }

    const headers = data[0];
    const dateRangeDays = self._getDateRangeDays(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);

    const metrics = {
      totalContent: 0,
      publishedContent: 0,
      inProgressContent: 0,
      overdueContent: 0,
      completionRate: 0,
      averageTimeToPublish: 0,
      productivityScore: 0,
      qualityScore: 0,
      teamEfficiency: 0,
      contentVelocity: 0
    };

    let totalPublishTime = 0;
    let publishedCount = 0;
    let recentContent = 0;
    const now = new Date();

    // Process each content item
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const createdAt = new Date(row[headers.indexOf('CreatedAt')]);
      const phase = row[headers.indexOf('WorkflowPhase')];
      const dueDate = row[headers.indexOf('DueDate')];
      const updatedAt = new Date(row[headers.indexOf('UpdatedAt')]);

      // Filter by date range
      if (createdAt < cutoffDate) continue;

      metrics.totalContent++;

      if (phase === 'Published') {
        metrics.publishedContent++;
        
        // Calculate time to publish
        const timeToPublish = updatedAt - createdAt;
        totalPublishTime += timeToPublish;
        publishedCount++;
      } else if (phase !== 'Idea') {
        metrics.inProgressContent++;
      }

      // Check overdue
      if (dueDate && new Date(dueDate) < now && phase !== 'Published') {
        metrics.overdueContent++;
      }

      // Count recent content
      if (createdAt >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        recentContent++;
      }
    }

    // Calculate derived metrics
    metrics.completionRate = metrics.totalContent > 0 ? 
      Math.round((metrics.publishedContent / metrics.totalContent) * 100) : 0;

    metrics.averageTimeToPublish = publishedCount > 0 ? 
      Math.round(totalPublishTime / publishedCount / (1000 * 60 * 60 * 24)) : 0;

    metrics.productivityScore = self._calculateProductivityScore(metrics, recentContent);
    metrics.qualityScore = self._calculateQualityScore(metrics);
    metrics.teamEfficiency = self._calculateTeamEfficiency(metrics);
    metrics.contentVelocity = recentContent;

    return metrics;
  };

  /**
   * Get trend data
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @param {string} groupBy - Group by period
   * @returns {object} Trend data
   */
  self._getTrendData = function(spreadsheetId, dateRange, groupBy) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('ContentAssets');
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { contentCreated: [], contentPublished: [], completionRates: [] };
    }

    const headers = data[0];
    const dateRangeDays = self._getDateRangeDays(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);

    const trends = {
      contentCreated: [],
      contentPublished: [],
      completionRates: [],
      productivityTrend: [],
      qualityTrend: []
    };

    // Group data by time period
    const groupedData = {};
    const periodFormat = groupBy === 'day' ? 'YYYY-MM-DD' : 
                        groupBy === 'week' ? 'YYYY-[W]WW' : 'YYYY-MM';

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const createdAt = new Date(row[headers.indexOf('CreatedAt')]);
      const updatedAt = new Date(row[headers.indexOf('UpdatedAt')]);
      const phase = row[headers.indexOf('WorkflowPhase')];

      if (createdAt < cutoffDate) continue;

      const period = self._formatDate(createdAt, periodFormat);
      if (!groupedData[period]) {
        groupedData[period] = {
          created: 0,
          published: 0,
          inProgress: 0,
          overdue: 0
        };
      }

      groupedData[period].created++;
      if (phase === 'Published') {
        groupedData[period].published++;
      } else if (phase !== 'Idea') {
        groupedData[period].inProgress++;
      }
    }

    // Convert to arrays for charts
    Object.keys(groupedData).sort().forEach(period => {
      const data = groupedData[period];
      trends.contentCreated.push({ period, value: data.created });
      trends.contentPublished.push({ period, value: data.published });
      trends.completionRates.push({ 
        period, 
        value: data.created > 0 ? Math.round((data.published / data.created) * 100) : 0 
      });
    });

    return trends;
  };

  /**
   * Get performance metrics
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @returns {object} Performance metrics
   */
  self._getPerformanceMetrics = function(spreadsheetId, dateRange) {
    const ss = SpreadsheetApp.openById(spreadsheetId);
    const sheet = ss.getSheetByName('ContentAssets');
    
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { byPillar: {}, byPhase: {}, byAssignee: {} };
    }

    const headers = data[0];
    const dateRangeDays = self._getDateRangeDays(dateRange);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - dateRangeDays);

    const performance = {
      byPillar: {},
      byPhase: {},
      byAssignee: {},
      topPerformers: [],
      bottlenecks: []
    };

    // Initialize counters
    const pillars = ['Educational Tutorials', 'Product Demos', 'Customer Success Stories', 'Support Library', 'Marketing & Updates'];
    const phases = ['Idea', 'Script', 'Recording', 'Editing', 'Review', 'Published'];
    
    pillars.forEach(pillar => {
      performance.byPillar[pillar] = {
        total: 0,
        published: 0,
        inProgress: 0,
        averageTime: 0,
        completionRate: 0
      };
    });

    phases.forEach(phase => {
      performance.byPhase[phase] = {
        count: 0,
        averageTime: 0,
        efficiency: 0
      };
    });

    // Process data
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const createdAt = new Date(row[headers.indexOf('CreatedAt')]);
      const updatedAt = new Date(row[headers.indexOf('UpdatedAt')]);
      const pillar = row[headers.indexOf('Pillar')];
      const phase = row[headers.indexOf('WorkflowPhase')];
      const assignee = row[headers.indexOf('AssignedTo')];

      if (createdAt < cutoffDate) continue;

      // Count by pillar
      if (pillar && performance.byPillar[pillar]) {
        performance.byPillar[pillar].total++;
        if (phase === 'Published') {
          performance.byPillar[pillar].published++;
        } else if (phase !== 'Idea') {
          performance.byPillar[pillar].inProgress++;
        }
      }

      // Count by phase
      if (phase && performance.byPhase[phase]) {
        performance.byPhase[phase].count++;
      }

      // Count by assignee
      if (assignee) {
        if (!performance.byAssignee[assignee]) {
          performance.byAssignee[assignee] = {
            total: 0,
            published: 0,
            inProgress: 0,
            efficiency: 0
          };
        }
        performance.byAssignee[assignee].total++;
        if (phase === 'Published') {
          performance.byAssignee[assignee].published++;
        } else if (phase !== 'Idea') {
          performance.byAssignee[assignee].inProgress++;
        }
      }
    }

    // Calculate derived metrics
    Object.keys(performance.byPillar).forEach(pillar => {
      const data = performance.byPillar[pillar];
      data.completionRate = data.total > 0 ? Math.round((data.published / data.total) * 100) : 0;
    });

    Object.keys(performance.byAssignee).forEach(assignee => {
      const data = performance.byAssignee[assignee];
      data.efficiency = data.total > 0 ? Math.round((data.published / data.total) * 100) : 0;
    });

    return performance;
  };

  /**
   * Get insights and recommendations
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @returns {Array} Insights
   */
  self._getInsights = function(spreadsheetId, dateRange) {
    const insights = [];
    const overview = self._getOverviewMetrics(spreadsheetId, dateRange);
    const performance = self._getPerformanceMetrics(spreadsheetId, dateRange);

    // Completion rate insights
    if (overview.completionRate < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Completion Rate',
        message: `Your completion rate is ${overview.completionRate}%. Consider reviewing bottlenecks in your workflow.`,
        action: 'Review workflow phases and identify bottlenecks',
        priority: 'high'
      });
    } else if (overview.completionRate > 80) {
      insights.push({
        type: 'success',
        title: 'Excellent Completion Rate',
        message: `Great job! Your completion rate is ${overview.completionRate}%.`,
        action: 'Maintain current workflow efficiency',
        priority: 'low'
      });
    }

    // Overdue content insights
    if (overview.overdueContent > 0) {
      insights.push({
        type: 'error',
        title: 'Overdue Content Alert',
        message: `You have ${overview.overdueContent} overdue content items.`,
        action: 'Review and prioritize overdue content',
        priority: 'high'
      });
    }

    // Productivity insights
    if (overview.contentVelocity < 2) {
      insights.push({
        type: 'info',
        title: 'Low Content Velocity',
        message: 'Consider increasing your content creation pace.',
        action: 'Set up content templates and automation',
        priority: 'medium'
      });
    }

    // Pillar performance insights
    Object.keys(performance.byPillar).forEach(pillar => {
      const data = performance.byPillar[pillar];
      if (data.completionRate < 30 && data.total > 2) {
        insights.push({
          type: 'warning',
          title: `Low Performance: ${pillar}`,
          message: `${pillar} has a completion rate of ${data.completionRate}%.`,
          action: `Review ${pillar} workflow and resources`,
          priority: 'medium'
        });
      }
    });

    return insights;
  };

  /**
   * Get projections
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @returns {object} Projections
   */
  self._getProjections = function(spreadsheetId, dateRange) {
    const trends = self._getTrendData(spreadsheetId, dateRange, 'week');
    const overview = self._getOverviewMetrics(spreadsheetId, dateRange);

    const projections = {
      nextWeek: {
        contentCreated: Math.round(overview.contentVelocity * 1.1),
        contentPublished: Math.round(overview.contentVelocity * overview.completionRate / 100 * 1.1),
        completionRate: overview.completionRate
      },
      nextMonth: {
        contentCreated: Math.round(overview.contentVelocity * 4.3),
        contentPublished: Math.round(overview.contentVelocity * overview.completionRate / 100 * 4.3),
        completionRate: overview.completionRate
      },
      recommendations: []
    };

    // Add recommendations based on projections
    if (projections.nextWeek.contentCreated < 5) {
      projections.recommendations.push({
        type: 'productivity',
        message: 'Consider increasing content creation pace to meet weekly goals',
        action: 'Set up content templates and batch creation'
      });
    }

    if (projections.nextWeek.completionRate < 60) {
      projections.recommendations.push({
        type: 'efficiency',
        message: 'Focus on improving workflow efficiency to increase completion rate',
        action: 'Review and optimize workflow phases'
      });
    }

    return projections;
  };

  /**
   * Get chart data
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} dateRange - Date range
   * @returns {object} Chart data
   */
  self._getChartData = function(spreadsheetId, dateRange) {
    const performance = self._getPerformanceMetrics(spreadsheetId, dateRange);
    
    return {
      pillarDistribution: {
        labels: Object.keys(performance.byPillar),
        datasets: [{
          label: 'Content by Pillar',
          data: Object.values(performance.byPillar).map(p => p.total),
          backgroundColor: [
            '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'
          ]
        }]
      },
      phaseDistribution: {
        labels: Object.keys(performance.byPhase),
        datasets: [{
          label: 'Content by Phase',
          data: Object.values(performance.byPhase).map(p => p.count),
          backgroundColor: [
            '#6b7280', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'
          ]
        }]
      },
      completionTrend: {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        datasets: [{
          label: 'Completion Rate (%)',
          data: [65, 72, 68, 75],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }]
      }
    };
  };

  /**
   * Helper functions
   */
  self._getDateRangeDays = function(dateRange) {
    const ranges = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    return ranges[dateRange] || 30;
  };

  self._formatDate = function(date, format) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const week = Math.ceil(date.getDate() / 7);

    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'YYYY-[W]WW':
        return `${year}-W${week}`;
      case 'YYYY-MM':
        return `${year}-${month}`;
      default:
        return date.toISOString().split('T')[0];
    }
  };

  self._calculateProductivityScore = function(metrics, recentContent) {
    const factors = {
      completionRate: metrics.completionRate / 100,
      velocity: Math.min(recentContent / 7, 1), // Normalize to max 1 per day
      efficiency: metrics.averageTimeToPublish > 0 ? Math.max(0, 1 - (metrics.averageTimeToPublish / 30)) : 0.5
    };

    return Math.round((factors.completionRate * 0.4 + factors.velocity * 0.3 + factors.efficiency * 0.3) * 100);
  };

  self._calculateQualityScore = function(metrics) {
    // This would be enhanced with actual quality metrics
    const baseScore = Math.min(metrics.completionRate, 100);
    const timeBonus = metrics.averageTimeToPublish > 0 && metrics.averageTimeToPublish < 14 ? 10 : 0;
    return Math.min(baseScore + timeBonus, 100);
  };

  self._calculateTeamEfficiency = function(metrics) {
    const efficiency = metrics.completionRate / 100;
    const velocity = Math.min(metrics.contentVelocity / 10, 1);
    return Math.round((efficiency * 0.7 + velocity * 0.3) * 100);
  };

  self._getEmptyOverviewMetrics = function() {
    return {
      totalContent: 0,
      publishedContent: 0,
      inProgressContent: 0,
      overdueContent: 0,
      completionRate: 0,
      averageTimeToPublish: 0,
      productivityScore: 0,
      qualityScore: 0,
      teamEfficiency: 0,
      contentVelocity: 0
    };
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
