import type { SortOrder, Cell, Sheet } from '../types';
import { getCellKey, parseCellKey } from '../utils/cell-key';

export class SortManager {
  static sortRows(sheet: Sheet, sortOrder: SortOrder[], dataRange?: { startRow: number; endRow: number }): void {
    if (sortOrder.length === 0) return;

    // Determine data range to sort
    const startRow = dataRange?.startRow ?? this.detectDataStartRow(sheet);
    const endRow = dataRange?.endRow ?? this.detectDataEndRow(sheet);

    if (startRow >= endRow) return;

    // Extract rows to sort
    const rowsToSort: Array<{ rowIndex: number; values: unknown[] }> = [];

    for (let row = startRow; row <= endRow; row++) {
      const rowValues: unknown[] = [];
      for (let col = 0; col < sheet.colCount; col++) {
        const cell = sheet.cells.get(getCellKey(row, col));
        rowValues.push(cell?.value ?? null);
      }
      rowsToSort.push({ rowIndex: row, values: rowValues });
    }

    // Sort rows based on sort order
    rowsToSort.sort((a, b) => {
      for (const sort of sortOrder) {
        const aValue = a.values[sort.column];
        const bValue = b.values[sort.column];

        let comparison = 0;

        // Handle different value types
        if (aValue === null && bValue === null) {
          comparison = 0;
        } else if (aValue === null) {
          comparison = sort.direction === 'asc' ? -1 : 1;
        } else if (bValue === null) {
          comparison = sort.direction === 'asc' ? 1 : -1;
        } else {
          // Both have values, compare based on type
          if (typeof aValue === 'number' && typeof bValue === 'number') {
            comparison = aValue - bValue;
          } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            comparison = aValue.localeCompare(bValue);
          } else if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
            comparison = aValue === bValue ? 0 : (aValue ? 1 : -1);
          } else {
            // Mixed types: convert to strings for comparison
            const aStr = String(aValue);
            const bStr = String(bValue);
            comparison = aStr.localeCompare(bStr);
          }
        }

        // Apply sort direction
        if (sort.direction === 'desc') {
          comparison = -comparison;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }

      return 0; // All sort criteria equal
    });

    // Create mapping from old row to new row
    const rowMapping = new Map<number, number>();
    rowsToSort.forEach((row, newIndex) => {
      rowMapping.set(row.rowIndex, startRow + newIndex);
    });

    // Move cells to new positions and update formulas
    const cellsToMove: Array<{ oldKey: string; newKey: string; cell: Cell }> = [];
    const formulaUpdates: Array<{ oldKey: string; newKey: string; cell: Cell }> = [];

    // Collect all cells that need to be moved
    for (const [key, cell] of sheet.cells) {
      const { row } = parseCellKey(key);
      if (row >= startRow && row <= endRow) {
        const newRow = rowMapping.get(row);
        if (newRow !== undefined) {
          const newKey = getCellKey(newRow, parseCellKey(key).col);
          cellsToMove.push({ oldKey: key, newKey, cell });
        }
      }
    }

    // Clear old cells
    for (const { oldKey } of cellsToMove) {
      sheet.cells.delete(oldKey);
    }

    // Move cells to new positions
    for (const { newKey, cell } of cellsToMove) {
      if (cell.formula) {
        // Formula needs to be updated based on row movement
        const adjustedFormula = this.adjustFormulaForRowSort(cell.formula, rowMapping, startRow, endRow);
        const updatedCell = { ...cell, formula: adjustedFormula };
        sheet.cells.set(newKey, updatedCell);
        formulaUpdates.push({ oldKey: '', newKey, cell: updatedCell });
      } else {
        sheet.cells.set(newKey, cell);
      }
    }
  }

  private static adjustFormulaForRowSort(
    formula: string,
    rowMapping: Map<number, number>,
    sortStartRow: number,
    sortEndRow: number
  ): string {
    if (!formula.startsWith('=')) {
      return formula;
    }

    try {
      // Remove leading = for processing
      const expression = formula.slice(1);

      // Adjust cell references in the formula
      // Match patterns like A1, $A1, A$1, $A$1, and ranges like A1:B10, $A$1:$B$10
      const adjustedExpression = expression.replace(
        /(\$?[A-Z]+\$?\d+)(?::(\$?[A-Z]+\$?\d+))?/g,
        (match, startRef, endRef) => {
          // Parse the start reference
          const startCellRef = this.parseCellReference(startRef);
          if (!startCellRef) return match;

          // Adjust the row if it's within the sorted range and not absolute
          let adjustedStartRow = startCellRef.row;
          if (!startCellRef.rowAbsolute && startCellRef.row >= sortStartRow && startCellRef.row <= sortEndRow) {
            const newRow = rowMapping.get(startCellRef.row);
            if (newRow !== undefined) {
              adjustedStartRow = newRow;
            }
          }

          // Reconstruct the start reference
          const startResult = this.reconstructCellReference(startCellRef, adjustedStartRow);

          // If it's a range, adjust the end reference too
          if (endRef) {
            const endCellRef = this.parseCellReference(endRef);
            if (!endCellRef) return match;

            // Adjust the row if it's within the sorted range and not absolute
            let adjustedEndRow = endCellRef.row;
            if (!endCellRef.rowAbsolute && endCellRef.row >= sortStartRow && endCellRef.row <= sortEndRow) {
              const newRow = rowMapping.get(endCellRef.row);
              if (newRow !== undefined) {
                adjustedEndRow = newRow;
              }
            }

            // Reconstruct the end reference
            const endResult = this.reconstructCellReference(endCellRef, adjustedEndRow);
            return `${startResult}:${endResult}`;
          }

          return startResult;
        }
      );

      return '=' + adjustedExpression;
    } catch (error) {
      // If formula adjustment fails, return original formula
      console.warn('Failed to adjust formula during sort:', formula, error);
      return formula;
    }
  }

  private static parseCellReference(ref: string): { row: number; col: number; rowAbsolute: boolean; colAbsolute: boolean } | null {
    const match = ref.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
    if (!match) return null;

    const [, colDollar, colLetters, rowDollar, rowNumber] = match;
    const colAbsolute = colDollar === '$';
    const rowAbsolute = rowDollar === '$';

    // Convert column letters to number (A=0, B=1, ..., Z=25, AA=26, etc.)
    let col = 0;
    for (let i = 0; i < colLetters.length; i++) {
      col = col * 26 + (colLetters.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    col -= 1; // Convert to 0-based

    const row = parseInt(rowNumber, 10) - 1; // Convert to 0-based

    return { row, col, rowAbsolute, colAbsolute };
  }

  private static reconstructCellReference(
    cellRef: { col: number; colAbsolute: boolean; rowAbsolute: boolean },
    adjustedRow: number
  ): string {
    // Convert column number to letters (0=A, 1=B, ..., 25=Z, 26=AA, etc.)
    let colLetters = '';
    let col = cellRef.col + 1; // Convert to 1-based for calculation
    while (col > 0) {
      col -= 1;
      colLetters = String.fromCharCode('A'.charCodeAt(0) + (col % 26)) + colLetters;
      col = Math.floor(col / 26);
    }

    const rowNumber = adjustedRow + 1; // Convert to 1-based

    let result = '';
    if (cellRef.colAbsolute) result += '$';
    result += colLetters;
    if (cellRef.rowAbsolute) result += '$';
    result += rowNumber;

    return result;
  }

  private static detectDataStartRow(sheet: Sheet): number {
    // Start from row 0, find first non-empty row
    for (let row = 0; row < sheet.rowCount; row++) {
      for (let col = 0; col < sheet.colCount; col++) {
        const cell = sheet.cells.get(getCellKey(row, col));
        if (cell && (cell.value !== null || cell.formula)) {
          return row;
        }
      }
    }
    return 0;
  }

  private static detectDataEndRow(sheet: Sheet): number {
    // Start from the bottom, find last non-empty row
    for (let row = sheet.rowCount - 1; row >= 0; row--) {
      for (let col = 0; col < sheet.colCount; col++) {
        const cell = sheet.cells.get(getCellKey(row, col));
        if (cell && (cell.value !== null || cell.formula)) {
          return row;
        }
      }
    }
    return Math.max(0, sheet.rowCount - 1);
  }

  static getColumnSortDirection(column: number, currentSortOrder: SortOrder[]): 'asc' | 'desc' | null {
    const sort = currentSortOrder.find(s => s.column === column);
    return sort ? sort.direction : null;
  }

  static toggleColumnSort(
    column: number,
    currentSortOrder: SortOrder[],
    multiColumn: boolean = false
  ): SortOrder[] {
    const existingSortIndex = currentSortOrder.findIndex(s => s.column === column);

    if (existingSortIndex >= 0) {
      // Column is already in sort order
      const existingSort = currentSortOrder[existingSortIndex];
      if (existingSort.direction === 'asc') {
        // asc -> desc
        const newSortOrder = [...currentSortOrder];
        newSortOrder[existingSortIndex] = { ...existingSort, direction: 'desc' };
        return newSortOrder;
      } else {
        // desc -> remove from sort (no sort)
        return currentSortOrder.filter(s => s.column !== column);
      }
    } else {
      // Column not in sort order
      if (multiColumn && currentSortOrder.length > 0) {
        // Add as secondary sort (ascending)
        return [...currentSortOrder, { column, direction: 'asc' }];
      } else {
        // Replace existing sort or start new sort (ascending)
        return [{ column, direction: 'asc' }];
      }
    }
  }
}
