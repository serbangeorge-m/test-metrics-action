import { ParsedTestData } from '../types';
export declare class JUnitParser {
    parseFile(filePath: string): Promise<ParsedTestData>;
    private parseJUnitXML;
    private determineTestStatus;
    private extractErrorMessage;
    private getAttributeValue;
}
//# sourceMappingURL=junitParser.d.ts.map