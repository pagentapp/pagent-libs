/**
 * create_sheet tool
 * Returns context for AI to generate valid WorkbookData JSON
 */

import { getSheetContext } from '../context/sheet-context.js';

export interface CreateSheetResult {
  types: string;
  rules: string[];
  examples: Array<{
    description: string;
    json: unknown;
  }>;
  version: string;
  instructions: string;
}

export function createSheet(): CreateSheetResult {
  const context = getSheetContext();
  
  return {
    types: context.types,
    rules: context.rules,
    examples: context.examples,
    version: context.version,
    instructions: `
Use the types, rules, and examples above to generate a valid WorkbookData JSON object.

WORKFLOW:
1. Understand the user's request for spreadsheet content
2. Design the sheet structure (sheets, cells, styles)
3. Create a stylePool for any styles you'll reuse (headers, numbers, etc.)
4. Generate the cells array with proper keys ("row:col" format, 0-indexed)
5. Return valid JSON matching the WorkbookData interface

IMPORTANT:
- Cell keys use format "row:col" where both are 0-indexed (e.g., "0:0" = A1, "0:1" = B1, "1:0" = A2)
- Only include non-empty cells (sparse storage)
- When referencing styles, add them to stylePool first
- Formulas start with "=" and use column letters (A, B, C) with 1-indexed rows (A1, B2)
- After generating, you can use validate_sheet to check your output
`.trim()
  };
}
