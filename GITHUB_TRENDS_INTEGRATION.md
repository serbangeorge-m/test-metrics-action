// GitHub Trends Integration Guide

## Current System

Your test-metrics-action currently uses:
- **GitHub Actions Cache** - Stores trend data between runs (up to 30 days retention)
- **Local JSON file** - Keeps historical data
- **Cache key** - Based on branch/test framework

## Enhanced GitHub Integration

### Option 1: Use GitHub Workflow API (Recommended)
Pull historical data directly from GitHub workflow runs:

```typescript
// Fetch previous test runs from this workflow
const { data: runs } = await octokit.actions.listWorkflowRuns({
  owner: context.repo.owner,
  repo: context.repo.repo,
  workflow_id: context.workflow,
  branch: context.ref,
  status: 'completed',
  per_page: 30  // Last 30 runs
});
```

**Advantages:**
- ✅ No data loss if cache expires
- ✅ Cross-machine consistency
- ✅ Long-term trends
- ✅ Public data accessible

**Disadvantages:**
- ❌ Requires additional API calls
- ❌ More complex parsing
- ❌ Need to parse action output

### Option 2: GitHub Artifacts (Current Best)
Store metrics as workflow artifacts:

```typescript
// Save current metrics as artifact
await uploadArtifact('test-metrics', [metricsFile]);

// Later, download and read previous artifacts
const artifacts = await listArtifacts({ name: 'test-metrics' });
const previousMetrics = await downloadArtifact(artifacts[0].id);
```

**Advantages:**
- ✅ Unlimited retention (configure per repo)
- ✅ Easy to retrieve
- ✅ Structured data
- ✅ Works across branches

**Disadvantages:**
- ❌ Need @actions/artifact
- ❌ Artifact API complexity

### Option 3: GitHub Wiki/Discussion (Community-Friendly)
Store trends in repo wiki or discussions as markdown

**Advantages:**
- ✅ Visible to community
- ✅ Manual override capability
- ✅ Easy to understand

**Disadvantages:**
- ❌ Requires write access to wiki
- ❌ Manual maintenance
- ❌ Harder to parse

## Recommended Implementation

I recommend **Option 2: Artifacts** combined with current cache:

1. **Save metrics as artifact** after each run
2. **Keep GitHub Actions cache** as fast primary storage
3. **Fallback to artifacts** if cache expires
4. **Show 30-day trends** with this data

## Implementation Steps

### Step 1: Add Artifact Upload
```typescript
// In index.ts, after generating metrics
const artifact = await uploadArtifact(
  `test-metrics-${framework}`,
  [metricsFile],
  { 
    retentionDays: 90  // Keep for 90 days
  }
);
```

### Step 2: Download Previous Artifacts
```typescript
const artifacts = await listArtifacts({
  name: `test-metrics-${framework}`,
  latest: true  // Get latest only
});

// Parse and aggregate for trends
```

### Step 3: Combine with Cache
- Fast: Use GitHub Actions cache (current workflow)
- Fallback: Use artifacts if cache missing
- Persist: Save to cache for next run

## What This Gives You

✅ **Long-term trends** - 90 days of history
✅ **Reliable data** - No loss if cache expires
✅ **Cross-runner** - Works on any runner
✅ **Branch-aware** - Separate trends per branch
✅ **Zero maintenance** - Automatic cleanup

## GitHub Actions Already Provide

```yaml
# GitHub provides:
- run number (sequential)
- run date/time
- commit hash
- branch name
- triggered by (push/pr)
```

You can correlate with your metrics!

## Quick Win: Use Workflow Run Numbers

```typescript
// Simple enhancement: use run number + date
const trendData = {
  timestamp: new Date().toISOString(),
  runNumber: process.env.GITHUB_RUN_NUMBER,
  runId: process.env.GITHUB_RUN_ID,
  metrics: {...}
};

// Later: fetch this specific run data
// https://api.github.com/repos/{owner}/{repo}/actions/runs/{run-id}
```

This gives you GitHub-native trend tracking!

## Files to Modify

1. **src/index.ts** - Add artifact upload
2. **src/storage/cache.ts** - Add artifact fallback
3. **action.yml** - Document artifact retention option

## Would You Like Me To:

1. ✅ Implement artifact-based trends?
2. ✅ Add workflow API integration?
3. ✅ Create GitHub run number tracking?
4. ✅ All of the above?

Let me know which approach you prefer!
