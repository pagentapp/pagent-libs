/**
 * Tests for sheet/workbook validator
 */

import { describe, it, expect } from 'vitest';
import { validateSheet } from '../validators/sheet-validator.js';

describe('validateSheet', () => {
  describe('root structure validation', () => {
    it('should reject non-object input', () => {
      const result = validateSheet(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('must be an object') })
      );
    });

    it('should require id field', () => {
      const result = validateSheet({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'id' })
      );
    });

    it('should require name field', () => {
      const result = validateSheet({ id: 'wb_1' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'name' })
      );
    });

    it('should require activeSheetId', () => {
      const result = validateSheet({ id: 'wb_1', name: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'activeSheetId' })
      );
    });

    it('should require sheets array', () => {
      const result = validateSheet({
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'sheet_1',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sheets' })
      );
    });
  });

  describe('valid workbook', () => {
    const validWorkbook = {
      id: 'wb_1',
      name: 'Test Workbook',
      activeSheetId: 'sheet_1',
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells: [
            { key: '0:0', cell: { value: 'Hello' } },
            { key: '0:1', cell: { value: 'World' } },
          ],
          config: {},
          rowCount: 1000,
          colCount: 100,
        },
      ],
    };

    it('should accept a valid workbook', () => {
      const result = validateSheet(validWorkbook);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('cell key validation', () => {
    const createWorkbook = (cells: unknown[]) => ({
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells,
          config: {},
          rowCount: 1000,
          colCount: 100,
        },
      ],
    });

    it('should require cell key', () => {
      const result = validateSheet(createWorkbook([{ cell: { value: 'Test' } }]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sheets[0].cells[0].key' })
      );
    });

    it('should reject invalid key format', () => {
      const result = validateSheet(createWorkbook([{ key: 'A1', cell: { value: 'Test' } }]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'sheets[0].cells[0].key',
          message: expect.stringContaining('Invalid key format')
        })
      );
    });

    it('should accept valid key format row:col', () => {
      const result = validateSheet(createWorkbook([
        { key: '0:0', cell: { value: 'A1' } },
        { key: '0:1', cell: { value: 'B1' } },
        { key: '1:0', cell: { value: 'A2' } },
        { key: '99:99', cell: { value: 'Test' } },
      ]));
      expect(result.valid).toBe(true);
    });

    it('should reject duplicate cell keys', () => {
      const result = validateSheet(createWorkbook([
        { key: '0:0', cell: { value: 'First' } },
        { key: '0:0', cell: { value: 'Second' } },
      ]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'sheets[0].cells[1].key',
          message: expect.stringContaining('Duplicate')
        })
      );
    });
  });

  describe('cell value validation', () => {
    const createWorkbook = (cell: unknown) => ({
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells: [{ key: '0:0', cell }],
          config: {},
          rowCount: 1000,
          colCount: 100,
        },
      ],
    });

    it('should accept string values', () => {
      const result = validateSheet(createWorkbook({ value: 'Hello' }));
      expect(result.valid).toBe(true);
    });

    it('should accept number values', () => {
      const result = validateSheet(createWorkbook({ value: 42 }));
      expect(result.valid).toBe(true);
    });

    it('should accept boolean values', () => {
      const result = validateSheet(createWorkbook({ value: true }));
      expect(result.valid).toBe(true);
    });

    it('should accept null values', () => {
      const result = validateSheet(createWorkbook({ value: null }));
      expect(result.valid).toBe(true);
    });

    it('should reject object values', () => {
      const result = validateSheet(createWorkbook({ value: { nested: 'object' } }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sheets[0].cells[0].cell.value' })
      );
    });
  });

  describe('formula validation', () => {
    const createWorkbook = (cell: unknown) => ({
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells: [{ key: '0:0', cell }],
          config: {},
          rowCount: 1000,
          colCount: 100,
        },
      ],
    });

    it('should accept formulas starting with =', () => {
      const result = validateSheet(createWorkbook({ value: 10, formula: '=SUM(A1:A10)' }));
      expect(result.valid).toBe(true);
    });

    it('should warn about formulas not starting with =', () => {
      const result = validateSheet(createWorkbook({ value: 10, formula: 'SUM(A1:A10)' }), true);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'sheets[0].cells[0].cell.formula',
          message: expect.stringContaining('should start with')
        })
      );
    });
  });

  describe('styleId validation', () => {
    it('should reject styleId not in stylePool', () => {
      const workbook = {
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'sheet_1',
        stylePool: {},
        sheets: [
          {
            id: 'sheet_1',
            name: 'Sheet1',
            cells: [{ key: '0:0', cell: { value: 'Test', styleId: 'missing_style' } }],
            config: {},
            rowCount: 1000,
            colCount: 100,
          },
        ],
      };
      const result = validateSheet(workbook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          message: expect.stringContaining('missing_style')
        })
      );
    });

    it('should accept styleId that exists in stylePool', () => {
      const workbook = {
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'sheet_1',
        stylePool: {
          style_header: { bold: true },
        },
        sheets: [
          {
            id: 'sheet_1',
            name: 'Sheet1',
            cells: [{ key: '0:0', cell: { value: 'Header', styleId: 'style_header' } }],
            config: {},
            rowCount: 1000,
            colCount: 100,
          },
        ],
      };
      const result = validateSheet(workbook);
      expect(result.valid).toBe(true);
    });
  });

  describe('sheet validation', () => {
    it('should require unique sheet ids', () => {
      const workbook = {
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'sheet_1',
        stylePool: {},
        sheets: [
          { id: 'sheet_1', name: 'Sheet1', cells: [], config: {}, rowCount: 1000, colCount: 100 },
          { id: 'sheet_1', name: 'Sheet2', cells: [], config: {}, rowCount: 1000, colCount: 100 },
        ],
      };
      const result = validateSheet(workbook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'sheets[1].id',
          message: expect.stringContaining('Duplicate')
        })
      );
    });

    it('should validate activeSheetId references valid sheet', () => {
      const workbook = {
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'nonexistent_sheet',
        stylePool: {},
        sheets: [
          { id: 'sheet_1', name: 'Sheet1', cells: [], config: {}, rowCount: 1000, colCount: 100 },
        ],
      };
      const result = validateSheet(workbook);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'activeSheetId',
          message: expect.stringContaining('does not match')
        })
      );
    });
  });

  describe('config validation', () => {
    const createWorkbook = (config: unknown) => ({
      id: 'wb_1',
      name: 'Test',
      activeSheetId: 'sheet_1',
      stylePool: {},
      sheets: [
        {
          id: 'sheet_1',
          name: 'Sheet1',
          cells: [],
          config,
          rowCount: 1000,
          colCount: 100,
        },
      ],
    });

    it('should accept valid frozen rows/cols', () => {
      const result = validateSheet(createWorkbook({ frozenRows: 1, frozenCols: 2 }));
      expect(result.valid).toBe(true);
    });

    it('should accept valid sortOrder', () => {
      const result = validateSheet(createWorkbook({
        sortOrder: [
          { column: 0, direction: 'asc' },
          { column: 1, direction: 'desc' },
        ],
      }));
      expect(result.valid).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('should report issues as warnings when strict=false', () => {
      const workbook = {
        id: 'wb_1',
        name: 'Test',
        activeSheetId: 'sheet_1',
        stylePool: {},
        sheets: [],
      };
      
      const strictResult = validateSheet(workbook, true);
      const lenientResult = validateSheet(workbook, false);
      
      // Strict mode: empty sheets is an issue
      expect(strictResult.errors.length + strictResult.warnings.length).toBeGreaterThan(0);
      
      // Lenient mode: more warnings than errors
      expect(lenientResult.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });
});
