/**
 * validate_document tool
 * Validates AI-generated DocumentData JSON
 */

import { validateDocument, ValidationResult } from '../validators/document-validator.js';

export interface ValidateDocumentInput {
  json: unknown;
  strict?: boolean;
}

export interface ValidateDocumentResult {
  valid: boolean;
  errors: Array<{
    path: string;
    message: string;
    suggestion?: string;
  }>;
  warnings: Array<{
    path: string;
    message: string;
    suggestion?: string;
  }>;
  summary: string;
}

export function validateDocumentTool(input: ValidateDocumentInput): ValidateDocumentResult {
  const strict = input.strict !== false; // Default to strict
  const result: ValidationResult = validateDocument(input.json, strict);
  
  let summary: string;
  if (result.valid) {
    if (result.warnings.length > 0) {
      summary = `Document is valid with ${result.warnings.length} warning(s).`;
    } else {
      summary = 'Document is valid and ready to use.';
    }
  } else {
    summary = `Document has ${result.errors.length} error(s) that must be fixed.`;
    if (result.warnings.length > 0) {
      summary += ` Also has ${result.warnings.length} warning(s).`;
    }
  }
  
  return {
    valid: result.valid,
    errors: result.errors,
    warnings: result.warnings,
    summary
  };
}
