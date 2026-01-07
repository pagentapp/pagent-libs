// Header Renderer - Handles row/column headers and corner cell

import type { CanvasTheme, CellPosition } from './types';
import type { Selection, ColumnFilter } from '../types';

/**
 * Renders row and column headers
 */
export class HeaderRenderer {
  private theme: CanvasTheme;

  constructor(theme: CanvasTheme) {
    this.theme = theme;
  }
  
  /**
   * Convert column index to letter label (0 -> A, 1 -> B, ..., 26 -> AA, etc.)
   */
  columnIndexToLabel(index: number): string {
    let label = '';
    let n = index;
    
    while (n >= 0) {
      label = String.fromCharCode(65 + (n % 26)) + label;
      n = Math.floor(n / 26) - 1;
    }
    
    return label;
  }
  
  /**
   * Check if a column is in the selection
   */
  private isColumnSelected(
    col: number,
    selection: Selection | null,
    activeCell: CellPosition | null
  ): boolean {
    if (activeCell && activeCell.col === col) {
      return true;
    }
    
    if (!selection) {
      return false;
    }
    
    for (const range of selection.ranges) {
      if (col >= range.startCol && col <= range.endCol) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a row is in the selection
   */
  private isRowSelected(
    row: number,
    selection: Selection | null,
    activeCell: CellPosition | null
  ): boolean {
    if (activeCell && activeCell.row === row) {
      return true;
    }
    
    if (!selection) {
      return false;
    }
    
    for (const range of selection.ranges) {
      if (row >= range.startRow && row <= range.endRow) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if there are hidden columns immediately before the given column
   */
  private hasHiddenColumnsBefore(col: number, hiddenCols: Set<number>): boolean {
    // Check if column-1 is hidden
    return col > 0 && hiddenCols.has(col - 1);
  }
  
  /**
   * Render column headers
   */
  renderColumnHeaders(
    ctx: CanvasRenderingContext2D,
    startCol: number,
    endCol: number,
    scrollLeft: number,
    colWidths: Map<number, number>,
    defaultColWidth: number,
    headerWidth: number,
    headerHeight: number,
    selection: Selection | null,
    activeCell: CellPosition | null,
    hiddenCols?: Set<number>,
    skipAccumulationBefore?: number,
    filters?: Map<number, ColumnFilter>
  ): void {
    const hidCols = hiddenCols ?? new Set<number>();
    
    // Calculate starting x position (skip hidden columns)
    // If skipAccumulationBefore is set, don't accumulate widths before that column
    // (used when rendering scrollable columns after frozen columns)
    let startX = headerWidth;
    const accumulateFrom = skipAccumulationBefore ?? 0;
    for (let c = accumulateFrom; c < startCol; c++) {
      if (!hidCols.has(c)) {
        startX += colWidths.get(c) ?? defaultColWidth;
      }
    }
    startX -= scrollLeft;
    
    // Render each column header (skip hidden columns)
    let x = startX;
    for (let col = startCol; col < endCol; col++) {
      // Skip hidden columns
      if (hidCols.has(col)) continue;
      
      const width = colWidths.get(col) ?? defaultColWidth;
      const isSelected = this.isColumnSelected(col, selection, activeCell);
      
      // Check if there are hidden columns before this one
      const hasHiddenBefore = this.hasHiddenColumnsBefore(col, hidCols);
      
      // Background
      ctx.fillStyle = isSelected
        ? this.darkenColor(this.theme.headerBackgroundColor, 0.1)
        : this.theme.headerBackgroundColor;
      ctx.fillRect(x, 0, width, headerHeight);
      
      // Bottom border
      ctx.strokeStyle = this.theme.headerBorderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, headerHeight - 0.5);
      ctx.lineTo(x + width, headerHeight - 0.5);
      ctx.stroke();
      
      // Right border
      ctx.beginPath();
      ctx.moveTo(x + width - 0.5, 0);
      ctx.lineTo(x + width - 0.5, headerHeight);
      ctx.stroke();
      
      // Hidden column indicator (double blue line on left edge)
      if (hasHiddenBefore) {
        ctx.strokeStyle = this.theme.selectionBorderColor;
        ctx.lineWidth = 2;
        // First line
        ctx.beginPath();
        ctx.moveTo(x + 1.5, 2);
        ctx.lineTo(x + 1.5, headerHeight - 2);
        ctx.stroke();
        // Second line (double line effect)
        ctx.beginPath();
        ctx.moveTo(x + 4.5, 2);
        ctx.lineTo(x + 4.5, headerHeight - 2);
        ctx.stroke();
      }
      
      // Label
      const label = this.columnIndexToLabel(col);
      ctx.font = `${this.theme.headerFontSize}px ${this.theme.headerFont}`;
      ctx.fillStyle = isSelected
        ? this.darkenColor(this.theme.headerTextColor, 0.2)
        : this.theme.headerTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x + width / 2, headerHeight / 2);

      // Filter icon (if column has active filter)
      if (filters?.has(col)) {
        this.renderFilterIcon(ctx, x, 0, width);
      }

      x += width;
    }
  }
  
  /**
   * Check if there are hidden rows immediately before the given row
   */
  private hasHiddenRowsBefore(row: number, hiddenRows: Set<number>): boolean {
    // Check if row-1 is hidden
    return row > 0 && hiddenRows.has(row - 1);
  }

  /**
   * Render row headers
   */
  renderRowHeaders(
    ctx: CanvasRenderingContext2D,
    startRow: number,
    endRow: number,
    scrollTop: number,
    rowHeights: Map<number, number>,
    defaultRowHeight: number,
    headerWidth: number,
    headerHeight: number,
    selection: Selection | null,
    activeCell: CellPosition | null,
    hiddenRows?: Set<number>,
    skipAccumulationBefore?: number
  ): void {
    const hidRows = hiddenRows ?? new Set<number>();
    
    // Calculate starting y position (skip hidden rows)
    // If skipAccumulationBefore is set, don't accumulate heights before that row
    // (used when rendering scrollable rows after frozen rows)
    let startY = headerHeight;
    const accumulateFrom = skipAccumulationBefore ?? 0;
    for (let r = accumulateFrom; r < startRow; r++) {
      if (!hidRows.has(r)) {
        startY += rowHeights.get(r) ?? defaultRowHeight;
      }
    }
    startY -= scrollTop;
    
    // Render each row header (skip hidden rows)
    let y = startY;
    for (let row = startRow; row < endRow; row++) {
      // Skip hidden rows
      if (hidRows.has(row)) continue;
      
      const height = rowHeights.get(row) ?? defaultRowHeight;
      const isSelected = this.isRowSelected(row, selection, activeCell);
      
      // Check if there are hidden rows before this one
      const hasHiddenBefore = this.hasHiddenRowsBefore(row, hidRows);
      
      // Background
      ctx.fillStyle = isSelected
        ? this.darkenColor(this.theme.headerBackgroundColor, 0.1)
        : this.theme.headerBackgroundColor;
      ctx.fillRect(0, y, headerWidth, height);
      
      // Bottom border
      ctx.strokeStyle = this.theme.headerBorderColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, y + height - 0.5);
      ctx.lineTo(headerWidth, y + height - 0.5);
      ctx.stroke();
      
      // Right border
      ctx.beginPath();
      ctx.moveTo(headerWidth - 0.5, y);
      ctx.lineTo(headerWidth - 0.5, y + height);
      ctx.stroke();
      
      // Hidden row indicator (double blue line on top edge)
      if (hasHiddenBefore) {
        ctx.strokeStyle = this.theme.selectionBorderColor;
        ctx.lineWidth = 2;
        // First line
        ctx.beginPath();
        ctx.moveTo(2, y + 1.5);
        ctx.lineTo(headerWidth - 2, y + 1.5);
        ctx.stroke();
        // Second line (double line effect)
        ctx.beginPath();
        ctx.moveTo(2, y + 4.5);
        ctx.lineTo(headerWidth - 2, y + 4.5);
        ctx.stroke();
      }
      
      // Label (1-indexed for display)
      const label = String(row + 1);
      ctx.font = `${this.theme.headerFontSize}px ${this.theme.headerFont}`;
      ctx.fillStyle = isSelected
        ? this.darkenColor(this.theme.headerTextColor, 0.2)
        : this.theme.headerTextColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, headerWidth / 2, y + height / 2);
      
      y += height;
    }
  }
  
  /**
   * Render the corner cell (intersection of row and column headers)
   */
  renderCornerCell(
    ctx: CanvasRenderingContext2D,
    headerWidth: number,
    headerHeight: number
  ): void {
    // Background
    ctx.fillStyle = this.theme.headerBackgroundColor;
    ctx.fillRect(0, 0, headerWidth, headerHeight);
    
    // Right border
    ctx.strokeStyle = this.theme.headerBorderColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(headerWidth - 0.5, 0);
    ctx.lineTo(headerWidth - 0.5, headerHeight);
    ctx.stroke();
    
    // Bottom border
    ctx.beginPath();
    ctx.moveTo(0, headerHeight - 0.5);
    ctx.lineTo(headerWidth, headerHeight - 0.5);
    ctx.stroke();
  }
  
  /**
   * Render resize handles for columns
   */
  renderColumnResizeHandle(
    ctx: CanvasRenderingContext2D,
    x: number,
    headerHeight: number
  ): void {
    ctx.strokeStyle = this.theme.selectionBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, headerHeight);
    ctx.stroke();
  }
  
  /**
   * Render resize handles for rows
   */
  renderRowResizeHandle(
    ctx: CanvasRenderingContext2D,
    y: number,
    headerWidth: number
  ): void {
    ctx.strokeStyle = this.theme.selectionBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(headerWidth, y);
    ctx.stroke();
  }
  
  /**
   * Render filter icon in column header
   */
  private renderFilterIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number
  ): void {
    const iconSize = 8;
    const iconX = x + width - iconSize - 3; // 3px padding from right edge
    const iconY = y + 3; // 3px padding from top

    // Draw a small funnel/filter icon
    ctx.fillStyle = this.theme.headerTextColor;
    ctx.beginPath();

    // Top triangle (wide part of funnel)
    ctx.moveTo(iconX, iconY);
    ctx.lineTo(iconX + iconSize, iconY);
    ctx.lineTo(iconX + iconSize / 2, iconY + iconSize / 2);
    ctx.closePath();
    ctx.fill();

    // Bottom triangle (narrow part of funnel)
    ctx.beginPath();
    ctx.moveTo(iconX + iconSize / 2 - 1, iconY + iconSize / 2);
    ctx.lineTo(iconX + iconSize / 2 + 1, iconY + iconSize / 2);
    ctx.lineTo(iconX + iconSize / 2, iconY + iconSize);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Darken a hex color by a percentage
   */
  private darkenColor(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Darken
    const newR = Math.max(0, Math.floor(r * (1 - percent)));
    const newG = Math.max(0, Math.floor(g * (1 - percent)));
    const newB = Math.max(0, Math.floor(b * (1 - percent)));

    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

