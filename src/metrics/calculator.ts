import { TestSuite, TestResult, TestMetrics, FlakyTest, FailureCategory } from '../types';

export class MetricsCalculator {
  calculateMetrics(suites: TestSuite[]): TestMetrics {
    const allTests = this.flattenTests(suites);
    
    const totalTests = allTests.length;
    const passedTests = allTests.filter(t => t.status === 'passed').length;
    const failedTests = allTests.filter(t => t.status === 'failed').length;
    const skippedTests = allTests.filter(t => t.status === 'skipped').length;
    
    const passRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    const totalDuration = allTests.reduce((sum, test) => sum + test.duration, 0);
    const averageDuration = totalTests > 0 ? totalDuration / totalTests : 0;

    return {
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      passRate,
      totalDuration,
      averageDuration,
      flakyTests: this.identifyFlakyTests(allTests),
      slowTests: this.identifySlowTests(allTests),
      failureCategories: this.categorizeFailures(allTests)
    };
  }

  private flattenTests(suites: TestSuite[]): TestResult[] {
    const allTests: TestResult[] = [];
    for (const suite of suites) {
      allTests.push(...suite.tests);
    }
    return allTests;
  }

  private identifyFlakyTests(tests: TestResult[]): FlakyTest[] {
    const flakyTests: FlakyTest[] = [];
    
    for (const test of tests) {
      // Check for retry patterns or intermittent failures
      if (test.retryCount && test.retryCount > 0) {
        const flakinessScore = this.calculateFlakinessScore(test);
        if (flakinessScore > 0.3) { // Threshold for flakiness
          flakyTests.push({
            name: test.name,
            flakinessScore,
            failurePattern: this.analyzeFailurePattern(test),
            retryCount: test.retryCount,
            lastSeen: new Date().toISOString()
          });
        }
      }
    }

    return flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore);
  }

  private calculateFlakinessScore(test: TestResult): number {
    // Simple flakiness scoring based on retry count and error type
    let score = 0;
    
    if (test.retryCount) {
      score += test.retryCount * 0.2; // Each retry adds to flakiness
    }
    
    if (test.errorMessage) {
      // Timeout errors are often flaky
      if (test.errorMessage.toLowerCase().includes('timeout')) {
        score += 0.3;
      }
      // Network errors are often flaky
      if (test.errorMessage.toLowerCase().includes('network') || 
          test.errorMessage.toLowerCase().includes('connection')) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0); // Cap at 1.0
  }

  private analyzeFailurePattern(test: TestResult): string {
    if (!test.errorMessage) return 'unknown';
    
    const error = test.errorMessage.toLowerCase();
    
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('network') || error.includes('connection')) return 'network';
    if (error.includes('assertion') || error.includes('expect')) return 'assertion';
    if (error.includes('setup') || error.includes('beforeeach')) return 'setup';
    
    return 'other';
  }

  private identifySlowTests(tests: TestResult[]): TestResult[] {
    // Find tests in the 95th percentile for duration
    const sortedTests = tests
      .filter(t => t.status === 'passed') // Only consider passed tests for performance
      .sort((a, b) => b.duration - a.duration);
    
    const slowTestCount = Math.ceil(sortedTests.length * 0.05); // Top 5% slowest
    return sortedTests.slice(0, slowTestCount);
  }

  private categorizeFailures(tests: TestResult[]): FailureCategory[] {
    const categories: Map<string, FailureCategory> = new Map();
    
    for (const test of tests) {
      if (test.status === 'failed' && test.errorMessage) {
        const categoryType = this.categorizeFailure(test.errorMessage);
        
        if (!categories.has(categoryType)) {
          categories.set(categoryType, {
            type: categoryType,
            count: 0,
            percentage: 0,
            tests: []
          });
        }
        
        const category = categories.get(categoryType)!;
        category.count++;
        category.tests.push(test.name);
      }
    }

    const failedTests = tests.filter(t => t.status === 'failed').length;
    const categoryArray = Array.from(categories.values());
    
    // Calculate percentages
    for (const category of categoryArray) {
      category.percentage = failedTests > 0 ? (category.count / failedTests) * 100 : 0;
    }

    return categoryArray.sort((a, b) => b.count - a.count);
  }

  private categorizeFailure(errorMessage: string): 'timeout' | 'assertion' | 'setup' | 'network' | 'other' {
    const error = errorMessage.toLowerCase();
    
    if (error.includes('timeout') || error.includes('timed out')) {
      return 'timeout';
    }
    if (error.includes('network') || error.includes('connection') || 
        error.includes('fetch') || error.includes('http')) {
      return 'network';
    }
    if (error.includes('assertion') || error.includes('expect') || 
        error.includes('assert') || error.includes('should')) {
      return 'assertion';
    }
    if (error.includes('setup') || error.includes('beforeeach') || 
        error.includes('beforeall') || error.includes('initialization')) {
      return 'setup';
    }
    
    return 'other';
  }
}
