require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const { createLogger, format, transports } = require('winston');

// Logger Setup
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' }),
  ],
});

// Validate Environment Variables
const REQUIRED_ENV_VARS = ['GEMINI_API_KEY', 'LINKEDIN_PERSON_ID', 'LINKEDIN_ACCESS_TOKEN', 'PORT'];
REQUIRED_ENV_VARS.forEach((variable) => {
  if (!process.env[variable]) {
    logger.error(`Missing required environment variable: ${variable}`);
    process.exit(1);
  }
});

// LinkedIn Content Generator
class LinkedInContentService {
  constructor() {
    this.geminiApiKey = process.env.GEMINI_API_KEY;
    this.linkedinPersonId = process.env.LINKEDIN_PERSON_ID;
    this.linkedinAccessToken = process.env.LINKEDIN_ACCESS_TOKEN;
  }

  // Generate AI-based content
  async generateContent() {
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${this.geminiApiKey}`;
    const prompt = this.createContentPrompt();
    const payload = { contents: [{ parts: [{ text: prompt }] }] };

    try {
      const response = await axios.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
      return this.processGeneratedContent(response);
    } catch (error) {
      logger.error(`Gemini API error: ${error.message}`);
      return null;
    }
  }

  // Structured prompt for AI
  createContentPrompt() {
    return `Create an engaging LinkedIn post about the latest AI developments:
    - Use professional and insightful language
    - Include a compelling title
    - Write in a LinkedIn post format
    - Use emojis for readability
    - Add a call to action for engagement
    - Avoid markdown or formatting symbols`;
  }

  // Process Gemini API Response
  processGeneratedContent(response) {
    if (response.status !== 200 || !response.data || !response.data.candidates?.length) {
      logger.warn(`Invalid Gemini response: ${JSON.stringify(response.data)}`);
      return null;
    }

    try {
      return response.data.candidates[0].content.parts[0].text.replace(/\*\*/g, ''); // Clean markdown
    } catch (error) {
      logger.error(`Content parsing error: ${error.message}`);
      return null;
    }
  }

  // Post Content to LinkedIn
  async postToLinkedIn(content) {
    if (!content) {
      logger.warn('No content to post to LinkedIn.');
      return;
    }

    const postData = {
      author: `urn:li:person:${this.linkedinPersonId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'NONE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    };

    try {
      const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', postData, {
        headers: {
          Authorization: `Bearer ${this.linkedinAccessToken}`,
          'Content-Type': 'application/json',
        },
      });

      logger.info(`LinkedIn Post Success: ${JSON.stringify(response.data)}`);
    } catch (error) {
      logger.error(`LinkedIn API Error: ${error.message}`);
    }
  }

  // Run Content Workflow
  async runContentWorkflow() {
    logger.info('Starting content generation and posting workflow...');
    const content = await this.generateContent();
    if (content) await this.postToLinkedIn(content);
  }
}

// Keep-Alive Service for free hosting platforms
class KeepAliveService {
  constructor(port) {
    this.serverUrl = process.env.SERVER_URL || `http://localhost:${port}`;
    this.isEnabled = process.env.KEEP_ALIVE_ENABLED !== 'false'; // Default to true
  }

  // Self-ping to prevent server sleep
  async pingServer() {
    if (!this.isEnabled) return;

    try {
      const response = await axios.get(`${this.serverUrl}/health`, { timeout: 10000 });
      logger.info(`Keep-alive ping successful: ${response.status}`);
    } catch (error) {
      logger.warn(`Keep-alive ping failed: ${error.message}`);
    }
  }

  // Setup keep-alive job
  startKeepAlive() {
    if (!this.isEnabled) {
      logger.info('Keep-alive service disabled');
      return;
    }

    // Ping every 8 minutes to prevent 10-minute timeout
    cron.schedule('*/8 * * * *', () => {
      this.pingServer();
    });

    logger.info('Keep-alive service started - pinging every 8 minutes');
  }
}

// Express Server
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.contentService = new LinkedInContentService();
    this.keepAliveService = new KeepAliveService(this.port);
    this.startTime = new Date();
    this.setupRoutes();
    this.setupCronJob();
    this.setupKeepAlive();
  }

  // API Routes
  setupRoutes() {
    // Main route
    this.app.get('/', (req, res) => {
      const uptime = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
      res.json({
        service: 'LinkedIn Content Generator Service',
        status: 'running',
        uptime: `${uptime} seconds`,
        started: this.startTime.toISOString(),
        keepAlive: this.keepAliveService.isEnabled
      });
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000)
      });
    });

    // Status endpoint with detailed info
    this.app.get('/status', (req, res) => {
      res.json({
        service: 'LinkedIn Auto Poster',
        status: 'active',
        uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
        nextPost: 'Every 5 hours',
        keepAliveEnabled: this.keepAliveService.isEnabled,
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Manual trigger endpoint (for testing)
    this.app.post('/trigger-post', async (req, res) => {
      try {
        logger.info('Manual post trigger requested');
        await this.contentService.runContentWorkflow();
        res.json({ message: 'Content workflow triggered successfully' });
      } catch (error) {
        logger.error(`Manual trigger error: ${error.message}`);
        res.status(500).json({ error: 'Failed to trigger content workflow' });
      }
    });

    // Error handler
    this.app.use((err, req, res, next) => {
      logger.error(`Unhandled error: ${err.message}`);
      res.status(500).json({ error: 'Internal Server Error' });
    });
  }

  // Cron Job - Runs every 5 hours
  setupCronJob() {
    cron.schedule('0 */5 * * *', () => this.contentService.runContentWorkflow());
    logger.info('Content posting scheduled every 5 hours');
  }

  // Setup keep-alive service
  setupKeepAlive() {
    this.keepAliveService.startKeepAlive();
  }
  
  // Start the Server
  start() {
    this.app.listen(this.port, () => {
      logger.info(`Server running at http://localhost:${this.port}`);
      logger.info(`Keep-alive enabled: ${this.keepAliveService.isEnabled}`);
      
      // Initial ping after 2 minutes to ensure service is ready
      setTimeout(() => {
        this.keepAliveService.pingServer();
      }, 120000);
    });
  }
}

// Application Entry Point
function main() {
  try {
    const server = new Server();
    server.start();
  } catch (error) {
    logger.error(`Startup error: ${error.message}`);
    process.exit(1);
  }
}

main();
