/**
 * Tests for document validator
 */

import { describe, it, expect } from 'vitest';
import { validateDocument } from '../validators/document-validator.js';

describe('validateDocument', () => {
  describe('root structure validation', () => {
    it('should reject non-object input', () => {
      const result = validateDocument(null);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ message: expect.stringContaining('must be an object') })
      );
    });

    it('should require id field', () => {
      const result = validateDocument({});
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'id' })
      );
    });

    it('should require title field', () => {
      const result = validateDocument({ id: 'doc_1' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'title' })
      );
    });

    it('should require defaultPageConfig', () => {
      const result = validateDocument({ id: 'doc_1', title: 'Test' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'defaultPageConfig' })
      );
    });

    it('should require sections array', () => {
      const result = validateDocument({
        id: 'doc_1',
        title: 'Test',
        defaultPageConfig: {
          size: { w: 816, h: 1056 },
          margins: { top: 96, right: 96, bottom: 96, left: 96 },
          orientation: 'portrait',
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections' })
      );
    });
  });

  describe('valid document', () => {
    const validDocument = {
      id: 'doc_1',
      title: 'Test Document',
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
            {
              id: 'block_1',
              type: 'paragraph',
              content: [{ type: 'text', text: 'Hello World' }],
            },
          ],
        },
      ],
    };

    it('should accept a valid document', () => {
      const result = validateDocument(validDocument);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('block validation', () => {
    const createDoc = (blocks: unknown[]) => ({
      id: 'doc_1',
      title: 'Test',
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: 'portrait',
      },
      textStylePool: {},
      sections: [
        {
          id: 'section_1',
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: 'portrait',
          },
          blocks,
        },
      ],
    });

    it('should require block id', () => {
      const result = validateDocument(createDoc([{ type: 'paragraph', content: [] }]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections[0].blocks[0].id' })
      );
    });

    it('should reject invalid block type', () => {
      const result = validateDocument(createDoc([{ id: 'block_1', type: 'invalid', content: [] }]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections[0].blocks[0].type' })
      );
    });

    it('should reject duplicate block ids', () => {
      const result = validateDocument(createDoc([
        { id: 'block_1', type: 'paragraph', content: [] },
        { id: 'block_1', type: 'paragraph', content: [] },
      ]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          path: 'sections[0].blocks[1].id',
          message: expect.stringContaining('Duplicate')
        })
      );
    });

    it('should validate heading level', () => {
      const result = validateDocument(createDoc([
        { id: 'block_1', type: 'heading', level: 7, content: [] },
      ]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections[0].blocks[0].level' })
      );
    });

    it('should accept valid heading levels 1-6', () => {
      for (let level = 1; level <= 6; level++) {
        const result = validateDocument(createDoc([
          { id: 'block_1', type: 'heading', level, content: [{ type: 'text', text: 'Test' }] },
        ]));
        expect(result.valid).toBe(true);
      }
    });

    it('should validate list-item listType', () => {
      const result = validateDocument(createDoc([
        { id: 'block_1', type: 'list-item', listType: 'invalid', level: 0, content: [] },
      ]));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections[0].blocks[0].listType' })
      );
    });

    it('should accept bullet and numbered list types', () => {
      const bulletResult = validateDocument(createDoc([
        { id: 'block_1', type: 'list-item', listType: 'bullet', level: 0, content: [{ type: 'text', text: 'Item' }] },
      ]));
      expect(bulletResult.valid).toBe(true);

      const numberedResult = validateDocument(createDoc([
        { id: 'block_1', type: 'list-item', listType: 'numbered', level: 0, content: [{ type: 'text', text: 'Item' }] },
      ]));
      expect(numberedResult.valid).toBe(true);
    });
  });

  describe('styleId validation', () => {
    it('should reject styleId not in textStylePool', () => {
      const doc = {
        id: 'doc_1',
        title: 'Test',
        defaultPageConfig: {
          size: { w: 816, h: 1056 },
          margins: { top: 96, right: 96, bottom: 96, left: 96 },
          orientation: 'portrait',
        },
        textStylePool: {},
        sections: [
          {
            id: 'section_1',
            pageConfig: {
              size: { w: 816, h: 1056 },
              margins: { top: 96, right: 96, bottom: 96, left: 96 },
              orientation: 'portrait',
            },
            blocks: [
              {
                id: 'block_1',
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello', styleId: 'missing_style' }],
              },
            ],
          },
        ],
      };
      const result = validateDocument(doc);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ 
          message: expect.stringContaining('missing_style')
        })
      );
    });

    it('should accept styleId that exists in textStylePool', () => {
      const doc = {
        id: 'doc_1',
        title: 'Test',
        defaultPageConfig: {
          size: { w: 816, h: 1056 },
          margins: { top: 96, right: 96, bottom: 96, left: 96 },
          orientation: 'portrait',
        },
        textStylePool: {
          style_bold: { bold: true },
        },
        sections: [
          {
            id: 'section_1',
            pageConfig: {
              size: { w: 816, h: 1056 },
              margins: { top: 96, right: 96, bottom: 96, left: 96 },
              orientation: 'portrait',
            },
            blocks: [
              {
                id: 'block_1',
                type: 'paragraph',
                content: [{ type: 'text', text: 'Hello', styleId: 'style_bold' }],
              },
            ],
          },
        ],
      };
      const result = validateDocument(doc);
      expect(result.valid).toBe(true);
    });
  });

  describe('table validation', () => {
    const createDocWithTable = (table: unknown) => ({
      id: 'doc_1',
      title: 'Test',
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: 'portrait',
      },
      textStylePool: {},
      sections: [
        {
          id: 'section_1',
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: 'portrait',
          },
          blocks: [table],
        },
      ],
    });

    it('should require table rows', () => {
      const result = validateDocument(createDocWithTable({
        id: 'block_1',
        type: 'table',
      }));
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ path: 'sections[0].blocks[0].rows' })
      );
    });

    it('should accept valid table', () => {
      const result = validateDocument(createDocWithTable({
        id: 'block_1',
        type: 'table',
        rows: [
          {
            id: 'row_1',
            cells: [
              { id: 'cell_1_1', content: [{ type: 'text', text: 'A' }] },
              { id: 'cell_1_2', content: [{ type: 'text', text: 'B' }] },
            ],
          },
        ],
      }));
      expect(result.valid).toBe(true);
    });
  });

  describe('strict mode', () => {
    it('should report issues as warnings when strict=false', () => {
      const doc = {
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
      
      const strictResult = validateDocument(doc, true);
      const lenientResult = validateDocument(doc, false);
      
      // Strict mode: empty sections is an error
      expect(strictResult.errors.length).toBeGreaterThan(0);
      
      // Lenient mode: empty sections is a warning
      expect(lenientResult.warnings.length).toBeGreaterThan(0);
    });
  });
});
