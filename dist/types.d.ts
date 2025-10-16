export interface TestResult {
    name: string;
    status: 'passed' | 'failed' | 'skipped';
    duration: number;
    errorMessage?: string;
    retryCount?: number;
    suite?: string;
    file?: string;
}
export interface TestSuite {
    name: string;
    tests: TestResult[];
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    duration: number;
}
export interface TestMetrics {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    passRate: number;
    totalDuration: number;
    averageDuration: number;
    flakyTests: FlakyTest[];
    slowTests: TestResult[];
    failureCategories: FailureCategory[];
}
export interface FlakyTest {
    name: string;
    flakinessScore: number;
    failurePattern: string;
    retryCount: number;
    lastSeen: string;
}
export interface FailureCategory {
    type: 'timeout' | 'assertion' | 'setup' | 'network' | 'other';
    count: number;
    percentage: number;
    tests: string[];
}
export interface TrendData {
    timestamp: string;
    commitSha: string;
    metrics: TestMetrics;
    runId: string;
    matrixKey?: string;
}
export interface PerformanceTrend {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
    trend: 'improving' | 'declining' | 'stable';
}
export interface TestFramework {
    type: 'jest' | 'playwright' | 'junit';
    version?: string;
}
export interface ParsedTestData {
    suites: TestSuite[];
    framework: TestFramework;
    timestamp: string;
}
