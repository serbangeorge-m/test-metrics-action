#!/usr/bin/env node

/**
 * Debug script to test JUnit parser locally
 * Usage: npx ts-node debug-parser.ts <path-to-junit-xml>
 */

import * as fs from 'fs';
import * as xml2js from 'xml2js';
import * as path from 'path';

async function debugParser(filePath: string) {
  console.log(`\n📄 Debugging JUnit parser for: ${filePath}\n`);

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    // Read file
    const xmlContent = fs.readFileSync(filePath, 'utf-8');
    console.log(`✅ File read successfully (${xmlContent.length} bytes)\n`);

    // Show first 500 chars
    console.log('📝 First 500 characters of XML:');
    console.log(xmlContent.substring(0, 500));
    console.log('\n---\n');

    // Parse with different configurations to understand the structure
    console.log('🔍 Testing different xml2js parser configurations:\n');

    // Config 1: With mergeAttrs
    const parser1 = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    });

    const result1 = await parser1.parseStringPromise(xmlContent);
    console.log('✅ Parser with mergeAttrs: true');
    console.log('   Root keys:', Object.keys(result1));
    console.log('   Structure:', JSON.stringify(result1, null, 2).substring(0, 800));
    console.log('\n');

    // Config 2: Without mergeAttrs
    const parser2 = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: false,
      trim: true
    });

    const result2 = await parser2.parseStringPromise(xmlContent);
    console.log('✅ Parser with mergeAttrs: false');
    console.log('   Root keys:', Object.keys(result2));
    console.log('   Structure:', JSON.stringify(result2, null, 2).substring(0, 800));
    console.log('\n');

    // Now test the actual parser logic directly
    console.log('🧪 Testing parser logic directly:\n');
    
    const parseData = result1 as any;
    const testsuites = parseData.testsuites.testsuite;
    const suitesArray = Array.isArray(testsuites) ? testsuites : [testsuites];
    
    console.log(`Found ${suitesArray.length} test suite(s)\n`);
    
    for (const testsuite of suitesArray) {
      console.log(`Suite: ${testsuite.name}`);
      console.log(`  - tests attribute: "${testsuite.tests}" (type: ${typeof testsuite.tests})`);
      console.log(`  - failures attribute: "${testsuite.failures}" (type: ${typeof testsuite.failures})`);
      console.log(`  - errors attribute: "${testsuite.errors}" (type: ${typeof testsuite.errors})`);
      console.log(`  - skipped attribute: "${testsuite.skipped}" (type: ${typeof testsuite.skipped})`);
      console.log(`  - time attribute: "${testsuite.time}" (type: ${typeof testsuite.time})`);
      
      // Try parsing
      const testCount = parseInt(testsuite.tests, 10);
      console.log(`  - parseInt(tests): ${testCount}\n`);
      
      if (testsuite.testcase) {
        const testcases = Array.isArray(testsuite.testcase) ? testsuite.testcase : [testsuite.testcase];
        console.log(`  Testcases: ${testcases.length}`);
        testcases.slice(0, 2).forEach((tc: any, idx: number) => {
          console.log(`    [${idx + 1}] ${tc.name} (${tc.classname})`);
        });
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: npx ts-node debug-parser.ts <path-to-junit-xml>');
  console.error('Example: npx ts-node debug-parser.ts examples/junit-sample.xml');
  process.exit(1);
}

debugParser(filePath).catch(console.error);
