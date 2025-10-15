import { TestMetrics, TrendData, PerformanceTrend } from '../types';

export class TrendAnalyzer {
  analyzeTrends(currentMetrics: TestMetrics, historicalData: TrendData[]): PerformanceTrend {
    if (historicalData.length === 0) {
      return {
        current: currentMetrics.totalDuration,
        previous: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable'
      };
    }

    // Get the most recent historical data
    const latestHistorical = historicalData[historicalData.length - 1];
    const previousDuration = latestHistorical.metrics.totalDuration;
    const currentDuration = currentMetrics.totalDuration;
    
    const change = currentDuration - previousDuration;
    const changePercent = previousDuration > 0 ? (change / previousDuration) * 100 : 0;
    
    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    
    // Consider it improving if duration decreased by more than 5%
    if (changePercent < -5) {
      trend = 'improving';
    }
    // Consider it declining if duration increased by more than 10%
    else if (changePercent > 10) {
      trend = 'declining';
    }

    return {
      current: currentDuration,
      previous: previousDuration,
      change,
      changePercent,
      trend
    };
  }

  getTrendSummary(currentMetrics: TestMetrics, historicalData: TrendData[]): {
    durationTrend: PerformanceTrend;
    passRateTrend: PerformanceTrend;
    testCountTrend: PerformanceTrend;
    flakyTestsTrend: PerformanceTrend;
  } {
    const latest = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
    
    const durationTrend = this.analyzeTrends(currentMetrics, historicalData);
    
    const passRateTrend: PerformanceTrend = latest ? {
      current: currentMetrics.passRate,
      previous: latest.metrics.passRate,
      change: currentMetrics.passRate - latest.metrics.passRate,
      changePercent: latest.metrics.passRate > 0 ? 
        ((currentMetrics.passRate - latest.metrics.passRate) / latest.metrics.passRate) * 100 : 0,
      trend: this.determineTrend(currentMetrics.passRate, latest.metrics.passRate)
    } : {
      current: currentMetrics.passRate,
      previous: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable'
    };

    const testCountTrend: PerformanceTrend = latest ? {
      current: currentMetrics.totalTests,
      previous: latest.metrics.totalTests,
      change: currentMetrics.totalTests - latest.metrics.totalTests,
      changePercent: latest.metrics.totalTests > 0 ? 
        ((currentMetrics.totalTests - latest.metrics.totalTests) / latest.metrics.totalTests) * 100 : 0,
      trend: this.determineTrend(currentMetrics.totalTests, latest.metrics.totalTests)
    } : {
      current: currentMetrics.totalTests,
      previous: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable'
    };

    const flakyTestsTrend: PerformanceTrend = latest ? {
      current: currentMetrics.flakyTests.length,
      previous: latest.metrics.flakyTests.length,
      change: currentMetrics.flakyTests.length - latest.metrics.flakyTests.length,
      changePercent: latest.metrics.flakyTests.length > 0 ? 
        ((currentMetrics.flakyTests.length - latest.metrics.flakyTests.length) / latest.metrics.flakyTests.length) * 100 : 0,
      trend: this.determineTrend(currentMetrics.flakyTests.length, latest.metrics.flakyTests.length)
    } : {
      current: currentMetrics.flakyTests.length,
      previous: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable'
    };

    return {
      durationTrend,
      passRateTrend,
      testCountTrend,
      flakyTestsTrend
    };
  }

  private determineTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
    const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    
    if (changePercent < -5) return 'improving';
    if (changePercent > 5) return 'declining';
    return 'stable';
  }

  getPerformanceInsights(currentMetrics: TestMetrics, historicalData: TrendData[]): string[] {
    const insights: string[] = [];
    const summary = this.getTrendSummary(currentMetrics, historicalData);

    // Duration insights
    if (summary.durationTrend.trend === 'declining') {
      insights.push(`⚠️ Test execution time increased by ${summary.durationTrend.changePercent.toFixed(1)}%`);
    } else if (summary.durationTrend.trend === 'improving') {
      insights.push(`✅ Test execution time improved by ${Math.abs(summary.durationTrend.changePercent).toFixed(1)}%`);
    }

    // Pass rate insights
    if (summary.passRateTrend.trend === 'declining') {
      insights.push(`📉 Pass rate decreased by ${Math.abs(summary.passRateTrend.changePercent).toFixed(1)}%`);
    } else if (summary.passRateTrend.trend === 'improving') {
      insights.push(`📈 Pass rate improved by ${summary.passRateTrend.changePercent.toFixed(1)}%`);
    }

    // Flaky tests insights
    if (summary.flakyTestsTrend.trend === 'declining') {
      insights.push(`🐛 Flaky tests increased by ${summary.flakyTestsTrend.change} (${summary.flakyTestsTrend.changePercent.toFixed(1)}%)`);
    } else if (summary.flakyTestsTrend.trend === 'improving') {
      insights.push(`🎯 Flaky tests decreased by ${Math.abs(summary.flakyTestsTrend.change)}`);
    }

    // Slow tests insights
    if (currentMetrics.slowTests.length > 0) {
      insights.push(`🐌 ${currentMetrics.slowTests.length} tests are in the slowest 5% (${(currentMetrics.slowTests[0].duration / 1000).toFixed(1)}s+)`);
    }

    return insights;
  }
}
