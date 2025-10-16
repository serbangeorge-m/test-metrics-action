# Debug Logging Documentation

## Overview

The test-metrics-action now includes comprehensive debug logging that can be enabled to troubleshoot parsing and metrics calculation issues.

## Enabling Debug Logging

Debug logging is controlled by environment variables. You can enable it in two ways:

### Option 1: Using `DEBUG_METRICS` Environment Variable

Set `DEBUG_METRICS=true` in your GitHub Actions workflow:

```yaml
- name: Test Metrics with Debug
  uses: serbangeorge-m/test-metrics-action@main
  env:
    DEBUG_METRICS: 'true'
  with:
    report_paths: 'tests/playwright/output/junit-results.xml'
```

### Option 2: Using GitHub Actions Debug Mode

GitHub Actions has built-in debug logging. Enable it by setting `RUNNER_DEBUG=1`:

```yaml
- name: Test Metrics with Debug
  uses: serbangeorge-m/test-metrics-action@main
  env:
    RUNNER_DEBUG: '1'
  with:
    report_paths: 'tests/playwright/output/junit-results.xml'
```

### Option 3: Local Testing

For local testing, set the environment variable before running:

```bash
DEBUG_METRICS=true npx ts-node src/index.ts
```

## Debug Output Examples

### When Debug Logging is Enabled

You'll see output like:

```
✅ Parsed tests/playwright/output/junit-results.xml (junit) - found 1 suites with 2 tests

🔍 DEBUG: Parsed XML structure: {
  "testsuites": {
    "testsuite": {...}
  }
}

🔍 DEBUG: xmlData.testsuites: true
🔍 DEBUG: xmlData.testsuite: false

🔍 DEBUG: Processing testsuites -> testsuite

🔍 DEBUG: Found 1 test suites

🔍 DEBUG: Processing suite: {"name":"dashboard.spec.ts","tests":"2",...}

🔍 DEBUG: Suite "dashboard.spec.ts" - tests: 2, failures: 0, errors: 0, skipped: 0

🔍 DEBUG: Suite has 2 test cases

🔍 DEBUG: Suite complete - total: 2, passed: 2, failed: 0, skipped: 0

🔍 DEBUG: Parsing complete - 1 suites, total tests: 2
```

### When Debug Logging is Disabled

You'll see minimal output:

```
✅ Parsed tests/playwright/output/junit-results.xml (junit) - found 1 suites with 2 tests
```

## Debug Log Messages Explained

### XML Structure Messages

```
🔍 DEBUG: Parsed XML structure: {...}
```
**What it means:** Shows the raw XML parsed structure. Useful to see the exact format of your test results file.

**When to look:** If tests aren't being detected, check if `testsuites` or `testsuite` exists in the output.

---

```
🔍 DEBUG: xmlData.testsuites: true
🔍 DEBUG: xmlData.testsuite: false
```
**What it means:** Shows which root element was found in the XML (testsuites vs testsuite).

**What's expected:**
- `true` for one, `false` for the other (unless it's a direct testcase structure)
- If both are `false`, the XML structure may not be JUnit format

---

### Processing Messages

```
🔍 DEBUG: Processing testsuites -> testsuite
```
**What it means:** The parser detected a `<testsuites>` root element with nested `<testsuite>` elements.

**Alternatives:**
- `Processing root testsuite` = Root is `<testsuite>` directly
- `Processing direct test results` = Root is `<testcase>` elements

---

```
🔍 DEBUG: Found X test suites
```
**What it means:** The parser found X test suite elements.

**What's expected:** `Found 1 test suites` or more, depending on your test structure.

**If 0:** XML structure may not be recognized.

---

### Suite-Level Messages

```
🔍 DEBUG: Suite "dashboard.spec.ts" - tests: 2, failures: 0, errors: 0, skipped: 0
```
**What it means:** Detailed breakdown of each test suite:
- Suite name
- Total tests declared in XML
- Failures count
- Errors count
- Skipped tests count

**What's expected:** All counts should match your test results.

---

```
🔍 DEBUG: Suite has 2 test cases
```
**What it means:** The number of individual `<testcase>` elements in this suite.

**What's expected:** Should match (or be close to) the "tests" count.

---

### Final Summary

```
🔍 DEBUG: Parsing complete - 1 suites, total tests: 2
```
**What it means:** Final summary of parsing results.

**Shows:**
- Number of test suites parsed
- Total number of tests found

**What's expected:** Non-zero values if your test file has tests.

---

## Troubleshooting with Debug Output

### Problem: "No test results could be parsed"

**Check these debug messages:**

1. ✅ `xmlData.testsuites` or `xmlData.testsuite` should be `true`
   - If both are `false`, your file may not be JUnit format

2. ✅ `Found X test suites` should be > 0
   - If 0, check XML structure

3. ✅ `Parsing complete - X suites, total tests: Y` should have Y > 0
   - If Y = 0, no test cases were found in the suites

### Problem: Pass rate shows 0% or is incorrect

**Check these debug messages:**

1. ✅ `Suite "name" - tests: X` should match actual tests
   - If different, XML metadata may not match actual test counts

2. ✅ `Suite has X test cases` should match the tests count
   - If less, some test cases may not be parsed

3. ✅ `Suite complete - total: X, passed: Y, failed: Z, skipped: W`
   - X should equal Y+Z+W
   - If not, status detection may have issues

### Problem: Slow tests showing 0.0s duration

**Check these debug messages:**

1. ✅ In the suite parsing output, look for actual test durations
2. ✅ If all durations are 0, your XML may not have time attributes
3. ✅ If some are non-zero, the display formatting should be fixed in v1.0.5+

## Disabling Debug Logging

Debug logging is **disabled by default**. To ensure it's off:

```yaml
- name: Test Metrics (production)
  uses: serbangeorge-m/test-metrics-action@main
  with:
    report_paths: 'tests/playwright/output/junit-results.xml'
  # No DEBUG_METRICS or RUNNER_DEBUG env vars set
```

## Performance Impact

Debug logging has **minimal performance impact**:
- ✅ Only runs when explicitly enabled
- ✅ Conditional checks are fast
- ✅ Log output is buffered
- ✅ No parsing overhead

Typical overhead: < 50ms per run

## Viewing Debug Output in GitHub Actions

### In Web UI

1. Go to your workflow run
2. Click the job that ran the action
3. Expand the step named "Test Metrics"
4. Scroll through the logs
5. Look for messages starting with `🔍 DEBUG:`

### Via GitHub CLI

```bash
gh run view <RUN_ID> --log
```

### Via Git

```bash
git log --all --grep="test metrics"
```

## Examples

### Example 1: Complete Debug Session

```bash
export DEBUG_METRICS=true
npm run build
node dist/index.js
```

Output:
```
✅ Parsed tests/junit.xml (junit) - found 2 suites with 8 tests

🔍 DEBUG: Parsed XML structure: {"testsuites":{"testsuite":[...]}}
🔍 DEBUG: xmlData.testsuites: true
🔍 DEBUG: xmlData.testsuite: false
🔍 DEBUG: Processing testsuites -> testsuite
🔍 DEBUG: Found 2 test suites
🔍 DEBUG: Suite "com.example.tests.UserServiceTest" - tests: 5, failures: 1, errors: 0, skipped: 1
🔍 DEBUG: Suite has 5 test cases
🔍 DEBUG: Suite complete - total: 5, passed: 3, failed: 1, skipped: 1
🔍 DEBUG: Suite "com.example.tests.PaymentServiceTest" - tests: 3, failures: 0, errors: 0, skipped: 0
🔍 DEBUG: Suite has 3 test cases
🔍 DEBUG: Suite complete - total: 3, passed: 3, failed: 0, skipped: 0
🔍 DEBUG: Parsing complete - 2 suites, total tests: 8
```

### Example 2: GitHub Actions Workflow

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run Playwright Tests
        run: npm run test:e2e
      
      - name: Report Metrics (with debug)
        if: always()
        uses: serbangeorge-m/test-metrics-action@main
        env:
          DEBUG_METRICS: 'true'  # Enable debug logging
        with:
          report_paths: 'tests/playwright/output/junit-results.xml'
```

---

**Note:** Debug logging is production-safe. Enable it whenever you need to troubleshoot, then disable it for normal operations.
