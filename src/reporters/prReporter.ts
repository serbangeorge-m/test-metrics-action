
import * as core from '@actions/core';
import * as github from '@actions/github';

export async function annotatePullRequest(metrics: any, annotateOnly: boolean): Promise<void> {
  if (github.context.eventName !== 'pull_request') {
    return; // Only annotate on pull requests
  }

  const octokit = github.getOctokit(process.env.GITHUB_TOKEN || '');
  
  const comment = `## 🧪 Test Results
  
**Status:** ${metrics.passRate >= 95 ? '🟢 All tests passed' : metrics.passRate >= 80 ? '🟡 Some tests failed' : '🔴 Tests failing'}
**Pass Rate:** ${metrics.passRate.toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})
**Duration:** ${metrics.totalDuration.toFixed(1)}s
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
