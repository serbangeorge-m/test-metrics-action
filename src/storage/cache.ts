import * as cache from '@actions/cache';
import * as core from '@actions/core';
import { TrendData } from '../types';

export class TrendCache {
  private cacheKey: string;
  private retentionDays: number;

  constructor(cacheKeyPrefix: string, retentionDays: number = 30) {
    this.cacheKey = `${cacheKeyPrefix}-trends`;
    this.retentionDays = retentionDays;
  }

  async saveTrendData(trendData: TrendData): Promise<void> {
    try {
      // Load existing data
      const existingData = await this.loadTrendData();
      
      // Add new data
      existingData.push(trendData);
      
      // Clean up old data (keep only last N days)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);
      
      const filteredData = existingData.filter(data => 
        new Date(data.timestamp) >= cutoffDate
      );
      
      // Sort by timestamp
      filteredData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Save to cache
      const cachePath = this.getCachePath();
      const fs = require('fs');
      const path = require('path');
      
      // Ensure directory exists
      const dir = path.dirname(cachePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(cachePath, JSON.stringify(filteredData, null, 2));
      
      // Save to GitHub Actions cache
      await cache.saveCache([cachePath], this.cacheKey);
      
      core.info(`Saved trend data for ${filteredData.length} runs`);
    } catch (error) {
      core.warning(`Failed to save trend data: ${error}`);
    }
  }

  async loadTrendData(): Promise<TrendData[]> {
    try {
      const cachePath = this.getCachePath();
      
      // Try to restore from GitHub Actions cache first
      await cache.restoreCache([cachePath], this.cacheKey);
      
      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(cachePath)) {
        const data = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
        core.info(`Loaded ${data.length} historical trend records`);
        return Array.isArray(data) ? data : [];
      }
      
      return [];
    } catch (error) {
      core.warning(`Failed to load trend data: ${error}`);
      return [];
    }
  }

  private getCachePath(): string {
    return `${process.env.RUNNER_TEMP || '/tmp'}/test-metrics-trends.json`;
  }

  async getTrendHistory(days: number = 7): Promise<TrendData[]> {
    const allData = await this.loadTrendData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allData.filter(data => 
      new Date(data.timestamp) >= cutoffDate
    );
  }

  async getLatestTrend(): Promise<TrendData | null> {
    const allData = await this.loadTrendData();
    return allData.length > 0 ? allData[allData.length - 1] : null;
  }
}
