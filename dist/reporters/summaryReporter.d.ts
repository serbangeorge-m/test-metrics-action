import { TestMetrics, TrendData } from '../types';
export declare class SummaryReporter {
    private trendAnalyzer;
    private htmlReporter;
    constructor();
    generateJobSummary(metrics: TestMetrics, historicalData: TrendData[], framework: string, currentTrendData: TrendData): Promise<void>;
    private generateSummaryTable;
    private generateExecutionDetails;
    private generateFlakyTestsTable;
    private generateSlowTestsTable;
    private generateFailureCategoriesTable;
    private generateTrendChart;
    private getStatusEmoji;
    private getTrendEmoji;
    private formatTrendValue;
    private generateHtmlStructuredMarkdown;
    private formatMarkdownTrendBadge;
}
//# sourceMappingURL=summaryReporter.d.ts.map