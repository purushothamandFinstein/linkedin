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

// Express Server
class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.contentService = new LinkedInContentService();
    this.setupRoutes();
    this.setupCronJob();
  }

  // API Routes
  setupRoutes() {
    this.app.get('/', (req, res) => res.send('LinkedIn Content Generator Service'));
    this.app.use((err, req, res, next) => {
      logger.error(`Unhandled error: ${err.message}`);
      res.status(500).send('Internal Server Error');
    });
  }

  // Cron Job - Runs every 5 hours
  setupCronJob() {
    cron.schedule('0 */5 * * *', () => this.contentService.runContentWorkflow());
  }
  
  // Start the Server
  start() {
    this.app.listen(this.port, () => logger.info(`Server running at http://localhost:${this.port}`));
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
