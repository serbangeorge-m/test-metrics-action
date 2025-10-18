import { ParsedTestData } from '../types';
import { BaseParser } from './baseParser';
export declare class JestParser extends BaseParser {
    protected parse(content: string): Promise<ParsedTestData>;
    private parseJestJSON;
    private parseJestSuite;
}
//# sourceMappingURL=jestParser.d.ts.map