/**
 * Sheet/Workbook context for AI generation
 * Provides TypeScript types, rules, and examples for generating valid WorkbookData JSON
 */

export const SHEET_TYPES = `
// ============================================================================
// WorkbookData - Root structure for pagent spreadsheets
// ============================================================================

interface WorkbookData {
  id: string;                              // Unique workbook identifier
  name: string;                            // Workbook name
  activeSheetId: string;                   // ID of currently active sheet
  defaultRowHeight: number;                // Default row height in pixels (typically 20)
  defaultColWidth: number;                 // Default column width in pixels (typically 100)
  
  // Pooled resources (for deduplication)
  stylePool: Record<string, CellStyle>;    // styleId -> style object
  formatPool?: Record<string, CellFormat>; // formatId -> format object
  
  // Sheet data
  sheets: SheetData[];
  
  // UI state (optional)
  selection?: Selection;
}

// ============================================================================
// Sheet
// ============================================================================

interface SheetData {
  id: string;                              // Unique sheet ID (e.g., "sheet_1")
  name: string;                            // Sheet name (e.g., "Sheet1", "Sales Data")
  
  // Sparse cell data - only non-empty cells are stored
  cells: Array<{ key: string; cell: Cell }>;  // key format: "row:col" (0-indexed)
  
  // Configuration
  config: SheetConfig;
  
  rowCount: number;                        // Total rows (virtual size, typically 1000)
  colCount: number;                        // Total columns (virtual size, typically 100)
}

interface SheetConfig {
  defaultRowHeight?: number;
  defaultColWidth?: number;
  rowHeights?: Array<[number, number]>;    // [rowIndex, height] pairs for custom heights
  colWidths?: Array<[number, number]>;     // [colIndex, width] pairs for custom widths
  hiddenRows?: number[];                   // Row indices to hide
  hiddenCols?: number[];                   // Column indices to hide
  frozenRows?: number;                     // Number of rows to freeze at top
  frozenCols?: number;                     // Number of columns to freeze at left
  showGridLines?: boolean;                 // Show grid lines (default: true)
  sortOrder?: SortOrder[];                 // Active sort configuration
  filters?: Array<[number, ColumnFilter]>; // [columnIndex, filter] pairs
}

// ============================================================================
// Cell
// ============================================================================

interface Cell {
  value: CellValue;                        // The display/computed value
  formula?: string;                        // Raw formula text (e.g., "=A1+B1")
  styleId?: string;                        // Reference to stylePool
  formatId?: string;                       // Reference to formatPool
  comment?: string;                        // Cell comment/note
  hyperlink?: string;                      // URL for hyperlinks
}

type CellValue = string | number | boolean | null;

// ============================================================================
// Cell Styling
// ============================================================================

interface CellStyle {
  // Font properties
  bold?: boolean;
  italic?: boolean;
  fontFamily?: string;                     // e.g., "Arial", "Helvetica"
  fontSize?: number;                       // In points (e.g., 11, 12, 14)
  fontColor?: string;                      // Hex color (e.g., "#000000")
  
  // Background
  backgroundColor?: string;                // Hex color (e.g., "#FFFFFF")
  
  // Alignment
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  
  // Borders (CSS border shorthand)
  borderTop?: string;                      // e.g., "1px solid #000000"
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
  
  // Text formatting
  textWrap?: boolean;
  textDecoration?: 'none' | 'underline' | 'line-through';
}

// ============================================================================
// Cell Formatting (Number/Date display)
// ============================================================================

interface CellFormat {
  type?: FormatType;
  
  // Number format
  decimalPlaces?: number;                  // 0-30
  useThousandsSeparator?: boolean;
  
  // Currency format
  currencyCode?: string;                   // "USD", "EUR", "GBP", etc.
  currencySymbolPosition?: 'prefix' | 'suffix';
  
  // Negative number display
  negativeFormat?: 'minus' | 'parentheses' | 'red';
  
  // Date/Time format
  dateFormat?: string;                     // e.g., "MM/DD/YYYY", "DD-MM-YYYY"
  timeFormat?: string;                     // e.g., "HH:mm:ss", "h:mm AM/PM"
  
  // Custom pattern
  pattern?: string;                        // Custom format pattern
}

type FormatType =
  | 'text'
  | 'number'
  | 'currency'
  | 'accounting'
  | 'percentage'
  | 'scientific'
  | 'fraction'
  | 'date'
  | 'time'
  | 'datetime'
  | 'duration'
  | 'custom';

// ============================================================================
// Selection
// ============================================================================

interface Selection {
  ranges: Range[];                         // Selected ranges (can be multiple)
  activeCell: { row: number; col: number }; // Primary cursor position
}

interface Range {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

// ============================================================================
// Sorting and Filtering
// ============================================================================

interface SortOrder {
  column: number;                          // Column index (0-based)
  direction: 'asc' | 'desc';
}

interface ColumnFilter {
  column: number;
  type: 'text' | 'number' | 'date';
  criteria: FilterCriteria;
}

type FilterCriteria =
  | { type: 'equals'; value: string | number }
  | { type: 'notEquals'; value: string | number }
  | { type: 'contains'; value: string }
  | { type: 'notContains'; value: string }
  | { type: 'startsWith'; value: string }
  | { type: 'endsWith'; value: string }
  | { type: 'greaterThan'; value: number }
  | { type: 'lessThan'; value: number }
  | { type: 'between'; min: number; max: number }
  | { type: 'custom'; values: Array<string | number> };
`;

export const SHEET_RULES = [
  "Cell keys use format 'row:col' where row and col are 0-indexed integers. Example: '0:0' is cell A1, '0:1' is B1, '1:0' is A2.",
  "Only non-empty cells need to be included in the cells array. Empty cells are not stored (sparse storage).",
  "Sheet IDs must be unique within the workbook. Use pattern: sheet_1, sheet_2, etc.",
  "The activeSheetId must reference a valid sheet ID in the sheets array.",
  "When using styleId in a cell, that styleId MUST exist in stylePool.",
  "When using formatId in a cell, that formatId MUST exist in formatPool.",
  "Formulas start with '=' character. Example: '=A1+B1', '=SUM(A1:A10)'",
  "Column references in formulas use letters (A, B, C...), row references use 1-indexed numbers.",
  "Colors use hex format: '#FF0000' for red, '#00FF00' for green, '#0000FF' for blue.",
  "Row and column indices are 0-based in the data structure, but 1-based in formula references.",
  "rowCount and colCount define the virtual sheet size, not the actual data bounds. Typical values: rowCount: 1000, colCount: 100.",
  "Default row height is typically 20 pixels, default column width is typically 100 pixels.",
];

export const SHEET_EXAMPLES = [
  {
    description: "Simple spreadsheet with basic data",
    json: {
      id: "workbook_example_1",
      name: "Simple Spreadsheet",
      activeSheetId: "sheet_1",
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {},
      sheets: [
        {
          id: "sheet_1",
          name: "Sheet1",
          cells: [
            { key: "0:0", cell: { value: "Name" } },
            { key: "0:1", cell: { value: "Age" } },
            { key: "0:2", cell: { value: "City" } },
            { key: "1:0", cell: { value: "Alice" } },
            { key: "1:1", cell: { value: 30 } },
            { key: "1:2", cell: { value: "New York" } },
            { key: "2:0", cell: { value: "Bob" } },
            { key: "2:1", cell: { value: 25 } },
            { key: "2:2", cell: { value: "Los Angeles" } }
          ],
          config: {
            defaultRowHeight: 20,
            defaultColWidth: 100
          },
          rowCount: 1000,
          colCount: 100
        }
      ],
      selection: {
        ranges: [],
        activeCell: { row: 0, col: 0 }
      }
    }
  },
  {
    description: "Spreadsheet with styled header row",
    json: {
      id: "workbook_example_2",
      name: "Styled Spreadsheet",
      activeSheetId: "sheet_1",
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {
        "style_header": {
          bold: true,
          backgroundColor: "#4472C4",
          fontColor: "#FFFFFF",
          textAlign: "center"
        },
        "style_number": {
          textAlign: "right"
        }
      },
      sheets: [
        {
          id: "sheet_1",
          name: "Sales Data",
          cells: [
            { key: "0:0", cell: { value: "Product", styleId: "style_header" } },
            { key: "0:1", cell: { value: "Q1", styleId: "style_header" } },
            { key: "0:2", cell: { value: "Q2", styleId: "style_header" } },
            { key: "0:3", cell: { value: "Total", styleId: "style_header" } },
            { key: "1:0", cell: { value: "Widget A" } },
            { key: "1:1", cell: { value: 1500, styleId: "style_number" } },
            { key: "1:2", cell: { value: 2000, styleId: "style_number" } },
            { key: "1:3", cell: { value: 3500, styleId: "style_number" } },
            { key: "2:0", cell: { value: "Widget B" } },
            { key: "2:1", cell: { value: 800, styleId: "style_number" } },
            { key: "2:2", cell: { value: 1200, styleId: "style_number" } },
            { key: "2:3", cell: { value: 2000, styleId: "style_number" } }
          ],
          config: {
            defaultRowHeight: 20,
            defaultColWidth: 100,
            colWidths: [[0, 150]]
          },
          rowCount: 1000,
          colCount: 100
        }
      ]
    }
  },
  {
    description: "Spreadsheet with formulas",
    json: {
      id: "workbook_example_3",
      name: "Formula Example",
      activeSheetId: "sheet_1",
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {
        "style_bold": { bold: true }
      },
      sheets: [
        {
          id: "sheet_1",
          name: "Calculations",
          cells: [
            { key: "0:0", cell: { value: "Item", styleId: "style_bold" } },
            { key: "0:1", cell: { value: "Price", styleId: "style_bold" } },
            { key: "0:2", cell: { value: "Quantity", styleId: "style_bold" } },
            { key: "0:3", cell: { value: "Total", styleId: "style_bold" } },
            { key: "1:0", cell: { value: "Apples" } },
            { key: "1:1", cell: { value: 2.50 } },
            { key: "1:2", cell: { value: 10 } },
            { key: "1:3", cell: { value: 25, formula: "=B2*C2" } },
            { key: "2:0", cell: { value: "Oranges" } },
            { key: "2:1", cell: { value: 3.00 } },
            { key: "2:2", cell: { value: 8 } },
            { key: "2:3", cell: { value: 24, formula: "=B3*C3" } },
            { key: "3:0", cell: { value: "Grand Total", styleId: "style_bold" } },
            { key: "3:3", cell: { value: 49, formula: "=SUM(D2:D3)", styleId: "style_bold" } }
          ],
          config: {
            defaultRowHeight: 20,
            defaultColWidth: 100
          },
          rowCount: 1000,
          colCount: 100
        }
      ]
    }
  },
  {
    description: "Multi-sheet workbook",
    json: {
      id: "workbook_example_4",
      name: "Multi-Sheet Workbook",
      activeSheetId: "sheet_1",
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {
        "style_header": { bold: true, backgroundColor: "#E2E2E2" }
      },
      sheets: [
        {
          id: "sheet_1",
          name: "Summary",
          cells: [
            { key: "0:0", cell: { value: "Department", styleId: "style_header" } },
            { key: "0:1", cell: { value: "Budget", styleId: "style_header" } },
            { key: "1:0", cell: { value: "Engineering" } },
            { key: "1:1", cell: { value: 500000 } },
            { key: "2:0", cell: { value: "Marketing" } },
            { key: "2:1", cell: { value: 200000 } }
          ],
          config: {},
          rowCount: 1000,
          colCount: 100
        },
        {
          id: "sheet_2",
          name: "Details",
          cells: [
            { key: "0:0", cell: { value: "See Summary sheet for overview" } }
          ],
          config: {},
          rowCount: 1000,
          colCount: 100
        }
      ]
    }
  },
  {
    description: "Spreadsheet with frozen rows and columns",
    json: {
      id: "workbook_example_5",
      name: "Frozen Panes Example",
      activeSheetId: "sheet_1",
      defaultRowHeight: 20,
      defaultColWidth: 100,
      stylePool: {
        "style_header": { bold: true, backgroundColor: "#4472C4", fontColor: "#FFFFFF" }
      },
      sheets: [
        {
          id: "sheet_1",
          name: "Data",
          cells: [
            { key: "0:0", cell: { value: "ID", styleId: "style_header" } },
            { key: "0:1", cell: { value: "Name", styleId: "style_header" } },
            { key: "0:2", cell: { value: "Value", styleId: "style_header" } },
            { key: "1:0", cell: { value: 1 } },
            { key: "1:1", cell: { value: "Item 1" } },
            { key: "1:2", cell: { value: 100 } },
            { key: "2:0", cell: { value: 2 } },
            { key: "2:1", cell: { value: "Item 2" } },
            { key: "2:2", cell: { value: 200 } }
          ],
          config: {
            frozenRows: 1,
            frozenCols: 1
          },
          rowCount: 1000,
          colCount: 100
        }
      ]
    }
  }
];

export function getSheetContext() {
  return {
    types: SHEET_TYPES,
    rules: SHEET_RULES,
    examples: SHEET_EXAMPLES,
    version: "1.0.0"
  };
}
