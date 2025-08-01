# Automated LinkedIn Posting System

This Node.js application automatically generates and posts content to LinkedIn using Google's Gemini AI for content generation and includes keep-alive functionality for free hosting platforms.

## Prerequisites

- Node.js (v14 or higher)
- LinkedIn account with API access
- Google Cloud account with Gemini API access

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your credentials:
     - LinkedIn Person ID and Access Token
     - Gemini API key
     - Server URL (for keep-alive functionality)
     - Desired port number (default: 3000)

## Running the Application

Start the server:
```bash
node index.js
```

The application will:
- Start an Express server
- Schedule automated posts every 5 hours
- Generate content using Gemini AI
- Post the content to LinkedIn automatically
- Keep itself alive on free hosting platforms

## Free Hosting Platform Support

### 🚀 **Keep-Alive Feature**
This application includes built-in keep-alive functionality to prevent sleeping on free hosting platforms like:
- Heroku (free tier)
- Railway
- Render (free tier)
- Glitch
- Cyclic
- Koyeb

### **How Keep-Alive Works:**
- Automatically pings itself every 8 minutes
- Prevents the 10-minute idle timeout common on free hosting
- Can be enabled/disabled via environment variables
- Logs all ping attempts for monitoring

### **Environment Configuration:**
```bash
# Enable keep-alive (default: true)
KEEP_ALIVE_ENABLED=true

# Your app's public URL
SERVER_URL=https://your-app-name.herokuapp.com
```

### **Deployment Examples:**

#### Heroku:
```bash
# Set your app URL
heroku config:set SERVER_URL=https://your-app-name.herokuapp.com

# Keep-alive is enabled by default
heroku config:set KEEP_ALIVE_ENABLED=true
```

#### Railway:
```bash
# Set environment variables in Railway dashboard
SERVER_URL=https://your-app-name.up.railway.app
KEEP_ALIVE_ENABLED=true
```

#### Render:
```bash
# Set in Render dashboard
SERVER_URL=https://your-app-name.onrender.com
KEEP_ALIVE_ENABLED=true
```

## Features

- ✅ Automated content generation using Google's Gemini AI
- ✅ Scheduled LinkedIn posts using node-cron (every 5 hours)
- ✅ Keep-alive functionality for free hosting platforms
- ✅ Comprehensive logging with Winston
- ✅ Health check endpoints
- ✅ Manual post triggering
- ✅ Environment variable configuration
- ✅ Error handling and recovery

## API Endpoints

- `GET /`: Service status and uptime information
- `GET /health`: Health check endpoint (used for keep-alive)
- `GET /status`: Detailed service status
- `POST /trigger-post`: Manually trigger a LinkedIn post

## Security Notes

- Never commit your `.env` file
- Keep your credentials secure
- Use environment variables for all sensitive data
- Consider using LinkedIn's official API rate limits
- Monitor your application logs regularly

## Error Handling

The application includes comprehensive error handling for:
- Content generation failures
- LinkedIn API issues
- Keep-alive ping failures
- Server errors and recovery

## Monitoring

### Logs Location:
- Console output (real-time)
- `app.log` file (persistent)

### Log Types:
- ✅ **Info**: Successful operations
- ⚠️ **Warn**: Non-critical issues (failed pings, etc.)
- ❌ **Error**: Critical failures

### Keep-Alive Monitoring:
```bash
# Check if keep-alive is working
curl https://your-app-name.herokuapp.com/health

# Check detailed status
curl https://your-app-name.herokuapp.com/status
```

## Troubleshooting

### App Still Going to Sleep?
1. Verify `SERVER_URL` is correct
2. Check if `KEEP_ALIVE_ENABLED=true`
3. Monitor logs for ping failures
4. Ensure your hosting platform allows self-requests

### Alternative Solutions:
1. **External Monitoring Services:**
   - UptimeRobot (free tier)
   - Pingdom
   - StatusCake

2. **Paid Hosting Options:**
   - Set `KEEP_ALIVE_ENABLED=false`
   - Use always-on hosting services

### Common Issues:
- **Ping failures**: Check firewall/security settings
- **Still sleeping**: Verify cron job is running
- **High resource usage**: Disable keep-alive on paid hosting

## Performance Optimization

- Keep-alive pings every 8 minutes (configurable)
- Minimal resource usage
- Efficient error handling
- Automatic recovery mechanisms 