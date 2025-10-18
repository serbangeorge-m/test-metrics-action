
import * as fs from 'fs';
import { ParsedTestData } from '../types';

export abstract class BaseParser {
  async parseFile(filePath: string): Promise<ParsedTestData> {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    return this.parse(fileContent);
  }

  protected abstract parse(content: string): Promise<ParsedTestData>;
}
