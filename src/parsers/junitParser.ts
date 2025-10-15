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

    // Handle both single testsuite and multiple testsuites
    const testsuites = xmlData.testsuites?.testsuite || xmlData.testsuite || [];
    const testSuitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];

    for (const testsuite of testSuitesArray) {
      if (!testsuite) continue;

      const suite: TestSuite = {
        name: testsuite.name || testsuite.$.name || 'Unknown Suite',
        tests: [],
        totalTests: parseInt(testsuite.$.tests || '0'),
        passedTests: parseInt(testsuite.$.tests || '0') - parseInt(testsuite.$.failures || '0') - parseInt(testsuite.$.errors || '0') - parseInt(testsuite.$.skipped || '0'),
        failedTests: parseInt(testsuite.$.failures || '0') + parseInt(testsuite.$.errors || '0'),
        skippedTests: parseInt(testsuite.$.skipped || '0'),
        duration: parseFloat(testsuite.$.time || '0')
      };

      // Parse individual test cases
      if (testsuite.testcase) {
        const testcases = Array.isArray(testsuite.testcase) ? testsuite.testcase : [testsuite.testcase];
        
        for (const testcase of testcases) {
          const test: TestResult = {
            name: testcase.$.name || testcase.name || 'Unknown Test',
            status: this.determineTestStatus(testcase),
            duration: parseFloat(testcase.$.time || testcase.time || '0'),
            errorMessage: this.extractErrorMessage(testcase),
            suite: suite.name,
            file: testcase.$.file || testcase.file || testcase.$.classname || testcase.classname
          };

          suite.tests.push(test);
        }
      }

      suites.push(suite);
    }

    return {
      suites,
      framework: { type: 'junit' },
      timestamp
    };
  }

  private determineTestStatus(testcase: any): 'passed' | 'failed' | 'skipped' {
    if (testcase.skipped) return 'skipped';
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
