import { TestSuite, TestMetrics } from '../types';
export declare class MetricsCalculator {
    calculateMetrics(suites: TestSuite[]): TestMetrics;
    private flattenTests;
    private identifyFlakyTests;
    private calculateFlakinessScore;
    private analyzeFailurePattern;
    private identifySlowTests;
    private categorizeFailures;
    private categorizeFailure;
}
//# sourceMappingURL=calculator.d.ts.map