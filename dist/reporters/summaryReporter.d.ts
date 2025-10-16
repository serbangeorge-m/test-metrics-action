import { TestMetrics, TrendData } from '../types';
export declare class SummaryReporter {
    private trendAnalyzer;
    constructor();
    generateJobSummary(metrics: TestMetrics, historicalData: TrendData[], framework: string): Promise<void>;
    private generateSummaryTable;
    private generateExecutionDetails;
    private generateFlakyTestsTable;
    private generateSlowTestsTable;
    private generateFailureCategoriesTable;
    private generateTrendChart;
    private getStatusEmoji;
    private getTrendEmoji;
    private formatTrendValue;
}
//# sourceMappingURL=summaryReporter.d.ts.map