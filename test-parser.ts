#!/usr/bin/env node

/**
 * Simple test to verify JUnit parser works correctly
 */

import * as fs from 'fs';
import * as xml2js from 'xml2js';

async function testParser() {
  const xmlContent = fs.readFileSync('examples/junit-sample.xml', 'utf-8');
  
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true
  });

  const result = await parser.parseStringPromise(xmlContent);
  
  // Helper function (matches the parser's implementation)
  function getAttributeValue(element: any, attributeName: string): any {
    if (element[attributeName] !== undefined) {
      const value = element[attributeName];
      if (attributeName === 'tests' || attributeName === 'failures' || 
          attributeName === 'errors' || attributeName === 'skipped') {
        return parseInt(value, 10) || 0;
      }
      if (attributeName === 'time') {
        return parseFloat(value) || 0;
      }
      return value;
    }
    if (attributeName === 'tests' || attributeName === 'failures' || 
        attributeName === 'errors' || attributeName === 'skipped') {
      return 0;
    }
    if (attributeName === 'time') {
      return 0;
    }
    return undefined;
  }

  // Helper function for test status
  function determineTestStatus(testcase: any): 'passed' | 'failed' | 'skipped' {
    if (testcase.skipped && typeof testcase.skipped === 'object') {
      return 'skipped';
    }
    if (testcase.failure || testcase.error) {
      return 'failed';
    }
    return 'passed';
  }

  // Parse
  const testsuites = result.testsuites.testsuite;
  const suitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;

  console.log('\n📊 Test Results:\n');

  for (const testsuite of suitesArray) {
    const suiteName = getAttributeValue(testsuite, 'name');
    console.log(`📦 Suite: ${suiteName}`);

    if (testsuite.testcase) {
      const testcases = Array.isArray(testsuite.testcase) ? testsuite.testcase : [testsuite.testcase];
      console.log(`   Found ${testcases.length} test cases:`);

      for (const testcase of testcases) {
        const testName = getAttributeValue(testcase, 'name');
        const status = determineTestStatus(testcase);

        console.log(`     - ${testName}: ${status}`);

        totalTests++;
        switch (status) {
          case 'passed':
            passedTests++;
            break;
          case 'failed':
            failedTests++;
            break;
          case 'skipped':
            skippedTests++;
            break;
        }
      }
    }
  }

  console.log(`\n✅ Summary:`);
  console.log(`   Total: ${totalTests}`);
  console.log(`   Passed: ${passedTests}`);
  console.log(`   Failed: ${failedTests}`);
  console.log(`   Skipped: ${skippedTests}`);
  console.log(`\n✅ Expected: Total: 8, Passed: 6, Failed: 1, Skipped: 1\n`);

  // Verify
  if (totalTests === 8 && passedTests === 6 && failedTests === 1 && skippedTests === 1) {
    console.log('🎉 TEST PASSED!\n');
    process.exit(0);
  } else {
    console.log('❌ TEST FAILED!\n');
    process.exit(1);
  }
}

testParser().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
