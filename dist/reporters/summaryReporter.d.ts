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
    private generateProgressBar;
    private getStatusEmoji;
    private getTrendEmoji;
    private formatChange;
}
//# sourceMappingURL=summaryReporter.d.ts.map