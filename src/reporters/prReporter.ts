
import * as core from '@actions/core';
import * as github from '@actions/github';

export async function annotatePullRequest(metrics: any, annotateOnly: boolean): Promise<void> {
  if (github.context.eventName !== 'pull_request') {
    return; // Only annotate on pull requests
  }

  // Safety checks for metrics
  const safeMetrics = {
    passRate: metrics?.passRate || 0,
    passedTests: metrics?.passedTests || 0,
    totalTests: metrics?.totalTests || 0,
    failedTests: metrics?.failedTests || 0,
    totalDuration: metrics?.totalDuration || 0,
    flakyTests: metrics?.flakyTests || []
  };

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '');
  
  const comment = `## 🧪 Test Results
  
**Status:** ${safeMetrics.passRate >= 95 ? '🟢 All tests passed' : safeMetrics.passRate >= 80 ? '🟡 Some tests failed' : '🔴 Tests failing'}
**Pass Rate:** ${safeMetrics.passRate.toFixed(1)}% (${safeMetrics.passedTests}/${safeMetrics.totalTests})
**Duration:** ${safeMetrics.totalDuration.toFixed(1)}s
${safeMetrics.flakyTests.length > 0 ? `**Flaky Tests:** ${safeMetrics.flakyTests.length}` : ''}

${safeMetrics.failedTests > 0 ? `⚠️ ${safeMetrics.failedTests} test(s) failed` : '✅ All tests passed!'}`;

  try {
    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      body: comment
    });
  } catch (error) {
    if (error instanceof Error) {
      core.warning(`Failed to create PR comment: ${error.message}`);
    } else {
      core.warning(`Failed to create PR comment: ${String(error)}`);
    }
    if (process.env.RUNNER_DEBUG === '1') {
      console.error(error);
    }
  }
}
