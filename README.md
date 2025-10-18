# 🧪 Test Metrics Reporter

Advanced test metrics and visual reporting for Jest, Playwright, and JUnit tests.

## ✨ Features

- 🎯 Multi-framework support (Jest, Playwright, JUnit XML)
- 📊 Advanced metrics (pass rate, duration, flakiness, failures)
- 📈 90-day trend tracking with GitHub Artifacts
- 🎨 Rich visual reports in GitHub Actions job summaries
- 🐛 Flakiness detection with retry analysis

## 🚀 Quick Start

```yaml
- name: Publish Test Metrics
  uses: serbangeorge-m/test-metrics-action@v1
  if: always()
  with:
    report_paths: '**/*results.xml'
    fail_on_failure: true
    detailed_summary: true
```

## 🔧 Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `report_paths` | Path to test result files (glob pattern) | Yes | `**/*results.xml` |
| `test_framework` | Test framework type: `auto`, `jest`, `playwright`, `junit` | No | `auto` |
| `detailed_summary` | Include detailed summary in job summary | No | `true` |
| `fail_on_failure` | Fail action if tests failed | No | `true` |
| `retention_days` | Days to retain trend data in cache (artifacts: 90 days) | No | `30` |
| `cache_key_prefix` | Prefix for cache key to separate test suites | No | `test-metrics` |
| `artifact_suffix` | Suffix for trend artifact name to ensure uniqueness in matrix jobs | No | `''` |
| `annotate_only` | Only annotate PR, don't fail the action | No | `false` |
| `include_passed` | Include passed tests in PR annotations | No | `true` |
| `require_tests` | Require at least one test result | No | `true` |

## 📊 What It Does

1. **Parses** test results from multiple frameworks
2. **Calculates** metrics: pass rate, duration, flakiness, failures
3. **Tracks** trends over 90 days with GitHub Artifacts
4. **Reports** with visual summary, tables, and charts
5. **Annotates** PRs with results (optional)

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

For Playwright, make sure to install the browsers before running the tests.

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright Tests
  run: npx playwright test --reporter=json
  env:
    PLAYWRIGHT_JSON_OUTPUT_NAME: playwright-results.json

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

## 🚀 Matrix Builds

When running this action in a matrix strategy, you might encounter errors with artifact uploads (e.g., `Error: Failed to CreateArtifact: ... an artifact with this name already exists`). This is because each job in the matrix will try to upload an artifact with the same name.

To solve this, use the `artifact_suffix` input to create a unique name for each job's artifact. You can use variables from your matrix context to create the suffix.

**Example:**

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest]
        node-version: [16, 18]

    steps:
    - uses: actions/checkout@v4
    # ... other steps
    - name: Publish Test Metrics
      uses: serbangeorge-m/test-metrics-action@v1
      if: always()
      with:
        report_paths: '**/*results.xml'
        artifact_suffix: ${{ matrix.os }}-${{ matrix.node-version }}
```

This will create artifacts with names like `test-metrics-trends-junit-ubuntu-latest-16`, `test-metrics-trends-junit-ubuntu-latest-18`, etc., avoiding conflicts.

## 📈 Outputs

| Output | Description |
|--------|-------------|
| `total_tests` | Total number of tests |
| `passed_tests` | Number of passed tests |
| `failed_tests` | Number of failed tests |
| `pass_rate` | Test pass rate percentage |
| `flaky_tests_count` | Number of flaky tests detected |
| `performance_trend` | Performance trend compared to previous runs |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**⭐ If you find this action useful, please give it a star!**