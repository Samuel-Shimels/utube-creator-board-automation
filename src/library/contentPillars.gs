/**
 * YouTube Content Manager Library - Content Pillars Management
 * Handles content pillar definitions, validation, and management
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Content pillar definitions with metadata
   */
  self.CONTENT_PILLARS = {
    'Educational Tutorials': {
      name: 'Educational Tutorials',
      description: 'Step-by-step demos of automations and technical tutorials',
      color: '#3b82f6',
      icon: 'book',
      priority: 1,
      targetAudience: 'Technical users, developers, automation enthusiasts',
      contentTypes: ['Tutorial', 'How-to', 'Technical Guide', 'Best Practices'],
      estimatedDuration: '5-15 minutes',
      keywords: ['tutorial', 'how-to', 'automation', 'technical', 'guide']
    },
    'Product Demos': {
      name: 'Product Demos',
      description: 'Showcasing automation products and SMB use cases',
      color: '#8b5cf6',
      icon: 'play-circle',
      priority: 2,
      targetAudience: 'SMB owners, decision makers, potential customers',
      contentTypes: ['Product Demo', 'Use Case', 'Feature Showcase', 'Comparison'],
      estimatedDuration: '3-10 minutes',
      keywords: ['demo', 'product', 'showcase', 'use case', 'SMB']
    },
    'Customer Success Stories': {
      name: 'Customer Success Stories',
      description: 'Case studies on workflow improvements and business impact',
      color: '#10b981',
      icon: 'trophy',
      priority: 3,
      targetAudience: 'Prospects, existing customers, industry peers',
      contentTypes: ['Case Study', 'Success Story', 'Testimonial', 'ROI Analysis'],
      estimatedDuration: '4-12 minutes',
      keywords: ['success', 'case study', 'testimonial', 'ROI', 'results']
    },
    'Support Library': {
      name: 'Support Library',
      description: 'FAQs, troubleshooting, setup guides, and support content',
      color: '#f59e0b',
      icon: 'question-circle',
      priority: 4,
      targetAudience: 'Existing customers, support team, end users',
      contentTypes: ['FAQ', 'Troubleshooting', 'Setup Guide', 'Troubleshooting'],
      estimatedDuration: '2-8 minutes',
      keywords: ['support', 'FAQ', 'troubleshooting', 'setup', 'help']
    },
    'Marketing & Updates': {
      name: 'Marketing & Updates',
      description: 'New gig announcements, promotions, feature releases',
      color: '#ef4444',
      icon: 'megaphone',
      priority: 5,
      targetAudience: 'All users, subscribers, potential customers',
      contentTypes: ['Announcement', 'Promotion', 'Update', 'News'],
      estimatedDuration: '1-5 minutes',
      keywords: ['announcement', 'promotion', 'update', 'news', 'marketing']
    }
  };

  /**
   * Get all content pillars
   * @returns {Array} Array of pillar objects
   */
  self.getAllPillars = function() {
    return Object.values(self.CONTENT_PILLARS);
  };

  /**
   * Get pillar by name
   * @param {string} pillarName - Name of the pillar
   * @returns {object|null} Pillar object or null if not found
   */
  self.getPillar = function(pillarName) {
    return self.CONTENT_PILLARS[pillarName] || null;
  };

  /**
   * Validate pillar name
   * @param {string} pillarName - Name to validate
   * @returns {boolean} True if valid
   */
  self.isValidPillar = function(pillarName) {
    return pillarName && self.CONTENT_PILLARS.hasOwnProperty(pillarName);
  };

  /**
   * Get pillar statistics
   * @param {string} spreadsheetId - Spreadsheet ID
   * @returns {object} Pillar statistics
   */
  self.getPillarStats = function(spreadsheetId) {
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
          data: self._getEmptyPillarStats()
        };
      }

      const headers = data[0];
      const pillarIndex = headers.indexOf('Pillar');
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const createdAtIndex = headers.indexOf('CreatedAt');

      const stats = {};

      // Initialize stats for each pillar
      Object.keys(self.CONTENT_PILLARS).forEach(pillarName => {
        stats[pillarName] = {
          ...self.CONTENT_PILLARS[pillarName],
          total: 0,
          published: 0,
          inProgress: 0,
          completed: 0,
          thisMonth: 0,
          thisWeek: 0,
          completionRate: 0,
          averageTimeToPublish: 0
        };
      });

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Process content items
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const pillar = row[pillarIndex];
        const phase = row[phaseIndex];
        const createdAt = row[createdAtIndex];

        if (pillar && stats[pillar]) {
          stats[pillar].total++;
          
          if (phase === 'Published') {
            stats[pillar].published++;
            stats[pillar].completed++;
          } else if (phase !== 'Idea') {
            stats[pillar].inProgress++;
          }

          // Check creation dates
          if (createdAt instanceof Date) {
            if (createdAt >= oneWeekAgo) {
              stats[pillar].thisWeek++;
            }
            if (createdAt >= oneMonthAgo) {
              stats[pillar].thisMonth++;
            }
          }
        }
      }

      // Calculate completion rates and average times
      Object.keys(stats).forEach(pillarName => {
        const pillarStats = stats[pillarName];
        if (pillarStats.total > 0) {
          pillarStats.completionRate = Math.round((pillarStats.published / pillarStats.total) * 100);
        }
        pillarStats.averageTimeToPublish = self._calculatePillarAverageTime(spreadsheetId, pillarName);
      });

      return {
        success: true,
        data: stats
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'PILLAR_STATS_ERROR'
        }
      };
    }
  };

  /**
   * Get content recommendations for a pillar
   * @param {string} pillarName - Name of the pillar
   * @returns {object} Content recommendations
   */
  self.getPillarRecommendations = function(pillarName) {
    const pillar = self.getPillar(pillarName);
    if (!pillar) {
      return {
        success: false,
        error: {
          message: 'Invalid pillar name',
          type: 'VALIDATION_ERROR'
        }
      };
    }

    const recommendations = {
      pillar: pillar,
      suggestedTopics: self._generateTopicSuggestions(pillar),
      contentIdeas: self._generateContentIdeas(pillar),
      bestPractices: self._getBestPractices(pillar),
      targetMetrics: self._getTargetMetrics(pillar)
    };

    return {
      success: true,
      data: recommendations
    };
  };

  /**
   * Calculate average time to publish for a pillar
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} pillarName - Pillar name
   * @returns {number} Average days to publish
   */
  self._calculatePillarAverageTime = function(spreadsheetId, pillarName) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const pillarIndex = headers.indexOf('Pillar');
      const phaseIndex = headers.indexOf('WorkflowPhase');
      const createdAtIndex = headers.indexOf('CreatedAt');
      const updatedAtIndex = headers.indexOf('UpdatedAt');

      let totalDays = 0;
      let publishedCount = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const pillar = row[pillarIndex];
        const phase = row[phaseIndex];
        
        if (pillar === pillarName && phase === 'Published') {
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

    } catch (error) {
      return 0;
    }
  };

  /**
   * Generate topic suggestions for a pillar
   * @private
   * @param {object} pillar - Pillar object
   * @returns {Array} Topic suggestions
   */
  self._generateTopicSuggestions = function(pillar) {
    const topicTemplates = {
      'Educational Tutorials': [
        'How to automate {process} in {tool}',
        'Step-by-step guide to {automation}',
        'Best practices for {workflow} automation',
        'Common mistakes when {doing} and how to avoid them',
        'Advanced techniques for {skill}'
      ],
      'Product Demos': [
        'Live demo: {product} solving {problem}',
        'Real-world use case: {company} using {product}',
        'Before vs After: {process} transformation',
        'ROI demonstration: {product} impact',
        'Feature deep-dive: {feature} capabilities'
      ],
      'Customer Success Stories': [
        'How {company} increased {metric} by {percentage}',
        'Case study: {industry} automation success',
        'Customer testimonial: {product} transformation',
        'Success metrics: {company} results',
        'Implementation story: {challenge} to {solution}'
      ],
      'Support Library': [
        'Troubleshooting: {common issue}',
        'Setup guide: {product} configuration',
        'FAQ: {frequently asked question}',
        'Quick fix: {problem} solution',
        'Configuration tips: {setting} optimization'
      ],
      'Marketing & Updates': [
        'New feature announcement: {feature}',
        'Product update: {version} release',
        'Special offer: {promotion} details',
        'Company news: {announcement}',
        'Upcoming events: {event} information'
      ]
    };

    return topicTemplates[pillar.name] || [];
  };

  /**
   * Generate content ideas for a pillar
   * @private
   * @param {object} pillar - Pillar object
   * @returns {Array} Content ideas
   */
  self._generateContentIdeas = function(pillar) {
    return [
      {
        title: `Quick ${pillar.name} Series`,
        description: `Create a series of short, focused ${pillar.name.toLowerCase()} videos`,
        estimatedEffort: 'Medium',
        priority: 'High'
      },
      {
        title: `Interactive ${pillar.name}`,
        description: `Add interactive elements like polls, Q&A, or live demos`,
        estimatedEffort: 'High',
        priority: 'Medium'
      },
      {
        title: `Behind-the-Scenes ${pillar.name}`,
        description: `Show the process of creating ${pillar.name.toLowerCase()}`,
        estimatedEffort: 'Low',
        priority: 'Low'
      }
    ];
  };

  /**
   * Get best practices for a pillar
   * @private
   * @param {object} pillar - Pillar object
   * @returns {Array} Best practices
   */
  self._getBestPractices = function(pillar) {
    const practices = {
      'Educational Tutorials': [
        'Start with clear learning objectives',
        'Use step-by-step visual demonstrations',
        'Include common troubleshooting tips',
        'Provide downloadable resources',
        'End with a summary and next steps'
      ],
      'Product Demos': [
        'Focus on business value and ROI',
        'Use real data and scenarios',
        'Address common objections',
        'Include customer testimonials',
        'Provide clear call-to-action'
      ],
      'Customer Success Stories': [
        'Use specific metrics and numbers',
        'Include before/after comparisons',
        'Feature actual customer quotes',
        'Show implementation timeline',
        'Highlight key challenges overcome'
      ],
      'Support Library': [
        'Use clear, concise language',
        'Include screenshots and visuals',
        'Organize by difficulty level',
        'Provide multiple solution paths',
        'Update regularly based on feedback'
      ],
      'Marketing & Updates': [
        'Lead with the most important information',
        'Use engaging visuals and graphics',
        'Include clear next steps',
        'Maintain consistent branding',
        'Track engagement metrics'
      ]
    };

    return practices[pillar.name] || [];
  };

  /**
   * Get target metrics for a pillar
   * @private
   * @param {object} pillar - Pillar object
   * @returns {object} Target metrics
   */
  self._getTargetMetrics = function(pillar) {
    return {
      targetViews: pillar.name === 'Educational Tutorials' ? 1000 : 500,
      targetEngagement: 0.05, // 5% engagement rate
      targetCompletion: 0.7, // 70% completion rate
      targetFrequency: 'Weekly',
      targetDuration: pillar.estimatedDuration
    };
  };

  /**
   * Get empty pillar stats structure
   * @private
   * @returns {object} Empty pillar stats
   */
  self._getEmptyPillarStats = function() {
    const stats = {};
    Object.keys(self.CONTENT_PILLARS).forEach(pillarName => {
      stats[pillarName] = {
        ...self.CONTENT_PILLARS[pillarName],
        total: 0,
        published: 0,
        inProgress: 0,
        completed: 0,
        thisMonth: 0,
        thisWeek: 0,
        completionRate: 0,
        averageTimeToPublish: 0
      };
    });
    return stats;
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
