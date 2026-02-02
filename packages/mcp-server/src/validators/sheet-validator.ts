/**
 * Sheet/Workbook JSON validator
 * Validates AI-generated WorkbookData JSON against the schema
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

const VALID_TEXT_ALIGNS = ['left', 'center', 'right'];
const VALID_VERTICAL_ALIGNS = ['top', 'middle', 'bottom'];
const VALID_FORMAT_TYPES = ['text', 'number', 'currency', 'accounting', 'percentage', 'scientific', 'fraction', 'date', 'time', 'datetime', 'duration', 'custom'];

/**
 * Validate a WorkbookData JSON object
 */
export function validateSheet(data: unknown, strict: boolean = true): ValidationResult {
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
    addError('', 'Workbook must be an object', 'Provide a valid JSON object');
    return { valid: false, errors, warnings };
  }

  const wb = data as Record<string, unknown>;

  // Required fields
  if (typeof wb.id !== 'string' || wb.id.length === 0) {
    addError('id', 'id is required and must be a non-empty string', 'Add id: "workbook_1"');
  }

  if (typeof wb.name !== 'string') {
    addError('name', 'name is required and must be a string', 'Add name: "My Spreadsheet"');
  }

  if (typeof wb.activeSheetId !== 'string') {
    addError('activeSheetId', 'activeSheetId is required', 'Set activeSheetId to a valid sheet id');
  }

  // Default dimensions
  if (wb.defaultRowHeight !== undefined && (typeof wb.defaultRowHeight !== 'number' || wb.defaultRowHeight <= 0)) {
    addIssue('defaultRowHeight', 'defaultRowHeight should be a positive number', 'Use defaultRowHeight: 20');
  }

  if (wb.defaultColWidth !== undefined && (typeof wb.defaultColWidth !== 'number' || wb.defaultColWidth <= 0)) {
    addIssue('defaultColWidth', 'defaultColWidth should be a positive number', 'Use defaultColWidth: 100');
  }

  // stylePool
  const stylePool = (wb.stylePool as Record<string, unknown>) || {};
  if (wb.stylePool !== undefined) {
    if (typeof wb.stylePool !== 'object' || wb.stylePool === null) {
      addError('stylePool', 'stylePool must be an object', 'Use format: { "style_header": { bold: true } }');
    } else {
      Object.entries(stylePool).forEach(([styleId, style]) => {
        validateCellStyle(style, `stylePool.${styleId}`, addIssue);
      });
    }
  }

  // formatPool
  const formatPool = (wb.formatPool as Record<string, unknown>) || {};
  if (wb.formatPool !== undefined) {
    if (typeof wb.formatPool !== 'object' || wb.formatPool === null) {
      addIssue('formatPool', 'formatPool must be an object');
    } else {
      Object.entries(formatPool).forEach(([formatId, format]) => {
        validateCellFormat(format, `formatPool.${formatId}`, addIssue);
      });
    }
  }

  // sheets
  if (!Array.isArray(wb.sheets)) {
    addError('sheets', 'sheets is required and must be an array', 'Add sheets: [{ id: "sheet_1", name: "Sheet1", cells: [], config: {}, rowCount: 1000, colCount: 100 }]');
  } else if (wb.sheets.length === 0) {
    addIssue('sheets', 'sheets array is empty', 'Add at least one sheet');
  } else {
    const sheetIds = new Set<string>();

    wb.sheets.forEach((sheet, sheetIndex) => {
      const sheetPath = `sheets[${sheetIndex}]`;
      validateSheetData(sheet, sheetPath, sheetIds, stylePool, formatPool, addIssue, addError);
    });

    // Validate activeSheetId references a valid sheet
    if (typeof wb.activeSheetId === 'string' && !sheetIds.has(wb.activeSheetId)) {
      addError('activeSheetId', `activeSheetId "${wb.activeSheetId}" does not match any sheet id`, 'Set activeSheetId to one of the sheet ids');
    }
  }

  // selection (optional)
  if (wb.selection !== undefined) {
    validateSelection(wb.selection, 'selection', addIssue);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function validateSheetData(
  sheet: unknown,
  path: string,
  sheetIds: Set<string>,
  stylePool: Record<string, unknown>,
  formatPool: Record<string, unknown>,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  if (!sheet || typeof sheet !== 'object') {
    addError(path, 'Sheet must be an object');
    return;
  }

  const s = sheet as Record<string, unknown>;

  // Sheet ID
  if (typeof s.id !== 'string' || s.id.length === 0) {
    addError(`${path}.id`, 'Sheet id is required', 'Add a unique id like "sheet_1"');
  } else if (sheetIds.has(s.id)) {
    addError(`${path}.id`, `Duplicate sheet id: ${s.id}`, 'Each sheet must have a unique id');
  } else {
    sheetIds.add(s.id);
  }

  // Sheet name
  if (typeof s.name !== 'string' || s.name.length === 0) {
    addIssue(`${path}.name`, 'Sheet name is recommended', 'Add name: "Sheet1"');
  }

  // Cells
  if (!Array.isArray(s.cells)) {
    addError(`${path}.cells`, 'cells is required and must be an array', 'Use cells: [{ key: "0:0", cell: { value: "Hello" } }]');
  } else {
    const cellKeys = new Set<string>();

    s.cells.forEach((cellEntry, cellIndex) => {
      const cellPath = `${path}.cells[${cellIndex}]`;
      
      if (!cellEntry || typeof cellEntry !== 'object') {
        addError(cellPath, 'Cell entry must be an object with key and cell properties');
        return;
      }

      const entry = cellEntry as Record<string, unknown>;

      // Validate key format
      if (typeof entry.key !== 'string') {
        addError(`${cellPath}.key`, 'Cell key is required', 'Use format "row:col" like "0:0" for A1');
      } else {
        const keyPattern = /^\d+:\d+$/;
        if (!keyPattern.test(entry.key)) {
          addError(`${cellPath}.key`, `Invalid key format: ${entry.key}`, 'Use format "row:col" where row and col are 0-indexed integers');
        } else if (cellKeys.has(entry.key)) {
          addError(`${cellPath}.key`, `Duplicate cell key: ${entry.key}`, 'Each cell key must be unique');
        } else {
          cellKeys.add(entry.key);
        }
      }

      // Validate cell
      if (!entry.cell || typeof entry.cell !== 'object') {
        addError(`${cellPath}.cell`, 'cell object is required');
      } else {
        validateCell(entry.cell as Record<string, unknown>, `${cellPath}.cell`, stylePool, formatPool, addIssue, addError);
      }
    });
  }

  // Config
  if (s.config !== undefined) {
    if (typeof s.config !== 'object' || s.config === null) {
      addIssue(`${path}.config`, 'config should be an object');
    } else {
      validateSheetConfig(s.config as Record<string, unknown>, `${path}.config`, addIssue);
    }
  }

  // Row/Col counts
  if (s.rowCount !== undefined && (typeof s.rowCount !== 'number' || s.rowCount <= 0)) {
    addIssue(`${path}.rowCount`, 'rowCount should be a positive number', 'Use rowCount: 1000');
  }

  if (s.colCount !== undefined && (typeof s.colCount !== 'number' || s.colCount <= 0)) {
    addIssue(`${path}.colCount`, 'colCount should be a positive number', 'Use colCount: 100');
  }
}

function validateCell(
  cell: Record<string, unknown>,
  path: string,
  stylePool: Record<string, unknown>,
  formatPool: Record<string, unknown>,
  addIssue: (path: string, message: string, suggestion?: string) => void,
  addError: (path: string, message: string, suggestion?: string) => void
) {
  // Value can be string, number, boolean, or null
  if (cell.value !== undefined && cell.value !== null) {
    const valueType = typeof cell.value;
    if (!['string', 'number', 'boolean'].includes(valueType)) {
      addError(`${path}.value`, `Invalid value type: ${valueType}`, 'Value must be string, number, boolean, or null');
    }
  }

  // Formula
  if (cell.formula !== undefined) {
    if (typeof cell.formula !== 'string') {
      addError(`${path}.formula`, 'formula must be a string');
    } else if (!cell.formula.startsWith('=')) {
      addIssue(`${path}.formula`, 'formula should start with "="', 'Formulas should start with = like "=SUM(A1:A10)"');
    }
  }

  // styleId
  if (cell.styleId !== undefined) {
    if (typeof cell.styleId !== 'string') {
      addError(`${path}.styleId`, 'styleId must be a string');
    } else if (!stylePool[cell.styleId]) {
      addError(`${path}.styleId`, `styleId "${cell.styleId}" not found in stylePool`, 'Add this style to stylePool or remove the styleId');
    }
  }

  // formatId
  if (cell.formatId !== undefined) {
    if (typeof cell.formatId !== 'string') {
      addError(`${path}.formatId`, 'formatId must be a string');
    } else if (!formatPool[cell.formatId]) {
      addError(`${path}.formatId`, `formatId "${cell.formatId}" not found in formatPool`, 'Add this format to formatPool or remove the formatId');
    }
  }

  // comment
  if (cell.comment !== undefined && typeof cell.comment !== 'string') {
    addIssue(`${path}.comment`, 'comment should be a string');
  }

  // hyperlink
  if (cell.hyperlink !== undefined && typeof cell.hyperlink !== 'string') {
    addIssue(`${path}.hyperlink`, 'hyperlink should be a string URL');
  }
}

function validateCellStyle(
  style: unknown,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void
) {
  if (!style || typeof style !== 'object') {
    addIssue(path, 'Style must be an object');
    return;
  }

  const s = style as Record<string, unknown>;

  if (s.textAlign !== undefined && !VALID_TEXT_ALIGNS.includes(s.textAlign as string)) {
    addIssue(`${path}.textAlign`, `Invalid textAlign: ${s.textAlign}`, `Use one of: ${VALID_TEXT_ALIGNS.join(', ')}`);
  }

  if (s.verticalAlign !== undefined && !VALID_VERTICAL_ALIGNS.includes(s.verticalAlign as string)) {
    addIssue(`${path}.verticalAlign`, `Invalid verticalAlign: ${s.verticalAlign}`, `Use one of: ${VALID_VERTICAL_ALIGNS.join(', ')}`);
  }

  // Validate color format
  ['fontColor', 'backgroundColor'].forEach(prop => {
    if (s[prop] !== undefined && typeof s[prop] === 'string') {
      if (!/^#[0-9A-Fa-f]{6}$/.test(s[prop] as string)) {
        addIssue(`${path}.${prop}`, `Invalid color format: ${s[prop]}`, 'Use hex format like "#FF0000"');
      }
    }
  });
}

function validateCellFormat(
  format: unknown,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void
) {
  if (!format || typeof format !== 'object') {
    addIssue(path, 'Format must be an object');
    return;
  }

  const f = format as Record<string, unknown>;

  if (f.type !== undefined && !VALID_FORMAT_TYPES.includes(f.type as string)) {
    addIssue(`${path}.type`, `Invalid format type: ${f.type}`, `Use one of: ${VALID_FORMAT_TYPES.join(', ')}`);
  }

  if (f.decimalPlaces !== undefined) {
    if (typeof f.decimalPlaces !== 'number' || f.decimalPlaces < 0 || f.decimalPlaces > 30) {
      addIssue(`${path}.decimalPlaces`, 'decimalPlaces should be 0-30');
    }
  }
}

function validateSheetConfig(
  config: Record<string, unknown>,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void
) {
  if (config.frozenRows !== undefined && (typeof config.frozenRows !== 'number' || config.frozenRows < 0)) {
    addIssue(`${path}.frozenRows`, 'frozenRows should be a non-negative number');
  }

  if (config.frozenCols !== undefined && (typeof config.frozenCols !== 'number' || config.frozenCols < 0)) {
    addIssue(`${path}.frozenCols`, 'frozenCols should be a non-negative number');
  }

  if (config.showGridLines !== undefined && typeof config.showGridLines !== 'boolean') {
    addIssue(`${path}.showGridLines`, 'showGridLines should be a boolean');
  }

  // rowHeights/colWidths validation
  if (config.rowHeights !== undefined) {
    if (!Array.isArray(config.rowHeights)) {
      addIssue(`${path}.rowHeights`, 'rowHeights should be an array of [row, height] pairs');
    }
  }

  if (config.colWidths !== undefined) {
    if (!Array.isArray(config.colWidths)) {
      addIssue(`${path}.colWidths`, 'colWidths should be an array of [col, width] pairs');
    }
  }

  // sortOrder validation
  if (config.sortOrder !== undefined) {
    if (!Array.isArray(config.sortOrder)) {
      addIssue(`${path}.sortOrder`, 'sortOrder should be an array');
    } else {
      config.sortOrder.forEach((sort, index) => {
        if (!sort || typeof sort !== 'object') return;
        const s = sort as Record<string, unknown>;
        if (typeof s.column !== 'number') {
          addIssue(`${path}.sortOrder[${index}].column`, 'column should be a number');
        }
        if (!['asc', 'desc'].includes(s.direction as string)) {
          addIssue(`${path}.sortOrder[${index}].direction`, 'direction should be "asc" or "desc"');
        }
      });
    }
  }
}

function validateSelection(
  selection: unknown,
  path: string,
  addIssue: (path: string, message: string, suggestion?: string) => void
) {
  if (!selection || typeof selection !== 'object') {
    addIssue(path, 'selection should be an object');
    return;
  }

  const sel = selection as Record<string, unknown>;

  if (!Array.isArray(sel.ranges)) {
    addIssue(`${path}.ranges`, 'ranges should be an array');
  }

  if (sel.activeCell !== undefined) {
    if (!sel.activeCell || typeof sel.activeCell !== 'object') {
      addIssue(`${path}.activeCell`, 'activeCell should be an object with row and col');
    } else {
      const ac = sel.activeCell as Record<string, unknown>;
      if (typeof ac.row !== 'number') {
        addIssue(`${path}.activeCell.row`, 'activeCell.row should be a number');
      }
      if (typeof ac.col !== 'number') {
        addIssue(`${path}.activeCell.col`, 'activeCell.col should be a number');
      }
    }
  }
}
