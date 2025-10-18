import { ParsedTestData } from '../types';
export declare abstract class BaseParser {
    parseFile(filePath: string): Promise<ParsedTestData>;
    protected abstract parse(content: string): Promise<ParsedTestData>;
}
//# sourceMappingURL=baseParser.d.ts.map