/**
 * Web Application Deployment Monitoring
 * 
 * Monitors the health and performance of the web application deployment.
 */

import { logger } from '@bitcraft/shared';

interface HealthMetrics {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  uptime: number;
  errors: number;
}

class WebAppMonitor {
  private metrics: HealthMetrics[] = [];
  private isMonitoring = false;
  private intervalId: NodeJS.Timeout | null = null;

  start() {
    if (this.isMonitoring) {
      logger.warn('Web app monitoring is already running');
      return;
    }

    this.isMonitoring = true;
    logger.info('Starting web app monitoring...');

    this.intervalId = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Collect metrics every 30 seconds
  }

  stop() {
    if (!this.isMonitoring) {
      logger.warn('Web app monitoring is not running');
      return;
    }

    this.isMonitoring = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    logger.info('Web app monitoring stopped');
  }

  private async collectMetrics() {
    try {
      const startTime = Date.now();
      
      // Simulate health check request
      const responseTime = Date.now() - startTime;
      
      const metrics: HealthMetrics = {
        status: 'healthy',
        timestamp: new Date(),
        responseTime,
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000, // seconds
        uptime: process.uptime(),
        errors: 0,
      };

      this.metrics.push(metrics);
      
      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      logger.debug('Web app metrics collected:', metrics);
    } catch (error) {
      logger.error('Failed to collect web app metrics:', error);
    }
  }

  getHealthStatus(): HealthMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
  }

  getMetricsHistory(): HealthMetrics[] {
    return [...this.metrics];
  }

  isHealthy(): boolean {
    const latest = this.getHealthStatus();
    return latest ? latest.status === 'healthy' : false;
  }
}

// Export singleton instance
export const webAppMonitor = new WebAppMonitor();

// Auto-start monitoring in production
if (process.env.NODE_ENV === 'production') {
  webAppMonitor.start();
}

export default webAppMonitor;
