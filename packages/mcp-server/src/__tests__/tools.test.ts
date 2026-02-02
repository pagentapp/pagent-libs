/**
 * Tests for MCP tools
 */

import { describe, it, expect } from 'vitest';
import { createDocument } from '../tools/create-document.js';
import { createSheet } from '../tools/create-sheet.js';
import { validateDocumentTool } from '../tools/validate-document.js';
import { validateSheetTool } from '../tools/validate-sheet.js';

describe('createDocument', () => {
  it('should return types, rules, examples, and instructions', () => {
    const result = createDocument();
    
    expect(result).toHaveProperty('types');
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('examples');
    expect(result).toHaveProperty('instructions');
    expect(result).toHaveProperty('version');
  });

  it('should include TypeScript type definitions', () => {
    const result = createDocument();
    
    expect(result.types).toContain('DocumentData');
    expect(result.types).toContain('PageConfig');
    expect(result.types).toContain('Block');
    expect(result.types).toContain('TextRun');
    expect(result.types).toContain('ParagraphBlock');
    expect(result.types).toContain('HeadingBlock');
    expect(result.types).toContain('TableBlock');
  });

  it('should include validation rules', () => {
    const result = createDocument();
    
    expect(result.rules).toBeInstanceOf(Array);
    expect(result.rules.length).toBeGreaterThan(5);
    expect(result.rules.some(r => r.includes('unique'))).toBe(true);
    expect(result.rules.some(r => r.includes('styleId'))).toBe(true);
  });

  it('should include multiple examples', () => {
    const result = createDocument();
    
    expect(result.examples).toBeInstanceOf(Array);
    expect(result.examples.length).toBeGreaterThanOrEqual(3);
    
    result.examples.forEach(example => {
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('json');
      expect(example.json).toHaveProperty('id');
      expect(example.json).toHaveProperty('sections');
    });
  });

  it('should include workflow instructions', () => {
    const result = createDocument();
    
    expect(result.instructions).toContain('WORKFLOW');
    expect(result.instructions).toContain('validate_document');
  });
});

describe('createSheet', () => {
  it('should return types, rules, examples, and instructions', () => {
    const result = createSheet();
    
    expect(result).toHaveProperty('types');
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('examples');
    expect(result).toHaveProperty('instructions');
    expect(result).toHaveProperty('version');
  });

  it('should include TypeScript type definitions', () => {
    const result = createSheet();
    
    expect(result.types).toContain('WorkbookData');
    expect(result.types).toContain('SheetData');
    expect(result.types).toContain('Cell');
    expect(result.types).toContain('CellStyle');
    expect(result.types).toContain('CellValue');
  });

  it('should include validation rules', () => {
    const result = createSheet();
    
    expect(result.rules).toBeInstanceOf(Array);
    expect(result.rules.length).toBeGreaterThan(5);
    expect(result.rules.some(r => r.includes('row:col'))).toBe(true);
    expect(result.rules.some(r => r.includes('styleId'))).toBe(true);
  });

  it('should include multiple examples', () => {
    const result = createSheet();
    
    expect(result.examples).toBeInstanceOf(Array);
    expect(result.examples.length).toBeGreaterThanOrEqual(3);
    
    result.examples.forEach(example => {
      expect(example).toHaveProperty('description');
      expect(example).toHaveProperty('json');
      expect(example.json).toHaveProperty('id');
      expect(example.json).toHaveProperty('sheets');
    });
  });

  it('should include workflow instructions', () => {
    const result = createSheet();
    
    expect(result.instructions).toContain('WORKFLOW');
    expect(result.instructions).toContain('validate_sheet');
  });
});

describe('validateDocumentTool', () => {
  it('should return valid=true for valid document', () => {
    const validDoc = {
      id: 'doc_1',
      title: 'Test',
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: 'portrait',
      },
      textStylePool: {},
      paragraphStylePool: {},
      sections: [
        {
          id: 'section_1',
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: 'portrait',
          },
          blocks: [
            { id: 'block_1', type: 'paragraph', content: [{ type: 'text', text: 'Hello' }] },
          ],
        },
      ],
    };

    const result = validateDocumentTool({ json: validDoc });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary).toContain('valid');
  });

  it('should return valid=false for invalid document', () => {
    const invalidDoc = { id: 'doc_1' };
    
    const result = validateDocumentTool({ json: invalidDoc });
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.summary).toContain('error');
  });

  it('should respect strict flag', () => {
    const docWithWarnings = {
      id: 'doc_1',
      title: 'Test',
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: 'portrait',
      },
      textStylePool: {},
      sections: [],
    };

    const strictResult = validateDocumentTool({ json: docWithWarnings, strict: true });
    const lenientResult = validateDocumentTool({ json: docWithWarnings, strict: false });
    
    // Strict: issue is an error
    expect(strictResult.errors.length).toBeGreaterThan(0);
    
    // Lenient: issue is a warning
    expect(lenientResult.warnings.length).toBeGreaterThan(0);
  });

  it('should include suggestions in errors', () => {
    const invalidDoc = {};
    
    const result = validateDocumentTool({ json: invalidDoc });
    
    const errorWithSuggestion = result.errors.find(e => e.suggestion);
    expect(errorWithSuggestion).toBeDefined();
  });
});

describe('validateSheetTool', () => {
  it('should return valid=true for valid workbook', () => {
    const validWorkbook = {
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells: [{ key: '0:0', cell: { value: 'Hello' } }],
          config: {},
          rowCount: 1000,
          colCount: 100,
        },
      ],
    };

    const result = validateSheetTool({ json: validWorkbook });
    
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.summary).toContain('valid');
  });

  it('should return valid=false for invalid workbook', () => {
    const invalidWorkbook = { id: 'wb_1' };
    
    const result = validateSheetTool({ json: invalidWorkbook });
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.summary).toContain('error');
  });

  it('should respect strict flag', () => {
    const workbookWithWarnings = {
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [],
    };

    const strictResult = validateSheetTool({ json: workbookWithWarnings, strict: true });
    const lenientResult = validateSheetTool({ json: workbookWithWarnings, strict: false });
    
    // Both should have some issues (empty sheets, invalid activeSheetId)
    expect(strictResult.errors.length + strictResult.warnings.length).toBeGreaterThan(0);
    expect(lenientResult.errors.length + lenientResult.warnings.length).toBeGreaterThan(0);
  });

  it('should include suggestions in errors', () => {
    const invalidWorkbook = {};
    
    const result = validateSheetTool({ json: invalidWorkbook });
    
    const errorWithSuggestion = result.errors.find(e => e.suggestion);
    expect(errorWithSuggestion).toBeDefined();
  });
});
