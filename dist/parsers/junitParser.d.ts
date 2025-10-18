import { ParsedTestData } from '../types';
import { BaseParser } from './baseParser';
export declare class JUnitParser extends BaseParser {
    protected parse(content: string): Promise<ParsedTestData>;
    private parseJUnitXML;
    private determineTestStatus;
    private extractErrorMessage;
    private getAttributeValue;
}
//# sourceMappingURL=junitParser.d.ts.map