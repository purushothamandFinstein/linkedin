#!/usr/bin/env node

/**
 * External Keep-Alive Monitor for LinkedIn Auto Poster
 * 
 * This script can be run from anywhere to keep your app alive.
 * Useful as a backup solution or when running from external services.
 * 
 * Usage:
 *   node external-monitor.js <YOUR_APP_URL>
 * 
 * Example:
 *   node external-monitor.js https://your-app.herokuapp.com
 */

const axios = require('axios');

class ExternalMonitor {
  constructor(appUrl) {
    this.appUrl = appUrl;
    this.pingInterval = 8 * 60 * 1000; // 8 minutes in milliseconds
    this.retryCount = 3;
    this.isRunning = false;
  }

  async pingApp() {
    console.log(`[${new Date().toISOString()}] Pinging ${this.appUrl}/health`);
    
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        const response = await axios.get(`${this.appUrl}/health`, {
          timeout: 15000,
          headers: {
            'User-Agent': 'External-Keep-Alive-Monitor/1.0'
          }
        });

        if (response.status === 200) {
          console.log(`✅ Ping successful (attempt ${attempt}): Status ${response.status}`);
          if (response.data && response.data.uptime) {
            console.log(`   App uptime: ${response.data.uptime} seconds`);
          }
          return true;
        }
      } catch (error) {
        console.log(`❌ Ping failed (attempt ${attempt}): ${error.message}`);
        
        if (attempt < this.retryCount) {
          console.log(`   Retrying in 30 seconds...`);
          await this.sleep(30000);
        }
      }
    }
    
    console.log(`🚨 All ping attempts failed for ${this.appUrl}`);
    return false;
  }

  async getStatus() {
    try {
      const response = await axios.get(`${this.appUrl}/status`, { timeout: 10000 });
      console.log('📊 App Status:', response.data);
    } catch (error) {
      console.log('⚠️  Could not fetch detailed status:', error.message);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    if (this.isRunning) {
      console.log('Monitor is already running');
      return;
    }

    console.log(`🚀 Starting external monitor for ${this.appUrl}`);
    console.log(`📅 Will ping every ${this.pingInterval / 60000} minutes`);
    console.log(`🔄 Retry attempts per ping: ${this.retryCount}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    this.isRunning = true;

    // Initial status check
    this.getStatus();

    // Start the monitoring loop
    const pingLoop = async () => {
      if (!this.isRunning) return;

      await this.pingApp();
      
      // Schedule next ping
      setTimeout(pingLoop, this.pingInterval);
    };

    // Start first ping after 1 minute
    setTimeout(pingLoop, 60000);
    
    console.log('✅ External monitor started successfully');
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 External monitor stopped');
  }
}

// Main execution
function main() {
  const appUrl = process.argv[2];

  if (!appUrl) {
    console.log('❌ Error: Please provide your app URL');
    console.log('Usage: node external-monitor.js <YOUR_APP_URL>');
    console.log('Example: node external-monitor.js https://your-app.herokuapp.com');
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(appUrl);
  } catch (error) {
    console.log('❌ Error: Invalid URL format');
    console.log('Please provide a valid URL like: https://your-app.herokuapp.com');
    process.exit(1);
  }

  const monitor = new ExternalMonitor(appUrl);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    monitor.stop();
    process.exit(0);
  });

  // Start monitoring
  monitor.start();
}

if (require.main === module) {
  main();
}

module.exports = ExternalMonitor;