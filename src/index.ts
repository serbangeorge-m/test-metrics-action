import * as core from '@actions/core';
import * as github from '@actions/github';
import * as glob from 'glob';
import * as path from 'path';

import { JUnitParser } from './parsers/junitParser';
import { JestParser } from './parsers/jestParser';
import { PlaywrightParser } from './parsers/playwrightParser';
import { MetricsCalculator } from './metrics/calculator';
import { TrendCache } from './storage/cache';
import { SummaryReporter } from './reporters/summaryReporter';
import { ParsedTestData, TrendData } from './types';

// Debug flag - controlled by environment variable
const DEBUG = process.env.DEBUG_METRICS === 'true' || process.env.RUNNER_DEBUG === '1';

async function run(): Promise<void> {
  try {
    // Get inputs
    const reportPaths = core.getInput('report_paths', { required: true });
    const testFramework = core.getInput('test_framework') || 'auto';
    const annotateOnly = core.getBooleanInput('annotate_only');
    const failOnFailure = core.getBooleanInput('fail_on_failure');
    const includePassed = core.getBooleanInput('include_passed');
    const detailedSummary = core.getBooleanInput('detailed_summary');
    const requireTests = core.getBooleanInput('require_tests');
    const retentionDays = parseInt(core.getInput('retention_days') || '30');
    const cacheKeyPrefix = core.getInput('cache_key_prefix') || 'test-metrics';

    core.info(`Looking for test reports matching: ${reportPaths}`);

    // Find test result files
    const files = glob.sync(reportPaths, { nodir: true });
    
    if (files.length === 0) {
      const message = `No test result files found matching pattern: ${reportPaths}`;
      if (requireTests) {
        core.setFailed(message);
        return;
      } else {
        core.warning(message);
        return;
      }
    }

    core.info(`Found ${files.length} test result files`);

    // Parse test results
    const parsedData: ParsedTestData[] = [];
    
    for (const file of files) {
      try {
        if (DEBUG) core.info(`📄 Parsing file: ${file}`);
        const data = await parseTestFile(file, testFramework);
        if (DEBUG) console.log(`DEBUG: Parsed data from ${file}:`, JSON.stringify(data).substring(0, 300));
        parsedData.push(data);
        const testCount = data.suites.reduce((sum, s) => sum + s.tests.length, 0);
        core.info(`✅ Parsed ${file} (${data.framework.type}) - found ${data.suites.length} suites with ${testCount} tests`);
      } catch (error) {
        core.warning(`Failed to parse ${file}: ${error}`);
      }
    }

    if (parsedData.length === 0) {
      const message = 'No test results could be parsed';
      if (requireTests) {
        core.setFailed(message);
        return;
      } else {
        core.warning(message);
        return;
      }
    }

    // Combine all parsed data
    const combinedData = combineParsedData(parsedData);
    
    // Calculate metrics
    const metricsCalculator = new MetricsCalculator();
    const metrics = metricsCalculator.calculateMetrics(combinedData.suites);

    // Load historical data and save current run
    const trendCache = new TrendCache(cacheKeyPrefix, retentionDays);
    const historicalData = await trendCache.loadTrendData();
    
    const currentTrendData: TrendData = {
      timestamp: new Date().toISOString(),
      commitSha: github.context.sha,
      metrics,
      runId: github.context.runId.toString()
    };
    
    await trendCache.saveTrendData(currentTrendData);

    // Set outputs
    core.setOutput('total_tests', metrics.totalTests.toString());
    core.setOutput('passed_tests', metrics.passedTests.toString());
    core.setOutput('failed_tests', metrics.failedTests.toString());
    core.setOutput('skipped_tests', metrics.skippedTests.toString());
    core.setOutput('pass_rate', metrics.passRate.toFixed(2));
    core.setOutput('total_duration', (metrics.totalDuration / 1000).toFixed(2));
    core.setOutput('flaky_tests_count', metrics.flakyTests.length.toString());

    // Generate job summary
    if (detailedSummary) {
      const summaryReporter = new SummaryReporter();
      await summaryReporter.generateJobSummary(metrics, historicalData, combinedData.framework.type);
    }

    // Handle test failures
    if (metrics.failedTests > 0) {
      const message = `${metrics.failedTests} test(s) failed`;
      
      if (annotateOnly) {
        core.notice(message);
      } else if (failOnFailure) {
        core.setFailed(message);
      } else {
        core.warning(message);
      }
    }

    // Annotate PR with test results
    if (includePassed || metrics.failedTests > 0) {
      await annotatePullRequest(metrics, annotateOnly);
    }

    core.info('Test metrics analysis completed successfully');

  } catch (error) {
    core.setFailed(`Action failed: ${error}`);
  }
}

async function parseTestFile(filePath: string, framework: string): Promise<ParsedTestData> {
  const extension = path.extname(filePath).toLowerCase();
  
  // Auto-detect framework based on file extension and content
  if (framework === 'auto') {
    if (extension === '.xml') {
      framework = 'junit';
    } else if (extension === '.json') {
      // Try to detect from file content
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const jsonData = JSON.parse(content);
      
      if (jsonData.testResults || jsonData.suites) {
        framework = 'jest';
      } else if (Array.isArray(jsonData) || jsonData.suites) {
        framework = 'playwright';
      } else {
        throw new Error('Unable to auto-detect test framework from JSON file');
      }
    } else {
      throw new Error(`Unsupported file extension: ${extension}`);
    }
  }

  // Parse based on detected framework
  switch (framework.toLowerCase()) {
    case 'junit':
      const junitParser = new JUnitParser();
      return await junitParser.parseFile(filePath);
    
    case 'jest':
      const jestParser = new JestParser();
      return await jestParser.parseFile(filePath);
    
    case 'playwright':
      const playwrightParser = new PlaywrightParser();
      return await playwrightParser.parseFile(filePath);
    
    default:
      throw new Error(`Unsupported test framework: ${framework}`);
  }
}

function combineParsedData(parsedDataArray: ParsedTestData[]): ParsedTestData {
  const combinedSuites = [];
  let framework = { type: 'junit' as 'jest' | 'playwright' | 'junit' };
  let timestamp = new Date().toISOString();

  for (const data of parsedDataArray) {
    combinedSuites.push(...data.suites);
    framework = data.framework;
    timestamp = data.timestamp;
  }

  return {
    suites: combinedSuites,
    framework,
    timestamp
  };
}

async function annotatePullRequest(metrics: any, annotateOnly: boolean): Promise<void> {
  if (github.context.eventName !== 'pull_request') {
    return; // Only annotate on pull requests
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '');
  
  const comment = `## 🧪 Test Results
  
**Status:** ${metrics.passRate >= 95 ? '🟢 All tests passed' : metrics.passRate >= 80 ? '🟡 Some tests failed' : '🔴 Tests failing'}
**Pass Rate:** ${metrics.passRate.toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})
**Duration:** ${(metrics.totalDuration / 1000).toFixed(1)}s
${metrics.flakyTests.length > 0 ? `**Flaky Tests:** ${metrics.flakyTests.length}` : ''}

${metrics.failedTests > 0 ? `⚠️ ${metrics.failedTests} test(s) failed` : '✅ All tests passed!'}`;

  try {
    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      body: comment
    });
  } catch (error) {
    core.warning(`Failed to create PR comment: ${error}`);
  }
}

// Run the action
run();
