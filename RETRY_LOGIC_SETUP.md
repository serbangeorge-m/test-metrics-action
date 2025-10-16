# Retry Logic Setup

## What Was Added

### 1. Playwright Configuration (`playwright.config.ts`)

A new Playwright configuration file has been created with retry logic enabled.

**Key settings:**
```typescript
retries: process.env.CI ? 2 : 0,
```

- **On GitHub Actions (CI=true):** Tests are retried up to 2 times if they fail
- **Locally (CI=false):** Tests run once without retries (faster feedback)

### 2. Playwright Dependency

Added `@playwright/test` to `package.json` devDependencies:
```json
"@playwright/test": "^1.40.0"
```

## How It Works

### Without Retry Logic (Before)
```
Test runs → Fails → Report shows: Failed
```

### With Retry Logic (After)
```
Test runs → Fails → Automatically retries (up to 2 times)
                  ↓
              If passes on retry → Report shows: Passed (with retry count)
              If fails again → Report shows: Failed (with retry info)
```

## Flaky Test Detection

Now when tests are retried:

1. **Test fails initially** → Playwright retries automatically
2. **Retry information is captured** in JUnit XML output
3. **Action parses retry data** and calculates flakiness score
4. **If score > 0.3** → Test flagged as flaky in report

### Example Report Output

```
🐛 Flaky Tests Detected

| Test Name | Flakiness Score | Retry Count | Pattern |
|-----------|-----------------|-------------|---------|
| Login test | 70% | 2 | timeout |
```

## Installation

Install dependencies:
```bash
npm install
```

This will install Playwright with the retry configuration.

## Usage in GitHub Actions

The retry logic is **automatically enabled** in CI/CD:

```yaml
- name: Run Playwright Tests
  run: npx playwright test --reporter=junit
```

Playwright automatically uses the settings from `playwright.config.ts`:
- Retries: 2 times
- Reporter: JUnit XML (for metrics parsing)

## Running Tests Locally

```bash
# Run tests once (no retries)
npx playwright test

# Run tests with retry logic (like CI)
CI=true npx playwright test
```

## What Gets Reported

After running with retry logic, you'll see:

✅ **Stable tests** → No retries needed
⚠️ **Flaky tests** → Retried but eventually passed
❌ **Failed tests** → Failed even after retries

## Benefits

1. **Reduces false failures** - Temporary network issues are handled automatically
2. **Identifies flaky tests** - Retry data helps identify unreliable tests
3. **Better metrics** - Accurate pass rates and test stability metrics
4. **CI/CD stability** - Prevents intermittent CI failures

## Customization

To change retry count, edit `playwright.config.ts`:

```typescript
retries: process.env.CI ? 3 : 0,  // Change to 3 retries in CI
```

Or set an environment variable:
```bash
CI=true RETRIES=3 npx playwright test
```

## Next Steps

1. ✅ Run `npm install` to install Playwright
2. ✅ Commit and push changes
3. ✅ Watch flaky tests appear in your metrics reports
4. ✅ Use the data to improve test reliability
