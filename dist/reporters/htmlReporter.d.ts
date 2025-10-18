import { TestMetrics, TrendData } from '../types';
export declare class HtmlReporter {
    private trendAnalyzer;
    constructor();
    generateHtmlSummary(metrics: TestMetrics, historicalData: TrendData[], framework: string, currentTrendData: TrendData): Promise<void>;
    private generateEnhancedMarkdown;
    private formatTrendBadge;
    private getPassRateColor;
    private formatDuration;
}
//# sourceMappingURL=htmlReporter.d.ts.map