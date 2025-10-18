import { TestMetrics, TrendData } from '../types';
export declare class HtmlReporter {
    private trendAnalyzer;
    constructor();
    generateHtmlSummary(metrics: TestMetrics, historicalData: TrendData[], framework: string, currentTrendData: TrendData): Promise<void>;
    private generateHtmlContent;
    private formatTrendBadge;
}
//# sourceMappingURL=htmlReporter.d.ts.map