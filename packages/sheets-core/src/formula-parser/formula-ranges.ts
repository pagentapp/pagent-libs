// Utility to extract cell references and ranges from formula strings

import { parseCellReference, parseRangeReference } from './cell-reference';
import type { CellReference, RangeReference } from './types';

export interface FormulaRange {
  type: 'cell' | 'range';
  cellRef?: CellReference;
  rangeRef?: RangeReference;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
  sheetName?: string; // Sheet name if this is a cross-sheet reference
}

/**
 * Extracts all cell references and ranges from a formula string.
 * Returns an array of ranges, where each range represents either:
 * - A single cell (startRow === endRow && startCol === endCol)
 * - A range of cells (e.g., A1:A5)
 * 
 * @param formula The formula string (e.g., "=SUM(A1:A5)+B2")
 * @returns Array of FormulaRange objects
 */
export function extractFormulaRanges(formula: string): FormulaRange[] {
  if (!formula.startsWith('=')) {
    return [];
  }

  const expression = formula.slice(1); // Remove leading =
  const ranges: FormulaRange[] = [];

  // Match patterns like:
  // - Single cells: A1, $A1, A$1, $A$1, Sheet1!A1, 'Sheet 1'!A1
  // - Ranges: A1:A5, $A$1:$B$10, Sheet1!A1:A5, 'Sheet 1'!A1:A5
  // This regex matches cell references and ranges, including cross-sheet references
  // We need to match cross-sheet references first, then same-sheet references
  // Pattern for cross-sheet: ('sheet name'|sheetname)!cellref(:cellref)?
  // Pattern for same-sheet: cellref(:cellref)?
  
  // First, try to match cross-sheet references
  const crossSheetPattern = /(?:'([^']+)'|([^!'"]+))!(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/g;
  let match;
  const processedIndices = new Set<number>();
  
  // Process cross-sheet references first
  while ((match = crossSheetPattern.exec(expression)) !== null) {
    const sheetName = match[1] || match[2]; // Use quoted name if present, otherwise unquoted
    const startRef = match[3];
    const endRef = match[4]; // undefined for single cells, defined for ranges
    const matchIndex = match.index;

    if (endRef) {
      // It's a range (e.g., Sheet1!A1:A5)
      const rangeRef = parseRangeReference(`${sheetName}!${startRef}:${endRef}`);
      if (rangeRef) {
        const { start, end } = rangeRef;
        const startRow = start.row;
        const startCol = start.col;
        const endRow = end.row;
        const endCol = end.col;

        ranges.push({
          type: 'range',
          rangeRef,
          startRow: Math.min(startRow, endRow),
          startCol: Math.min(startCol, endCol),
          endRow: Math.max(startRow, endRow),
          endCol: Math.max(startCol, endCol),
          sheetName,
        });
        processedIndices.add(matchIndex);
      }
    } else {
      // It's a single cell (e.g., Sheet1!A1)
      const cellRef = parseCellReference(`${sheetName}!${startRef}`);
      if (cellRef) {
        const row = cellRef.row;
        const col = cellRef.col;

        ranges.push({
          type: 'cell',
          cellRef,
          startRow: row,
          startCol: col,
          endRow: row,
          endCol: col,
          sheetName,
        });
        processedIndices.add(matchIndex);
      }
    }
  }

  // Now match same-sheet references (those not already processed)
  const sameSheetPattern = /(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/g;
  while ((match = sameSheetPattern.exec(expression)) !== null) {
    // Skip if this position was already processed as part of a cross-sheet reference
    // Check if there's a ! before this match (indicating it's part of a cross-sheet ref)
    const beforeMatch = expression.substring(Math.max(0, match.index - 100), match.index);
    // Look for ! that's not inside quotes (simple check: ! not followed by quote)
    const lastExclamation = beforeMatch.lastIndexOf('!');
    if (lastExclamation !== -1) {
      const afterExclamation = beforeMatch.substring(lastExclamation + 1);
      // If there's no quote after the !, this is likely part of a cross-sheet reference
      // But we need to be more careful - check if the ! is part of a sheet name pattern
      if (!afterExclamation.match(/^['"]/)) {
        // This is likely part of a cross-sheet reference, skip it
        continue;
      }
    }

    const startRef = match[1];
    const endRef = match[2]; // undefined for single cells, defined for ranges

    if (endRef) {
      // It's a range (e.g., A1:A5)
      const rangeRef = parseRangeReference(`${startRef}:${endRef}`);
      if (rangeRef) {
        const { start, end } = rangeRef;
        const startRow = start.row;
        const startCol = start.col;
        const endRow = end.row;
        const endCol = end.col;

        ranges.push({
          type: 'range',
          rangeRef,
          startRow: Math.min(startRow, endRow),
          startCol: Math.min(startCol, endCol),
          endRow: Math.max(startRow, endRow),
          endCol: Math.max(startCol, endCol),
          // No sheetName means it's on the same sheet as the formula
        });
      }
    } else {
      // It's a single cell (e.g., A1)
      const cellRef = parseCellReference(startRef);
      if (cellRef) {
        const row = cellRef.row;
        const col = cellRef.col;

        ranges.push({
          type: 'cell',
          cellRef,
          startRow: row,
          startCol: col,
          endRow: row,
          endCol: col,
          // No sheetName means it's on the same sheet as the formula
        });
      }
    }
  }

  return ranges;
}

