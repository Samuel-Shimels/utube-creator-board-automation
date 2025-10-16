# YouTube Content Manager - Deployment Guide

This guide provides step-by-step instructions for deploying the YouTube Content Manager application.

## Prerequisites

- Google account with access to Google Apps Script
- Google Sheets for data storage
- Basic understanding of Google Apps Script
- Optional: clasp CLI tool for version control

## Deployment Steps

### Step 1: Create the Library Project

1. **Go to Google Apps Script**
   - Visit [script.google.com](https://script.google.com)
   - Click "New Project"

2. **Set up the Library**
   - Rename the project to "YouTube Content Manager Library"
   - Delete the default `Code.gs` file
   - Create new files and copy the following content:

   **Files to create:**
   - `appsscript.json` - Copy from `src/library/appsscript.json`
   - `workflow.gs` - Copy from `src/library/workflow.gs`
   - `dashboard.gs` - Copy from `src/library/dashboard.gs`
   - `kanban.gs` - Copy from `src/library/kanban.gs`
   - `contentPillars.gs` - Copy from `src/library/contentPillars.gs`
   - `emailNotifications.gs` - Copy from `src/library/emailNotifications.gs`

3. **Deploy as Library**
   - Go to "Deploy" > "New deployment"
   - Choose "Library" as the type
   - Set version to "0" (development mode)
   - Click "Deploy"
   - **Important**: Copy the Library ID from the deployment dialog

### Step 2: Create the Sheet Project

1. **Create New Project**
   - Go to [script.google.com](https://script.google.com)
   - Click "New Project"
   - Rename to "YouTube Content Manager Sheet"

2. **Set up the Sheet Project**
   - Delete the default `Code.gs` file
   - Create new files and copy the following content:

   **Files to create:**
   - `appsscript.json` - Copy from `src/sheet/appsscript.json`
   - `Code.js` - Copy from `src/sheet/Code.js`
   - `index.html` - Copy from `src/sheet/index.html`
   - `sheetConfig.gs` - Copy from `src/sheet/sheetConfig.gs`
   - `sheetService.gs` - Copy from `src/sheet/sheetService.gs`
   - `sheetUtils.gs` - Copy from `src/sheet/sheetUtils.gs`

3. **Update Library Reference**
   - In `appsscript.json`, replace `YOUR_LIBRARY_ID_HERE` with the actual Library ID from Step 1

### Step 3: Create Google Sheets Database

1. **Create New Spreadsheet**
   - Go to [sheets.google.com](https://sheets.google.com)
   - Create a new spreadsheet
   - Name it "YouTube Content Manager Database"

2. **Initialize Sheets Structure**
   - Deploy the Sheet project as a web app (see Step 4)
   - Open the web app URL
   - Click "Initialize Sheets" to set up the database structure

### Step 4: Deploy as Web App

1. **Deploy Sheet Project**
   - In the Sheet project, go to "Deploy" > "New deployment"
   - Choose "Web app" as the type
   - Set "Execute as" to "Me"
   - Set "Who has access" to "Anyone" (or restrict as needed)
   - Click "Deploy"
   - Copy the Web App URL

2. **Configure Permissions**
   - The first time you access the web app, you'll need to authorize permissions
   - Grant access to Google Sheets, Drive, and Gmail (for notifications)

### Step 5: Initial Setup

1. **Open the Web App**
   - Navigate to the Web App URL from Step 4
   - You should see the YouTube Content Manager interface

2. **Initialize the Database**
   - Click the "Settings" dropdown
   - Select "Initialize Sheets"
   - This will create the necessary sheet structure

3. **Verify Setup**
   - Check that the dashboard shows metrics
   - Verify the Kanban board is visible
   - Test adding a new content item

## Configuration

### Email Notifications Setup

1. **Configure Team Emails**
   - Go to the Configurations sheet in your Google Sheets
   - Update the "TeamEmails" row with comma-separated email addresses
   - Example: `user1@example.com,user2@example.com`

2. **Configure Notification Settings**
   - Update "NotificationSettings" to "enabled"
   - Set "DueDateReminderDays" to "3,1" (3 days and 1 day before due)
   - Set "OverdueCheckEnabled" to "true"

### Customization Options

1. **Content Pillars**
   - Modify pillar definitions in `contentPillars.gs`
   - Update the UI dropdowns in `index.html`

2. **Workflow Phases**
   - Modify phase definitions in `workflow.gs`
   - Update the UI accordingly

3. **UI Customization**
   - Modify colors and styling in `index.html`
   - Update the CSS variables in the `<style>` section

## Testing

### Basic Functionality Tests

1. **Content Management**
   - Add a new content item
   - Edit an existing item
   - Delete an item
   - Search and filter content

2. **Workflow Management**
   - Move content between phases using drag-and-drop
   - Verify phase changes are saved

3. **Dashboard**
   - Check that metrics update correctly
   - Verify charts and statistics

4. **Notifications**
   - Test email notifications (if configured)
   - Check audit trail entries

### Performance Tests

1. **Load Testing**
   - Test with large amounts of data
   - Verify caching works correctly

2. **Error Handling**
   - Test with invalid inputs
   - Verify error messages are user-friendly

## Troubleshooting

### Common Issues

1. **Library Not Found Error**
   - Verify the Library ID is correct in `appsscript.json`
   - Ensure the library is deployed and accessible

2. **Permission Denied Errors**
   - Check that the web app has proper permissions
   - Verify the user has access to the Google Sheets

3. **Sheets Not Found Error**
   - Ensure the spreadsheet is properly linked
   - Run the "Initialize Sheets" function

4. **UI Not Loading**
   - Check browser console for JavaScript errors
   - Verify all external libraries are loading correctly

### Debug Mode

1. **Enable Debug Logging**
   - Add `console.log()` statements in the code
   - Check the Apps Script execution logs

2. **Test Functions Individually**
   - Use the Apps Script editor to test functions
   - Check the execution transcript for errors

## Maintenance

### Regular Maintenance Tasks

1. **Clean Up Audit Logs**
   - Run `cleanupAuditLogs()` function periodically
   - Set up a time-driven trigger for automatic cleanup

2. **Backup Data**
   - Export data regularly using the export function
   - Keep backups of the Apps Script projects

3. **Monitor Performance**
   - Check execution times in the Apps Script dashboard
   - Monitor memory usage and optimize as needed

### Updates and Upgrades

1. **Code Updates**
   - Test changes in a development environment first
   - Deploy updates during low-usage periods
   - Keep backups before major updates

2. **Library Updates**
   - Update library version when making changes
   - Test compatibility with existing sheet projects

## Security Considerations

1. **Access Control**
   - Restrict web app access to authorized users only
   - Use Google Workspace for team management

2. **Data Protection**
   - Regular backups of important data
   - Monitor access logs and audit trails

3. **API Security**
   - Validate all user inputs
   - Use proper error handling to avoid information leakage

## Support and Documentation

### Getting Help

1. **Check the Logs**
   - Apps Script execution logs
   - Browser console logs
   - Google Sheets audit logs

2. **Common Solutions**
   - Review this deployment guide
   - Check the main README.md
   - Search for similar issues online

3. **Contact Support**
   - Create an issue in the project repository
   - Provide detailed error messages and steps to reproduce

### Additional Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [clasp CLI Documentation](https://github.com/google/clasp)

---

**Note**: This deployment guide assumes basic familiarity with Google Apps Script and Google Sheets. For advanced configurations or custom requirements, refer to the official Google documentation or seek additional support.
