/**
 * create_document tool
 * Returns context for AI to generate valid DocumentData JSON
 */

import { getDocumentContext } from '../context/document-context.js';

export interface CreateDocumentResult {
  types: string;
  rules: string[];
  examples: Array<{
    description: string;
    json: unknown;
  }>;
  version: string;
  instructions: string;
}

export function createDocument(): CreateDocumentResult {
  const context = getDocumentContext();
  
  return {
    types: context.types,
    rules: context.rules,
    examples: context.examples,
    version: context.version,
    instructions: `
Use the types, rules, and examples above to generate a valid DocumentData JSON object.

WORKFLOW:
1. Understand the user's request for document content
2. Design the document structure (sections, blocks, styles)
3. Create a textStylePool for any styles you'll reuse
4. Generate the blocks array with proper IDs and content
5. Return valid JSON matching the DocumentData interface

IMPORTANT:
- Every block needs a unique id (use block_1, block_2, etc.)
- When referencing styles, add them to textStylePool first
- Use the examples as templates for common patterns
- After generating, you can use validate_document to check your output
`.trim()
  };
}
