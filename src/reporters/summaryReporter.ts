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
    framework: string
  ): Promise<void> {
    const summary = this.trendAnalyzer.getTrendSummary(metrics, historicalData);
    const insights = this.trendAnalyzer.getPerformanceInsights(metrics, historicalData);
    
    let summaryMarkdown = `# 🧪 Test Metrics Report (${framework})\n\n`;
    
    // Main summary table
    summaryMarkdown += this.generateSummaryTable(metrics, summary);
    
    // Test execution details
    summaryMarkdown += `\n## 📈 Test Execution Details\n\n`;
    summaryMarkdown += this.generateExecutionDetails(metrics);
    
    // Combined Performance & Slowest Tests section
    if (metrics.slowTests.length > 0 || insights.length > 0) {
      summaryMarkdown += `\n## 🐌 Performance Analysis\n\n`;
      
      // Performance insights
      if (insights.length > 0) {
        insights.forEach(insight => {
          summaryMarkdown += `- ${insight}\n`;
        });
        summaryMarkdown += '\n';
      }
      
      // Slowest tests table
      if (metrics.slowTests.length > 0) {
        summaryMarkdown += `**Slowest Tests (Top 5%):**\n\n`;
        summaryMarkdown += this.generateSlowTestsTable(metrics.slowTests);
      }
    }
    
    // Flaky tests section
    if (metrics.flakyTests.length > 0) {
      summaryMarkdown += `\n## 🐛 Flaky Tests Detected\n\n`;
      summaryMarkdown += this.generateFlakyTestsTable(metrics.flakyTests);
    }
    
    // Failure categories
    if (metrics.failureCategories.length > 0) {
      summaryMarkdown += `\n## ❌ Failure Analysis\n\n`;
      summaryMarkdown += this.generateFailureCategoriesTable(metrics.failureCategories);
    }
    
    // Trend chart (simple ASCII)
    if (historicalData.length > 1) {
      summaryMarkdown += `\n## 📊 Performance Trend (Last 7 Days)\n\n`;
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
    
    return `| Metric | Current | Previous | Change | Status |
|--------|---------|----------|--------|--------|
| **Tests** | ${metrics.totalTests} | ${summary.testCountTrend.previous} | ${this.formatChange(summary.testCountTrend)} | ${this.getTrendEmoji(summary.testCountTrend.trend)} |
| **Pass Rate** | ${metrics.passRate.toFixed(1)}% | ${summary.passRateTrend.previous.toFixed(1)}% | ${this.formatChange(summary.passRateTrend)} | ${passRateTrend} |
| **Duration** | ${metrics.totalDuration.toFixed(2)}s | ${summary.durationTrend.previous.toFixed(2)}s | ${this.formatChange(summary.durationTrend)} | ${durationTrend} |
| **Flaky Tests** | ${metrics.flakyTests.length} | ${summary.flakyTestsTrend.previous} | ${this.formatChange(summary.flakyTestsTrend)} | ${this.getTrendEmoji(summary.flakyTestsTrend.trend)} |

**Overall Status:** ${statusEmoji} ${metrics.passedTests}/${metrics.totalTests} tests passed\n\n`;
  }

  private generateExecutionDetails(metrics: TestMetrics): string {
    const passed = metrics.passedTests;
    const failed = metrics.failedTests;
    const skipped = metrics.skippedTests;
    const total = metrics.totalTests;
    
    const passedPercent = ((passed/total)*100).toFixed(1);
    const failedPercent = ((failed/total)*100).toFixed(1);
    const skippedPercent = ((skipped/total)*100).toFixed(1);
    
    // Format average duration (in seconds from calculator)
    const avgDur = metrics.averageDuration;
    const displayAvgDur = avgDur >= 1 ? avgDur.toFixed(2) : (avgDur * 1000).toFixed(0);
    const avgDurUnit = avgDur >= 1 ? 's' : 'ms';
    
    return `
### Test Results Breakdown
- **Passed:** <span style="color: #22c55e;">**${passed}** (${passedPercent}%)</span>
- **Failed:** <span style="color: #ef4444;">**${failed}** (${failedPercent}%)</span>
- **Skipped:** <span style="color: #f59e0b;">**${skipped}** (${skippedPercent}%)</span>

**Average test duration:** ${displayAvgDur}${avgDurUnit}
`;
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

  private generateProgressBar(value: number, total: number, emoji: string): string {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    const barLength = Math.round(percentage / 5); // 20 chars max
    return emoji.repeat(barLength) + '░'.repeat(Math.max(0, 20 - barLength));
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

  private formatChange(trend: any): string {
    const sign = trend.change > 0 ? '+' : '';
    return `${sign}${trend.change.toFixed(1)} (${sign}${trend.changePercent.toFixed(1)}%)`;
  }
}
