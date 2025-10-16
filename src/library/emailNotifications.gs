/**
 * YouTube Content Manager Library - Email Notifications
 * Handles email notifications for content updates and workflow changes
 */

var YtLib = (function(ns) {
  const self = ns || {};

  /**
   * Notification types
   */
  self.NOTIFICATION_TYPES = {
    PHASE_CHANGE: 'phase_change',
    DUE_DATE_REMINDER: 'due_date_reminder',
    OVERDUE_ALERT: 'overdue_alert',
    PUBLISHED_NOTIFICATION: 'published_notification',
    WEEKLY_SUMMARY: 'weekly_summary'
  };

  /**
   * Send phase change notification
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @param {string} oldPhase - Previous phase
   * @param {string} newPhase - New phase
   * @param {string} assignedTo - Assigned user email
   * @returns {object} Notification result
   */
  self.sendPhaseChangeNotification = function(spreadsheetId, contentId, oldPhase, newPhase, assignedTo) {
    try {
      if (!assignedTo) {
        return {
          success: false,
          error: {
            message: 'No assigned user for notification',
            type: 'VALIDATION_ERROR'
          }
        };
      }

      const contentDetails = self._getContentDetails(spreadsheetId, contentId);
      if (!contentDetails.success) {
        return contentDetails;
      }

      const subject = `Content Phase Update: ${contentDetails.data.title}`;
      const body = self._buildPhaseChangeEmailBody(contentDetails.data, oldPhase, newPhase);

      GmailApp.sendEmail(assignedTo, subject, body, {
        htmlBody: self._buildPhaseChangeHtmlBody(contentDetails.data, oldPhase, newPhase)
      });

      return {
        success: true,
        message: 'Phase change notification sent successfully'
      };

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
   * Send due date reminder
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @param {string} assignedTo - Assigned user email
   * @param {number} daysUntilDue - Days until due
   * @returns {object} Notification result
   */
  self.sendDueDateReminder = function(spreadsheetId, contentId, assignedTo, daysUntilDue) {
    try {
      if (!assignedTo) {
        return {
          success: false,
          error: {
            message: 'No assigned user for notification',
            type: 'VALIDATION_ERROR'
          }
        };
      }

      const contentDetails = self._getContentDetails(spreadsheetId, contentId);
      if (!contentDetails.success) {
        return contentDetails;
      }

      const subject = `Due Date Reminder: ${contentDetails.data.title}`;
      const body = self._buildDueDateReminderBody(contentDetails.data, daysUntilDue);

      GmailApp.sendEmail(assignedTo, subject, body, {
        htmlBody: self._buildDueDateReminderHtmlBody(contentDetails.data, daysUntilDue)
      });

      return {
        success: true,
        message: 'Due date reminder sent successfully'
      };

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
   * Send overdue alert
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @param {string} assignedTo - Assigned user email
   * @returns {object} Notification result
   */
  self.sendOverdueAlert = function(spreadsheetId, contentId, assignedTo) {
    try {
      if (!assignedTo) {
        return {
          success: false,
          error: {
            message: 'No assigned user for notification',
            type: 'VALIDATION_ERROR'
          }
        };
      }

      const contentDetails = self._getContentDetails(spreadsheetId, contentId);
      if (!contentDetails.success) {
        return contentDetails;
      }

      const subject = `URGENT: Overdue Content - ${contentDetails.data.title}`;
      const body = self._buildOverdueAlertBody(contentDetails.data);

      GmailApp.sendEmail(assignedTo, subject, body, {
        htmlBody: self._buildOverdueAlertHtmlBody(contentDetails.data)
      });

      return {
        success: true,
        message: 'Overdue alert sent successfully'
      };

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
   * Send published notification
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @param {string} publishedUrl - Published YouTube URL
   * @returns {object} Notification result
   */
  self.sendPublishedNotification = function(spreadsheetId, contentId, publishedUrl) {
    try {
      const contentDetails = self._getContentDetails(spreadsheetId, contentId);
      if (!contentDetails.success) {
        return contentDetails;
      }

      const subject = `Content Published: ${contentDetails.data.title}`;
      const body = self._buildPublishedNotificationBody(contentDetails.data, publishedUrl);

      // Send to assigned user if available
      if (contentDetails.data.assignedTo) {
        GmailApp.sendEmail(contentDetails.data.assignedTo, subject, body, {
          htmlBody: self._buildPublishedNotificationHtmlBody(contentDetails.data, publishedUrl)
        });
      }

      // Send to team (you can add team email addresses here)
      const teamEmails = self._getTeamEmails();
      if (teamEmails.length > 0) {
        GmailApp.sendEmail(teamEmails.join(','), subject, body, {
          htmlBody: self._buildPublishedNotificationHtmlBody(contentDetails.data, publishedUrl)
        });
      }

      return {
        success: true,
        message: 'Published notification sent successfully'
      };

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
   * Send weekly summary
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} recipientEmail - Recipient email
   * @returns {object} Notification result
   */
  self.sendWeeklySummary = function(spreadsheetId, recipientEmail) {
    try {
      const summaryData = self._generateWeeklySummary(spreadsheetId);
      if (!summaryData.success) {
        return summaryData;
      }

      const subject = `Weekly Content Summary - ${new Date().toLocaleDateString()}`;
      const body = self._buildWeeklySummaryBody(summaryData.data);

      GmailApp.sendEmail(recipientEmail, subject, body, {
        htmlBody: self._buildWeeklySummaryHtmlBody(summaryData.data)
      });

      return {
        success: true,
        message: 'Weekly summary sent successfully'
      };

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
   * Get content details for notifications
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @param {string} contentId - Content ID
   * @returns {object} Content details
   */
  self._getContentDetails = function(spreadsheetId, contentId) {
    try {
      const ss = SpreadsheetApp.openById(spreadsheetId);
      const sheet = ss.getSheetByName('ContentAssets');
      
      if (!sheet) {
        throw new Error('ContentAssets sheet not found');
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const contentIdIndex = headers.indexOf('ID');

      for (let i = 1; i < data.length; i++) {
        if (data[i][contentIdIndex] === contentId) {
          const row = data[i];
          return {
            success: true,
            data: {
              id: row[headers.indexOf('ID')],
              title: row[headers.indexOf('Title')],
              pillar: row[headers.indexOf('Pillar')],
              workflowPhase: row[headers.indexOf('WorkflowPhase')],
              assignedTo: row[headers.indexOf('AssignedTo')],
              dueDate: row[headers.indexOf('DueDate')],
              notes: row[headers.indexOf('Notes')],
              publishedUrl: row[headers.indexOf('PublishedURL')]
            }
          };
        }
      }

      throw new Error('Content not found with ID: ' + contentId);

    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'CONTENT_ERROR'
        }
      };
    }
  };

  /**
   * Build phase change email body
   * @private
   * @param {object} content - Content details
   * @param {string} oldPhase - Previous phase
   * @param {string} newPhase - New phase
   * @returns {string} Email body
   */
  self._buildPhaseChangeEmailBody = function(content, oldPhase, newPhase) {
    return `
Content Phase Update

Title: ${content.title}
Pillar: ${content.pillar}
Phase Changed: ${oldPhase} → ${newPhase}
Due Date: ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}

Notes: ${content.notes || 'None'}

View in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager
    `.trim();
  };

  /**
   * Build phase change HTML email body
   * @private
   * @param {object} content - Content details
   * @param {string} oldPhase - Previous phase
   * @param {string} newPhase - New phase
   * @returns {string} HTML email body
   */
  self._buildPhaseChangeHtmlBody = function(content, oldPhase, newPhase) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Content Phase Update</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${content.title}</h3>
        <p><strong>Pillar:</strong> ${content.pillar}</p>
        <p><strong>Phase Changed:</strong> <span style="color: #666;">${oldPhase}</span> → <span style="color: #007bff; font-weight: bold;">${newPhase}</span></p>
        <p><strong>Due Date:</strong> ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}</p>
        ${content.notes ? `<p><strong>Notes:</strong> ${content.notes}</p>` : ''}
      </div>
      <p style="color: #666;">View in Content Manager: <a href="#">[Link to your content manager]</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>YouTube Content Manager</p>
    </div>
    `;
  };

  /**
   * Build due date reminder email body
   * @private
   * @param {object} content - Content details
   * @param {number} daysUntilDue - Days until due
   * @returns {string} Email body
   */
  self._buildDueDateReminderBody = function(content, daysUntilDue) {
    return `
Due Date Reminder

Title: ${content.title}
Pillar: ${content.pillar}
Current Phase: ${content.workflowPhase}
Due Date: ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}
Days Until Due: ${daysUntilDue}

Please ensure this content is on track for completion.

View in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager
    `.trim();
  };

  /**
   * Build due date reminder HTML email body
   * @private
   * @param {object} content - Content details
   * @param {number} daysUntilDue - Days until due
   * @returns {string} HTML email body
   */
  self._buildDueDateReminderHtmlBody = function(content, daysUntilDue) {
    const urgencyColor = daysUntilDue <= 1 ? '#ef4444' : daysUntilDue <= 3 ? '#f59e0b' : '#3b82f6';
    
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Due Date Reminder</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${urgencyColor};">
        <h3 style="margin-top: 0;">${content.title}</h3>
        <p><strong>Pillar:</strong> ${content.pillar}</p>
        <p><strong>Current Phase:</strong> ${content.workflowPhase}</p>
        <p><strong>Due Date:</strong> ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}</p>
        <p style="color: ${urgencyColor}; font-weight: bold; font-size: 18px;">Days Until Due: ${daysUntilDue}</p>
      </div>
      <p style="color: #666;">Please ensure this content is on track for completion.</p>
      <p style="color: #666;">View in Content Manager: <a href="#">[Link to your content manager]</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>YouTube Content Manager</p>
    </div>
    `;
  };

  /**
   * Build overdue alert email body
   * @private
   * @param {object} content - Content details
   * @returns {string} Email body
   */
  self._buildOverdueAlertBody = function(content) {
    return `
URGENT: Overdue Content

Title: ${content.title}
Pillar: ${content.pillar}
Current Phase: ${content.workflowPhase}
Due Date: ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}
STATUS: OVERDUE

This content is past its due date. Please take immediate action.

View in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager
    `.trim();
  };

  /**
   * Build overdue alert HTML email body
   * @private
   * @param {object} content - Content details
   * @returns {string} HTML email body
   */
  self._buildOverdueAlertHtmlBody = function(content) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">URGENT: Overdue Content</h2>
      <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #ef4444;">
        <h3 style="margin-top: 0; color: #ef4444;">${content.title}</h3>
        <p><strong>Pillar:</strong> ${content.pillar}</p>
        <p><strong>Current Phase:</strong> ${content.workflowPhase}</p>
        <p><strong>Due Date:</strong> ${content.dueDate ? content.dueDate.toLocaleDateString() : 'Not set'}</p>
        <p style="color: #ef4444; font-weight: bold; font-size: 20px; text-transform: uppercase;">STATUS: OVERDUE</p>
      </div>
      <p style="color: #666; font-weight: bold;">This content is past its due date. Please take immediate action.</p>
      <p style="color: #666;">View in Content Manager: <a href="#">[Link to your content manager]</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>YouTube Content Manager</p>
    </div>
    `;
  };

  /**
   * Build published notification email body
   * @private
   * @param {object} content - Content details
   * @param {string} publishedUrl - Published URL
   * @returns {string} Email body
   */
  self._buildPublishedNotificationBody = function(content, publishedUrl) {
    return `
Content Published Successfully!

Title: ${content.title}
Pillar: ${content.pillar}
Published URL: ${publishedUrl}

Congratulations! Your content has been published and is now live.

View in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager
    `.trim();
  };

  /**
   * Build published notification HTML email body
   * @private
   * @param {object} content - Content details
   * @param {string} publishedUrl - Published URL
   * @returns {string} HTML email body
   */
  self._buildPublishedNotificationHtmlBody = function(content, publishedUrl) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Content Published Successfully!</h2>
      <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
        <h3 style="margin-top: 0; color: #10b981;">${content.title}</h3>
        <p><strong>Pillar:</strong> ${content.pillar}</p>
        <p><strong>Published URL:</strong> <a href="${publishedUrl}" style="color: #10b981;">${publishedUrl}</a></p>
      </div>
      <p style="color: #666;">Congratulations! Your content has been published and is now live.</p>
      <p style="color: #666;">View in Content Manager: <a href="#">[Link to your content manager]</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>YouTube Content Manager</p>
    </div>
    `;
  };

  /**
   * Generate weekly summary data
   * @private
   * @param {string} spreadsheetId - Spreadsheet ID
   * @returns {object} Summary data
   */
  self._generateWeeklySummary = function(spreadsheetId) {
    try {
      // This would integrate with the dashboard metrics
      // For now, return a basic structure
      return {
        success: true,
        data: {
          week: new Date().toLocaleDateString(),
          totalContent: 0,
          publishedThisWeek: 0,
          inProgress: 0,
          overdue: 0,
          topPillar: 'Educational Tutorials',
          upcomingDue: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message: error.message,
          type: 'SUMMARY_ERROR'
        }
      };
    }
  };

  /**
   * Build weekly summary email body
   * @private
   * @param {object} summaryData - Summary data
   * @returns {string} Email body
   */
  self._buildWeeklySummaryBody = function(summaryData) {
    return `
Weekly Content Summary - ${summaryData.week}

Total Content: ${summaryData.totalContent}
Published This Week: ${summaryData.publishedThisWeek}
In Progress: ${summaryData.inProgress}
Overdue: ${summaryData.overdue}
Top Performing Pillar: ${summaryData.topPillar}
Upcoming Due: ${summaryData.upcomingDue}

View detailed analytics in Content Manager: [Link to your content manager]

Best regards,
YouTube Content Manager
    `.trim();
  };

  /**
   * Build weekly summary HTML email body
   * @private
   * @param {object} summaryData - Summary data
   * @returns {string} HTML email body
   */
  self._buildWeeklySummaryHtmlBody = function(summaryData) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Weekly Content Summary - ${summaryData.week}</h2>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
          <div><strong>Total Content:</strong> ${summaryData.totalContent}</div>
          <div><strong>Published This Week:</strong> ${summaryData.publishedThisWeek}</div>
          <div><strong>In Progress:</strong> ${summaryData.inProgress}</div>
          <div><strong>Overdue:</strong> ${summaryData.overdue}</div>
          <div><strong>Top Performing Pillar:</strong> ${summaryData.topPillar}</div>
          <div><strong>Upcoming Due:</strong> ${summaryData.upcomingDue}</div>
        </div>
      </div>
      <p style="color: #666;">View detailed analytics in Content Manager: <a href="#">[Link to your content manager]</a></p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
      <p style="color: #999; font-size: 12px;">Best regards,<br>YouTube Content Manager</p>
    </div>
    `;
  };

  /**
   * Get team email addresses
   * @private
   * @returns {Array} Team email addresses
   */
  self._getTeamEmails = function() {
    // This could be configured in a settings sheet or properties
    return [
      // Add team email addresses here
    ];
  };

  return self;
})(typeof YtLib !== 'undefined' ? YtLib : {});
