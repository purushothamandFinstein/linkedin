# Automated LinkedIn Posting System

This Node.js application automatically generates and posts content to LinkedIn using Google's Gemini AI for content generation and Selenium for browser automation.

## Prerequisites

- Node.js (v14 or higher)
- Chrome browser
- ChromeDriver (matching your Chrome version)
- LinkedIn account
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
     - LinkedIn email and password
     - Gemini API key
     - Desired port number (default: 3000)

4. Install ChromeDriver:
   ```bash
   # For Ubuntu/Debian
   sudo apt-get install chromium-chromedriver
   ```

## Running the Application

Start the server:
```bash
node index.js
```

The application will:
- Start an Express server
- Schedule automated posts every hour
- Generate content using Gemini AI
- Post the content to LinkedIn automatically

## Features

- Automated content generation using Google's Gemini AI
- Scheduled LinkedIn posts using node-cron
- Browser automation with Selenium WebDriver
- Environment variable configuration
- Basic health check endpoint

## Security Notes

- Never commit your `.env` file
- Keep your credentials secure
- Consider using LinkedIn's official API for production use
- Implement rate limiting for API calls

## Error Handling

The application includes basic error handling for:
- Content generation failures
- LinkedIn automation issues
- Server errors

## Endpoints

- `GET /health`: Check server status 