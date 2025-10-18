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

| Feature | Markdown | HTML Dashboard |
|---------|----------|----------------|
| Visual Appeal | Basic | ⭐⭐⭐⭐⭐ |
| Responsive | Limited | ✅ Full |
| Interactive | ❌ Static | ✅ Dynamic |
| Color Coding | Emoji only | ✅ Full color |
| Trend Visualization | Text-based | ✅ Visual badges |

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

That's it! Your next workflow run will show the beautiful HTML dashboard. 🚀
