import { TrendData } from '../types';
export declare class TrendCache {
    private cacheKey;
    private retentionDays;
    constructor(cacheKeyPrefix: string, retentionDays?: number);
    saveTrendData(trendData: TrendData): Promise<void>;
    loadTrendData(): Promise<TrendData[]>;
    private getCachePath;
    getTrendHistory(days?: number): Promise<TrendData[]>;
    getLatestTrend(): Promise<TrendData | null>;
}
//# sourceMappingURL=cache.d.ts.map