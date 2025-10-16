# Critical Fixes - Action Plan

This document provides implementation guidance for addressing the critical security vulnerabilities identified in the security review.

## 🔴 CRITICAL PRIORITY 1: Path Traversal Vulnerability

**Status:** NOT FIXED  
**File:** `src/index.ts`  
**Estimated Fix Time:** 20 minutes

### Problem
User input `reportPaths` is passed directly to `glob.sync()` without validation, allowing potential directory traversal attacks.

### Implementation

```typescript
// Add this function before the run() function
function validateReportPath(reportPaths: string): string {
  // Check for path traversal attempts
  if (reportPaths.includes('..')) {
    throw new Error('Invalid report_paths: path traversal (..) is not allowed');
  }
  
  // Check for absolute paths
  if (reportPaths.startsWith('/') || reportPaths.match(/^[a-zA-Z]:/)) {
    throw new Error('Invalid report_paths: absolute paths are not allowed');
  }
  
  // Ensure we're looking for report files
  if (!reportPaths.includes('*') && !reportPaths.endsWith('.xml') && !reportPaths.endsWith('.json')) {
    throw new Error('Invalid report_paths: must target .xml or .json files');
  }
  
  return reportPaths;
}

// In run() function, replace:
// const reportPaths = core.getInput('report_paths', { required: true });
// With:
let reportPaths = core.getInput('report_paths', { required: true });
try {
  reportPaths = validateReportPath(reportPaths);
} catch (error) {
  core.setFailed(`Invalid input: ${error}`);
  return;
}
```

---

## 🔴 CRITICAL PRIORITY 2: Unsafe JSON Parsing

**Status:** NOT FIXED  
**Files:** 
- `src/parsers/jestParser.ts`
- `src/parsers/playwrightParser.ts`

**Estimated Fix Time:** 20 minutes

### Problem
Large files can consume unbounded memory, causing DoS.

### Implementation

Create a utility file `src/utils/fileValidation.ts`:

```typescript
import * as fs from 'fs';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function validateFileSize(filePath: string): void {
  const stats = fs.statSync(filePath);
  
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(
      `File ${filePath} exceeds maximum size limit of ${MAX_FILE_SIZE} bytes (actual: ${stats.size} bytes)`
    );
  }
}
```

Then update parsers:

```typescript
// In jestParser.ts
import { validateFileSize } from '../utils/fileValidation';

async parseFile(filePath: string): Promise<ParsedTestData> {
  validateFileSize(filePath);  // Add this line
  const jsonContent = fs.readFileSync(filePath, 'utf-8');
  const jestData = JSON.parse(jsonContent);
  return this.parseJestJSON(jestData);
}

// In playwrightParser.ts
import { validateFileSize } from '../utils/fileValidation';

async parseFile(filePath: string): Promise<ParsedTestData> {
  validateFileSize(filePath);  // Add this line
  const jsonContent = fs.readFileSync(filePath, 'utf-8');
  const playwrightData = JSON.parse(jsonContent);
  return this.parsePlaywrightJSON(playwrightData);
}
```

---

## 🔴 CRITICAL PRIORITY 3: GitHub Token Exposure

**Status:** NOT FIXED  
**File:** `src/index.ts`  
**Estimated Fix Time:** 10 minutes

### Problem
Error messages might expose GitHub token in logs.

### Implementation

```typescript
// Replace the annotatePullRequest function with:

async function annotatePullRequest(metrics: any, annotateOnly: boolean): Promise<void> {
  if (github.context.eventName !== 'pull_request') {
    return;
  }

  try {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      core.debug('GITHUB_TOKEN not available, skipping PR comment');
      return;
    }

    const octokit = github.getOctokit(token);
    
    const comment = `## 🧪 Test Results
  
**Status:** ${metrics.passRate >= 95 ? '🟢 All tests passed' : metrics.passRate >= 80 ? '🟡 Some tests failed' : '🔴 Tests failing'}
**Pass Rate:** ${metrics.passRate.toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})
**Duration:** ${(metrics.totalDuration / 1000).toFixed(1)}s
${metrics.flakyTests.length > 0 ? `**Flaky Tests:** ${metrics.flakyTests.length}` : ''}

${metrics.failedTests > 0 ? `⚠️ ${metrics.failedTests} test(s) failed` : '✅ All tests passed!'}`;

    await octokit.rest.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      body: comment
    });
    
    core.debug('Successfully posted test metrics comment');
  } catch (error) {
    // Don't include error details that might contain sensitive info
    core.debug(`Failed to create PR comment: ${error}`);
    core.warning('Failed to create PR comment - check debug logs for details');
  }
}
```

---

## 🔴 CRITICAL PRIORITY 4: XXE Attack Vulnerability

**Status:** NOT FIXED  
**File:** `src/parsers/junitParser.ts`  
**Estimated Fix Time:** 10 minutes

### Problem
XML parser vulnerable to XXE attacks.

### Implementation

```typescript
// In junitParser.ts, update the parseFile method:

async parseFile(filePath: string): Promise<ParsedTestData> {
  const xmlContent = fs.readFileSync(filePath, 'utf-8');
  
  // Security: Prevent XXE attacks and limit parser complexity
  const parser = new xml2js.Parser({
    explicitArray: false,
    mergeAttrs: true,
    trim: true,
    // Security hardening
    strict: true,
    // Disable external entity processing
    doctype: false,
    skipAttrPrefix: true,
    // Limit parser depth to prevent billion laughs attack
    maxDepth: 10
  });

  try {
    const result = await parser.parseStringPromise(xmlContent);
    return this.parseJUnitXML(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes('DOCTYPE')) {
      throw new Error('DOCTYPE declarations are not allowed in test result files');
    }
    throw error;
  }
}
```

---

## 🟠 HIGH PRIORITY 5: Unvalidated Error Messages

**Status:** NOT FIXED  
**File:** `src/index.ts`  
**Estimated Fix Time:** 15 minutes

### Problem
Test data could contain markdown injection in PR comments.

### Implementation

Create `src/utils/sanitization.ts`:

```typescript
/**
 * Sanitize strings for safe embedding in Markdown
 */
export function sanitizeForMarkdown(input: string | undefined): string {
  if (!input) return '';
  
  return input
    .toString()
    .substring(0, 1000) // Limit length
    .replace(/[[\]()]/g, '\\$&') // Escape markdown link syntax
    .replace(/[`]/g, '\\$&') // Escape code blocks
    .replace(/[*_]/g, '\\$&') // Escape emphasis
    .replace(/\n\n/g, '\n'); // Limit line breaks
}

/**
 * Escape HTML to prevent injection
 */
export function escapeHtml(input: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return input.replace(/[&<>"']/g, char => map[char]);
}
```

Then update the comment generation:

```typescript
// In index.ts, import the sanitization function
import { sanitizeForMarkdown } from './utils/sanitization';

// In annotatePullRequest function:
const comment = `## 🧪 Test Results

**Status:** ${metrics.passRate >= 95 ? '🟢 All tests passed' : metrics.passRate >= 80 ? '🟡 Some tests failed' : '🔴 Tests failing'}
**Pass Rate:** ${metrics.passRate.toFixed(1)}% (${metrics.passedTests}/${metrics.totalTests})
**Duration:** ${(metrics.totalDuration / 1000).toFixed(1)}s
${metrics.flakyTests.length > 0 ? `**Flaky Tests:** ${metrics.flakyTests.length}` : ''}

${metrics.failedTests > 0 ? `⚠️ ${sanitizeForMarkdown(metrics.failedTests.toString())} test(s) failed` : '✅ All tests passed!'}`;
```

---

## 📋 Testing the Fixes

Create a test file `src/utils/__tests__/sanitization.test.ts`:

```typescript
import { sanitizeForMarkdown, escapeHtml } from '../sanitization';

describe('Sanitization Utils', () => {
  describe('sanitizeForMarkdown', () => {
    it('should escape markdown special characters', () => {
      const input = '[Click Here](javascript:alert("xss"))';
      const result = sanitizeForMarkdown(input);
      expect(result).not.toContain('[');
      expect(result).toContain('\\[');
    });

    it('should limit string length', () => {
      const input = 'a'.repeat(2000);
      const result = sanitizeForMarkdown(input);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('should handle undefined input', () => {
      const result = sanitizeForMarkdown(undefined);
      expect(result).toBe('');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = escapeHtml(input);
      expect(result).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });
});
```

---

## ✅ Verification Checklist

After implementing each fix, verify:

### Path Traversal Fix
- [ ] Test with `report_paths: '../../etc/passwd'` → Should fail
- [ ] Test with `report_paths: '/etc/passwd'` → Should fail
- [ ] Test with `report_paths: 'tests/**/*.xml'` → Should pass

### File Size Limit Fix
- [ ] Create a 100MB JSON file
- [ ] Run parser on it → Should fail with clear message
- [ ] Run parser on normal file (< 50MB) → Should pass

### Token Exposure Fix
- [ ] Check that GITHUB_TOKEN is not logged
- [ ] Verify error messages don't contain token
- [ ] Test with invalid token → Should show generic message

### XXE Fix
- [ ] Create XML with DOCTYPE → Should fail
- [ ] Create deeply nested XML (depth > 10) → Should fail
- [ ] Parse normal JUnit XML → Should pass

### Sanitization Fix
- [ ] Test with markdown injection → Should be escaped
- [ ] Test with HTML injection → Should be escaped
- [ ] Verify PR comment displays correctly

---

## Deployment Order

1. **Commit 1:** Path validation + File size validation
   ```bash
   git commit -m "security: add input validation and file size limits"
   ```

2. **Commit 2:** XXE prevention + Token safety
   ```bash
   git commit -m "security: disable XXE attacks and protect GitHub token"
   ```

3. **Commit 3:** Data sanitization
   ```bash
   git commit -m "security: sanitize user-generated content in PR comments"
   ```

4. **Test & Deploy**
   - Run full test suite
   - Deploy to production
   - Monitor for any issues

