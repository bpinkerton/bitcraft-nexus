/**
 * Discord Bot Deployment Monitoring
 * 
 * Monitors the health and performance of the Discord bot deployment.
 */

import { logger } from '@bitcraft/shared';

interface BotHealthMetrics {
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: Date;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  commandsExecuted: number;
  errors: number;
  lastHeartbeat: Date;
}

class DiscordBotMonitor {
  private metrics: BotHealthMetrics[] = [];
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;
  private commandCount = 0;
  private errorCount = 0;

  start() {
    if (this.isMonitoring) {
      logger.warn('Discord bot monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting Discord bot monitoring...');

    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  stop() {
    if (!this.isMonitoring) {
      logger.warn('Discord bot monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Discord bot monitoring stopped');
  }

  private async collectMetrics() {
    try {
      const metrics: BotHealthMetrics = {
        status: 'connected', // This would be determined by actual bot state
        timestamp: new Date(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000, // seconds
        commandsExecuted: this.commandCount,
        errors: this.errorCount,
        lastHeartbeat: new Date(),
      };

      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      logger.debug('Discord bot metrics collected:', metrics);
    } catch (error) {
      logger.error('Failed to collect Discord bot metrics:', error);
    }
  }

  incrementCommandCount() {
    this.commandCount++;
  }

  incrementErrorCount() {
    this.errorCount++;
  }

  getHealthStatus(): BotHealthMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(): BotHealthMetrics[] {
    return [...this.metrics];
  }

  isHealthy(): boolean {
    const latest = this.getHealthStatus();
    return latest ? latest.status === 'connected' : false;
  }
}

// Export singleton instance
export const discordBotMonitor = new DiscordBotMonitor();

// Auto-start monitoring in production
//if (process.env.NODE_ENV === 'production') {
  //discordBotMonitor.start();
//}

export default discordBotMonitor;
