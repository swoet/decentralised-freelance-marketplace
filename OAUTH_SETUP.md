# OAuth Integration Setup Guide

This guide explains how to set up OAuth integrations for Slack and Jira in the Decentralized Freelance Marketplace.

## Prerequisites

- A running instance of the marketplace backend
- Admin access to Slack workspace and/or Atlassian account
- Environment variables configured in your `.env` file

## Slack Integration Setup

### 1. Create a Slack App

1. Go to https://api.slack.com/apps
2. Click "Create New App" → "From scratch"
3. Enter your app name (e.g., "Freelance Marketplace")
4. Select your development workspace
5. Click "Create App"

### 2. Configure OAuth & Permissions

1. In your app dashboard, go to "OAuth & Permissions"
2. Under "Redirect URLs", add:
   ```
   http://localhost:8000/api/v1/integrations/slack/callback
   ```
3. Under "Scopes" → "User Token Scopes", add:
   - `channels:read` - View basic information about public channels
   - `chat:write` - Send messages as the user
   - `users:read` - View people in the workspace
   - `users:read.email` - View email addresses of people in the workspace

### 3. Get Credentials

1. In "Basic Information", find "App Credentials"
2. Copy the "Client ID" and "Client Secret"
3. Add them to your `.env` file:
   ```
   SLACK_CLIENT_ID=your_actual_client_id_here
   SLACK_CLIENT_SECRET=your_actual_client_secret_here
   ```

## Jira Integration Setup

### 1. Create an Atlassian OAuth App

1. Go to https://developer.atlassian.com/console/myapps/
2. Click "Create" → "OAuth 2.0 integration"
3. Enter your app name (e.g., "Freelance Marketplace")
4. Click "Create"

### 2. Configure Authorization

1. Click on your app, then go to "Authorization"
2. Under "OAuth 2.0 (3LO)", click "Configure"
3. Add callback URL:
   ```
   http://localhost:8000/api/v1/integrations/jira/callback
   ```

### 3. Set Permissions

1. Go to "Permissions"
2. Add the Jira API and configure these scopes:
   - `read:jira-work` - Read project data and issues
   - `write:jira-work` - Create and update issues
   - `read:jira-user` - Read user information
   - `offline_access` - Maintain access when user is offline

### 4. Get Credentials

1. In your app dashboard, find "Settings"
2. Copy the "Client ID" and "Client Secret"
3. Add them to your `.env` file:
   ```
   JIRA_CLIENT_ID=your_actual_client_id_here
   JIRA_CLIENT_SECRET=your_actual_client_secret_here
   ```

## Environment Variables

Make sure your `.env` file contains all required variables:

```bash
# OAuth Integration Credentials
OAUTH_ENABLED=true

# Slack OAuth
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_REDIRECT_URI=http://localhost:8000/api/v1/integrations/slack/callback

# Jira OAuth (Atlassian)
JIRA_CLIENT_ID=your_jira_client_id
JIRA_CLIENT_SECRET=your_jira_client_secret
JIRA_REDIRECT_URI=http://localhost:8000/api/v1/integrations/jira/callback

# Frontend URL for OAuth redirects
FRONTEND_BASE_URL=http://localhost:3000
```

## Testing the Integration

1. Start your backend server
2. Go to http://localhost:3000/integrations
3. Click "Connect" on either Slack or Jira
4. Complete the OAuth flow in the popup/redirect
5. You should be redirected back with a successful connection

## Functionality Provided

### Slack Integration
- **Team Communication**: Send project notifications to Slack channels
- **Status Updates**: Automatically notify team members of project milestones
- **User Authentication**: Verify user identity through Slack workspace membership

### Jira Integration
- **Issue Tracking**: Create Jira issues from project tasks
- **Progress Sync**: Update issue status based on project progress
- **Resource Access**: View accessible Jira sites and projects
- **Task Management**: Bidirectional sync between marketplace tasks and Jira issues

## Security Notes

1. **Environment Variables**: Never commit actual credentials to version control
2. **HTTPS**: Use HTTPS in production for all OAuth redirects
3. **Scope Limitation**: Only request the minimum scopes necessary
4. **Token Storage**: Tokens are stored encrypted in the database
5. **Revocation**: Users can disconnect integrations at any time

## Troubleshooting

### Common Issues

1. **"OAuth not configured" error**: Check that all required environment variables are set
2. **Redirect URI mismatch**: Ensure the callback URL in your app matches the backend configuration
3. **Scope errors**: Verify that your app has the correct permissions configured
4. **Network errors**: Check that your backend is accessible at the configured URLs

### Debug Steps

1. Check backend logs for detailed error messages
2. Verify environment variables are loaded correctly
3. Test OAuth URLs manually in browser
4. Check app configuration in Slack/Atlassian developer consoles

## Production Deployment

When deploying to production:

1. Update redirect URLs to use your production domain
2. Use HTTPS for all OAuth endpoints
3. Set appropriate CORS origins
4. Use secure environment variable management
5. Consider implementing webhook endpoints for real-time updates

## API Usage

Once connected, the integrations provide these API capabilities:

### Slack API Access
```python
# Send message to Slack channel
POST /api/v1/integrations/slack/message
{
  "channel": "#general",
  "text": "Project milestone completed!"
}
```

### Jira API Access
```python
# Create Jira issue
POST /api/v1/integrations/jira/issue
{
  "project_key": "PROJ",
  "summary": "New task from marketplace",
  "description": "Task details..."
}
```

For detailed API documentation, see the OpenAPI docs at `/docs` when running the backend server.
