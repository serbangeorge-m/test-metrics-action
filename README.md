# 🧪 Test Metrics Reporter

[![GitHub Marketplace](https://img.shields.io/badge/GitHub%20Marketplace-Test%20Metrics%20Reporter-blue?logo=github)](https://github.com/marketplace/actions/test-metrics-reporter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

Advanced test metrics and visual reporting for Jest, Playwright, and JUnit tests with trend analysis and flakiness detection.

## ✨ Features

- 🎯 **Multi-framework Support**: Jest, Playwright, and JUnit XML reports
- 📊 **Advanced Metrics**: Flakiness detection, performance analysis, failure categorization
- 📈 **Trend Tracking**: Historical comparison with performance insights
- 🎨 **Visual Reports**: Rich GitHub Actions job summaries with charts and tables
- 🔄 **Drop-in Replacement**: Compatible with `mikepenz/action-junit-report`

## 🚀 Quick Start

### Basic Usage

```yaml
- name: Publish Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  if: always()
  with:
    report_paths: '**/*results.xml'
    fail_on_failure: true
    detailed_summary: true
```

### Advanced Configuration

```yaml
- name: Run Tests
  run: |
    npm test -- --json --outputFile=test-results.json
    npx playwright test --reporter=json --output-file=playwright-results.json

- name: Publish Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  if: always()
  with:
    report_paths: 'test-results.json,playwright-results.json'
    test_framework: 'auto'
    detailed_summary: true
    retention_days: 30
    cache_key_prefix: 'my-project-tests'
```

## 📊 Advanced Metrics

### Flakiness Detection
- Identifies tests that fail intermittently
- Scores tests based on retry patterns and error types
- Highlights network and timeout-related flakiness

### Performance Analysis
- Tracks test execution time trends
- Identifies slowest tests (95th percentile)
- Compares performance across runs

### Failure Categorization
- Groups failures by type: timeout, assertion, setup, network, other
- Provides insights into common failure patterns
- Helps prioritize test improvements

### Trend Analysis
- Historical comparison of test metrics
- Performance regression detection
- Pass rate trend monitoring
- Visual trend charts in job summaries

## 🎨 Visual Reports

The action generates rich job summaries with:

- 📊 **Summary Table**: Current vs previous run comparison
- �� **Performance Insights**: Automated analysis of trends
- 🐛 **Flaky Tests Section**: Detailed flakiness analysis
- 🐌 **Slow Tests**: Performance bottleneck identification
- ❌ **Failure Analysis**: Categorized failure breakdown
- 📊 **Trend Charts**: Visual performance trends

## 🔧 Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `report_paths` | Path to test result files | Yes | `**/*results.xml` |
| `test_framework` | Test framework type (auto, jest, playwright, junit) | No | `auto` |
| `detailed_summary` | Include detailed summary in job summary | No | `true` |
| `fail_on_failure` | Fail action if tests failed | No | `true` |
| `retention_days` | Days to retain trend data | No | `30` |
| `cache_key_prefix` | Prefix for cache key | No | `test-metrics` |

## 📈 Outputs

| Output | Description |
|--------|-------------|
| `total_tests` | Total number of tests |
| `passed_tests` | Number of passed tests |
| `failed_tests` | Number of failed tests |
| `pass_rate` | Test pass rate percentage |
| `flaky_tests_count` | Number of flaky tests detected |
| `performance_trend` | Performance trend compared to previous runs |

## 🧪 Supported Test Frameworks

### Jest
```yaml
- name: Run Jest Tests
  run: npm test -- --json --outputFile=jest-results.json

- name: Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  with:
    report_paths: 'jest-results.json'
    test_framework: 'jest'
```

### Playwright
```yaml
- name: Run Playwright Tests
  run: npx playwright test --reporter=json --output-file=playwright-results.json

- name: Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  with:
    report_paths: 'playwright-results.json'
    test_framework: 'playwright'
```

### JUnit (Any framework that outputs JUnit XML)
```yaml
- name: Run Tests with JUnit Reporter
  run: npm test -- --reporters=jest-junit

- name: Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  with:
    report_paths: '**/junit.xml'
    test_framework: 'junit'
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**⭐ If you find this action useful, please give it a star!**
