# OAuth Integration Setup Guide

## Overview
This guide explains how to set up OAuth integrations (GitHub, Slack, Jira) for your **multi-user platform**. 

**Important**: You create ONE OAuth app per service, and ALL users will connect through it.

## How It Works

### For Platform Owners (You)
1. Create OAuth apps on each platform (GitHub, Slack, Jira)
2. Set the credentials in backend `.env` file
3. Deploy with these credentials
4. **Same credentials work for ALL users**

### For End Users
1. User visits `/integrations` page
2. Clicks "Connect GitHub" (or Slack/Jira)
3. Redirected to authorize **your platform's app**
4. **Their personal access token** is stored in database
5. Each user has their own separate connection

## Step-by-Step Setup

### 1. GitHub OAuth App

#### Create App
1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `CraftNexus` (or your platform name)
   - **Homepage URL**: 
     - Dev: `http://localhost:3000`
     - Prod: `https://yourdomain.com`
   - **Authorization callback URL**:
     - Dev: `http://localhost:8000/api/v1/integrations/github/callback`
     - Prod: `https://api.yourdomain.com/api/v1/integrations/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

#### Add to .env
```bash
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/integrations/github/callback
```

### 2. Slack OAuth App

#### Create App
1. Go to: https://api.slack.com/apps
2. Click **"Create New App"** → **"From scratch"**
3. Enter app name: `CraftNexus` and select a workspace
4. Go to **"OAuth & Permissions"** in sidebar
5. Under **"Redirect URLs"**, add:
   - Dev: `http://localhost:8000/api/v1/integrations/slack/callback`
   - Prod: `https://api.yourdomain.com/api/v1/integrations/slack/callback`
6. Under **"Scopes"** → **"User Token Scopes"**, add:
   - `channels:read`
   - `chat:write`
   - `users:read`
   - `users:read.email`
7. Go to **"Basic Information"**
8. Copy **Client ID** and **Client Secret**

#### Add to .env
```bash
SLACK_CLIENT_ID=1234567890.1234567890123
SLACK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
SLACK_REDIRECT_URI=http://localhost:8000/api/v1/integrations/slack/callback
```

### 3. Jira OAuth App

#### Create App
1. Go to: https://developer.atlassian.com/console/myapps/
2. Click **"Create"** → **"OAuth 2.0 integration"**
3. Enter app name: `CraftNexus`
4. Go to **"Permissions"** tab
5. Click **"Add"** for Jira API and select:
   - `read:jira-work`
   - `write:jira-work`
   - `read:jira-user`
6. Go to **"Authorization"** tab
7. Under **"OAuth 2.0 (3LO)"**, add callback URL:
   - Dev: `http://localhost:8000/api/v1/integrations/jira/callback`
   - Prod: `https://api.yourdomain.com/api/v1/integrations/jira/callback`
8. Go to **"Settings"** tab
9. Copy **Client ID** and **Secret**

#### Add to .env
```bash
JIRA_CLIENT_ID=abc123def456ghi789
JIRA_CLIENT_SECRET=ABCdef123456789xyz
JIRA_REDIRECT_URI=http://localhost:8000/api/v1/integrations/jira/callback
```

### 4. Frontend URL

```bash
# Where to redirect users after OAuth authorization
FRONTEND_BASE_URL=http://localhost:3000  # Dev
# FRONTEND_BASE_URL=https://yourdomain.com  # Production
```

## Complete .env Example

```bash
# OAuth Integration Configuration
GITHUB_CLIENT_ID=Iv1.abc123def456
GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678
GITHUB_REDIRECT_URI=http://localhost:8000/api/v1/integrations/github/callback

SLACK_CLIENT_ID=1234567890.1234567890123
SLACK_CLIENT_SECRET=abcdef1234567890abcdef1234567890
SLACK_REDIRECT_URI=http://localhost:8000/api/v1/integrations/slack/callback

JIRA_CLIENT_ID=abc123def456ghi789
JIRA_CLIENT_SECRET=ABCdef123456789xyz
JIRA_REDIRECT_URI=http://localhost:8000/api/v1/integrations/jira/callback

FRONTEND_BASE_URL=http://localhost:3000
```

## Testing

1. Start backend: `uvicorn app.main:app --reload`
2. Start frontend: `npm run dev`
3. Login to your platform
4. Navigate to: http://localhost:3000/integrations
5. Click "Connect GitHub" (or Slack/Jira)
6. Authorize the app
7. You should be redirected back to `/integrations` with connection shown

## Production Deployment

### Update Callback URLs
When deploying to production, **update callback URLs** in:
1. GitHub OAuth app settings
2. Slack app settings  
3. Jira app settings

### Update .env
```bash
GITHUB_REDIRECT_URI=https://api.yourdomain.com/api/v1/integrations/github/callback
SLACK_REDIRECT_URI=https://api.yourdomain.com/api/v1/integrations/slack/callback
JIRA_REDIRECT_URI=https://api.yourdomain.com/api/v1/integrations/jira/callback
FRONTEND_BASE_URL=https://yourdomain.com
```

### Security Notes
- ✅ **DO**: Keep client secrets in `.env` (never commit to git)
- ✅ **DO**: Use HTTPS in production
- ✅ **DO**: Set up proper CORS origins
- ❌ **DON'T**: Expose client secrets in frontend code
- ❌ **DON'T**: Commit `.env` file to version control

## How User Connections Work

```
User Alice visits /integrations
  ↓
Clicks "Connect GitHub"
  ↓
Backend generates signed state with Alice's user_id
  ↓
Alice redirected to GitHub authorization page
  ↓
Alice authorizes "CraftNexus" app to access her GitHub
  ↓
GitHub redirects back to callback URL with code
  ↓
Backend exchanges code for Alice's access token
  ↓
Alice's token stored in database:
  Integration(owner_id=alice_user_id, provider="github", config_json={access_token: alice_token})
  ↓
Alice redirected back to /integrations (now shows "Connected")
```

User Bob follows the same flow and gets HIS OWN token stored separately!

## Database Schema

Each user's integration is stored in the `integrations` table:

```sql
Integration {
  id: UUID
  owner_id: UUID            -- Different for each user
  provider: "github"        -- or "slack", "jira"
  status: "connected"
  config_json: {
    access_token: "..."     -- User's personal token
    github_user: {...}      -- User's GitHub profile
  }
  created_at: timestamp
  updated_at: timestamp
}
```

## Troubleshooting

### "OAuth not configured" error
- Make sure environment variables are set in `.env`
- Restart the backend after adding env vars

### Callback URL mismatch
- Ensure callback URLs in OAuth app settings match exactly
- Include protocol (`http://` or `https://`)
- Include port for local dev (`:8000`)

### Users can't connect
- Check OAuth app is not in development/sandbox mode
- Verify scopes/permissions are granted
- Check backend logs for specific error messages

## Questions?

This setup allows:
- ✅ Unlimited users to connect their accounts
- ✅ Each user has their own separate connection
- ✅ Platform owner manages one set of OAuth apps
- ✅ Works in both development and production
- ✅ Tokens stored securely in database per user
