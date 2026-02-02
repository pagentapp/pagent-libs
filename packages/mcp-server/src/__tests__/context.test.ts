/**
 * Tests for context providers
 */

import { describe, it, expect } from 'vitest';
import { getDocumentContext } from '../context/document-context.js';
import { getSheetContext } from '../context/sheet-context.js';

describe('getDocumentContext', () => {
  it('should return complete context object', () => {
    const context = getDocumentContext();
    
    expect(context).toHaveProperty('types');
    expect(context).toHaveProperty('rules');
    expect(context).toHaveProperty('examples');
    expect(context).toHaveProperty('version');
  });

  describe('types', () => {
    it('should include all core types', () => {
      const { types } = getDocumentContext();
      
      // Core types
      expect(types).toContain('DocumentData');
      expect(types).toContain('PageConfig');
      expect(types).toContain('Section');
      expect(types).toContain('Block');
      expect(types).toContain('TextRun');
      expect(types).toContain('TextStyle');
    });

    it('should include block types', () => {
      const { types } = getDocumentContext();
      
      expect(types).toContain('ParagraphBlock');
      expect(types).toContain('HeadingBlock');
      expect(types).toContain('TableBlock');
      expect(types).toContain('ImageBlock');
      expect(types).toContain('ListItemBlock');
    });

    it('should include table-related types', () => {
      const { types } = getDocumentContext();
      
      expect(types).toContain('TableRow');
      expect(types).toContain('TableCell');
    });
  });

  describe('rules', () => {
    it('should include id uniqueness rules', () => {
      const { rules } = getDocumentContext();
      
      expect(rules.some(r => r.toLowerCase().includes('unique'))).toBe(true);
      expect(rules.some(r => r.includes('block'))).toBe(true);
    });

    it('should include styleId rules', () => {
      const { rules } = getDocumentContext();
      
      expect(rules.some(r => r.includes('styleId'))).toBe(true);
      expect(rules.some(r => r.includes('textStylePool'))).toBe(true);
    });

    it('should include page config rules', () => {
      const { rules } = getDocumentContext();
      
      // Check for page size and margin rules
      expect(rules.some(r => r.includes('Page') || r.includes('816'))).toBe(true);
      expect(rules.some(r => r.includes('pixel') || r.includes('96'))).toBe(true);
    });
  });

  describe('examples', () => {
    it('should include at least 3 examples', () => {
      const { examples } = getDocumentContext();
      
      expect(examples.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid structure for each example', () => {
      const { examples } = getDocumentContext();
      
      examples.forEach(example => {
        expect(example).toHaveProperty('description');
        expect(typeof example.description).toBe('string');
        expect(example.description.length).toBeGreaterThan(0);
        
        expect(example).toHaveProperty('json');
        expect(typeof example.json).toBe('object');
      });
    });

    it('should have valid document structure in examples', () => {
      const { examples } = getDocumentContext();
      
      examples.forEach(example => {
        const doc = example.json;
        
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('defaultPageConfig');
        expect(doc).toHaveProperty('sections');
        expect(Array.isArray(doc.sections)).toBe(true);
      });
    });

    it('should include diverse document types', () => {
      const { examples } = getDocumentContext();
      const descriptions = examples.map(e => e.description.toLowerCase());
      
      // Should have different types of documents
      expect(descriptions.some(d => d.includes('simple') || d.includes('paragraph'))).toBe(true);
      expect(descriptions.some(d => d.includes('table') || d.includes('list'))).toBe(true);
    });
  });
});

describe('getSheetContext', () => {
  it('should return complete context object', () => {
    const context = getSheetContext();
    
    expect(context).toHaveProperty('types');
    expect(context).toHaveProperty('rules');
    expect(context).toHaveProperty('examples');
    expect(context).toHaveProperty('version');
  });

  describe('types', () => {
    it('should include all core types', () => {
      const { types } = getSheetContext();
      
      expect(types).toContain('WorkbookData');
      expect(types).toContain('SheetData');
      expect(types).toContain('Cell');
      expect(types).toContain('CellValue');
      expect(types).toContain('CellStyle');
    });

    it('should include config types', () => {
      const { types } = getSheetContext();
      
      expect(types).toContain('SheetConfig');
    });
  });

  describe('rules', () => {
    it('should include cell key format rules', () => {
      const { rules } = getSheetContext();
      
      expect(rules.some(r => r.includes('row:col'))).toBe(true);
      expect(rules.some(r => r.includes('0:0'))).toBe(true);
    });

    it('should include cell value rules', () => {
      const { rules } = getSheetContext();
      
      // Check for cell-related rules (sparse storage or cell key format)
      expect(rules.some(r => r.includes('cell') || r.includes('Cell'))).toBe(true);
    });

    it('should include formula rules', () => {
      const { rules } = getSheetContext();
      
      expect(rules.some(r => r.includes('formula') || r.includes('='))).toBe(true);
    });
  });

  describe('examples', () => {
    it('should include at least 3 examples', () => {
      const { examples } = getSheetContext();
      
      expect(examples.length).toBeGreaterThanOrEqual(3);
    });

    it('should have valid structure for each example', () => {
      const { examples } = getSheetContext();
      
      examples.forEach(example => {
        expect(example).toHaveProperty('description');
        expect(typeof example.description).toBe('string');
        expect(example.description.length).toBeGreaterThan(0);
        
        expect(example).toHaveProperty('json');
        expect(typeof example.json).toBe('object');
      });
    });

    it('should have valid workbook structure in examples', () => {
      const { examples } = getSheetContext();
      
      examples.forEach(example => {
        const wb = example.json;
        
        expect(wb).toHaveProperty('id');
        expect(wb).toHaveProperty('name');
        expect(wb).toHaveProperty('activeSheetId');
        expect(wb).toHaveProperty('sheets');
        expect(Array.isArray(wb.sheets)).toBe(true);
      });
    });

    it('should include diverse spreadsheet types', () => {
      const { examples } = getSheetContext();
      const descriptions = examples.map(e => e.description.toLowerCase());
      
      // Should have different types of spreadsheets
      expect(descriptions.some(d => 
        d.includes('simple') || d.includes('basic') || d.includes('data')
      )).toBe(true);
    });

    it('should have cells with valid key format', () => {
      const { examples } = getSheetContext();
      
      examples.forEach(example => {
        const wb = example.json;
        wb.sheets.forEach((sheet: { cells: Array<{ key: string }> }) => {
          sheet.cells.forEach(cellEntry => {
            expect(cellEntry.key).toMatch(/^\d+:\d+$/);
          });
        });
      });
    });
  });
});
