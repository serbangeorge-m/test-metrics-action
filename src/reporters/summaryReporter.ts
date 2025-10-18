import * as core from '@actions/core';
import { TestMetrics, TrendData } from '../types';
import { TrendAnalyzer } from '../metrics/trends';
import { HtmlReporter } from './htmlReporter';

export class SummaryReporter {
  private trendAnalyzer: TrendAnalyzer;
  private htmlReporter: HtmlReporter;

  constructor() {
    this.trendAnalyzer = new TrendAnalyzer();
    this.htmlReporter = new HtmlReporter();
  }

  async generateJobSummary(
    metrics: TestMetrics,
    historicalData: TrendData[],
    framework: string,
    currentTrendData: TrendData
  ): Promise<void> {
    const htmlOutput = core.getBooleanInput('html_output');
    
    if (htmlOutput) {
      // Use HTML reporter for dashboard output
      await this.htmlReporter.generateHtmlSummary(metrics, historicalData, framework, currentTrendData);
      return;
    }

    // Generate markdown that matches HTML dashboard structure
    const summary = this.trendAnalyzer.getTrendSummary(metrics, historicalData, currentTrendData.matrixKey);
    const insights = this.trendAnalyzer.getPerformanceInsights(metrics, historicalData, currentTrendData.matrixKey);
    
    const summaryMarkdown = this.generateHtmlStructuredMarkdown(metrics, summary, insights, framework, historicalData);
    
    // Write to GitHub Actions job summary
    await core.summary
      .addRaw(summaryMarkdown)
      .write();
  }

  private generateSummaryTable(metrics: TestMetrics, summary: any): string {
    // Safety checks to prevent undefined errors
    const safeMetrics = {
      passRate: metrics?.passRate || 0,
      totalTests: metrics?.totalTests || 0,
      passedTests: metrics?.passedTests || 0,
      totalDuration: metrics?.totalDuration || 0,
      averageDuration: metrics?.averageDuration || 0,
      flakyTests: metrics?.flakyTests || []
    };
    
    const statusEmoji = this.getStatusEmoji(safeMetrics.passRate);
    const durationTrend = this.getTrendEmoji(summary?.durationTrend?.trend || 'stable');
    const passRateTrend = this.getTrendEmoji(summary?.passRateTrend?.trend || 'stable');
    
    // Format metrics with better visual presentation
    const testsStatus = `${safeMetrics.totalTests} tests`;
    const passRateValue = `${safeMetrics.passRate.toFixed(1)}%`;
    const durationValue = `${safeMetrics.totalDuration.toFixed(2)}s`;
    const avgDurValue = safeMetrics.averageDuration >= 1 ? 
      `${safeMetrics.averageDuration.toFixed(2)}s` : 
      `${(safeMetrics.averageDuration * 1000).toFixed(0)}ms`;
    const flakyValue = safeMetrics.flakyTests.length;
    
    // Format trend display - show "—" if no previous data
    const formatTrend = (trend: any) => {
      if (trend.previous === 0 && trend.current !== 0) {
        return `${this.getTrendEmoji(trend.trend)} New`;
      }
      return `${this.getTrendEmoji(trend.trend)} ${this.formatTrendValue(trend)}`;
    };
    
    return `**Overall Status:** ${statusEmoji} ${safeMetrics.passedTests}/${safeMetrics.totalTests} tests passed

| Metric | Current | Previous | Trend |
|:-------|:-------:|:--------:|:-----:|
| 📊 Tests | ${testsStatus} | ${summary?.testCountTrend?.previous || '0'} | ${formatTrend(summary?.testCountTrend)} |
| ✅ Pass Rate | ${passRateValue} | ${summary?.passRateTrend?.previous?.toFixed(1) || '0.0'}% | ${formatTrend(summary?.passRateTrend)} |
| ⏱️ Test Avg Duration | ${avgDurValue} | N/A | N/A |
| 🐛 Flaky | ${flakyValue} | ${summary?.flakyTestsTrend?.previous || '0'} | ${formatTrend(summary?.flakyTestsTrend)} |

\n`;
  }

  private generateExecutionDetails(metrics: TestMetrics): string {
    // Safety checks to prevent undefined errors
    const passed = metrics?.passedTests || 0;
    const failed = metrics?.failedTests || 0;
    const skipped = metrics?.skippedTests || 0;
    const total = metrics?.totalTests || 0;
    
    const passedPercent = total > 0 ? ((passed/total)*100).toFixed(1) : '0.0';
    const failedPercent = total > 0 ? ((failed/total)*100).toFixed(1) : '0.0';
    const skippedPercent = total > 0 ? ((skipped/total)*100).toFixed(1) : '0.0';
    
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

  private generateHtmlStructuredMarkdown(
    metrics: TestMetrics,
    summary: any,
    insights: string[],
    framework: string,
    historicalData: TrendData[]
  ): string {
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

    // Format duration for title
    const minutes = Math.floor(safeMetrics.totalDuration / 60);
    const seconds = (safeMetrics.totalDuration % 60).toFixed(2);
    const durationFormatted = `${minutes}m ${seconds.toString().padStart(5, '0')}s`;

    let markdown = `# 🧪 Test Metrics Report (${framework})\n\n`;
    
    // Test Execution Details Section (matching HTML structure)
    markdown += `## 📄 Test Execution Details (${safeMetrics.passedTests}/${safeMetrics.totalTests} Passed)\n\n`;
    
    markdown += `| Status | Count | Percentage |\n`;
    markdown += `|--------|-------|------------|\n`;
    markdown += `| 🟢 Passed | ${safeMetrics.passedTests} | ${safeMetrics.totalTests > 0 ? ((safeMetrics.passedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}% |\n`;
    
    if (safeMetrics.failedTests > 0) {
      markdown += `| 🔴 Failed | ${safeMetrics.failedTests} | ${safeMetrics.totalTests > 0 ? ((safeMetrics.failedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}% |\n`;
    }
    
    if (safeMetrics.skippedTests > 0) {
      markdown += `| 🟡 Skipped | ${safeMetrics.skippedTests} | ${safeMetrics.totalTests > 0 ? ((safeMetrics.skippedTests / safeMetrics.totalTests) * 100).toFixed(1) : '0.0'}% |\n`;
    }
    
    markdown += '\n';

    // Metrics Table (matching HTML structure exactly)
    markdown += `| Metric | Current | Previous | Trend |\n`;
    markdown += `|--------|---------|----------|-------|\n`;
    markdown += `| ■ Tests | ${safeMetrics.totalTests} tests | ${summary.testCountTrend?.previous || '0'} | ${this.formatMarkdownTrendBadge(summary.testCountTrend)} |\n`;
    markdown += `| ✓ Pass Rate | **${safeMetrics.passRate.toFixed(1)}%** | ${summary.passRateTrend?.previous?.toFixed(1) || '0.0'}% | ${this.formatMarkdownTrendBadge(summary.passRateTrend)} |\n`;
    markdown += `| ● Test Avg Duration | ${safeMetrics.averageDuration.toFixed(2)}s | N/A | N/A |\n`;
    markdown += `| ⚡️ Flaky | ${safeMetrics.flakyTests.length} | ${summary.flakyTestsTrend?.previous || '0'} | ${this.formatMarkdownTrendBadge(summary.flakyTestsTrend || { trend: 'stable', changePercent: 0 })} |\n`;
    
    if (slowestTest) {
      markdown += `| 🐌 Slowest Test<br/>${slowestTest.name} | **${slowestTest.duration.toFixed(2)}s** | N/A | N/A |\n`;
    }
    
    markdown += `| 📊 Performance Insights<br/>${performanceInsight} | N/A | N/A | N/A |\n`;
    
    markdown += '\n';

    // Additional sections if data exists (matching HTML behavior)
    if (safeMetrics.flakyTests.length > 0) {
      markdown += `## 🐛 Flaky Tests Detected\n\n`;
      markdown += this.generateFlakyTestsTable(safeMetrics.flakyTests);
      markdown += '\n';
    }

    if (metrics.failureCategories && metrics.failureCategories.length > 0) {
      markdown += `## ❌ Failure Analysis\n\n`;
      markdown += this.generateFailureCategoriesTable(metrics.failureCategories);
      markdown += '\n';
    }

    if (safeMetrics.slowTests.length > 1) {
      markdown += `## 🐌 Slowest Tests (Top ${Math.min(safeMetrics.slowTests.length, 10)})\n\n`;
      markdown += this.generateSlowTestsTable(safeMetrics.slowTests);
      markdown += '\n';
    }

    if (historicalData.length > 1) {
      markdown += `## 📊 Performance Trend (Last 7 Days)\n\n`;
      markdown += this.generateTrendChart(historicalData.slice(-7));
    }

    // Footer
    markdown += `\n---\n*Job summary generated at ${new Date().toLocaleString()}*\n`;

    return markdown;
  }

  private formatMarkdownTrendBadge(trend: any): string {
    if (!trend || (trend.previous === 0 && trend.current !== 0)) {
      return '➡️ **New**';
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
}
