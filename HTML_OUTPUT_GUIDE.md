# HTML Dashboard Output Guide

Your Test Metrics Action now supports beautiful HTML dashboard output! 🎉

## Overview

The action can generate a modern, responsive HTML dashboard instead of markdown output. This provides a much richer visual experience for viewing test results directly in GitHub Actions Job Summary.

## Features

- 🎨 **Beautiful Dark Theme** - Modern UI with Tailwind CSS
- 📊 **Interactive Dashboard** - Dynamic content based on test results
- 📱 **Responsive Design** - Works on desktop and mobile
- 🏃‍♂️ **Real-time Updates** - JavaScript-powered dynamic content
- 🎯 **Trend Analysis** - Visual trend indicators with color coding

## Usage

To enable HTML output, simply add the `html_output: true` parameter to your workflow:

```yaml
- name: Test Metrics Report
  uses: your-username/test-metrics-action@v1
  with:
    report_paths: '**/test-results/*.xml'
    html_output: true  # 🎯 Enable HTML dashboard
    detailed_summary: true
```

## Dashboard Features

### 📄 Test Execution Details
- **Dynamic Title**: Shows pass rate and duration in real-time
- **Status Table**: Passed, failed, and skipped tests with percentages
- **Smart Visibility**: Only shows rows for relevant test states

### 📈 Metrics Table
- **Current vs Previous**: Side-by-side comparison
- **Trend Indicators**: Color-coded badges (📈📉➡️)
- **Performance Insights**: Automated analysis and recommendations
- **Slowest Test**: Identifies performance bottlenecks

### 🎨 Visual Design
- **Color Coding**: 
  - 🟢 Green for passing tests
  - 🔴 Red for failing tests  
  - 🟡 Yellow for warnings
  - 🔵 Blue for metrics
- **Responsive Tables**: Scroll on mobile devices
- **Modern Typography**: Inter font family
- **Dark Theme**: Easy on the eyes

## Example Output

The dashboard will look like this in your GitHub Actions summary:

![HTML Dashboard Preview](demo-html.html)

## Comparison: Markdown vs HTML

| Feature | Markdown Report | HTML Dashboard |
|---------|-----------------|----------------|
| **Information Structure** | ✅ **IDENTICAL** | ✅ **IDENTICAL** |
| **Test Execution Details** | ✅ Same table format | ✅ Same table format |
| **Metrics Comparison** | ✅ Current/Previous/Trend | ✅ Current/Previous/Trend |
| **Performance Insights** | ✅ Same insights | ✅ Same insights |
| **Slowest Test Detection** | ✅ Same identification | ✅ Same identification |
| Visual Appeal | GitHub-native markdown | ⭐⭐⭐⭐⭐ Modern CSS |
| Responsive Design | ✅ GitHub responsive | ✅ Tailwind responsive |
| Interactive Elements | ❌ Static tables | ✅ Dynamic JavaScript |
| Color Coding | 📈📉➡️ Emoji badges | 🎨 Full CSS colors |
| Accessibility | ✅ Screen reader friendly | ✅ ARIA compliant |

### 🎯 **NEW: Both Formats Show Identical Information!**

As of the latest update, both HTML and Markdown outputs display **exactly the same data structure**:
- Same test execution details table
- Same metrics with Current/Previous/Trend columns  
- Same performance insights and recommendations
- Same slowest test identification
- Same trend indicators (emojis vs. colors)

## Configuration Options

```yaml
inputs:
  html_output:
    description: 'Generate HTML dashboard instead of markdown summary'
    required: false
    default: 'false'  # Set to 'true' to enable
```

## Browser Support

The HTML dashboard works in all modern browsers:
- ✅ Chrome/Edge 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Mobile browsers

## Performance

- **Fast Loading**: Optimized HTML with inline CSS
- **CDN Assets**: Tailwind CSS loaded from CDN
- **Minimal JS**: Lightweight JavaScript for dynamics

## Troubleshooting

If HTML output isn't appearing:

1. **Check Input**: Ensure `html_output: true` is set
2. **Verify Build**: Make sure you're using the latest action version
3. **Check Permissions**: Ensure the action has summary write permissions

```yaml
permissions:
  actions: read
  contents: read
  checks: write
  pull-requests: write
```

## Migration from Markdown

To switch from markdown to HTML output:

```yaml
# Before
- uses: your-username/test-metrics-action@v1
  with:
    report_paths: '**/test-results/*.xml'
    detailed_summary: true

# After  
- uses: your-username/test-metrics-action@v1
  with:
    report_paths: '**/test-results/*.xml'
    detailed_summary: true
    html_output: true  # 🎯 Add this line
```

## Side-by-Side Comparison

Want to see both formats? Use a matrix strategy:

```yaml
strategy:
  matrix:
    include:
      - name: "HTML Dashboard"
        html_output: true
        suffix: "html"
      - name: "Markdown Report"  
        html_output: false
        suffix: "markdown"

steps:
  - uses: your-username/test-metrics-action@v1
    with:
      report_paths: '**/test-results/*.xml'
      html_output: ${{ matrix.html_output }}
      detailed_summary: true
      artifact_suffix: ${{ matrix.suffix }}  # Prevents conflicts
```

Both outputs will show **identical information** - choose based on your preference! 🚀
