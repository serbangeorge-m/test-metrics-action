# 🚀 Workflow Examples

This document provides comprehensive examples of how to use the Test Metrics Action with HTML dashboard output in your GitHub workflows.

## 🎨 Basic HTML Dashboard

```yaml
name: Tests with HTML Dashboard

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Tests
        run: npm test  # or your test command
        
      - name: 🎨 Test Metrics HTML Dashboard
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: '**/test-results.xml'
          html_output: true
          detailed_summary: true
```

## 📊 Multi-Framework Matrix

```yaml
name: Multi-Framework Test Metrics

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        framework: 
          - { name: 'Jest', path: '**/jest-results.json', type: 'jest' }
          - { name: 'Playwright', path: '**/playwright-results.json', type: 'playwright' }
          - { name: 'JUnit', path: '**/junit-results.xml', type: 'junit' }
        output_format:
          - { name: 'HTML Dashboard', html: true, icon: '🎨' }
          - { name: 'Markdown Report', html: false, icon: '📝' }
    
    name: ${{ matrix.output_format.icon }} ${{ matrix.framework.name }} - ${{ matrix.output_format.name }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup and Run Tests
        run: |
          # Your test setup and execution
          echo "Running ${{ matrix.framework.name }} tests..."
          
      - name: ${{ matrix.output_format.icon }} Test Metrics
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: ${{ matrix.framework.path }}
          test_framework: ${{ matrix.framework.type }}
          html_output: ${{ matrix.output_format.html }}
          detailed_summary: true
          cache_key_prefix: 'metrics-${{ matrix.framework.name }}'
          artifact_suffix: '${{ matrix.framework.name }}-${{ matrix.output_format.name }}'
```

## 🔄 Side-by-Side Comparison

```yaml
name: HTML vs Markdown Comparison

on: 
  workflow_dispatch:
    inputs:
      show_both:
        description: 'Show both HTML and Markdown outputs'
        default: true
        type: boolean

jobs:
  test-comparison:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        output:
          - name: "HTML Dashboard"
            html_output: true
            emoji: "🎨"
          - name: "Markdown Report" 
            html_output: false
            emoji: "📝"
            
    name: ${{ matrix.output.emoji }} ${{ matrix.output.name }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Tests
        run: |
          # Your test commands here
          echo "Running tests for comparison..."
          
      - name: ${{ matrix.output.emoji }} Generate Report
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: '**/test-results.*'
          html_output: ${{ matrix.output.html_output }}
          detailed_summary: true
          fail_on_failure: false  # Don't fail for demo
```

## 🎯 Production Ready Setup

```yaml
name: Production Test Metrics

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-and-metrics:
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      checks: write
      pull-requests: write  # For PR annotations
      
    steps:
      - name: 📁 Checkout
        uses: actions/checkout@v4
        
      - name: 🟢 Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: 📦 Install Dependencies
        run: npm ci
        
      - name: 🧪 Run Unit Tests
        run: npm run test:unit
        
      - name: 🎭 Run E2E Tests
        run: npm run test:e2e
        if: always()
        
      - name: 🎨 Test Metrics Dashboard
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: |
            **/junit-results.xml
            **/jest-results.json
            **/playwright-results.json
          test_framework: 'auto'
          html_output: true
          detailed_summary: true
          fail_on_failure: true
          include_passed: false  # Only show failures in PR comments
          retention_days: 30
          cache_key_prefix: 'test-metrics-${{ github.workflow }}'
```

## 🏢 Enterprise Matrix Setup

```yaml
name: Enterprise Test Suite

on: [push, pull_request]

jobs:
  test-matrix:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node-version: [18, 20]
        test-suite: [unit, integration, e2e]
        
    name: 🧪 ${{ matrix.test-suite }} on ${{ matrix.os }} (Node ${{ matrix.node-version }})
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run ${{ matrix.test-suite }} tests
        run: npm run test:${{ matrix.test-suite }}
        
      - name: 🎨 Test Metrics Dashboard
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: '**/test-results-${{ matrix.test-suite }}.xml'
          html_output: true
          detailed_summary: true
          fail_on_failure: false  # Let other matrix jobs continue
          cache_key_prefix: 'metrics-${{ matrix.test-suite }}'
          artifact_suffix: '${{ matrix.os }}-node${{ matrix.node-version }}-${{ matrix.test-suite }}'
          retention_days: 14
```

## 🔄 Scheduled Performance Tracking

```yaml
name: Performance Monitoring

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM
  workflow_dispatch:

jobs:
  performance-tracking:
    runs-on: ubuntu-latest
    name: 📈 Daily Performance Metrics
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Environment
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install Dependencies
        run: npm ci
        
      - name: Run Performance Tests
        run: npm run test:performance
        
      - name: 📊 Performance Metrics Dashboard
        uses: your-username/test-metrics-action@v1
        if: always()
        with:
          report_paths: '**/performance-results.xml'
          html_output: true
          detailed_summary: true
          fail_on_failure: false
          retention_days: 90  # Keep longer history for trends
          cache_key_prefix: 'performance-daily'
```

## 💡 Tips for HTML Dashboard

### 🎨 Best Practices

1. **Always use `if: always()`** to ensure metrics are generated even if tests fail
2. **Set appropriate permissions** for PR annotations
3. **Use unique cache keys** for different test suites
4. **Enable `detailed_summary: true`** for full dashboard experience

### 🎯 Configuration Recommendations

```yaml
# Recommended configuration for HTML dashboard
- name: Test Metrics
  uses: your-username/test-metrics-action@v1
  if: always()
  with:
    report_paths: '**/test-results.*'
    html_output: true              # 🎨 Enable HTML dashboard
    detailed_summary: true         # 📊 Full metrics
    fail_on_failure: true          # ❌ Fail on test failures
    include_passed: false          # 🎯 Only show failures in PR
    retention_days: 30             # 📅 Keep 30 days of trends
    cache_key_prefix: 'my-app'     # 🏷️ Unique cache key
```

### 📱 Mobile Responsiveness

The HTML dashboard is fully responsive and includes:
- 📱 Mobile-optimized tables with horizontal scroll
- 🎨 Touch-friendly interface elements
- 📊 Readable fonts and spacing on all devices
- ⚡ Fast loading with optimized assets

Ready to use these examples? Copy and customize any of the workflows above! 🚀
