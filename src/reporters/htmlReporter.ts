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
    
    const htmlContent = this.generateHtmlContent(metrics, summary, insights, framework);
    
    // Write to GitHub Actions job summary
    await core.summary
      .addRaw(htmlContent)
      .write();
  }

  private generateHtmlContent(metrics: TestMetrics, summary: any, insights: string[], framework: string): string {
    const testData = {
      passed: metrics.passedTests,
      failed: metrics.failedTests,
      skipped: metrics.skippedTests,
      durationInSeconds: metrics.totalDuration
    };

    const slowestTest = metrics.slowTests.length > 0 ? metrics.slowTests[0] : null;
    const performanceInsight = insights.length > 0 ? insights[0] : 'No significant changes detected';
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Metrics Report (${framework})</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
    </style>
    <script>
      tailwind.config = {
        theme: {
          extend: {
            colors: {
              'gray': {
                900: '#1a1d21',
                800: '#272b30',
                700: '#3c4147',
                400: '#9ca3af',
                300: '#d1d5db',
                200: '#e5e7eb',
              }
            }
          }
        }
      }
    </script>
</head>
<body class="bg-gray-900 text-gray-300 antialiased">

    <div class="container mx-auto p-4 sm:p-6 md:p-8">
        <div class="max-w-5xl mx-auto bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">

            <!-- Section: Test Execution Details -->
            <section class="mb-8">
                <h2 id="execution-details-title" class="text-xl font-semibold mb-4 text-gray-200 border-b border-gray-700 pb-2 flex items-center"><span class="text-xl mr-3">📄</span>Test Execution Details</h2>
                <div class="overflow-x-auto">
                    <table class="min-w-full text-left">
                        <thead>
                            <tr>
                                <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Count</th>
                                <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Percentage</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                            <tr>
                                <td class="py-3 px-4 text-green-400 font-semibold flex items-center"><span class="w-3 h-3 bg-green-400 rounded-full mr-3"></span>Passed</td>
                                <td class="py-3 px-4" id="passed-count">${testData.passed}</td>
                                <td class="py-3 px-4" id="passed-percentage">${((testData.passed / metrics.totalTests) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr id="failed-row" style="display: ${testData.failed > 0 ? 'table-row' : 'none'};">
                                <td class="py-3 px-4 text-red-400 font-semibold flex items-center"><span class="w-3 h-3 bg-red-400 rounded-full mr-3"></span>Failed</td>
                                <td class="py-3 px-4" id="failed-count">${testData.failed}</td>
                                <td class="py-3 px-4" id="failed-percentage">${((testData.failed / metrics.totalTests) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr id="skipped-row" style="display: ${testData.skipped > 0 ? 'table-row' : 'none'};">
                                <td class="py-3 px-4 text-gray-400 font-semibold flex items-center"><span class="w-3 h-3 bg-gray-400 rounded-full mr-3"></span>Skipped</td>
                                <td class="py-3 px-4" id="skipped-count">${testData.skipped}</td>
                                <td class="py-3 px-4" id="skipped-percentage">${((testData.skipped / metrics.totalTests) * 100).toFixed(1)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            <!-- Metrics Table -->
            <div class="overflow-x-auto mb-8">
                <table class="min-w-full text-left">
                    <thead>
                        <tr>
                            <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Metric</th>
                            <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Current</th>
                            <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Previous</th>
                            <th class="py-3 px-4 text-sm font-medium text-gray-400 uppercase tracking-wider">Trend</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-700">
                        <tr>
                            <td class="py-3 px-4 flex items-center"><span class="text-green-400 mr-3">■</span>Tests</td>
                            <td class="py-3 px-4">${metrics.totalTests} tests</td>
                            <td class="py-3 px-4">${summary.testCountTrend.previous || '0'}</td>
                            <td class="py-3 px-4">${this.formatTrendBadge(summary.testCountTrend)}</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 flex items-center"><span class="text-green-400 mr-3">✓</span>Pass Rate</td>
                            <td class="py-3 px-4 font-semibold ${metrics.passRate >= 95 ? 'text-green-400' : metrics.passRate >= 80 ? 'text-yellow-400' : 'text-red-400'}">${metrics.passRate.toFixed(1)}%</td>
                            <td class="py-3 px-4">${summary.passRateTrend.previous?.toFixed(1) || '0.0'}%</td>
                            <td class="py-3 px-4">${this.formatTrendBadge(summary.passRateTrend)}</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 flex items-center"><span class="text-blue-400 mr-3">●</span>Duration</td>
                            <td class="py-3 px-4">${testData.durationInSeconds.toFixed(2)}s</td>
                            <td class="py-3 px-4">${summary.durationTrend.previous?.toFixed(2) || '0.00'}s</td>
                            <td class="py-3 px-4">${this.formatTrendBadge(summary.durationTrend)}</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 flex items-center"><span class="text-blue-400 mr-3">●</span>Avg Duration</td>
                            <td class="py-3 px-4">${metrics.averageDuration.toFixed(2)}s</td>
                            <td class="py-3 px-4">—</td>
                            <td class="py-3 px-4">—</td>
                        </tr>
                        <tr>
                            <td class="py-3 px-4 flex items-center"><span class="text-yellow-400 mr-3">⚡️</span>Flaky</td>
                            <td class="py-3 px-4">${metrics.flakyTests.length}</td>
                            <td class="py-3 px-4">${summary.flakyTestsTrend?.previous || '0'}</td>
                            <td class="py-3 px-4">${this.formatTrendBadge(summary.flakyTestsTrend || { trend: 'stable', changePercent: 0 })}</td>
                        </tr>
                        ${slowestTest ? `
                        <tr>
                            <td class="py-3 px-4 align-top">
                                <div class="flex items-center"><span class="mr-3">🐌</span>Slowest Test</div>
                                <div class="text-sm text-gray-400 mt-1 pl-7">${slowestTest.name}</div>
                            </td>
                            <td class="py-3 px-4 font-semibold text-gray-200 align-top">${slowestTest.duration.toFixed(2)}s</td>
                            <td class="py-3 px-4 align-top">—</td>
                            <td class="py-3 px-4 align-top">—</td>
                        </tr>
                        ` : ''}
                        <tr>
                            <td class="py-3 px-4 align-top">
                                <div class="flex items-center"><span class="mr-3">📊</span>Performance Insights</div>
                                <div class="text-sm text-gray-400 mt-1 pl-7">${performanceInsight}</div>
                            </td>
                            <td class="py-3 px-4 align-top">—</td>
                            <td class="py-3 px-4 align-top">—</td>
                            <td class="py-3 px-4 align-top">—</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Footer -->
            <footer class="mt-8 pt-4 border-t border-gray-700">
                <p class="text-xs text-gray-500 italic">Job summary generated at ${new Date().toLocaleString()}</p>
            </footer>

        </div>
    </div>

    <script>
        // Dynamic title update
        document.addEventListener('DOMContentLoaded', () => {
            const testResults = {
                passed: ${testData.passed},
                failed: ${testData.failed}, 
                skipped: ${testData.skipped},
                durationInSeconds: ${testData.durationInSeconds}
            };

            const totalTests = testResults.passed + testResults.failed + testResults.skipped;
            if (totalTests === 0) return;

            const executionTitleEl = document.getElementById('execution-details-title');
            
            // Format duration
            const totalSeconds = testResults.durationInSeconds;
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = (totalSeconds % 60).toFixed(2);
            const durationFormatted = \`\${minutes}m \${seconds.toString().padStart(5, '0')}s\`;

            // Update Title
            executionTitleEl.innerHTML = \`<span class="text-xl mr-3">📄</span>Test Execution Details (<span class="text-white font-bold">\${testResults.passed}/\${totalTests}</span>&nbsp;<span class="text-white">Passed</span>) <span class="text-white font-bold">[\${durationFormatted}]</span>\`;
        });
    </script>

</body>
</html>`;
  }

  private formatTrendBadge(trend: any): string {
    if (!trend || (trend.previous === 0 && trend.current !== 0)) {
      return '<span class="bg-blue-900/70 text-blue-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">➡️ New</span>';
    }

    const changePercent = trend.changePercent || 0;
    
    if (changePercent > 5) {
      return `<span class="bg-red-900/70 text-red-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">📈 +${changePercent.toFixed(1)}%</span>`;
    } else if (changePercent < -5) {
      return `<span class="bg-green-900/70 text-green-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">📉 ${changePercent.toFixed(1)}%</span>`;
    } else {
      return `<span class="bg-gray-900/70 text-gray-300 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full">➡️ ${changePercent.toFixed(1)}%</span>`;
    }
  }
}
