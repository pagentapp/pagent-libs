// Hit Testing - Maps mouse coordinates to grid positions

import type { CellPosition, HeaderHit, ResizeHandle } from './types';
import type { Range } from '../types';

/**
 * Resize handle hit area size (pixels from edge)
 */
const RESIZE_HANDLE_SIZE = 5;

/**
 * Fill handle hit area size
 */
const FILL_HANDLE_HIT_SIZE = 8;

/**
 * Handles hit testing for mouse interactions
 */
export class HitTester {
  private headerWidth: number;
  private headerHeight: number;
  private defaultRowHeight: number;
  private defaultColWidth: number;
  
  // Current scroll position
  private scrollTop: number = 0;
  private scrollLeft: number = 0;
  
  // Dimension maps (updated from render state)
  private rowHeights: Map<number, number> = new Map();
  private colWidths: Map<number, number> = new Map();
  private rowCount: number = 0;
  private colCount: number = 0;
  
  // Hidden rows/cols
  private hiddenRows: Set<number> = new Set();
  private hiddenCols: Set<number> = new Set();
  
  // Freeze panes configuration
  private frozenRows: number = 0;
  private frozenCols: number = 0;
  private frozenWidth: number = 0;
  private frozenHeight: number = 0;
  
  constructor(
    headerWidth: number,
    headerHeight: number,
    defaultRowHeight: number,
    defaultColWidth: number
  ) {
    this.headerWidth = headerWidth;
    this.headerHeight = headerHeight;
    this.defaultRowHeight = defaultRowHeight;
    this.defaultColWidth = defaultColWidth;
  }
  
  /**
   * Update scroll position
   */
  setScroll(scrollTop: number, scrollLeft: number): void {
    this.scrollTop = scrollTop;
    this.scrollLeft = scrollLeft;
  }
  
  /**
   * Update dimension information
   */
  setDimensions(
    rowHeights: Map<number, number>,
    colWidths: Map<number, number>,
    defaultRowHeight: number,
    defaultColWidth: number,
    rowCount: number,
    colCount: number,
    hiddenRows?: Set<number>,
    hiddenCols?: Set<number>
  ): void {
    this.rowHeights = rowHeights;
    this.colWidths = colWidths;
    this.defaultRowHeight = defaultRowHeight;
    this.defaultColWidth = defaultColWidth;
    this.rowCount = rowCount;
    this.colCount = colCount;
    this.hiddenRows = hiddenRows ?? new Set();
    this.hiddenCols = hiddenCols ?? new Set();
  }
  
  /**
   * Update freeze panes configuration
   */
  setFreezeConfig(
    frozenRows: number,
    frozenCols: number,
    frozenWidth: number,
    frozenHeight: number
  ): void {
    this.frozenRows = frozenRows;
    this.frozenCols = frozenCols;
    this.frozenWidth = frozenWidth;
    this.frozenHeight = frozenHeight;
  }
  
  /**
   * Get the cell at a canvas point (accounting for freeze panes)
   */
  getCellAt(x: number, y: number): CellPosition | null {
    // Check if point is in the cell area (not headers)
    if (x <= this.headerWidth || y <= this.headerHeight) {
      return null;
    }
    
    // Determine which freeze region the point is in
    const inFrozenCols = x < this.headerWidth + this.frozenWidth && this.frozenCols > 0;
    const inFrozenRows = y < this.headerHeight + this.frozenHeight && this.frozenRows > 0;
    
    // Calculate effective scroll based on region
    const effectiveScrollLeft = inFrozenCols ? 0 : this.scrollLeft;
    const effectiveScrollTop = inFrozenRows ? 0 : this.scrollTop;
    
    // Determine starting column and position for search
    let col: number;
    let accX: number;
    
    if (inFrozenCols) {
      // In frozen columns - start from column 0
      col = 0;
      accX = 0;
      const localX = x - this.headerWidth;
      
      while (col < this.frozenCols && col < this.colCount) {
        if (this.hiddenCols.has(col)) {
          col++;
          continue;
        }
        const width = this.colWidths.get(col) ?? this.defaultColWidth;
        if (accX + width > localX) {
          break;
        }
        accX += width;
        col++;
      }
    } else {
      // In scrollable columns - start from first visible scrollable column
      col = this.frozenCols;
      accX = 0;
      const localX = x - this.headerWidth - this.frozenWidth + effectiveScrollLeft;
      
      while (col < this.colCount) {
        if (this.hiddenCols.has(col)) {
          col++;
          continue;
        }
        const width = this.colWidths.get(col) ?? this.defaultColWidth;
        if (accX + width > localX) {
          break;
        }
        accX += width;
        col++;
      }
    }
    
    // Determine starting row and position for search
    let row: number;
    let accY: number;
    
    if (inFrozenRows) {
      // In frozen rows - start from row 0
      row = 0;
      accY = 0;
      const localY = y - this.headerHeight;
      
      while (row < this.frozenRows && row < this.rowCount) {
        if (this.hiddenRows.has(row)) {
          row++;
          continue;
        }
        const height = this.rowHeights.get(row) ?? this.defaultRowHeight;
        if (accY + height > localY) {
          break;
        }
        accY += height;
        row++;
      }
    } else {
      // In scrollable rows - start from first visible scrollable row
      row = this.frozenRows;
      accY = 0;
      const localY = y - this.headerHeight - this.frozenHeight + effectiveScrollTop;
      
      while (row < this.rowCount) {
        if (this.hiddenRows.has(row)) {
          row++;
          continue;
        }
        const height = this.rowHeights.get(row) ?? this.defaultRowHeight;
        if (accY + height > localY) {
          break;
        }
        accY += height;
        row++;
      }
    }
    
    // Check bounds and if cell is hidden
    if (row >= this.rowCount || col >= this.colCount) {
      return null;
    }
    if (this.hiddenRows.has(row) || this.hiddenCols.has(col)) {
      return null;
    }
    
    return { row, col };
  }
  
  /**
   * Get the header at a canvas point (accounting for freeze panes)
   */
  getHeaderAt(x: number, y: number): HeaderHit | null {
    // Column header
    if (y <= this.headerHeight && x > this.headerWidth) {
      // Check if in frozen columns area
      const inFrozenCols = x < this.headerWidth + this.frozenWidth && this.frozenCols > 0;
      
      if (inFrozenCols) {
        // Frozen column headers - no scroll
        const localX = x - this.headerWidth;
        
        let col = 0;
        let accX = 0;
        while (col < this.frozenCols && col < this.colCount) {
          if (this.hiddenCols.has(col)) {
            col++;
            continue;
          }
          
          const width = this.colWidths.get(col) ?? this.defaultColWidth;
          const nextAccX = accX + width;
          
          // Check for resize handle
          if (localX >= nextAccX - RESIZE_HANDLE_SIZE && localX <= nextAccX + RESIZE_HANDLE_SIZE) {
            return { type: 'column', index: col, isResize: true };
          }
          
          if (nextAccX > localX) {
            return { type: 'column', index: col, isResize: false };
          }
          
          accX = nextAccX;
          col++;
        }
      } else {
        // Scrollable column headers
        const localX = x - this.headerWidth - this.frozenWidth + this.scrollLeft;
        
        let col = this.frozenCols;
        let accX = 0;
        while (col < this.colCount) {
          if (this.hiddenCols.has(col)) {
            col++;
            continue;
          }
          
          const width = this.colWidths.get(col) ?? this.defaultColWidth;
          const nextAccX = accX + width;
          
          // Check for resize handle
          if (localX >= nextAccX - RESIZE_HANDLE_SIZE && localX <= nextAccX + RESIZE_HANDLE_SIZE) {
            return { type: 'column', index: col, isResize: true };
          }
          
          if (nextAccX > localX) {
            return { type: 'column', index: col, isResize: false };
          }
          
          accX = nextAccX;
          col++;
        }
      }
      
      return null;
    }
    
    // Row header
    if (x <= this.headerWidth && y > this.headerHeight) {
      // Check if in frozen rows area
      const inFrozenRows = y < this.headerHeight + this.frozenHeight && this.frozenRows > 0;
      
      if (inFrozenRows) {
        // Frozen row headers - no scroll
        const localY = y - this.headerHeight;
        
        let row = 0;
        let accY = 0;
        while (row < this.frozenRows && row < this.rowCount) {
          if (this.hiddenRows.has(row)) {
            row++;
            continue;
          }
          
          const height = this.rowHeights.get(row) ?? this.defaultRowHeight;
          const nextAccY = accY + height;
          
          // Check for resize handle
          if (localY >= nextAccY - RESIZE_HANDLE_SIZE && localY <= nextAccY + RESIZE_HANDLE_SIZE) {
            return { type: 'row', index: row, isResize: true };
          }
          
          if (nextAccY > localY) {
            return { type: 'row', index: row, isResize: false };
          }
          
          accY = nextAccY;
          row++;
        }
      } else {
        // Scrollable row headers
        const localY = y - this.headerHeight - this.frozenHeight + this.scrollTop;
        
        let row = this.frozenRows;
        let accY = 0;
        while (row < this.rowCount) {
          if (this.hiddenRows.has(row)) {
            row++;
            continue;
          }
          
          const height = this.rowHeights.get(row) ?? this.defaultRowHeight;
          const nextAccY = accY + height;
          
          // Check for resize handle
          if (localY >= nextAccY - RESIZE_HANDLE_SIZE && localY <= nextAccY + RESIZE_HANDLE_SIZE) {
            return { type: 'row', index: row, isResize: true };
          }
          
          if (nextAccY > localY) {
            return { type: 'row', index: row, isResize: false };
          }
          
          accY = nextAccY;
          row++;
        }
      }
      
      return null;
    }
    
    // Corner cell
    if (x <= this.headerWidth && y <= this.headerHeight) {
      // Corner cell doesn't have a specific header hit type
      return null;
    }
    
    return null;
  }
  
  /**
   * Get resize handle at a point
   */
  getResizeHandleAt(x: number, y: number): ResizeHandle | null {
    const header = this.getHeaderAt(x, y);
    if (header && header.isResize) {
      return { type: header.type, index: header.index };
    }
    return null;
  }
  
  /**
   * Check if point is on the fill handle (accounting for freeze panes)
   */
  getFillHandleAt(
    x: number,
    y: number,
    selectionRange: Range | undefined
  ): boolean {
    if (!selectionRange) {
      return false;
    }
    
    // Calculate fill handle position (bottom-right of selection)
    const range = selectionRange;
    
    // Determine if the end of the range is in frozen area
    const endColFrozen = range.endCol < this.frozenCols;
    const endRowFrozen = range.endRow < this.frozenRows;
    
    // Calculate handleX
    let handleX: number;
    if (endColFrozen) {
      // End column is frozen - no scroll offset
      handleX = this.headerWidth;
      for (let c = 0; c <= range.endCol; c++) {
        if (!this.hiddenCols.has(c)) {
          handleX += this.colWidths.get(c) ?? this.defaultColWidth;
        }
      }
    } else {
      // End column is scrollable
      handleX = this.headerWidth + this.frozenWidth;
      for (let c = this.frozenCols; c <= range.endCol; c++) {
        if (!this.hiddenCols.has(c)) {
          handleX += this.colWidths.get(c) ?? this.defaultColWidth;
        }
      }
      handleX -= this.scrollLeft;
    }
    
    // Calculate handleY
    let handleY: number;
    if (endRowFrozen) {
      // End row is frozen - no scroll offset
      handleY = this.headerHeight;
      for (let r = 0; r <= range.endRow; r++) {
        if (!this.hiddenRows.has(r)) {
          handleY += this.rowHeights.get(r) ?? this.defaultRowHeight;
        }
      }
    } else {
      // End row is scrollable
      handleY = this.headerHeight + this.frozenHeight;
      for (let r = this.frozenRows; r <= range.endRow; r++) {
        if (!this.hiddenRows.has(r)) {
          handleY += this.rowHeights.get(r) ?? this.defaultRowHeight;
        }
      }
      handleY -= this.scrollTop;
    }
    
    // Check if point is within fill handle hit area
    const dx = Math.abs(x - handleX);
    const dy = Math.abs(y - handleY);
    
    return dx <= FILL_HANDLE_HIT_SIZE && dy <= FILL_HANDLE_HIT_SIZE;
  }
  
  /**
   * Convert grid position to canvas coordinates (accounting for freeze panes)
   */
  gridToCanvas(row: number, col: number): { x: number; y: number } {
    // Determine if cell is in frozen area
    const colFrozen = col < this.frozenCols;
    const rowFrozen = row < this.frozenRows;
    
    // Calculate X position
    let x: number;
    if (colFrozen) {
      // Column is frozen - no scroll offset
      x = this.headerWidth;
      for (let c = 0; c < col; c++) {
        if (!this.hiddenCols.has(c)) {
          x += this.colWidths.get(c) ?? this.defaultColWidth;
        }
      }
    } else {
      // Column is scrollable
      x = this.headerWidth + this.frozenWidth;
      for (let c = this.frozenCols; c < col; c++) {
        if (!this.hiddenCols.has(c)) {
          x += this.colWidths.get(c) ?? this.defaultColWidth;
        }
      }
      x -= this.scrollLeft;
    }
    
    // Calculate Y position
    let y: number;
    if (rowFrozen) {
      // Row is frozen - no scroll offset
      y = this.headerHeight;
      for (let r = 0; r < row; r++) {
        if (!this.hiddenRows.has(r)) {
          y += this.rowHeights.get(r) ?? this.defaultRowHeight;
        }
      }
    } else {
      // Row is scrollable
      y = this.headerHeight + this.frozenHeight;
      for (let r = this.frozenRows; r < row; r++) {
        if (!this.hiddenRows.has(r)) {
          y += this.rowHeights.get(r) ?? this.defaultRowHeight;
        }
      }
      y -= this.scrollTop;
    }
    
    return { x, y };
  }
  
  /**
   * Get the bounds of a cell in canvas coordinates (accounting for freeze panes)
   */
  getCellBounds(row: number, col: number): { x: number; y: number; width: number; height: number } | null {
    // Return null for hidden cells
    if (this.hiddenRows.has(row) || this.hiddenCols.has(col)) {
      return null;
    }
    
    const { x, y } = this.gridToCanvas(row, col);
    const width = this.colWidths.get(col) ?? this.defaultColWidth;
    const height = this.rowHeights.get(row) ?? this.defaultRowHeight;
    
    return { x, y, width, height };
  }
  
  /**
   * Check if a point is in the corner cell
   */
  isInCornerCell(x: number, y: number): boolean {
    return x <= this.headerWidth && y <= this.headerHeight;
  }
  
  /**
   * Get the total width of the grid (excluding hidden columns)
   */
  getTotalWidth(): number {
    let total = 0;
    for (let c = 0; c < this.colCount; c++) {
      if (!this.hiddenCols.has(c)) {
        total += this.colWidths.get(c) ?? this.defaultColWidth;
      }
    }
    return total;
  }
  
  /**
   * Get the total height of the grid (excluding hidden rows)
   */
  getTotalHeight(): number {
    let total = 0;
    for (let r = 0; r < this.rowCount; r++) {
      if (!this.hiddenRows.has(r)) {
        total += this.rowHeights.get(r) ?? this.defaultRowHeight;
      }
    }
    return total;
  }
}

