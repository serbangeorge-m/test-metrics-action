# 🧪 Test Metrics Reporter

Advanced test metrics and visual reporting for Jest, Playwright, and JUnit tests.

## ✨ Features

- 🎯 Multi-framework support (Jest, Playwright, JUnit XML)
- 📊 Advanced metrics (pass rate, duration, flakiness, failures)
- 📈 90-day trend tracking with GitHub Artifacts
- 🎨 Rich visual reports in GitHub Actions job summaries
- 🐛 Flakiness detection with retry analysis

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

## 🚀 Quick Start

```yaml
- name: Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  if: always()
  with:
    report_paths: '**/*results.xml'
    fail_on_failure: true
    detailed_summary: true
```

## 🔧 Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `report_paths` | `**/*results.xml` | Test result file patterns (glob) |
| `test_framework` | `auto` | Framework: `auto`, `jest`, `playwright`, `junit` |
| `detailed_summary` | `true` | Include detailed job summary |
| `fail_on_failure` | `true` | Fail if tests failed |
| `retention_days` | `30` | Cache retention (artifacts: 90 days) |

## 📊 What It Does

1. **Parses** test results from multiple frameworks
2. **Calculates** metrics: pass rate, duration, flakiness, failures
3. **Tracks** trends over 90 days with GitHub Artifacts
4. **Reports** with visual summary, tables, and charts
5. **Annotates** PRs with results (optional)

## 🧪 Supported Formats

- **JUnit XML**: `*.xml` files
- **Jest JSON**: `--json --outputFile=results.json`
- **Playwright JSON**: `--reporter=json`

## 📄 License

MIT
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

- 📊 **Summary Table**: Current vs previous run metrics with trends (tests, pass rate, duration, flaky tests)
- 📈 **Test Status**: Visual breakdown of passed/failed/skipped with percentages
- ❌ **Failure Analysis**: Categorized failures (timeout, assertion, setup, network)
- 🐛 **Flaky Tests**: Detailed flakiness scoring and retry patterns
- 🐌 **Slow Tests**: Performance bottleneck identification (95th percentile)
- 📊 **Trend Charts**: ASCII visualization of performance over time

## 🔧 Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `report_paths` | Path to test result files (glob pattern) | Yes | `**/*results.xml` |
| `test_framework` | Test framework type: `auto`, `jest`, `playwright`, `junit` | No | `auto` |
| `detailed_summary` | Include detailed summary in job summary | No | `true` |
| `fail_on_failure` | Fail action if tests failed | No | `true` |
| `retention_days` | Days to retain trend data in cache (artifacts: 90 days) | No | `30` |
| `cache_key_prefix` | Prefix for cache key to separate test suites | No | `test-metrics` |
| `annotate_only` | Only annotate PR, don't fail the action | No | `false` |
| `include_passed` | Include passed tests in PR annotations | No | `true` |
| `require_tests` | Require at least one test result | No | `true` |

## 📈 Trend Tracking

The action automatically stores test metrics for trend analysis:

- **GitHub Actions Cache**: 30-day rolling history for quick access
- **GitHub Artifacts**: 90-day retention for long-term analysis
- **Automatic Cleanup**: Expired data is automatically removed

Trends help you:
- Detect performance regressions
- Monitor pass rate improvements
- Track flaky test patterns
- Identify slowest tests over time

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
