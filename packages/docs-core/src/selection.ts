// Selection and cursor management

import type { CursorPosition, TextSelection, Block, InlineContent } from './types';

export function createCursorPosition(blockId: string, offset: number, runIndex?: number): CursorPosition {
  return { blockId, offset, runIndex };
}

export function createCollapsedSelection(position: CursorPosition): TextSelection {
  return {
    anchor: position,
    focus: position,
    isCollapsed: true,
  };
}

export function createSelection(anchor: CursorPosition, focus: CursorPosition): TextSelection {
  const isCollapsed = 
    anchor.blockId === focus.blockId && 
    anchor.offset === focus.offset &&
    anchor.runIndex === focus.runIndex;
  
  return {
    anchor,
    focus,
    isCollapsed,
  };
}

export function isSelectionCollapsed(selection: TextSelection): boolean {
  return selection.isCollapsed;
}

export function getSelectionStart(selection: TextSelection): CursorPosition {
  // For a proper implementation, we'd need to compare positions based on document order
  // For now, we return anchor as start
  return selection.anchor;
}

export function getSelectionEnd(selection: TextSelection): CursorPosition {
  return selection.focus;
}

/**
 * Get the total text length of a block's content
 */
export function getBlockTextLength(block: Block): number {
  if (block.type === 'horizontal-rule' || block.type === 'page-break' || block.type === 'table') {
    return 0;
  }
  
  if (block.type === 'image') {
    return 1; // Treat image as single character for selection purposes
  }

  const content = block.content as InlineContent[];
  return content.reduce((total, item) => {
    if (item.type === 'text') {
      return total + item.text.length;
    }
    if (item.type === 'link') {
      return total + item.text.length;
    }
    if (item.type === 'image') {
      return 1; // Inline image counts as 1
    }
    return total;
  }, 0);
}

/**
 * Get text content from a block
 */
export function getBlockText(block: Block): string {
  if (block.type === 'horizontal-rule' || block.type === 'page-break' || block.type === 'table' || block.type === 'image') {
    return '';
  }

  const content = block.content as InlineContent[];
  return content.reduce((text, item) => {
    if (item.type === 'text') {
      return text + item.text;
    }
    if (item.type === 'link') {
      return text + item.text;
    }
    return text;
  }, '');
}

/**
 * Find the run index and offset within run for a given block offset
 */
export function findRunAtOffset(
  content: InlineContent[],
  offset: number
): { runIndex: number; offsetInRun: number } | null {
  let currentOffset = 0;
  
  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    let itemLength = 0;
    
    if (item.type === 'text') {
      itemLength = item.text.length;
    } else if (item.type === 'link') {
      itemLength = item.text.length;
    } else if (item.type === 'image') {
      itemLength = 1;
    }
    
    if (offset <= currentOffset + itemLength) {
      return {
        runIndex: i,
        offsetInRun: offset - currentOffset,
      };
    }
    
    currentOffset += itemLength;
  }
  
  // If offset is at the very end
  if (content.length > 0) {
    return {
      runIndex: content.length - 1,
      offsetInRun: offset - currentOffset,
    };
  }
  
  return null;
}

/**
 * Convert run index and offset within run to block offset
 */
export function runOffsetToBlockOffset(
  content: InlineContent[],
  runIndex: number,
  offsetInRun: number
): number {
  let blockOffset = 0;
  
  for (let i = 0; i < runIndex && i < content.length; i++) {
    const item = content[i];
    if (item.type === 'text') {
      blockOffset += item.text.length;
    } else if (item.type === 'link') {
      blockOffset += item.text.length;
    } else if (item.type === 'image') {
      blockOffset += 1;
    }
  }
  
  return blockOffset + offsetInRun;
}

