import * as fs from 'fs';
import * as xml2js from 'xml2js';
import { TestSuite, TestResult, TestFramework, ParsedTestData } from '../types';

export class JUnitParser {
  async parseFile(filePath: string): Promise<ParsedTestData> {
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    const parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    });

    const result = await parser.parseStringPromise(xmlContent);
    return this.parseJUnitXML(result);
  }

  private parseJUnitXML(xmlData: any): ParsedTestData {
    const suites: TestSuite[] = [];
    const timestamp = new Date().toISOString();

    try {
      // Handle different JUnit XML structures
      let testSuitesArray: any[] = [];

      // Case 1: Root is testsuites with nested testsuite elements
      if (xmlData.testsuites && xmlData.testsuites.testsuite) {
        const testsuites = xmlData.testsuites.testsuite;
        testSuitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];
      }
      // Case 2: Root is testsuite
      else if (xmlData.testsuite) {
        const testsuites = xmlData.testsuite;
        testSuitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];
      }
      // Case 3: Direct test results (some tools generate this)
      else if (xmlData.tests || xmlData.testcase) {
        // Wrap in a virtual testsuite
        testSuitesArray = [{
          name: 'Test Results',
          tests: xmlData.tests || 0,
          failures: xmlData.failures || 0,
          errors: xmlData.errors || 0,
          skipped: xmlData.skipped || 0,
          time: xmlData.time || 0,
          testcase: xmlData.testcase || []
        }];
      }

      for (const testsuite of testSuitesArray) {
        if (!testsuite) continue;

        const suite: TestSuite = {
          name: testsuite.name || testsuite.$.name || 'Unknown Suite',
          tests: [],
          totalTests: parseInt(testsuite.$.tests || testsuite.tests || '0'),
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          duration: parseFloat(testsuite.$.time || testsuite.time || '0')
        };

        // Parse individual test cases
        if (testsuite.testcase) {
          const testcases = Array.isArray(testsuite.testcase) ? testsuite.testcase : [testsuite.testcase];
          
          for (const testcase of testcases) {
            if (!testcase) continue;

            const test: TestResult = {
              name: testcase.$.name || testcase.name || 'Unknown Test',
              status: this.determineTestStatus(testcase),
              duration: parseFloat(testcase.$.time || testcase.time || '0'),
              errorMessage: this.extractErrorMessage(testcase),
              suite: suite.name,
              file: testcase.$.file || testcase.file || testcase.$.classname || testcase.classname
            };

            suite.tests.push(test);

            // Update counts
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
        }

        // If no testcases but we have counts, create virtual tests
        if (suite.tests.length === 0 && suite.totalTests > 0) {
          suite.passedTests = suite.totalTests - (parseInt(testsuite.$.failures || testsuite.failures || '0') + 
                                                 parseInt(testsuite.$.errors || testsuite.errors || '0') + 
                                                 parseInt(testsuite.$.skipped || testsuite.skipped || '0'));
          suite.failedTests = parseInt(testsuite.$.failures || testsuite.failures || '0') + 
                              parseInt(testsuite.$.errors || testsuite.errors || '0');
          suite.skippedTests = parseInt(testsuite.$.skipped || testsuite.skipped || '0');
        }

        suites.push(suite);
      }

      return {
        suites,
        framework: { type: 'junit' },
        timestamp
      };
    } catch (error) {
      console.error('Error parsing JUnit XML:', error);
      // Return empty result instead of throwing
      return {
        suites: [],
        framework: { type: 'junit' },
        timestamp
      };
    }
  }

  private determineTestStatus(testcase: any): 'passed' | 'failed' | 'skipped' {
    if (testcase.skipped || testcase.$.skipped) return 'skipped';
    if (testcase.failure || testcase.error) return 'failed';
    return 'passed';
  }

  private extractErrorMessage(testcase: any): string | undefined {
    if (testcase.failure) {
      return testcase.failure.$.message || testcase.failure.message || testcase.failure;
    }
    if (testcase.error) {
      return testcase.error.$.message || testcase.error.message || testcase.error;
    }
    return undefined;
  }
}
