# YouTube Content Management & Tracking Platform

A comprehensive cloud-based content management system for YouTube creators to efficiently manage assets, track content creation workflow, and optimize publishing across defined content pillars.

## 🚀 Features

### Core Functionality
- **Dashboard Overview**: Real-time metrics and analytics for content performance
- **Kanban Board**: Drag-and-drop workflow management for content phases
- **Content Pillars**: Organized content categories (Educational, Product Demos, Success Stories, Support, Marketing)
- **Workflow Management**: 6-phase content pipeline (Idea → Script → Recording → Editing → Review → Published)
- **Team Collaboration**: Assign content to team members and track progress
- **Due Date Management**: Track deadlines with overdue alerts and reminders

### Advanced Features
- **Real-time Notifications**: Email alerts for phase changes, due dates, and overdue content
- **Data Export/Import**: CSV export and import functionality
- **Audit Trail**: Complete history of all content changes
- **Caching System**: Performance optimization with intelligent caching
- **Responsive Design**: Mobile-friendly interface with modern UI
- **Search & Filtering**: Advanced filtering by pillar, phase, assignee, and title

## 🏗️ Architecture

### Technology Stack
- **Backend**: Google Apps Script (GAS)
- **Database**: Google Sheets
- **Frontend**: HTML5, CSS3, JavaScript, Tailwind CSS, Bootstrap 5
- **Libraries**: SortableJS (drag-and-drop), Chart.js (analytics)
- **Version Control**: clasp (Command Line Apps Script Projects)

### Project Structure
```
youtube-content-manager/
├── src/
│   ├── library/                 # Shared reusable library
│   │   ├── appsscript.json     # Library configuration
│   │   ├── workflow.gs         # Workflow logic and phase management
│   │   ├── dashboard.gs        # Dashboard metrics and analytics
│   │   ├── kanban.gs          # Kanban board rendering and drag-drop
│   │   ├── contentPillars.gs  # Content pillar definitions and management
│   │   └── emailNotifications.gs # Email notification system
│   └── sheet/                  # Google Sheets operations
│       ├── appsscript.json    # Sheet configuration with library dependency
│       ├── index.html         # Main web portal interface
│       ├── sheetConfig.gs     # Sheet structure and metadata
│       ├── sheetService.gs    # CRUD operations on sheet data
│       └── sheetUtils.gs      # Utilities, caching, and performance optimization
└── README.md
```

## 📊 Database Design

### ContentAssets Sheet
| Column | Type | Description |
|--------|------|-------------|
| ID | String | Unique identifier for content |
| Title | String | Content title |
| Pillar | Dropdown | Educational Tutorials, Product Demos, etc. |
| WorkflowPhase | Dropdown | Idea, Script, Recording, Editing, Review, Published |
| AssignedTo | String | Team member responsible |
| DueDate | Date | Planned publishing date |
| Assets | String | Linked resources (Drive URLs) |
| Notes | Text | Internal comments |
| PublishedURL | String | YouTube URL after publishing |
| CreatedAt | Date | Auto-populated creation date |
| UpdatedAt | Date | Auto-populated last update date |

### Configurations Sheet
| Column | Type | Description |
|--------|------|-------------|
| ConfigKey | String | Configuration setting name |
| ConfigValue | String | Configuration value |
| Description | String | Setting description |
| UpdatedAt | Date | Last update timestamp |

### Activity_Audit Sheet
| Column | Type | Description |
|--------|------|-------------|
| audit_id | String | Unique audit identifier |
| entity_type | String | Type of entity (ContentAssets) |
| entity_id | String | ID of the modified entity |
| action | String | Action performed (CREATE, UPDATE, DELETE) |
| user_id | String | User who performed the action |
| timestamp | Date | When the action occurred |
| notes | String | Additional notes |

## 🚀 Quick Start

### Prerequisites
- Google account with access to Google Apps Script
- Google Sheets for data storage
- clasp CLI tool (optional, for version control)

### Installation

1. **Create a new Google Apps Script project**
   - Go to [script.google.com](https://script.google.com)
   - Create a new project

2. **Set up the Library**
   - Create a new script file for the library
   - Copy the contents from `src/library/` files
   - Deploy as a library and note the library ID

3. **Set up the Sheet Project**
   - Create another Google Apps Script project
   - Copy the contents from `src/sheet/` files
   - Update the library ID in `appsscript.json`
   - Deploy as a web app

4. **Initialize the Sheets**
   - Open the web app
   - Click "Initialize Sheets" to set up the database structure

### Configuration

1. **Update Library ID**
   - In `src/sheet/appsscript.json`, replace `YOUR_LIBRARY_ID_HERE` with your actual library ID

2. **Configure Notifications**
   - Update team email addresses in the email notification settings
   - Configure notification preferences in the Configurations sheet

3. **Set Permissions**
   - Ensure the web app has appropriate permissions for Sheets, Drive, and Gmail

## 📱 Usage

### Dashboard
- View real-time metrics and analytics
- Monitor content performance across pillars
- Track completion rates and productivity

### Kanban Board
- Drag and drop content between workflow phases
- Visual representation of content pipeline
- Filter by pillar, phase, or assignee

### Content Management
- Add new content with detailed metadata
- Edit existing content and update phases
- Track due dates and assignments
- Manage assets and notes

### Notifications
- Automatic email alerts for phase changes
- Due date reminders
- Overdue content alerts
- Weekly summary reports

## 🔧 API Reference

### Core Functions

#### Content Management
```javascript
// Get all content assets
getContentAssets()

// Get content by ID
getContentAssetById(contentId)

// Create new content
createContentAsset(assetData)

// Update content
updateContentAsset(contentId, updateData)

// Delete content
deleteContentAsset(contentId)

// Search content
searchContentAssets(searchCriteria)
```

#### Dashboard & Analytics
```javascript
// Get dashboard metrics
getDashboardMetrics()

// Get content statistics
getContentStatistics()

// Get Kanban data
getKanbanData(spreadsheetId, pillar)
```

#### Workflow Management
```javascript
// Move to next phase
moveToNextPhase(spreadsheetId, contentId)

// Move to previous phase
moveToPreviousPhase(spreadsheetId, contentId)

// Get workflow statistics
getWorkflowStats(spreadsheetId)
```

#### Notifications
```javascript
// Send phase change notification
sendPhaseChangeNotification(spreadsheetId, contentId, oldPhase, newPhase, assignedTo)

// Send due date reminder
sendDueDateReminder(spreadsheetId, contentId, assignedTo, daysUntilDue)

// Send overdue alert
sendOverdueAlert(spreadsheetId, contentId, assignedTo)

// Send published notification
sendPublishedNotification(spreadsheetId, contentId, publishedUrl)
```

## 🎨 Content Pillars

### Educational Tutorials
- **Focus**: Step-by-step demos of automations
- **Target Audience**: Technical users, developers, automation enthusiasts
- **Content Types**: Tutorial, How-to, Technical Guide, Best Practices
- **Duration**: 5-15 minutes

### Product Demos
- **Focus**: Showcasing automation products and SMB use cases
- **Target Audience**: SMB owners, decision makers, potential customers
- **Content Types**: Product Demo, Use Case, Feature Showcase, Comparison
- **Duration**: 3-10 minutes

### Customer Success Stories
- **Focus**: Case studies on workflow improvements and business impact
- **Target Audience**: Prospects, existing customers, industry peers
- **Content Types**: Case Study, Success Story, Testimonial, ROI Analysis
- **Duration**: 4-12 minutes

### Support Library
- **Focus**: FAQs, troubleshooting, setup guides, and support content
- **Target Audience**: Existing customers, support team, end users
- **Content Types**: FAQ, Troubleshooting, Setup Guide, Help
- **Duration**: 2-8 minutes

### Marketing & Updates
- **Focus**: New gig announcements, promotions, feature releases
- **Target Audience**: All users, subscribers, potential customers
- **Content Types**: Announcement, Promotion, Update, News
- **Duration**: 1-5 minutes

## 🔄 Workflow Phases

1. **Idea** - Initial concept and planning
2. **Script** - Content script development
3. **Recording** - Video recording phase
4. **Editing** - Post-production and editing
5. **Review** - Quality review and approval
6. **Published** - Live on YouTube platform

## ⚡ Performance Optimizations

### Caching System
- Intelligent caching for frequently accessed data
- Configurable cache TTL (Time To Live)
- Automatic cache invalidation on updates
- Memory-efficient cache management

### Batch Operations
- Batch updates for multiple content items
- Reduced API calls and improved performance
- Transaction-like operations for data consistency

### Error Handling
- Comprehensive error handling and logging
- User-friendly error messages
- Graceful degradation on failures
- Audit trail for troubleshooting

## 🛡️ Security & Best Practices

### Data Validation
- Input validation for all user inputs
- Data type checking and format validation
- SQL injection prevention
- XSS protection

### Access Control
- User-based permissions
- Audit logging for all actions
- Secure data transmission
- Regular security updates

### Backup & Recovery
- Automatic data backup
- Version control integration
- Disaster recovery procedures
- Data export capabilities

## 📈 Monitoring & Analytics

### Key Metrics
- Content completion rate
- Average time to publish
- Pillar performance analysis
- Team productivity metrics
- Overdue content tracking

### Reporting
- Weekly summary reports
- Custom date range reports
- Export to CSV/Excel
- Visual analytics dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

## 🔮 Roadmap

### Upcoming Features
- YouTube API integration
- Advanced analytics and reporting
- Team collaboration tools
- Mobile app
- Advanced automation workflows
- Integration with other platforms

### Version History
- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added caching and performance optimizations
- **v1.2.0** - Enhanced UI and user experience
- **v1.3.0** - Advanced filtering and search capabilities

---

**Built with ❤️ for YouTube creators and content teams**