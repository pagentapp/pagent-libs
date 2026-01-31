// Paragraph block creation and manipulation

import type { ParagraphBlock, InlineContent, TextRun } from '../types';
import { generateBlockId, createTextRun } from './utils';

/**
 * Create a new paragraph block
 */
export function createParagraph(
  content: InlineContent[] = [],
  styleId?: string
): ParagraphBlock {
  return {
    id: generateBlockId(),
    type: 'paragraph',
    content,
    styleId,
  };
}

/**
 * Create a paragraph from plain text
 */
export function createParagraphFromText(text: string, styleId?: string): ParagraphBlock {
  return createParagraph(
    text ? [createTextRun(text)] : [],
    styleId
  );
}

/**
 * Insert text into a paragraph at a given offset
 */
export function insertTextIntoParagraph(
  paragraph: ParagraphBlock,
  text: string,
  offset: number,
  textStyleId?: string
): ParagraphBlock {
  const newContent = [...paragraph.content];
  let currentOffset = 0;
  
  for (let i = 0; i < newContent.length; i++) {
    const item = newContent[i];
    
    if (item.type === 'text') {
      const itemLength = item.text.length;
      
      if (offset >= currentOffset && offset <= currentOffset + itemLength) {
        const splitPoint = offset - currentOffset;
        const before = item.text.substring(0, splitPoint);
        const after = item.text.substring(splitPoint);
        
        // If inserting with same style, just concatenate
        if (item.styleId === textStyleId) {
          newContent[i] = { ...item, text: before + text + after };
        } else {
          // Need to split and insert new run
          const newRuns: InlineContent[] = [];
          if (before) {
            newRuns.push({ ...item, text: before });
          }
          newRuns.push(createTextRun(text, textStyleId));
          if (after) {
            newRuns.push({ ...item, text: after });
          }
          newContent.splice(i, 1, ...newRuns);
        }
        
        return { ...paragraph, content: newContent };
      }
      
      currentOffset += itemLength;
    } else if (item.type === 'link') {
      currentOffset += item.text.length;
    } else if (item.type === 'image') {
      currentOffset += 1;
    }
  }
  
  // Append at the end
  const lastItem = newContent[newContent.length - 1];
  if (lastItem && lastItem.type === 'text' && lastItem.styleId === textStyleId) {
    newContent[newContent.length - 1] = { ...lastItem, text: lastItem.text + text };
  } else {
    newContent.push(createTextRun(text, textStyleId));
  }
  
  return { ...paragraph, content: newContent };
}

/**
 * Delete text from a paragraph between two offsets
 */
export function deleteTextFromParagraph(
  paragraph: ParagraphBlock,
  startOffset: number,
  endOffset: number
): ParagraphBlock {
  if (startOffset >= endOffset) {
    return paragraph;
  }
  
  const newContent: InlineContent[] = [];
  let currentOffset = 0;
  
  for (const item of paragraph.content) {
    let itemLength = 0;
    
    if (item.type === 'text') {
      itemLength = item.text.length;
    } else if (item.type === 'link') {
      itemLength = item.text.length;
    } else if (item.type === 'image') {
      itemLength = 1;
    }
    
    const itemStart = currentOffset;
    const itemEnd = currentOffset + itemLength;
    
    // Completely before deletion range
    if (itemEnd <= startOffset) {
      newContent.push({ ...item });
    }
    // Completely after deletion range
    else if (itemStart >= endOffset) {
      newContent.push({ ...item });
    }
    // Partially or fully within deletion range
    else {
      if (item.type === 'text' || item.type === 'link') {
        const textItem = item as TextRun;
        const keepBefore = Math.max(0, startOffset - itemStart);
        const keepAfter = Math.max(0, itemEnd - endOffset);
        
        const newText = textItem.text.substring(0, keepBefore) + 
                       textItem.text.substring(textItem.text.length - keepAfter);
        
        if (newText.length > 0) {
          newContent.push({ ...textItem, text: newText });
        }
      }
      // For images, if any part is in deletion range, delete the whole thing
    }
    
    currentOffset += itemLength;
  }
  
  return { ...paragraph, content: newContent };
}

/**
 * Apply a style to a range of text in a paragraph
 */
export function applyStyleToParagraph(
  paragraph: ParagraphBlock,
  startOffset: number,
  endOffset: number,
  styleId: string
): ParagraphBlock {
  if (startOffset >= endOffset) {
    return paragraph;
  }
  
  const newContent: InlineContent[] = [];
  let currentOffset = 0;
  
  for (const item of paragraph.content) {
    if (item.type !== 'text') {
      newContent.push({ ...item });
      if (item.type === 'link') {
        currentOffset += item.text.length;
      } else if (item.type === 'image') {
        currentOffset += 1;
      }
      continue;
    }
    
    const itemLength = item.text.length;
    const itemStart = currentOffset;
    const itemEnd = currentOffset + itemLength;
    
    // Completely before style range
    if (itemEnd <= startOffset || itemStart >= endOffset) {
      newContent.push({ ...item });
    }
    // Completely within style range
    else if (itemStart >= startOffset && itemEnd <= endOffset) {
      newContent.push({ ...item, styleId });
    }
    // Partially overlapping
    else {
      const overlapStart = Math.max(startOffset, itemStart);
      const overlapEnd = Math.min(endOffset, itemEnd);
      
      // Before overlap
      if (itemStart < overlapStart) {
        newContent.push({
          ...item,
          text: item.text.substring(0, overlapStart - itemStart),
        });
      }
      
      // Overlap (styled)
      newContent.push({
        ...item,
        text: item.text.substring(overlapStart - itemStart, overlapEnd - itemStart),
        styleId,
      });
      
      // After overlap
      if (itemEnd > overlapEnd) {
        newContent.push({
          ...item,
          text: item.text.substring(overlapEnd - itemStart),
        });
      }
    }
    
    currentOffset += itemLength;
  }
  
  return { ...paragraph, content: newContent };
}

