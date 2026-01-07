// Utility functions for cell key management

export function getCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function parseCellKey(key: string): { row: number; col: number } {
  const [row, col] = key.split(':').map(Number);
  return { row, col };
}

export function isValidCellKey(key: string): boolean {
  const parts = key.split(':');
  if (parts.length !== 2) return false;
  const row = Number(parts[0]);
  const col = Number(parts[1]);
  return !isNaN(row) && !isNaN(col) && row >= 0 && col >= 0;
}

