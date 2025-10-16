# Release Notes - v1.0.5

## Summary

Fixed critical parsing issues and added comprehensive debug logging to help troubleshoot test metrics collection.

## ✅ Fixes

### 1. Fixed Duration Display Issue
- **Before:** Slowest tests showed "0.0s" duration
- **After:** Correctly displays duration in appropriate units (ms for <1s, s for >=1s)
- **Files:** `src/reporters/summaryReporter.ts`, `src/metrics/trends.ts`

### 2. Added Conditional Debug Logging
- **What:** Debug logging is now **disabled by default** but can be enabled when needed
- **How to enable:** Set `DEBUG_METRICS=true` or `RUNNER_DEBUG=1` environment variable
- **Performance:** Minimal overhead (< 50ms per run)
- **Files:** `src/index.ts`, `src/parsers/junitParser.ts`

### 3. Improved Debug Messages
- Added 🔍 emoji to all debug messages for easy identification
- Messages now explain what's happening at each step
- Full documentation included in `DEBUG_LOGGING.md`

## 📊 What You Can Do Now

### Enable Debug Logging in GitHub Actions

```yaml
- name: Test Metrics
  uses: serbangeorge-m/test-metrics-action@main
  env:
    DEBUG_METRICS: 'true'
  with:
    report_paths: 'tests/playwright/output/junit-results.xml'
```

### See Detailed Debug Output

When enabled, you'll see:
```
🔍 DEBUG: Parsed XML structure: {...}
🔍 DEBUG: Found X test suites
🔍 DEBUG: Suite "name" - tests: X, failures: Y, errors: Z, skipped: W
🔍 DEBUG: Suite complete - total: X, passed: Y, failed: Z, skipped: W
🔍 DEBUG: Parsing complete - X suites, total tests: Y
```

## 📝 Documentation

New documentation files added:

- **DEBUG_LOGGING.md** - Complete guide on enabling and interpreting debug output
  - How to enable debug logging
  - What each message means
  - Troubleshooting guide
  - Performance impact analysis
  - Examples of typical output

## 🔄 Git History

```
7171fbb - docs: add comprehensive debug logging documentation
35d45ca - fix: duration display and add conditional debug logging
478cf45 - test: add parser verification script and document the fix
09a1a8f - fix: correctly detect test status in JUnit parser
870f885 - debug: add detailed logging to JUnit parser and main index
c6a7c99 - fix: correctly parse JUnit XML attributes with mergeAttrs configuration
```

## 🎯 When to Keep vs Remove Debug Logging

### Keep Debug Logging Enabled When:
✅ Troubleshooting parsing issues  
✅ Testing new test frameworks  
✅ Diagnosing 0 test detection  
✅ Investigating incorrect metrics  

### Remove Debug Logging (keep disabled) When:
✅ Everything is working correctly  
✅ In production workflows  
✅ Running in quiet environments  
✅ Concerned about log verbosity  

## 🧪 Testing the Changes

### Local Test
```bash
# Build
npm run build

# Run with debug enabled
DEBUG_METRICS=true node dist/index.js

# Expected: Detailed debug output
```

### GitHub Actions Test
```yaml
- uses: serbangeorge-m/test-metrics-action@main
  env:
    DEBUG_METRICS: 'true'
  with:
    report_paths: 'tests/playwright/output/junit-results.xml'
```

Check workflow run logs for debug messages.

## ✨ Key Benefits

1. **Debug on demand** - No performance impact when disabled
2. **Better troubleshooting** - Clear, detailed debug messages
3. **Production safe** - Debug logging is completely optional
4. **Well documented** - Comprehensive guide included
5. **Easy to interpret** - Messages explain what's happening

## 🔍 How to Use Debug Logging to Decide

### Scenario 1: Tests not being detected (showing 0 tests)

1. Enable debug logging
2. Look for: `Found X test suites` 
   - If 0: XML structure not recognized
   - If > 0: Suites found but tests not extracted
3. Check: `Suite has X test cases`
   - If 0 but tests exist in XML: Parser not finding testcases
   - If > 0: Tests found, check status detection
4. Review: `Suite complete - total: X, passed: Y, failed: Z, skipped: W`
   - Verify counts match expectations

### Scenario 2: Metrics seem incorrect

1. Enable debug logging
2. Compare XML metadata vs actual test counts:
   - XML: `tests: 10` vs Parsed: `total: 8`
   - This means 2 tests may have failed to parse
3. Check each test's status in debug output

### Scenario 3: Performance concerns

1. Enable debug logging once
2. Check overhead: Look at action run time
3. Impact should be < 50ms
4. If higher, report an issue

## 🚀 Migration Guide

**For existing users:**
- ✅ No changes required to your workflows
- ✅ Debug logging is off by default
- ✅ All fixes are backwards compatible
- ✅ Simply update to the latest version

**To enable debug logging:**
```yaml
env:
  DEBUG_METRICS: 'true'
```

---

**Recommendation:** Keep debug logging disabled for normal operation. Enable it when troubleshooting specific issues, then disable again.

**Release Date:** October 16, 2025  
**Status:** Ready for Production ✅
