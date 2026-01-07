// Range utility functions

import type { Range } from '../types';

export function normalizeRange(range: Range): Range {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}

export function rangeContains(range: Range, row: number, col: number): boolean {
  const normalized = normalizeRange(range);
  return (
    row >= normalized.startRow &&
    row <= normalized.endRow &&
    col >= normalized.startCol &&
    col <= normalized.endCol
  );
}

export function rangeIntersects(range1: Range, range2: Range): boolean {
  const r1 = normalizeRange(range1);
  const r2 = normalizeRange(range2);
  return !(
    r1.endRow < r2.startRow ||
    r1.startRow > r2.endRow ||
    r1.endCol < r2.startCol ||
    r1.startCol > r2.endCol
  );
}

export function getRangeCells(range: Range): Array<{ row: number; col: number }> {
  const normalized = normalizeRange(range);
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = normalized.startRow; row <= normalized.endRow; row++) {
    for (let col = normalized.startCol; col <= normalized.endCol; col++) {
      cells.push({ row, col });
    }
  }
  return cells;
}

export function getRangeSize(range: Range): { rows: number; cols: number } {
  const normalized = normalizeRange(range);
  return {
    rows: normalized.endRow - normalized.startRow + 1,
    cols: normalized.endCol - normalized.startCol + 1,
  };
}

