import * as core from '@actions/core';
import { TestMetrics, TrendData } from '../types';
import { TrendAnalyzer } from '../metrics/trends';

export class HtmlReporter {
  private trendAnalyzer: TrendAnalyzer;

  constructor() {
    this.trendAnalyzer = new TrendAnalyzer();
  }

  async generateHtmlSummary(
    metrics: TestMetrics,
    historicalData: TrendData[],
    framework: string,
    currentTrendData: TrendData
  ): Promise<void> {
    const summary = this.trendAnalyzer.getTrendSummary(metrics, historicalData, currentTrendData.matrixKey);
    const insights = this.trendAnalyzer.getPerformanceInsights(metrics, historicalData, currentTrendData.matrixKey);
    
    // GitHub Actions Job Summary doesn't support full HTML with external scripts
    // So we'll generate enhanced markdown with HTML-style structure
    const markdownContent = this.generateEnhancedMarkdown(metrics, summary, insights, framework);
    
    // Write to GitHub Actions job summary
    await core.summary
      .addRaw(markdownContent)
      .write();
  }

  private generateEnhancedMarkdown(metrics: TestMetrics, summary: any, insights: string[], framework: string): string {
    // Safety checks to prevent undefined errors
    const safeMetrics = {
      passedTests: metrics?.passedTests || 0,
      failedTests: metrics?.failedTests || 0,
      skippedTests: metrics?.skippedTests || 0,
      totalTests: metrics?.totalTests || 0,
      totalDuration: metrics?.totalDuration || 0,
      averageDuration: metrics?.averageDuration || 0,
      passRate: metrics?.passRate || 0,
      flakyTests: metrics?.flakyTests || [],
      slowTests: metrics?.slowTests || []
    };

    const slowestTest = safeMetrics.slowTests.length > 0 ? safeMetrics.slowTests[0] : null;
    const performanceInsight = insights.length > 0 ? insights[0] : 'No significant changes detected';

    let markdown = `# 🎨 Test Metrics Dashboard (${framework})

## 📄 Test Execution Details (${safeMetrics.passedTests}/${safeMetrics.totalTests} Passed) [${this.formatDuration(safeMetrics.totalDuration)}]

<table>
<tr><th>Status</th><th>Count</th><th>Percentage</th></tr>
<tr><td>🟢 <b>Passed</b></td><td><b>${safeMetrics.passedTests}</b></td><td><b>${safeMetrics.totalTests > 0 ? ((safeMetrics.passedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}%</b></td></tr>`;

    if (safeMetrics.failedTests > 0) {
      markdown += `\n<tr><td>🔴 <b>Failed</b></td><td><b>${safeMetrics.failedTests}</b></td><td><b>${safeMetrics.totalTests > 0 ? ((safeMetrics.failedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}%</b></td></tr>`;
    }
    
    if (safeMetrics.skippedTests > 0) {
      markdown += `\n<tr><td>🟡 <b>Skipped</b></td><td><b>${safeMetrics.skippedTests}</b></td><td><b>${safeMetrics.totalTests > 0 ? ((safeMetrics.skippedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}%</b></td></tr>`;
    }

    markdown += `\n</table>

## 📊 Detailed Metrics

<table>
<tr><th>Metric</th><th>Current</th><th>Previous</th><th>Trend</th></tr>
<tr><td>■ <b>Tests</b></td><td>${safeMetrics.totalTests} tests</td><td>${summary.testCountTrend?.previous || '0'}</td><td>${this.formatTrendBadge(summary.testCountTrend)}</td></tr>
<tr><td>✓ <b>Pass Rate</b></td><td><b>${this.getPassRateColor(safeMetrics.passRate)}${safeMetrics.passRate.toFixed(1)}%</b></td><td>${summary.passRateTrend?.previous?.toFixed(1) || '0.0'}%</td><td>${this.formatTrendBadge(summary.passRateTrend)}</td></tr>
<tr><td>● <b>Duration</b></td><td>${safeMetrics.totalDuration.toFixed(2)}s</td><td>${summary.durationTrend?.previous?.toFixed(2) || '0.00'}s</td><td>${this.formatTrendBadge(summary.durationTrend)}</td></tr>
<tr><td>● <b>Avg Duration</b></td><td>${safeMetrics.averageDuration.toFixed(2)}s</td><td>—</td><td>—</td></tr>
<tr><td>⚡️ <b>Flaky</b></td><td>${safeMetrics.flakyTests.length}</td><td>${summary.flakyTestsTrend?.previous || '0'}</td><td>${this.formatTrendBadge(summary.flakyTestsTrend || { trend: 'stable', changePercent: 0 })}</td></tr>`;

    if (slowestTest) {
      markdown += `\n<tr><td>🐌 <b>Slowest Test</b><br/><small>${slowestTest.name}</small></td><td><b>${slowestTest.duration.toFixed(2)}s</b></td><td>—</td><td>—</td></tr>`;
    }
    
    markdown += `\n<tr><td>📊 <b>Performance Insights</b><br/><small>${performanceInsight}</small></td><td>—</td><td>—</td><td>—</td></tr>
</table>

---
> 🎨 **Enhanced Dashboard View** • *Generated at ${new Date().toLocaleString()}*`;

    return markdown;
  }

  private formatTrendBadge(trend: any): string {
    if (!trend || (trend.previous === 0 && trend.current !== 0)) {
      return '🆕 **New**';
    }

    const changePercent = trend.changePercent || 0;
    
    if (changePercent > 5) {
      return `📈 **+${changePercent.toFixed(1)}%**`;
    } else if (changePercent < -5) {
      return `📉 **${changePercent.toFixed(1)}%**`;
    } else {
      return `➡️ ${changePercent.toFixed(1)}%`;
    }
  }

  private getPassRateColor(passRate: number): string {
    if (passRate >= 95) return '🟢 ';
    if (passRate >= 80) return '🟡 ';
    return '🔴 ';
  }

  private formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(2);
    return `${minutes}m ${remainingSeconds.toString().padStart(5, '0')}s`;
  }
}