import { TestSuite, TestResult, ParsedTestData } from '../types';
import { BaseParser } from './baseParser';

export class PlaywrightParser extends BaseParser {
  protected async parse(content: string): Promise<ParsedTestData> {
    const playwrightData = JSON.parse(content);
    return this.parsePlaywrightJSON(playwrightData);
  }

  private parsePlaywrightJSON(playwrightData: any): ParsedTestData {
    const suites: TestSuite[] = [];
    const timestamp = new Date().toISOString();

    // Playwright JSON format - results array
    if (Array.isArray(playwrightData)) {
      const suiteMap = new Map<string, TestSuite>();

      for (const result of playwrightData) {
        const suiteName = result.suite || result.file || 'Default Suite';
        
        if (!suiteMap.has(suiteName)) {
          suiteMap.set(suiteName, {
            name: suiteName,
            tests: [],
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            duration: 0
          });
        }

        const suite = suiteMap.get(suiteName)!;
        const test: TestResult = {
          name: result.title || result.name || 'Unknown Test',
          status: this.mapPlaywrightStatus(result.status),
          duration: result.duration || 0,
          errorMessage: result.error?.message || result.failure,
          retryCount: result.retry || 0,
          suite: suiteName,
          file: result.file || result.location?.file
        };

        suite.tests.push(test);
        suite.totalTests++;
        suite.duration += test.duration;

        switch (test.status) {
          case 'passed':
            suite.passedTests++;
            break;
          case 'failed':
            suite.failedTests++;
            break;
          case 'skipped':
            suite.skippedTests++;
            break;
        }
      }

      suites.push(...Array.from(suiteMap.values()));
    }
    // Handle Playwright report format
    else if (playwrightData.suites) {
      for (const suiteData of playwrightData.suites) {
        const suite = this.parsePlaywrightSuite(suiteData);
        suites.push(suite);
      }
    }

    return {
      suites,
      framework: { type: 'playwright', version: playwrightData.version },
      timestamp
    };
  }

  private parsePlaywrightSuite(suiteData: any): TestSuite {
    const suite: TestSuite = {
      name: suiteData.title || suiteData.name || 'Unknown Suite',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      duration: suiteData.duration || 0
    };

    const parseTests = (tests: any[]) => {
      for (const test of tests) {
        const testResult: TestResult = {
          name: test.title || test.name || 'Unknown Test',
          status: this.mapPlaywrightStatus(test.status),
          duration: test.duration || 0,
          errorMessage: test.error?.message || test.failure,
          retryCount: test.retry || 0,
          suite: suite.name,
          file: test.file || test.location?.file
        };

        suite.tests.push(testResult);
        suite.totalTests++;

        switch (testResult.status) {
          case 'passed':
            suite.passedTests++;
            break;
          case 'failed':
            suite.failedTests++;
            break;
          case 'skipped':
            suite.skippedTests++;
            break;
        }
      }
    };

    if (suiteData.tests) {
      parseTests(suiteData.tests);
    }

    if (suiteData.suites) {
      for (const childSuiteData of suiteData.suites) {
        const childSuite = this.parsePlaywrightSuite(childSuiteData);
        suite.tests.push(...childSuite.tests);
        suite.totalTests += childSuite.totalTests;
        suite.passedTests += childSuite.passedTests;
        suite.failedTests += childSuite.failedTests;
        suite.skippedTests += childSuite.skippedTests;
        suite.duration += childSuite.duration;
      }
    }

    return suite;
  }

  private mapPlaywrightStatus(status: string): 'passed' | 'failed' | 'skipped' {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'ok':
        return 'passed';
      case 'failed':
      case 'fail':
      case 'error':
        return 'failed';
      case 'skipped':
      case 'skip':
      case 'pending':
        return 'skipped';
      default:
        return 'skipped';
    }
  }
}
