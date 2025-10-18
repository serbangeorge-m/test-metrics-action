import { ParsedTestData } from '../types';
import { BaseParser } from './baseParser';
export declare class PlaywrightParser extends BaseParser {
    protected parse(content: string): Promise<ParsedTestData>;
    private parsePlaywrightJSON;
    private parsePlaywrightSuite;
    private mapPlaywrightStatus;
}
//# sourceMappingURL=playwrightParser.d.ts.map