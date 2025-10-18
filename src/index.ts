import * as core from '@actions/core';
import * as github from '@actions/github';
import * as glob from 'glob';
import { getParser } from './parsers/parserFactory';
import { MetricsCalculator } from './metrics/calculator';
import { TrendCache } from './storage/cache';
import { GitHubTrendManager } from './storage/githubTrends';
import { SummaryReporter } from './reporters/summaryReporter';
import { annotatePullRequest } from './reporters/prReporter';
import { getMatrixKey } from './utils/matrix';
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
        const parser = getParser(file, testFramework);
        const data = await parser.parseFile(file);
        if (DEBUG) console.log(`DEBUG: Parsed data from ${file}:`, JSON.stringify(data).substring(0, 300));
        parsedData.push(data);
        const testCount = data.suites.reduce((sum, s) => sum + s.tests.length, 0);
        core.info(`✅ Parsed ${file} (${data.framework.type}) - found ${data.suites.length} suites with ${testCount} tests`);
      } catch (error) {
        if (error instanceof Error) {
          core.warning(`Failed to parse ${file}: ${error.message}`);
        } else {
          core.warning(`Failed to parse ${file}: ${String(error)}`);
        }
        if (DEBUG) {
          console.error(error);
        }
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

    // Load historical data from cache and artifacts
    const trendCache = new TrendCache(cacheKeyPrefix, retentionDays);
    const cacheData = await trendCache.loadTrendData();
    
    // Load from GitHub artifacts for longer history (90 days)
    const gitHubTrendManager = new GitHubTrendManager(testFramework === 'auto' ? 'junit' : testFramework, 90);
    const artifactData = await gitHubTrendManager.loadTrendHistory(90);
    
    // Merge and deduplicate by runId + matrixKey (prefer cache data if duplicate)
    const mergedHistoricalData = [
      ...artifactData,
      ...cacheData
    ].filter((data, index, arr) => 
      index === arr.findIndex(d => 
        d.runId === data.runId && d.matrixKey === data.matrixKey
      )
    ).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    const currentTrendData: TrendData = {
      timestamp: new Date().toISOString(),
      commitSha: github.context.sha,
      metrics,
      runId: github.context.runId.toString(),
      matrixKey: getMatrixKey() // Capture matrix context if present
    };
    
    await trendCache.saveTrendData(currentTrendData);
    await gitHubTrendManager.saveTrendArtifact(currentTrendData);

    // Set outputs
    core.setOutput('total_tests', metrics.totalTests.toString());
    core.setOutput('passed_tests', metrics.passedTests.toString());
    core.setOutput('failed_tests', metrics.failedTests.toString());
    core.setOutput('skipped_tests', metrics.skippedTests.toString());
    core.setOutput('pass_rate', metrics.passRate.toFixed(2));
    core.setOutput('total_duration', metrics.totalDuration.toFixed(2));
    core.setOutput('flaky_tests_count', metrics.flakyTests.length.toString());

    // Generate job summary
    if (detailedSummary) {
      const summaryReporter = new SummaryReporter();
      await summaryReporter.generateJobSummary(metrics, mergedHistoricalData, combinedData.framework.type, currentTrendData);
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
    if (error instanceof Error) {
      core.setFailed(`Action failed: ${error.message}`);
    } else {
      core.setFailed(`Action failed: ${error}`);
    }
    if (DEBUG) {
      console.error(error);
    }
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

// Run the action
run();
