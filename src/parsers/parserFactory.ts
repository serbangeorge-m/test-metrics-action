
import * as fs from 'fs';
import * as path from 'path';
import { BaseParser } from './baseParser';
import { JestParser } from './jestParser';
import { JUnitParser } from './junitParser';
import { PlaywrightParser } from './playwrightParser';

export function getParser(filePath: string, framework: string): BaseParser {
  const frameworkType = framework === 'auto' ? detectFramework(filePath) : framework;

  switch (frameworkType.toLowerCase()) {
    case 'junit':
      return new JUnitParser();
    case 'jest':
      return new JestParser();
    case 'playwright':
      return new PlaywrightParser();
    default:
      throw new Error(`Unsupported test framework: ${frameworkType}`);
  }
}

function detectFramework(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === '.xml') {
    return 'junit';
  } else if (extension === '.json') {
    const content = fs.readFileSync(filePath, 'utf-8');
    const jsonData = JSON.parse(content);

    if (jsonData.testResults || (jsonData.suites && jsonData.suites.every((s: any) => s.testResults))) {
      return 'jest';
    } else if (Array.isArray(jsonData) || (jsonData.suites && !jsonData.suites.every((s: any) => s.testResults))) {
      return 'playwright';
    } else {
      throw new Error('Unable to auto-detect test framework from JSON file. Please specify the `test_framework` input.');
    }
  } else {
    throw new Error(`Unsupported file extension: ${extension}. Please specify the 'test_framework' input.`);
  }
}
