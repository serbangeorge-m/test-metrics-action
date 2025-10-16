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
      // Debug: log the parsed XML structure
      console.log('DEBUG: Parsed XML structure:', JSON.stringify(xmlData, null, 2).substring(0, 500));
      console.log('DEBUG: xmlData.testsuites:', !!xmlData.testsuites);
      console.log('DEBUG: xmlData.testsuite:', !!xmlData.testsuite);
      
      // Handle different JUnit XML structures
      let testSuitesArray: any[] = [];

      // Case 1: Root is testsuites with nested testsuite elements
      if (xmlData.testsuites && xmlData.testsuites.testsuite) {
        console.log('DEBUG: Processing testsuites -> testsuite');
        const testsuites = xmlData.testsuites.testsuite;
        testSuitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];
      }
      // Case 2: Root is testsuite
      else if (xmlData.testsuite) {
        console.log('DEBUG: Processing root testsuite');
        const testsuites = xmlData.testsuite;
        testSuitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];
      }
      // Case 3: Direct test results (some tools generate this)
      else if (xmlData.tests || xmlData.testcase) {
        console.log('DEBUG: Processing direct test results');
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

      console.log(`DEBUG: Found ${testSuitesArray.length} test suites`);

      for (const testsuite of testSuitesArray) {
        if (!testsuite) continue;

        console.log('DEBUG: Processing suite:', JSON.stringify(testsuite).substring(0, 200));

        // Get attribute values - with mergeAttrs: true, attributes are merged directly
        const testsCount = this.getAttributeValue(testsuite, 'tests');
        const failuresCount = this.getAttributeValue(testsuite, 'failures');
        const errorsCount = this.getAttributeValue(testsuite, 'errors');
        const skippedCount = this.getAttributeValue(testsuite, 'skipped');
        const timeValue = this.getAttributeValue(testsuite, 'time');
        const suiteName = this.getAttributeValue(testsuite, 'name') || 'Unknown Suite';

        console.log(`DEBUG: Suite "${suiteName}" - tests: ${testsCount}, failures: ${failuresCount}, errors: ${errorsCount}, skipped: ${skippedCount}`);

        const suite: TestSuite = {
          name: suiteName,
          tests: [],
          totalTests: testsCount,
          passedTests: 0,
          failedTests: 0,
          skippedTests: 0,
          duration: timeValue
        };

        // Parse individual test cases
        if (testsuite.testcase) {
          const testcases = Array.isArray(testsuite.testcase) ? testsuite.testcase : [testsuite.testcase];
          console.log(`DEBUG: Suite has ${testcases.length} test cases`);
          
          for (const testcase of testcases) {
            if (!testcase) continue;

            const testName = this.getAttributeValue(testcase, 'name') || 'Unknown Test';
            const testTime = this.getAttributeValue(testcase, 'time');
            const classname = this.getAttributeValue(testcase, 'classname');

            const test: TestResult = {
              name: testName,
              status: this.determineTestStatus(testcase),
              duration: testTime,
              errorMessage: this.extractErrorMessage(testcase),
              suite: suite.name,
              file: classname
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
          console.log('DEBUG: Creating virtual tests based on counts');
          suite.passedTests = suite.totalTests - (failuresCount + errorsCount + skippedCount);
          suite.failedTests = failuresCount + errorsCount;
          suite.skippedTests = skippedCount;
        }

        console.log(`DEBUG: Suite complete - total: ${suite.totalTests}, passed: ${suite.passedTests}, failed: ${suite.failedTests}, skipped: ${suite.skippedTests}`);
        suites.push(suite);
      }

      console.log(`DEBUG: Parsing complete - ${suites.length} suites, total tests: ${suites.reduce((sum, s) => sum + s.totalTests, 0)}`);

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
    // Check for skipped element (not the merged attribute)
    if (testcase.skipped && typeof testcase.skipped === 'object') {
      return 'skipped';
    }
    
    // Check for failure or error elements
    if (testcase.failure || testcase.error) {
      return 'failed';
    }
    
    // Default to passed
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

  private getAttributeValue(element: any, attributeName: string): any {
    // With mergeAttrs: true, attributes are merged directly into the object
    if (element[attributeName] !== undefined) {
      const value = element[attributeName];
      
      // Handle numeric attributes
      if (attributeName === 'tests' || attributeName === 'failures' || 
          attributeName === 'errors' || attributeName === 'skipped') {
        return parseInt(value, 10) || 0;
      }
      
      // Handle time/duration attributes
      if (attributeName === 'time') {
        return parseFloat(value) || 0;
      }
      
      return value;
    }
    
    // Fallback for attributes under $ (shouldn't happen with mergeAttrs: true)
    if (element.$ && element.$[attributeName] !== undefined) {
      const value = element.$[attributeName];
      
      if (attributeName === 'tests' || attributeName === 'failures' || 
          attributeName === 'errors' || attributeName === 'skipped') {
        return parseInt(value, 10) || 0;
      }
      
      if (attributeName === 'time') {
        return parseFloat(value) || 0;
      }
      
      return value;
    }
    
    // Return default values
    if (attributeName === 'tests' || attributeName === 'failures' || 
        attributeName === 'errors' || attributeName === 'skipped') {
      return 0;
    }
    
    if (attributeName === 'time') {
      return 0;
    }
    
    return undefined;
  }
}
