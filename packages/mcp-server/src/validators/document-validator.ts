/**
 * Document JSON validator
 * Validates AI-generated DocumentData JSON against the schema
 */

export interface ValidationError {
  path: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const VALID_BLOCK_TYPES = ['paragraph', 'heading', 'list-item', 'table', 'image', 'horizontal-rule', 'page-break'];
const VALID_HEADING_LEVELS = [1, 2, 3, 4, 5, 6];
const VALID_LIST_TYPES = ['bullet', 'numbered'];
const VALID_ALIGNMENTS = ['left', 'center', 'right', 'justify'];
const VALID_ORIENTATIONS = ['portrait', 'landscape'];
const VALID_INLINE_TYPES = ['text', 'image', 'link', 'dynamicField'];
const VALID_DYNAMIC_FIELD_TYPES = ['pageNumber', 'totalPages', 'date', 'time', 'title'];

/**
 * Validate a DocumentData JSON object
 */
export function validateDocument(data: unknown, strict: boolean = true): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const addIssue = (path: string, message: string, suggestion?: string) => {
    const issue = { path, message, suggestion };
    if (strict) {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }
  };

  const addError = (path: string, message: string, suggestion?: string) => {
    errors.push({ path, message, suggestion });
  };

  // Check root structure
  if (!data || typeof data !== 'object') {
    addError('', 'Document must be an object', 'Provide a valid JSON object');
    return { valid: false, errors, warnings };
  }

  const doc = data as Record<string, unknown>;

  // Required fields
  if (typeof doc.id !== 'string' || doc.id.length === 0) {
    addError('id', 'id is required and must be a non-empty string', 'Add id: "doc_1"');
  }

  if (typeof doc.title !== 'string') {
    addError('title', 'title is required and must be a string', 'Add title: "My Document"');
  }

  // defaultPageConfig
  if (!doc.defaultPageConfig || typeof doc.defaultPageConfig !== 'object') {
    addError('defaultPageConfig', 'defaultPageConfig is required', 'Add defaultPageConfig with size, margins, and orientation');
  } else {
    validatePageConfig(doc.defaultPageConfig as Record<string, unknown>, 'defaultPageConfig', addIssue, addError);
  }

  // textStylePool
  if (doc.textStylePool !== undefined) {
    if (typeof doc.textStylePool !== 'object' || doc.textStylePool === null) {
      addIssue('textStylePool', 'textStylePool must be an object', 'Use format: { "style_bold": { bold: true } }');
    }
  }

  // paragraphStylePool
  if (doc.paragraphStylePool !== undefined) {
    if (typeof doc.paragraphStylePool !== 'object' || doc.paragraphStylePool === null) {
      addIssue('paragraphStylePool', 'paragraphStylePool must be an object', 'Use format: { "style_centered": { alignment: "center" } }');
    }
  }

  // sections
  if (!Array.isArray(doc.sections)) {
    addError('sections', 'sections is required and must be an array', 'Add sections: [{ id: "section_1", pageConfig: {...}, blocks: [...] }]');
  } else if (doc.sections.length === 0) {
    addIssue('sections', 'sections array is empty', 'Add at least one section');
  } else {
    const sectionIds = new Set<string>();
    const allBlockIds = new Set<string>();
    const textStylePool = (doc.textStylePool as Record<string, unknown>) || {};

    doc.sections.forEach((section, sectionIndex) => {
      const sectionPath = `sections[${sectionIndex}]`;
      
      if (!section || typeof section !== 'object') {
        addError(sectionPath, 'Section must be an object');
        return;
      }

      const sec = section as Record<string, unknown>;

      // Section ID
      if (typeof sec.id !== 'string' || sec.id.length === 0) {
        addError(`${sectionPath}.id`, 'Section id is required', `Use id: "section_${sectionIndex + 1}"`);
      } else if (sectionIds.has(sec.id)) {
        addError(`${sectionPath}.id`, `Duplicate section id: ${sec.id}`, 'Each section must have a unique id');
      } else {
        sectionIds.add(sec.id);
      }

      // Section pageConfig
      if (!sec.pageConfig || typeof sec.pageConfig !== 'object') {
        addIssue(`${sectionPath}.pageConfig`, 'Section pageConfig is recommended', 'Add pageConfig to the section');
      } else {
        validatePageConfig(sec.pageConfig as Record<string, unknown>, `${sectionPath}.pageConfig`, addIssue, addError);
      }

      // Blocks
      if (!Array.isArray(sec.blocks)) {
        addError(`${sectionPath}.blocks`, 'blocks is required and must be an array');
      } else {
        sec.blocks.forEach((block, blockIndex) => {
          validateBlock(
            block,
            `${sectionPath}.blocks[${blockIndex}]`,
            allBlockIds,
            textStylePool,
            addIssue,
            addError
          );
        });
      }

      // Header (optional)
      if (sec.header !== undefined) {
        validateHeaderFooter(sec.header, `${sectionPath}.header`, addIssue, addError);
      }

      // Footer (optional)
      if (sec.footer !== undefined) {
        validateHeaderFooter(sec.footer, `${sectionPath}.footer`, addIssue, addError);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validatePageConfig(
  config: Record<string, unknown>,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  // Size
  if (!config.size || typeof config.size !== 'object') {
    addError(`${path}.size`, 'size is required', 'Add size: { w: 816, h: 1056 }');
  } else {
    const size = config.size as Record<string, unknown>;
    if (typeof size.w !== 'number' || size.w <= 0) {
      addError(`${path}.size.w`, 'size.w must be a positive number', 'Use w: 816 for Letter width');
    }
    if (typeof size.h !== 'number' || size.h <= 0) {
      addError(`${path}.size.h`, 'size.h must be a positive number', 'Use h: 1056 for Letter height');
    }
  }

  // Margins
  if (!config.margins || typeof config.margins !== 'object') {
    addError(`${path}.margins`, 'margins is required', 'Add margins: { top: 96, right: 96, bottom: 96, left: 96 }');
  } else {
    const margins = config.margins as Record<string, unknown>;
    ['top', 'right', 'bottom', 'left'].forEach(side => {
      if (typeof margins[side] !== 'number') {
        addIssue(`${path}.margins.${side}`, `margins.${side} should be a number`, 'Use 96 for 1 inch margin');
      }
    });
  }

  // Orientation
  if (config.orientation !== undefined) {
    if (!VALID_ORIENTATIONS.includes(config.orientation as string)) {
      addIssue(`${path}.orientation`, `orientation must be one of: ${VALID_ORIENTATIONS.join(', ')}`, 'Use "portrait" or "landscape"');
    }
  }
}

function validateBlock(
  block: unknown,
  path: string,
  allBlockIds: Set<string>,
  textStylePool: Record<string, unknown>,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  if (!block || typeof block !== 'object') {
    addError(path, 'Block must be an object');
    return;
  }

  const b = block as Record<string, unknown>;

  // Block ID
  if (typeof b.id !== 'string' || b.id.length === 0) {
    addError(`${path}.id`, 'Block id is required', 'Add a unique id like "block_1"');
  } else if (allBlockIds.has(b.id)) {
    addError(`${path}.id`, `Duplicate block id: ${b.id}`, 'Each block must have a unique id');
  } else {
    allBlockIds.add(b.id);
  }

  // Block type
  if (!VALID_BLOCK_TYPES.includes(b.type as string)) {
    addError(`${path}.type`, `Invalid block type: ${b.type}`, `Use one of: ${VALID_BLOCK_TYPES.join(', ')}`);
    return;
  }

  // Type-specific validation
  switch (b.type) {
    case 'paragraph':
      validateInlineContent(b.content, `${path}.content`, textStylePool, addIssue, addError);
      if (b.alignment !== undefined && !VALID_ALIGNMENTS.includes(b.alignment as string)) {
        addIssue(`${path}.alignment`, `Invalid alignment: ${b.alignment}`, `Use one of: ${VALID_ALIGNMENTS.join(', ')}`);
      }
      break;

    case 'heading':
      if (!VALID_HEADING_LEVELS.includes(b.level as number)) {
        addError(`${path}.level`, `Heading level must be 1-6, got: ${b.level}`, 'Use level: 1 for H1, level: 2 for H2, etc.');
      }
      validateInlineContent(b.content, `${path}.content`, textStylePool, addIssue, addError);
      break;

    case 'list-item':
      if (!VALID_LIST_TYPES.includes(b.listType as string)) {
        addError(`${path}.listType`, `Invalid listType: ${b.listType}`, 'Use "bullet" or "numbered"');
      }
      if (typeof b.level !== 'number' || b.level < 0) {
        addIssue(`${path}.level`, 'List level should be a non-negative number', 'Use level: 0 for top-level items');
      }
      validateInlineContent(b.content, `${path}.content`, textStylePool, addIssue, addError);
      break;

    case 'table':
      validateTable(b, path, textStylePool, addIssue, addError);
      break;

    case 'image':
      if (typeof b.src !== 'string' || b.src.length === 0) {
        addError(`${path}.src`, 'Image src is required');
      }
      if (typeof b.width !== 'number' || b.width <= 0) {
        addError(`${path}.width`, 'Image width is required and must be positive');
      }
      if (typeof b.height !== 'number' || b.height <= 0) {
        addError(`${path}.height`, 'Image height is required and must be positive');
      }
      break;

    case 'horizontal-rule':
    case 'page-break':
      // No additional validation needed
      break;
  }
}

function validateInlineContent(
  content: unknown,
  path: string,
  textStylePool: Record<string, unknown>,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  if (!Array.isArray(content)) {
    addError(path, 'content must be an array', 'Use content: [{ type: "text", text: "Hello" }]');
    return;
  }

  content.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    
    if (!item || typeof item !== 'object') {
      addError(itemPath, 'Content item must be an object');
      return;
    }

    const i = item as Record<string, unknown>;

    if (!VALID_INLINE_TYPES.includes(i.type as string)) {
      addError(`${itemPath}.type`, `Invalid inline type: ${i.type}`, `Use one of: ${VALID_INLINE_TYPES.join(', ')}`);
      return;
    }

    if (i.type === 'text') {
      if (typeof i.text !== 'string') {
        addError(`${itemPath}.text`, 'text is required for type: "text"');
      }
      if (i.styleId !== undefined && typeof i.styleId === 'string') {
        if (!textStylePool[i.styleId]) {
          addError(`${itemPath}.styleId`, `styleId "${i.styleId}" not found in textStylePool`, 'Add this style to textStylePool or remove the styleId');
        }
      }
    } else if (i.type === 'link') {
      if (typeof i.text !== 'string') {
        addError(`${itemPath}.text`, 'text is required for links');
      }
      if (typeof i.href !== 'string') {
        addError(`${itemPath}.href`, 'href is required for links');
      }
    } else if (i.type === 'image') {
      if (typeof i.src !== 'string') {
        addError(`${itemPath}.src`, 'src is required for inline images');
      }
    } else if (i.type === 'dynamicField') {
      if (!VALID_DYNAMIC_FIELD_TYPES.includes(i.fieldType as string)) {
        addError(`${itemPath}.fieldType`, `Invalid fieldType: ${i.fieldType}`, `Use one of: ${VALID_DYNAMIC_FIELD_TYPES.join(', ')}`);
      }
    }
  });
}

function validateTable(
  table: Record<string, unknown>,
  path: string,
  textStylePool: Record<string, unknown>,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  if (!Array.isArray(table.rows)) {
    addError(`${path}.rows`, 'Table rows is required and must be an array');
    return;
  }

  const rowIds = new Set<string>();
  const cellIds = new Set<string>();

  table.rows.forEach((row, rowIndex) => {
    const rowPath = `${path}.rows[${rowIndex}]`;
    
    if (!row || typeof row !== 'object') {
      addError(rowPath, 'Row must be an object');
      return;
    }

    const r = row as Record<string, unknown>;

    if (typeof r.id !== 'string') {
      addIssue(`${rowPath}.id`, 'Row id is recommended', `Use id: "row_${rowIndex + 1}"`);
    } else if (rowIds.has(r.id)) {
      addError(`${rowPath}.id`, `Duplicate row id: ${r.id}`);
    } else {
      rowIds.add(r.id);
    }

    if (!Array.isArray(r.cells)) {
      addError(`${rowPath}.cells`, 'Row cells is required and must be an array');
      return;
    }

    r.cells.forEach((cell, cellIndex) => {
      const cellPath = `${rowPath}.cells[${cellIndex}]`;
      
      if (!cell || typeof cell !== 'object') {
        addError(cellPath, 'Cell must be an object');
        return;
      }

      const c = cell as Record<string, unknown>;

      if (typeof c.id !== 'string') {
        addIssue(`${cellPath}.id`, 'Cell id is recommended', `Use id: "cell_${rowIndex + 1}_${cellIndex + 1}"`);
      } else if (cellIds.has(c.id)) {
        addError(`${cellPath}.id`, `Duplicate cell id: ${c.id}`);
      } else {
        cellIds.add(c.id);
      }

      validateInlineContent(c.content, `${cellPath}.content`, textStylePool, addIssue, addError);
    });
  });
}

function validateHeaderFooter(
  hf: unknown,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  if (!hf || typeof hf !== 'object') {
    addError(path, 'Header/footer must be an object');
    return;
  }

  const obj = hf as Record<string, unknown>;

  if (!Array.isArray(obj.blocks)) {
    addError(`${path}.blocks`, 'Header/footer blocks is required and must be an array');
  } else {
    obj.blocks.forEach((block, index) => {
      const blockPath = `${path}.blocks[${index}]`;
      if (!block || typeof block !== 'object') {
        addError(blockPath, 'Header/footer block must be an object');
        return;
      }
      const b = block as Record<string, unknown>;
      if (b.type !== 'paragraph') {
        addIssue(`${blockPath}.type`, 'Header/footer blocks should be paragraphs');
      }
      if (!Array.isArray(b.content)) {
        addError(`${blockPath}.content`, 'Header/footer block content is required');
      }
    });
  }

  if (obj.differentFirstPage !== undefined && typeof obj.differentFirstPage !== 'boolean') {
    addIssue(`${path}.differentFirstPage`, 'differentFirstPage should be a boolean');
  }
}
