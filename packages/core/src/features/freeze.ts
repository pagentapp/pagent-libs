// Freeze Panes Utilities
// Handles calculation and management of frozen rows/columns

/**
 * Configuration for freeze panes
 */
export interface FreezeConfig {
  frozenRows: number;
  frozenCols: number;
}

/**
 * Cached dimensions for frozen areas
 */
export interface FreezeDimensions {
  /** Total width of all frozen columns */
  frozenWidth: number;
  /** Total height of all frozen rows */
  frozenHeight: number;
}

/**
 * The 4 regions created by freeze panes
 */
export type FreezeRegion = 
  | 'top-left'    // Frozen rows AND cols - never scrolls
  | 'top'         // Frozen rows only - scrolls horizontally
  | 'left'        // Frozen cols only - scrolls vertically
  | 'main';       // Regular scrollable area

/**
 * Calculate the total dimensions of frozen areas
 */
export function calculateFreezeDimensions(
  frozenRows: number,
  frozenCols: number,
  rowHeights: Map<number, number>,
  colWidths: Map<number, number>,
  defaultRowHeight: number,
  defaultColWidth: number,
  hiddenRows?: Set<number>,
  hiddenCols?: Set<number>
): FreezeDimensions {
  const hidRows = hiddenRows ?? new Set<number>();
  const hidCols = hiddenCols ?? new Set<number>();
  
  // Calculate frozen width (sum of frozen column widths, excluding hidden)
  let frozenWidth = 0;
  for (let c = 0; c < frozenCols; c++) {
    if (!hidCols.has(c)) {
      frozenWidth += colWidths.get(c) ?? defaultColWidth;
    }
  }
  
  // Calculate frozen height (sum of frozen row heights, excluding hidden)
  let frozenHeight = 0;
  for (let r = 0; r < frozenRows; r++) {
    if (!hidRows.has(r)) {
      frozenHeight += rowHeights.get(r) ?? defaultRowHeight;
    }
  }
  
  return { frozenWidth, frozenHeight };
}

/**
 * Determine which freeze region a canvas point falls into
 * 
 * @param x - Canvas x coordinate (relative to canvas origin, after headers)
 * @param y - Canvas y coordinate (relative to canvas origin, after headers)
 * @param frozenWidth - Total width of frozen columns
 * @param frozenHeight - Total height of frozen rows
 * @param headerWidth - Width of row headers
 * @param headerHeight - Height of column headers
 */
export function getRegionAtPoint(
  x: number,
  y: number,
  frozenWidth: number,
  frozenHeight: number,
  headerWidth: number,
  headerHeight: number
): FreezeRegion {
  const inFrozenCols = x <= headerWidth + frozenWidth;
  const inFrozenRows = y <= headerHeight + frozenHeight;
  
  if (inFrozenRows && inFrozenCols) {
    return 'top-left';
  } else if (inFrozenRows) {
    return 'top';
  } else if (inFrozenCols) {
    return 'left';
  } else {
    return 'main';
  }
}

/**
 * Get the effective scroll offset for a given region
 */
export function getScrollForRegion(
  region: FreezeRegion,
  scrollTop: number,
  scrollLeft: number
): { effectiveScrollTop: number; effectiveScrollLeft: number } {
  switch (region) {
    case 'top-left':
      // Never scrolls
      return { effectiveScrollTop: 0, effectiveScrollLeft: 0 };
    case 'top':
      // Only scrolls horizontally
      return { effectiveScrollTop: 0, effectiveScrollLeft: scrollLeft };
    case 'left':
      // Only scrolls vertically
      return { effectiveScrollTop: scrollTop, effectiveScrollLeft: 0 };
    case 'main':
      // Scrolls both ways
      return { effectiveScrollTop: scrollTop, effectiveScrollLeft: scrollLeft };
  }
}

/**
 * Convert a canvas point to grid coordinates, accounting for freeze regions
 * 
 * @param canvasX - X position on canvas (including headers)
 * @param canvasY - Y position on canvas (including headers)
 * @param scrollTop - Current vertical scroll position
 * @param scrollLeft - Current horizontal scroll position
 * @param frozenWidth - Total width of frozen columns
 * @param frozenHeight - Total height of frozen rows
 * @param headerWidth - Width of row headers
 * @param headerHeight - Height of column headers
 */
export function canvasToGridCoordinates(
  canvasX: number,
  canvasY: number,
  scrollTop: number,
  scrollLeft: number,
  frozenWidth: number,
  frozenHeight: number,
  headerWidth: number,
  headerHeight: number
): { gridX: number; gridY: number } {
  const region = getRegionAtPoint(
    canvasX, canvasY,
    frozenWidth, frozenHeight,
    headerWidth, headerHeight
  );
  
  const { effectiveScrollTop, effectiveScrollLeft } = getScrollForRegion(
    region, scrollTop, scrollLeft
  );
  
  // Convert to grid coordinates based on region
  let gridX: number;
  let gridY: number;
  
  if (region === 'top-left' || region === 'left') {
    // In frozen columns - no horizontal scroll adjustment
    gridX = canvasX - headerWidth;
  } else {
    // In scrollable columns - apply scroll offset
    gridX = canvasX - headerWidth + effectiveScrollLeft;
  }
  
  if (region === 'top-left' || region === 'top') {
    // In frozen rows - no vertical scroll adjustment
    gridY = canvasY - headerHeight;
  } else {
    // In scrollable rows - apply scroll offset
    gridY = canvasY - headerHeight + effectiveScrollTop;
  }
  
  return { gridX, gridY };
}

/**
 * Calculate clipping rectangle for a freeze region
 * 
 * @returns Clip rect in canvas coordinates { x, y, width, height }
 */
export function getClipRectForRegion(
  region: FreezeRegion,
  canvasWidth: number,
  canvasHeight: number,
  frozenWidth: number,
  frozenHeight: number,
  headerWidth: number,
  headerHeight: number
): { x: number; y: number; width: number; height: number } {
  switch (region) {
    case 'top-left':
      return {
        x: headerWidth,
        y: headerHeight,
        width: frozenWidth,
        height: frozenHeight,
      };
    case 'top':
      return {
        x: headerWidth + frozenWidth,
        y: headerHeight,
        width: canvasWidth - headerWidth - frozenWidth,
        height: frozenHeight,
      };
    case 'left':
      return {
        x: headerWidth,
        y: headerHeight + frozenHeight,
        width: frozenWidth,
        height: canvasHeight - headerHeight - frozenHeight,
      };
    case 'main':
      return {
        x: headerWidth + frozenWidth,
        y: headerHeight + frozenHeight,
        width: canvasWidth - headerWidth - frozenWidth,
        height: canvasHeight - headerHeight - frozenHeight,
      };
  }
}

/**
 * Check if a row is in the frozen area
 */
export function isRowFrozen(row: number, frozenRows: number): boolean {
  return row < frozenRows;
}

/**
 * Check if a column is in the frozen area
 */
export function isColFrozen(col: number, frozenCols: number): boolean {
  return col < frozenCols;
}

/**
 * Check if a cell is fully in the frozen area (both row and col frozen)
 */
export function isCellFullyFrozen(
  row: number,
  col: number,
  frozenRows: number,
  frozenCols: number
): boolean {
  return isRowFrozen(row, frozenRows) && isColFrozen(col, frozenCols);
}

/**
 * Get the region a cell belongs to based on its row/col indices
 */
export function getCellRegion(
  row: number,
  col: number,
  frozenRows: number,
  frozenCols: number
): FreezeRegion {
  const rowFrozen = isRowFrozen(row, frozenRows);
  const colFrozen = isColFrozen(col, frozenCols);
  
  if (rowFrozen && colFrozen) {
    return 'top-left';
  } else if (rowFrozen) {
    return 'top';
  } else if (colFrozen) {
    return 'left';
  } else {
    return 'main';
  }
}

