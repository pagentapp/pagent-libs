// Selection Renderer - Handles selection highlighting and active cell

import type { CanvasTheme, Viewport, CellPosition, Rect, FormulaRangeHighlight } from './types';
import type { Selection, Range } from '../types';
import type { FreezeRegion } from '../features/freeze';
import { getCellRegion } from '../features/freeze';

/**
 * Renders selection highlighting and active cell border
 */
export class SelectionRenderer {
  private theme: CanvasTheme;
  
  constructor(theme: CanvasTheme) {
    this.theme = theme;
  }
  
  /**
   * Main render method for all selection elements
   * @param frozenRows - Number of frozen rows (optional, for freeze pane support)
   * @param frozenCols - Number of frozen columns (optional, for freeze pane support)
   * @param currentRegion - Current freeze region being rendered (optional)
   */
  render(
    ctx: CanvasRenderingContext2D,
    selection: Selection | null,
    activeCell: CellPosition | null,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    formulaRanges?: FormulaRangeHighlight[],
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number,
    currentRegion?: FreezeRegion
  ): void {
    const hidRows = hiddenRows ?? new Set<number>();
    const hidCols = hiddenCols ?? new Set<number>();
    const numFrozenRows = frozenRows ?? 0;
    const numFrozenCols = frozenCols ?? 0;
    
    // Render formula reference highlights first (behind selection)
    if (formulaRanges && formulaRanges.length > 0) {
      for (const formulaRange of formulaRanges) {
        // Check if this formula range should be rendered in the current region
        if (currentRegion && !this.shouldRenderRangeInRegion(
          { startRow: formulaRange.startRow, endRow: formulaRange.endRow, 
            startCol: formulaRange.startCol, endCol: formulaRange.endCol },
          currentRegion, numFrozenRows, numFrozenCols
        )) {
          continue;
        }
        
        this.renderFormulaRange(
          ctx,
          formulaRange,
          viewport,
          rowHeights,
          colWidths,
          defaultRowHeight,
          defaultColWidth,
          headerWidth,
          headerHeight,
          hidRows,
          hidCols,
          numFrozenRows,
          numFrozenCols
        );
      }
    }
    
    // Render selection ranges (highlight)
    if (selection) {
      for (const range of selection.ranges) {
        // Check if this selection range should be rendered in the current region
        if (currentRegion && !this.shouldRenderRangeInRegion(
          range, currentRegion, numFrozenRows, numFrozenCols
        )) {
          continue;
        }
        
        this.renderSelectionRange(
          ctx,
          range,
          viewport,
          rowHeights,
          colWidths,
          defaultRowHeight,
          defaultColWidth,
          headerWidth,
          headerHeight,
          hidRows,
          hidCols,
          numFrozenRows,
          numFrozenCols
        );
      }
    }
    
    // Render active cell border (only if not hidden)
    if (activeCell && !hidRows.has(activeCell.row) && !hidCols.has(activeCell.col)) {
      // Check if active cell should be rendered in the current region
      const activeCellRegion = getCellRegion(activeCell.row, activeCell.col, numFrozenRows, numFrozenCols);
      if (!currentRegion || activeCellRegion === currentRegion) {
        this.renderActiveCell(
          ctx,
          activeCell,
          viewport,
          rowHeights,
          colWidths,
          defaultRowHeight,
          defaultColWidth,
          headerWidth,
          headerHeight,
          hidRows,
          hidCols,
          numFrozenRows,
          numFrozenCols
        );
      }
      
      // Render fill handle if there's a selection (only in the region containing the end of selection)
      if (selection && selection.ranges.length > 0) {
        const lastRange = selection.ranges[selection.ranges.length - 1];
        const fillHandleRegion = getCellRegion(lastRange.endRow, lastRange.endCol, numFrozenRows, numFrozenCols);
        
        if (!currentRegion || fillHandleRegion === currentRegion) {
          this.renderFillHandle(
            ctx,
            lastRange,
            viewport,
            rowHeights,
            colWidths,
            defaultRowHeight,
            defaultColWidth,
            headerWidth,
            headerHeight,
            hidRows,
            hidCols,
            numFrozenRows,
            numFrozenCols
          );
        }
      }
    }
  }
  
  /**
   * Determine if a range should be rendered in the current freeze region.
   * A range should be rendered if any of its cells overlap with the current region.
   */
  private shouldRenderRangeInRegion(
    range: Range,
    currentRegion: FreezeRegion,
    frozenRows: number,
    frozenCols: number
  ): boolean {
    // Check each corner of the range to see if any fall in the current region
    const corners = [
      { row: range.startRow, col: range.startCol },
      { row: range.startRow, col: range.endCol },
      { row: range.endRow, col: range.startCol },
      { row: range.endRow, col: range.endCol },
    ];
    
    for (const corner of corners) {
      if (getCellRegion(corner.row, corner.col, frozenRows, frozenCols) === currentRegion) {
        return true;
      }
    }
    
    // Also check if the range spans across the current region
    // (e.g., a range from frozen to non-frozen area)
    const rangeStartsFrozenRow = range.startRow < frozenRows;
    const rangeEndsFrozenRow = range.endRow < frozenRows;
    const rangeStartsFrozenCol = range.startCol < frozenCols;
    const rangeEndsFrozenCol = range.endCol < frozenCols;
    
    switch (currentRegion) {
      case 'top-left':
        // Any range that has cells in frozen rows AND frozen cols
        return rangeStartsFrozenRow && rangeStartsFrozenCol;
      case 'top':
        // Range that has cells in frozen rows AND non-frozen cols
        return rangeStartsFrozenRow && !rangeEndsFrozenCol;
      case 'left':
        // Range that has cells in non-frozen rows AND frozen cols
        return !rangeEndsFrozenRow && rangeStartsFrozenCol;
      case 'main':
        // Range that has cells in non-frozen rows AND non-frozen cols
        return !rangeEndsFrozenRow && !rangeEndsFrozenCol;
    }
  }
  
  /**
   * Get color for formula range by index
   */
  private getFormulaRangeColor(colorIndex: number): { border: string; fill: string } {
    const colors = this.theme.formulaReferenceColors;
    if (colorIndex < colors.length) {
      return colors[colorIndex];
    }
    // Generate a color for indices beyond the palette
    const hue = (colorIndex * 137.508) % 360;
    const saturation = 60 + (colorIndex % 20);
    const lightness = 50 + (colorIndex % 10);
    return {
      border: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
      fill: `hsla(${hue}, ${saturation}%, ${lightness}%, 0.15)`,
    };
  }
  
  /**
   * Render a formula range highlight (cell references in formulas)
   */
  private renderFormulaRange(
    ctx: CanvasRenderingContext2D,
    formulaRange: FormulaRangeHighlight,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number
  ): void {
    const range: Range = {
      startRow: formulaRange.startRow,
      endRow: formulaRange.endRow,
      startCol: formulaRange.startCol,
      endCol: formulaRange.endCol,
    };
    
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight,
      hiddenRows,
      hiddenCols,
      frozenRows,
      frozenCols
    );
    
    if (!bounds) return;
    
    const color = this.getFormulaRangeColor(formulaRange.colorIndex);
    
    // Formula range fill
    ctx.fillStyle = color.fill;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    
    // Formula range border
    ctx.strokeStyle = color.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      bounds.x + 1,
      bounds.y + 1,
      bounds.width - 2,
      bounds.height - 2
    );
  }
  
  /**
   * Calculate bounds for a range in canvas coordinates
   */
  private getRangeBounds(
    range: Range,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number
  ): Rect | null {
    const { scrollTop, scrollLeft } = viewport;
    const hidRows = hiddenRows ?? new Set<number>();
    const hidCols = hiddenCols ?? new Set<number>();
    const numFrozenRows = frozenRows ?? 0;
    const numFrozenCols = frozenCols ?? 0;
    
    // Determine if this range is in frozen area
    const isRowFrozen = range.startRow < numFrozenRows;
    const isColFrozen = range.startCol < numFrozenCols;
    
    // Calculate x position (skip hidden columns)
    // If column is frozen, accumulate from 0; otherwise accumulate from frozenCols
    let x = headerWidth;
    const startColAccumulation = isColFrozen ? 0 : numFrozenCols;
    for (let c = startColAccumulation; c < range.startCol; c++) {
      if (!hidCols.has(c)) {
        x += colWidths.get(c) ?? defaultColWidth;
      }
    }
    // Only apply scroll if not in frozen columns
    if (!isColFrozen) {
      x -= scrollLeft;
    }
    
    // Calculate y position (skip hidden rows)
    // If row is frozen, accumulate from 0; otherwise accumulate from frozenRows
    let y = headerHeight;
    const startRowAccumulation = isRowFrozen ? 0 : numFrozenRows;
    for (let r = startRowAccumulation; r < range.startRow; r++) {
      if (!hidRows.has(r)) {
        y += rowHeights.get(r) ?? defaultRowHeight;
      }
    }
    // Only apply scroll if not in frozen rows
    if (!isRowFrozen) {
      y -= scrollTop;
    }
    
    // Calculate width (skip hidden columns)
    let width = 0;
    for (let c = range.startCol; c <= range.endCol; c++) {
      if (!hidCols.has(c)) {
        width += colWidths.get(c) ?? defaultColWidth;
      }
    }
    
    // Calculate height (skip hidden rows)
    let height = 0;
    for (let r = range.startRow; r <= range.endRow; r++) {
      if (!hidRows.has(r)) {
        height += rowHeights.get(r) ?? defaultRowHeight;
      }
    }
    
    // Return null if entire range is hidden
    if (width === 0 || height === 0) {
      return null;
    }
    
    return { x, y, width, height };
  }
  
  /**
   * Render a selection range (highlight fill and border)
   */
  private renderSelectionRange(
    ctx: CanvasRenderingContext2D,
    range: Range,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number
  ): void {
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight,
      hiddenRows,
      hiddenCols,
      frozenRows,
      frozenCols
    );
    
    if (!bounds) return;
    
    // Selection fill
    ctx.fillStyle = this.theme.selectionFillColor;
    ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    
    // Selection border
    ctx.strokeStyle = this.theme.selectionBorderColor;
    ctx.lineWidth = this.theme.selectionBorderWidth;
    ctx.strokeRect(
      bounds.x + 0.5,
      bounds.y + 0.5,
      bounds.width - 1,
      bounds.height - 1
    );
  }
  
  /**
   * Render the active cell border
   */
  private renderActiveCell(
    ctx: CanvasRenderingContext2D,
    cell: CellPosition,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number
  ): void {
    const range: Range = {
      startRow: cell.row,
      endRow: cell.row,
      startCol: cell.col,
      endCol: cell.col,
    };
    
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight,
      hiddenRows,
      hiddenCols,
      frozenRows,
      frozenCols
    );
    
    if (!bounds) return;
    
    // Active cell border only - cell content is already rendered by CellRenderer
    ctx.strokeStyle = this.theme.activeCellBorderColor;
    ctx.lineWidth = this.theme.activeCellBorderWidth;
    ctx.strokeRect(
      bounds.x + 1,
      bounds.y + 1,
      bounds.width - 2,
      bounds.height - 2
    );
  }
  
  /**
   * Render the fill handle (small square at bottom-right of selection)
   */
  private renderFillHandle(
    ctx: CanvasRenderingContext2D,
    range: Range,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>,
    frozenRows?: number,
    frozenCols?: number
  ): void {
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight,
      hiddenRows,
      hiddenCols,
      frozenRows,
      frozenCols
    );
    
    if (!bounds) return;
    
    const handleSize = this.theme.fillHandleSize;
    const handleX = bounds.x + bounds.width - handleSize / 2;
    const handleY = bounds.y + bounds.height - handleSize / 2;
    
    // Fill handle square
    ctx.fillStyle = this.theme.fillHandleColor;
    ctx.fillRect(
      handleX - handleSize / 2,
      handleY - handleSize / 2,
      handleSize,
      handleSize
    );
    
    // White border around fill handle
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      handleX - handleSize / 2,
      handleY - handleSize / 2,
      handleSize,
      handleSize
    );
  }
  
  /**
   * Render copy/paste marching ants border
   */
  renderMarchingAnts(
    ctx: CanvasRenderingContext2D,
    range: Range,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    offset: number
  ): void {
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight
    );
    
    if (!bounds) return;
    
    ctx.strokeStyle = this.theme.selectionBorderColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = offset;
    
    ctx.strokeRect(
      bounds.x + 0.5,
      bounds.y + 0.5,
      bounds.width - 1,
      bounds.height - 1
    );
    
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;
  }
  
  /**
   * Render fill preview during fill handle drag
   */
  renderFillPreview(
    ctx: CanvasRenderingContext2D,
    range: Range,
    viewport: Viewport,
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number
  ): void {
    const bounds = this.getRangeBounds(
      range,
      viewport,
      rowHeights,
      colWidths,
      defaultRowHeight,
      defaultColWidth,
      headerWidth,
      headerHeight
    );
    
    if (!bounds) return;
    
    // Dashed border for fill preview
    ctx.strokeStyle = this.theme.selectionBorderColor;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    
    ctx.strokeRect(
      bounds.x + 0.5,
      bounds.y + 0.5,
      bounds.width - 1,
      bounds.height - 1
    );
    
    ctx.setLineDash([]);
  }
}

