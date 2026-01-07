// Utility functions for adjusting formulas when copying/filling cells

import { parseCellReference, columnIndexToLabel } from './cell-reference';

/**
 * Adjusts a formula when copying from source cell to target cell.
 * Increments relative references (without $) and keeps absolute references (with $) unchanged.
 * 
 * @param formula The original formula string
 * @param sourceRow Source cell row (0-based)
 * @param sourceCol Source cell column (0-based)
 * @param targetRow Target cell row (0-based)
 * @param targetCol Target cell column (0-based)
 * @returns Adjusted formula string
 */
export function adjustFormula(
  formula: string,
  sourceRow: number,
  sourceCol: number,
  targetRow: number,
  targetCol: number
): string {
  if (!formula.startsWith('=')) {
    // Not a formula, return as-is
    return formula;
  }

  const rowOffset = targetRow - sourceRow;
  const colOffset = targetCol - sourceCol;

  if (rowOffset === 0 && colOffset === 0) {
    // Same cell, no adjustment needed
    return formula;
  }

  // Remove leading = for processing
  const expression = formula.slice(1);

  // Adjust cell references in the formula
  // Match patterns like A1, $A1, A$1, $A$1, and ranges like A1:B10, $A$1:$B$10
  const adjustedExpression = expression.replace(
    /(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/g,
    (match, startRef, endRef) => {
      const startCellRef = parseCellReference(startRef);
      if (!startCellRef) return match;

      // For relative references, parseCellReference returns the absolute position (e.g., A1 = row 0, col 0)
      // We need to calculate the offset from the source cell, then apply it to the target cell
      let newStartRow: number;
      let newStartCol: number;

      if (startCellRef.rowAbsolute) {
        // Absolute row: keep the same row
        newStartRow = startCellRef.row;
      } else {
        // Relative row: calculate offset from source and apply to target
        // The referenced cell's absolute row is startCellRef.row
        // The offset from source is: startCellRef.row - sourceRow
        // Apply same offset to target: targetRow + (startCellRef.row - sourceRow)
        newStartRow = targetRow + (startCellRef.row - sourceRow);
        if (newStartRow < 0) newStartRow = 0;
      }

      if (startCellRef.colAbsolute) {
        // Absolute column: keep the same column
        newStartCol = startCellRef.col;
      } else {
        // Relative column: calculate offset from source and apply to target
        // The referenced cell's absolute col is startCellRef.col
        // The offset from source is: startCellRef.col - sourceCol
        // Apply same offset to target: targetCol + (startCellRef.col - sourceCol)
        newStartCol = targetCol + (startCellRef.col - sourceCol);
        if (newStartCol < 0) newStartCol = 0;
      }

      const startColLabel = columnIndexToLabel(newStartCol);
      const startRowLabel = (newStartRow + 1).toString();

      let startResult = '';
      if (startCellRef.colAbsolute) startResult += '$';
      startResult += startColLabel;
      if (startCellRef.rowAbsolute) startResult += '$';
      startResult += startRowLabel;

      // If it's a range, adjust the end cell too
      if (endRef) {
        const endCellRef = parseCellReference(endRef);
        if (!endCellRef) return match;

        let newEndRow: number;
        let newEndCol: number;

        if (endCellRef.rowAbsolute) {
          // Absolute row: keep the same row
          newEndRow = endCellRef.row;
        } else {
          // Relative row: calculate offset from source and apply to target
          newEndRow = targetRow + (endCellRef.row - sourceRow);
          if (newEndRow < 0) newEndRow = 0;
        }

        if (endCellRef.colAbsolute) {
          // Absolute column: keep the same column
          newEndCol = endCellRef.col;
        } else {
          // Relative column: calculate offset from source and apply to target
          newEndCol = targetCol + (endCellRef.col - sourceCol);
          if (newEndCol < 0) newEndCol = 0;
        }

        const endColLabel = columnIndexToLabel(newEndCol);
        const endRowLabel = (newEndRow + 1).toString();

        let endResult = '';
        if (endCellRef.colAbsolute) endResult += '$';
        endResult += endColLabel;
        if (endCellRef.rowAbsolute) endResult += '$';
        endResult += endRowLabel;

        return `${startResult}:${endResult}`;
      }

      return startResult;
    }
  );

  return '=' + adjustedExpression;
}

