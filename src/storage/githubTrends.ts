import * as core from '@actions/core';
import client, { ArtifactClient } from '@actions/artifact';
import * as fs from 'fs';
import * as path from 'path';
import { TrendData } from '../types';

/**
 * Enhanced Trend Manager using GitHub Artifacts + Cache
 * Provides long-term trend data with fallback strategy
 */
export class GitHubTrendManager {
  private artifactClient: ArtifactClient;
  private artifactName: string;
  private retentionDays: number;

  constructor(
    framework: string = 'junit',
    retentionDays: number = 90,
    artifactSuffix: string = ''
  ) {
    this.artifactClient = client;
    this.artifactName = `test-metrics-trends-${framework}${artifactSuffix ? `-${artifactSuffix}` : ''}`;
    this.retentionDays = retentionDays;
  }

  /**
   * Save current metrics as GitHub artifact for long-term trend tracking
   */
  async saveTrendArtifact(trendData: TrendData): Promise<void> {
    try {
      const tempDir = process.env.RUNNER_TEMP || '/tmp';
      const trendFile = path.join(tempDir, `trend-${Date.now()}.json`);
      
      // Write trend data
      fs.writeFileSync(trendFile, JSON.stringify(trendData, null, 2));
      
      // Upload as artifact
      const uploadResult = await this.artifactClient.uploadArtifact(
        this.artifactName,
        [trendFile],
        tempDir,
        {
          retentionDays: this.retentionDays,
        }
      );
      
      core.info(`✅ Saved trend artifact: ${this.artifactName} (ID: ${uploadResult.id})`);
      
      // Cleanup temp file
      if (fs.existsSync(trendFile)) {
        fs.unlinkSync(trendFile);
      }
    } catch (error) {
      core.warning(`⚠️ Failed to save trend artifact: ${error}`);
      // Non-fatal - trends will fall back to cache
    }
  }

  /**
   * Download and parse previous trend artifacts
   */
  async loadTrendHistory(limit: number = 30): Promise<TrendData[]> {
    try {
      // Try to get the latest artifact
      const { artifacts } = await this.artifactClient.listArtifacts();
      
      const trendArtifacts = artifacts.filter((a: any) => 
        a.name.startsWith('test-metrics-trends-') && !a.isExpired
      );
      
      if (trendArtifacts.length === 0) {
        core.info('ℹ️ No previous trend artifacts found');
        return [];
      }
      
      // Sort by creation date, most recent first
      trendArtifacts.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const trends: TrendData[] = [];
      
      // Download up to `limit` artifacts
      for (let i = 0; i < Math.min(limit, trendArtifacts.length); i++) {
        try {
          const downloadResult = await this.artifactClient.downloadArtifact(trendArtifacts[i].id);
          const downloadPath = downloadResult.downloadPath;
          
          if (!downloadPath) {
            core.debug(`No download path for artifact ${i}`);
            continue;
          }
          
          // Read all JSON files in the artifact
          const files = fs.readdirSync(downloadPath);
          for (const file of files) {
            if (file.endsWith('.json')) {
              const filePath = path.join(downloadPath, file);
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              trends.push(data);
            }
          }
          
          core.debug(`Downloaded trend artifact: ${trendArtifacts[i].name}`);
        } catch (error) {
          core.debug(`Failed to download artifact ${i}: ${error}`);
          continue;
        }
      }
      
      core.info(`✅ Loaded ${trends.length} trend records from artifacts`);
      return trends;
    } catch (error) {
      core.warning(`⚠️ Failed to load trend artifacts: ${error}`);
      return [];
    }
  }

  /**
   * Get trend statistics from historical data
   */
  getTrendStats(trends: TrendData[]): {
    averageDuration: number;
    averagePassRate: number;
    flakyTrend: string;
    performanceTrend: string;
  } {
    const validTrends = trends.filter(t => t && t.metrics);

    if (validTrends.length === 0) {
      return {
        averageDuration: 0,
        averagePassRate: 0,
        flakyTrend: 'stable',
        performanceTrend: 'stable',
      };
    }

    // Calculate averages
    const avgDuration = validTrends.reduce((sum, t) => sum + t.metrics.totalDuration, 0) / validTrends.length;
    const avgPassRate = validTrends.reduce((sum, t) => sum + t.metrics.passRate, 0) / validTrends.length;
    
    // Determine trends
    const oldestTrend = validTrends[0];
    const newestTrend = validTrends[validTrends.length - 1];
    
    const passRateDiff = newestTrend.metrics.passRate - oldestTrend.metrics.passRate;
    const flakyTrend = passRateDiff > 5 ? 'improving' : 
                       passRateDiff < -5 ? 'declining' : 'stable';
    
    const performanceDiff = newestTrend.metrics.totalDuration - oldestTrend.metrics.totalDuration;
    const performanceTrend = performanceDiff < -5 ? 'improving' :
                            performanceDiff > 5 ? 'declining' : 'stable';
    
    return {
      averageDuration: avgDuration,
      averagePassRate: avgPassRate,
      flakyTrend,
      performanceTrend,
    };
  }
}
