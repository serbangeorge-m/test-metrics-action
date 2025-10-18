import * as core from '@actions/core';
import { TestMetrics, TrendData } from '../types';
import { TrendAnalyzer } from '../metrics/trends';

export class SummaryReporter {
  private trendAnalyzer: TrendAnalyzer;

  constructor() {
    this.trendAnalyzer = new TrendAnalyzer();
  }

  async generateJobSummary(
    metrics: TestMetrics,
    historicalData: TrendData[],
    framework: string,
    currentTrendData: TrendData
  ): Promise<void> {
    const summary = this.trendAnalyzer.getTrendSummary(metrics, historicalData, currentTrendData.matrixKey);
    const insights = this.trendAnalyzer.getPerformanceInsights(metrics, historicalData, currentTrendData.matrixKey);
    
    let summaryMarkdown = `## 🧪 Test Metrics Report (${framework})\n\n`;
    
    // Main summary table (most important - overall status)
    summaryMarkdown += this.generateSummaryTable(metrics, summary);
    
    // Test execution details
    summaryMarkdown += `## 📈 Test Execution Details\n`;
    summaryMarkdown += this.generateExecutionDetails(metrics);
    
    // Performance insights
    summaryMarkdown += `## 📊 Performance Insights\n`;
    if (insights.length > 0) {
      insights.forEach(insight => {
        summaryMarkdown += `- ${insight}\n`;
      });
    } else {
      summaryMarkdown += `- No significant changes detected\n`;
    }
    summaryMarkdown += '\n';
    
    // Failure categories FIRST (most urgent - what broke)
    if (metrics.failureCategories.length > 0) {
      summaryMarkdown += `## ❌ Failure Analysis\n`;
      summaryMarkdown += this.generateFailureCategoriesTable(metrics.failureCategories);
      summaryMarkdown += '\n';
    }
    
    // Flaky tests SECOND (unreliable tests need attention)
    if (metrics.flakyTests.length > 0) {
      summaryMarkdown += `## 🐛 Flaky Tests Detected\n`;
      summaryMarkdown += this.generateFlakyTestsTable(metrics.flakyTests);
      summaryMarkdown += '\n';
    }
    
    // Performance & Slowest Tests THIRD (less urgent than failures)
    if (metrics.slowTests.length > 0) {
      summaryMarkdown += `## 🐌 Slowest Tests (Top ${metrics.slowTests.length})\n`;
      summaryMarkdown += this.generateSlowTestsTable(metrics.slowTests);
      summaryMarkdown += '\n';
    }
    
    // Trend chart LAST (historical data is least urgent)
    if (historicalData.length > 1) {
      summaryMarkdown += `## 📊 Performance Trend (Last 7 Days)\n`;
      summaryMarkdown += this.generateTrendChart(historicalData.slice(-7));
    }
    
    // Write to GitHub Actions job summary
    await core.summary
      .addRaw(summaryMarkdown)
      .write();
  }

  private generateSummaryTable(metrics: TestMetrics, summary: any): string {
    const statusEmoji = this.getStatusEmoji(metrics.passRate);
    const durationTrend = this.getTrendEmoji(summary.durationTrend.trend);
    const passRateTrend = this.getTrendEmoji(summary.passRateTrend.trend);
    
    // Format metrics with better visual presentation
    const testsStatus = `${metrics.totalTests} tests`;
    const passRateValue = `${metrics.passRate.toFixed(1)}%`;
    const durationValue = `${metrics.totalDuration.toFixed(2)}s`;
    const avgDurValue = metrics.averageDuration >= 1 ? 
      `${metrics.averageDuration.toFixed(2)}s` : 
      `${(metrics.averageDuration * 1000).toFixed(0)}ms`;
    const flakyValue = metrics.flakyTests.length;
    
    // Format trend display - show "—" if no previous data
    const formatTrend = (trend: any) => {
      if (trend.previous === 0 && trend.current !== 0) {
        return `${this.getTrendEmoji(trend.trend)} New`;
      }
      return `${this.getTrendEmoji(trend.trend)} ${this.formatTrendValue(trend)}`;
    };
    
    return `**Overall Status:** ${statusEmoji} ${metrics.passedTests}/${metrics.totalTests} tests passed

| Metric | Current | Previous | Trend |
|:-------|:-------:|:--------:|:-----:|
| 📊 Tests | ${testsStatus} | ${summary.testCountTrend.previous} | ${formatTrend(summary.testCountTrend)} |
| ✅ Pass Rate | ${passRateValue} | ${summary.passRateTrend.previous.toFixed(1)}% | ${formatTrend(summary.passRateTrend)} |
| ⏱️ Duration | ${durationValue} | ${summary.durationTrend.previous.toFixed(2)}s | ${formatTrend(summary.durationTrend)} |
| ⏱️ Avg Duration | ${avgDurValue} | — | — |
| 🐛 Flaky | ${flakyValue} | ${summary.flakyTestsTrend.previous} | ${formatTrend(summary.flakyTestsTrend)} |

\n`;
  }

  private generateExecutionDetails(metrics: TestMetrics): string {
    const passed = metrics.passedTests;
    const failed = metrics.failedTests;
    const skipped = metrics.skippedTests;
    const total = metrics.totalTests;
    
    const passedPercent = ((passed/total)*100).toFixed(1);
    const failedPercent = ((failed/total)*100).toFixed(1);
    const skippedPercent = ((skipped/total)*100).toFixed(1);
    
    let table = `| Status | Count | Percentage |\n`;
    table += `|--------|-------|------------|\n`;
    table += `| 🟢 Passed | ${passed} | ${passedPercent}% |\n`;
    
    if (failed > 0) {
      table += `| 🔴 Failed | ${failed} | ${failedPercent}% |\n`;
    }
    
    if (skipped > 0) {
      table += `| 🟡 Skipped | ${skipped} | ${skippedPercent}% |\n`;
    }
    
    return table + '\n';
  }

  private generateFlakyTestsTable(flakyTests: any[]): string {
    let table = `| Test Name | Flakiness Score | Retry Count | Pattern |\n`;
    table += `|-----------|-----------------|-------------|----------|\n`;
    
    flakyTests.slice(0, 10).forEach(test => {
      const score = (test.flakinessScore * 100).toFixed(0);
      table += `| ${test.name} | ${score}% | ${test.retryCount} | ${test.failurePattern} |\n`;
    });
    
    if (flakyTests.length > 10) {
      table += `\n*... and ${flakyTests.length - 10} more flaky tests*\n`;
    }
    
    return table;
  }

  private generateSlowTestsTable(slowTests: any[]): string {
    let table = `| Test Name | Duration | Suite |\n`;
    table += `|-----------|----------|-------|\n`;
    
    slowTests.slice(0, 10).forEach(test => {
      // Duration is stored in seconds from XML, display appropriately
      const durationSec = test.duration;
      const displayDuration = durationSec >= 1 ? durationSec.toFixed(2) : (durationSec * 1000).toFixed(0);
      const unit = durationSec >= 1 ? 's' : 'ms';
      table += `| ${test.name} | ${displayDuration}${unit} | ${test.suite} |\n`;
    });
    
    return table;
  }

  private generateFailureCategoriesTable(categories: any[]): string {
    let table = `| Category | Count | Percentage | Tests |\n`;
    table += `|----------|-------|------------|-------|\n`;
    
    categories.forEach(category => {
      const testList = category.tests.slice(0, 3).join(', ');
      const more = category.tests.length > 3 ? ` +${category.tests.length - 3} more` : '';
      table += `| ${category.type} | ${category.count} | ${category.percentage.toFixed(1)}% | ${testList}${more} |\n`;
    });
    
    return table;
  }

  private generateTrendChart(historicalData: TrendData[]): string {
    if (historicalData.length < 2) return 'Not enough data for trend chart\n';
    
    const durations = historicalData.map(d => d.metrics.totalDuration);
    const minDuration = Math.min(...durations);
    const maxDuration = Math.max(...durations);
    const range = maxDuration - minDuration;
    
    if (range === 0) return 'No variation in test duration\n';
    
    let chart = '```\n';
    chart += 'Duration Trend (seconds):\n';
    
    durations.forEach((duration, index) => {
      const normalized = (duration - minDuration) / range;
      const barLength = Math.round(normalized * 20);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      const date = new Date(historicalData[index].timestamp).toLocaleDateString();
      chart += `${date}: ${bar} ${(duration / 1000).toFixed(1)}s\n`;
    });
    
    chart += '```\n';
    return chart;
  }

  private getStatusEmoji(passRate: number): string {
    if (passRate >= 95) return '🟢';
    if (passRate >= 80) return '🟡';
    return '🔴';
  }

  private getTrendEmoji(trend: string): string {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  }

  private formatTrendValue(trend: any): string {
    const sign = trend.changePercent > 0 ? '+' : '';
    return `${sign}${trend.changePercent.toFixed(1)}%`;
  }
}
