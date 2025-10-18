import { TestMetrics, TrendData, PerformanceTrend } from '../types';
export declare class TrendAnalyzer {
    analyzeTrends(currentMetrics: TestMetrics, historicalData: TrendData[]): PerformanceTrend;
    getTrendSummary(currentMetrics: TestMetrics, historicalData: TrendData[], matrixKey?: string): {
        durationTrend: PerformanceTrend;
        passRateTrend: PerformanceTrend;
        testCountTrend: PerformanceTrend;
        flakyTestsTrend: PerformanceTrend;
    };
    private determineTrend;
    getPerformanceInsights(currentMetrics: TestMetrics, historicalData: TrendData[], matrixKey?: string): string[];
}
//# sourceMappingURL=trends.d.ts.map