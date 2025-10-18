import { TrendData } from '../types';
/**
 * Enhanced Trend Manager using GitHub Artifacts + Cache
 * Provides long-term trend data with fallback strategy
 */
export declare class GitHubTrendManager {
    private artifactClient;
    private artifactName;
    private retentionDays;
    constructor(framework?: string, retentionDays?: number, artifactSuffix?: string);
    /**
     * Save current metrics as GitHub artifact for long-term trend tracking
     */
    saveTrendArtifact(trendData: TrendData): Promise<void>;
    /**
     * Download and parse previous trend artifacts
     */
    loadTrendHistory(limit?: number): Promise<TrendData[]>;
    /**
     * Get trend statistics from historical data
     */
    getTrendStats(trends: TrendData[]): {
        averageDuration: number;
        averagePassRate: number;
        flakyTrend: string;
        performanceTrend: string;
    };
}
//# sourceMappingURL=githubTrends.d.ts.map