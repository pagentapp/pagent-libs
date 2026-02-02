/**
 * validate_sheet tool
 * Validates AI-generated WorkbookData JSON
 */

import { validateSheet, ValidationResult } from '../validators/sheet-validator.js';

export interface ValidateSheetInput {
  json: unknown;
  strict?: boolean;
}

export interface ValidateSheetResult {
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

export function validateSheetTool(input: ValidateSheetInput): ValidateSheetResult {
  const strict = input.strict !== false; // Default to strict
  const result: ValidationResult = validateSheet(input.json, strict);
  
  let summary: string;
  if (result.valid) {
    if (result.warnings.length > 0) {
      summary = `Workbook is valid with ${result.warnings.length} warning(s).`;
    } else {
      summary = 'Workbook is valid and ready to use.';
    }
  } else {
    summary = `Workbook has ${result.errors.length} error(s) that must be fixed.`;
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
