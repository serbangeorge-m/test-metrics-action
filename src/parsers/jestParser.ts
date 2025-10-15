import * as fs from 'fs';
import { TestSuite, TestResult, TestFramework, ParsedTestData } from '../types';

export class JestParser {
  async parseFile(filePath: string): Promise<ParsedTestData> {
    const jsonContent = fs.readFileSync(filePath, 'utf-8');
    const jestData = JSON.parse(jsonContent);
    return this.parseJestJSON(jestData);
  }

  private parseJestJSON(jestData: any): ParsedTestData {
    const suites: TestSuite[] = [];
    const timestamp = new Date().toISOString();

    // Jest JSON format can vary, handle common structures
    if (jestData.testResults) {
      // Jest --json output format
      for (const testResult of jestData.testResults) {
        const suite: TestSuite = {
          name: testResult.name || 'Unknown Suite',
          tests: [],
          totalTests: testResult.assertionResults?.length || 0,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          duration: testResult.endTime - testResult.startTime
        };

        if (testResult.assertionResults) {
          for (const assertion of testResult.assertionResults) {
            const test: TestResult = {
              name: assertion.title || 'Unknown Test',
              status: assertion.status,
              duration: assertion.duration || 0,
              errorMessage: assertion.failureMessages?.join('\n'),
              suite: suite.name,
              file: testResult.name
            };

            suite.tests.push(test);

            switch (assertion.status) {
              case 'passed':
                suite.passedTests++;
                break;
              case 'failed':
                suite.failedTests++;
                break;
              case 'pending':
              case 'skipped':
              case 'disabled':
                suite.skippedTests++;
                break;
            }
          }
        }

        suites.push(suite);
      }
    } else if (jestData.suites) {
      // Alternative Jest format
      for (const suiteData of jestData.suites) {
        const suite = this.parseJestSuite(suiteData);
        suites.push(suite);
      }
    }

    return {
      suites,
      framework: { type: 'jest', version: jestData.version },
      timestamp
    };
  }

  private parseJestSuite(suiteData: any): TestSuite {
    const suite: TestSuite = {
      name: suiteData.name || 'Unknown Suite',
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
          name: test.name || test.title || 'Unknown Test',
          status: test.status,
          duration: test.duration || 0,
          errorMessage: test.failureMessages?.join('\n'),
          suite: suite.name
        };

        suite.tests.push(testResult);
        suite.totalTests++;

        switch (test.status) {
          case 'passed':
            suite.passedTests++;
            break;
          case 'failed':
            suite.failedTests++;
            break;
          case 'pending':
          case 'skipped':
          case 'disabled':
            suite.skippedTests++;
            break;
        }
      }
    };

    if (suiteData.tests) {
      parseTests(suiteData.tests);
    }

    return suite;
  }
}
