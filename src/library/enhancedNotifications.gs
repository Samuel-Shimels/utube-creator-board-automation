/**
 * YouTube Content Manager Library - Enhanced Notifications
 * Provides advanced notification system with real-time updates and better UX
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Notification types and priorities
   */
  self.NOTIFICATION_TYPES = {
    PHASE_CHANGE: { id: 'phase_change', priority: 'medium', icon: 'bi-arrow-right' },
    DUE_DATE_REMINDER: { id: 'due_reminder', priority: 'high', icon: 'bi-clock' },
    OVERDUE_ALERT: { id: 'overdue', priority: 'critical', icon: 'bi-exclamation-triangle' },
    PUBLISHED_NOTIFICATION: { id: 'published', priority: 'low', icon: 'bi-check-circle' },
    WEEKLY_SUMMARY: { id: 'weekly_summary', priority: 'low', icon: 'bi-graph-up' },
    TEAM_UPDATE: { id: 'team_update', priority: 'medium', icon: 'bi-people' },
    SYSTEM_ALERT: { id: 'system_alert', priority: 'high', icon: 'bi-gear' },
    CONTENT_SUGGESTION: { id: 'content_suggestion', priority: 'low', icon: 'bi-lightbulb' }
  };

  /**
   * Notification channels
   */
  self.NOTIFICATION_CHANNELS = {
    EMAIL: 'email',
    IN_APP: 'in_app',
    PUSH: 'push',
    SLACK: 'slack'
  };

  /**
   * Send enhanced notification
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} type - Notification type
   * @param {object} data - Notification data
   * @param {Array} channels - Notification channels
   * @returns {object} Notification result
   */
  self.sendEnhancedNotification = function(spreadsheetId, type, data, channels = ['email', 'in_app']) {
    try {
      const notificationType = self.NOTIFICATION_TYPES[type];
      if (!notificationType) {
        throw new Error('Invalid notification type: ' + type);
      }

      const notification = {
        id: 'notif_' + Utilities.getUuid(),
        type: type,
        priority: notificationType.priority,
        icon: notificationType.icon,
        title: data.title || self._getDefaultTitle(type),
        message: data.message || '',
        data: data,
        channels: channels,
        createdAt: new Date().toISOString(),
        read: false,
        expiresAt: data.expiresAt || self._getExpirationDate(notificationType.priority)
      };

      const results = {
        success: true,
        notification: notification,
        channelResults: {}
      };

      // Send to each channel
      channels.forEach(channel => {
        try {
          switch (channel) {
            case 'email':
              results.channelResults.email = self._sendEmailNotification(notification, data);
              break;
            case 'in_app':
              results.channelResults.in_app = self._storeInAppNotification(spreadsheetId, notification);
              break;
            case 'push':
              results.channelResults.push = self._sendPushNotification(notification, data);
              break;
            case 'slack':
              results.channelResults.slack = self._sendSlackNotification(notification, data);
              break;
          }
        } catch (error) {
          results.channelResults[channel] = {
            success: false,
            error: error.message
          };
        }
      });

      return results;

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'NOTIFICATION_ERROR'
        }
      };
    }
  };

  /**
   * Send smart notification based on context
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} event - Event that triggered notification
   * @param {object} context - Event context
   * @returns {object} Notification result
   */
  self.sendSmartNotification = function(spreadsheetId, event, context) {
    try {
      const notificationConfig = self._getSmartNotificationConfig(event, context);
      if (!notificationConfig) {
        return { success: false, message: 'No notification configured for event: ' + event };
      }

      return self.sendEnhancedNotification(
        spreadsheetId,
        notificationConfig.type,
        notificationConfig.data,
        notificationConfig.channels
      );

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'SMART_NOTIFICATION_ERROR'
        }
      };
    }
  };

  /**
   * Get user notification preferences
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} userId - User ID
   * @returns {object} User preferences
   */
  self.getUserNotificationPreferences = function(spreadsheetId, userId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const configSheet = ss.getSheetByName('Configurations');
      
      if (!configSheet) {
        return self._getDefaultNotificationPreferences();
      }

      const data = configSheet.getDataRange().getValues();
      const preferences = self._getDefaultNotificationPreferences();

      // Load user-specific preferences
      for (let i = 1; i < data.length; i++) {
        const key = data[i][0];
        const value = data[i][1];
        
        if (key.startsWith('notification_')) {
          const setting = key.replace('notification_', '');
          preferences[setting] = value === 'true' || value === true;
        }
      }

      return {
        success: true,
        data: preferences
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'PREFERENCES_ERROR'
        }
      };
    }
  };

  /**
   * Update user notification preferences
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} userId - User ID
   * @param {object} preferences - New preferences
   * @returns {object} Update result
   */
  self.updateUserNotificationPreferences = function(spreadsheetId, userId, preferences) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const configSheet = ss.getSheetByName('Configurations');
      
      if (!configSheet) {
        throw new Error('Configurations sheet not found');
      }

      const data = configSheet.getDataRange().getValues();
      const keyIndex = data[0].indexOf('ConfigKey');
      const valueIndex = data[0].indexOf('ConfigValue');
      const updatedIndex = data[0].indexOf('UpdatedAt');

      let updatedCount = 0;

      // Update preferences
      Object.keys(preferences).forEach(setting => {
        const configKey = `notification_${setting}`;
        let rowIndex = -1;

        // Find existing row
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
            preferences[setting].toString(),
            `Notification preference for ${setting}`,
            new Date().toISOString()
          ]);
        } else {
          // Update existing row
          configSheet.getRange(rowIndex + 1, valueIndex + 1).setValue(preferences[setting].toString());
          configSheet.getRange(rowIndex + 1, updatedIndex + 1).setValue(new Date().toISOString());
        }
        updatedCount++;
      });

      return {
        success: true,
        message: `Updated ${updatedCount} notification preferences`,
        data: { updatedCount: updatedCount }
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'PREFERENCES_UPDATE_ERROR'
        }
      };
    }
  };

  /**
   * Get in-app notifications
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {object} Notifications
   */
  self.getInAppNotifications = function(spreadsheetId, userId, options = {}) {
    try {
      const {
        limit = 50,
        unreadOnly = false,
        priority = null
      } = options;

      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('Notifications');
      
      if (!sheet) {
        return { success: true, data: [] };
      }

      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) {
        return { success: true, data: [] };
      }

      const headers = data[0];
      const notifications = [];

      for (let i = 1; i < notifications.length && notifications.length < limit; i++) {
        const row = data[i];
        const notification = {
          id: row[headers.indexOf('id')],
          type: row[headers.indexOf('type')],
          priority: row[headers.indexOf('priority')],
          title: row[headers.indexOf('title')],
          message: row[headers.indexOf('message')],
          read: row[headers.indexOf('read')] === 'true',
          createdAt: row[headers.indexOf('createdAt')],
          expiresAt: row[headers.indexOf('expiresAt')]
        };

        // Apply filters
        if (unreadOnly && notification.read) continue;
        if (priority && notification.priority !== priority) continue;
        if (notification.expiresAt && new Date(notification.expiresAt) < new Date()) continue;

        notifications.push(notification);
      }

      return {
        success: true,
        data: notifications
      };

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'NOTIFICATIONS_FETCH_ERROR'
        }
      };
    }
  };

  /**
   * Mark notification as read
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} notificationId - Notification ID
   * @returns {object} Update result
   */
  self.markNotificationAsRead = function(spreadsheetId, notificationId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('Notifications');
      
      if (!sheet) {
        throw new Error('Notifications sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('id');
      const readIndex = headers.indexOf('read');

      // Find the notification
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === notificationId) {
          sheet.getRange(i + 1, readIndex + 1).setValue('true');
          return {
            success: true,
            message: 'Notification marked as read'
          };
        }
      }

      throw new Error('Notification not found: ' + notificationId);

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'MARK_READ_ERROR'
        }
      };
    }
  };

  /**
   * Private helper functions
   */
  self._getDefaultTitle = function(type) {
    const titles = {
      'PHASE_CHANGE': 'Content Phase Updated',
      'DUE_DATE_REMINDER': 'Due Date Reminder',
      'OVERDUE_ALERT': 'Overdue Content Alert',
      'PUBLISHED_NOTIFICATION': 'Content Published',
      'WEEKLY_SUMMARY': 'Weekly Summary',
      'TEAM_UPDATE': 'Team Update',
      'SYSTEM_ALERT': 'System Alert',
      'CONTENT_SUGGESTION': 'Content Suggestion'
    };
    return titles[type] || 'Notification';
  };

  self._getExpirationDate = function(priority) {
    const now = new Date();
    const hours = {
      'critical': 24,
      'high': 72,
      'medium': 168, // 1 week
      'low': 720 // 1 month
    };
    now.setHours(now.getHours() + (hours[priority] || 168));
    return now.toISOString();
  };

  self._getDefaultNotificationPreferences = function() {
    return {
      phase_changes: true,
      due_reminders: true,
      overdue_alerts: true,
      published_notifications: false,
      weekly_summaries: true,
      team_updates: true,
      system_alerts: true,
      content_suggestions: false,
      email_notifications: true,
      in_app_notifications: true,
      push_notifications: false
    };
  };

  self._getSmartNotificationConfig = function(event, context) {
    const configs = {
      'content_phase_changed': {
        type: 'PHASE_CHANGE',
        data: {
          title: `Content moved to ${context.newPhase}`,
          message: `"${context.title}" has been moved to ${context.newPhase}`,
          contentId: context.contentId,
          previousPhase: context.previousPhase,
          newPhase: context.newPhase
        },
        channels: ['email', 'in_app']
      },
      'content_due_soon': {
        type: 'DUE_DATE_REMINDER',
        data: {
          title: 'Content due soon',
          message: `"${context.title}" is due in ${context.daysUntilDue} days`,
          contentId: context.contentId,
          dueDate: context.dueDate
        },
        channels: ['email', 'in_app']
      },
      'content_overdue': {
        type: 'OVERDUE_ALERT',
        data: {
          title: 'Content is overdue',
          message: `"${context.title}" is ${context.daysOverdue} days overdue`,
          contentId: context.contentId,
          dueDate: context.dueDate
        },
        channels: ['email', 'in_app', 'push']
      },
      'content_published': {
        type: 'PUBLISHED_NOTIFICATION',
        data: {
          title: 'Content published successfully',
          message: `"${context.title}" has been published`,
          contentId: context.contentId,
          publishedUrl: context.publishedUrl
        },
        channels: ['in_app']
      }
    };

    return configs[event];
  };

  self._sendEmailNotification = function(notification, data) {
    try {
      const subject = notification.title;
      const body = self._buildEmailBody(notification, data);
      const htmlBody = self._buildEmailHtmlBody(notification, data);

      GmailApp.sendEmail(data.recipient || Session.getActiveUser().getEmail(), subject, body, {
        htmlBody: htmlBody
      });

      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  self._storeInAppNotification = function(spreadsheetId, notification) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      let sheet = ss.getSheetByName('Notifications');
      
      if (!sheet) {
        sheet = ss.insertSheet('Notifications');
        sheet.getRange(1, 1, 1, 7).setValues([[
          'id', 'type', 'priority', 'title', 'message', 'read', 'createdAt', 'expiresAt'
        ]]);
      }

      sheet.appendRow([
        notification.id,
        notification.type,
        notification.priority,
        notification.title,
        notification.message,
        'false',
        notification.createdAt,
        notification.expiresAt
      ]);

      return { success: true, message: 'In-app notification stored' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  self._sendPushNotification = function(notification, data) {
    // This would integrate with a push notification service
    return { success: true, message: 'Push notification sent (mock)' };
  };

  self._sendSlackNotification = function(notification, data) {
    // This would integrate with Slack API
    return { success: true, message: 'Slack notification sent (mock)' };
  };

  self._buildEmailBody = function(notification, data) {
    return `
${notification.title}

${notification.message}

Priority: ${notification.priority.toUpperCase()}
Created: ${new Date(notification.createdAt).toLocaleString()}

View in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager Pro
    `.trim();
  };

  self._buildEmailHtmlBody = function(notification, data) {
    const priorityColors = {
      'critical': '#ef4444',
      'high': '#f59e0b',
      'medium': '#3b82f6',
      'low': '#6b7280'
    };

    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${priorityColors[notification.priority]}; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">${notification.title}</h2>
      </div>
      <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 15px 0; font-size: 16px;">${notification.message}</p>
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">
            <strong>Priority:</strong> ${notification.priority.toUpperCase()}<br>
            <strong>Created:</strong> ${new Date(notification.createdAt).toLocaleString()}
          </p>
        </div>
        <p style="margin: 15px 0 0 0; font-size: 14px; color: #6b7280;">
          View in Content Manager: <a href="#">[Link to your content manager]</a>
        </p>
      </div>
      <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        Best regards,<br>YouTube Content Manager Pro
      </div>
    </div>
    `;
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
