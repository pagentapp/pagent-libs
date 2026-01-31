// Heading block creation and manipulation

import type { HeadingBlock, HeadingLevel, InlineContent, ParagraphBlock } from '../types';
import { generateBlockId, createTextRun } from './utils';

/**
 * Create a new heading block
 */
export function createHeading(
  level: HeadingLevel,
  content: InlineContent[] = [],
  styleId?: string
): HeadingBlock {
  return {
    id: generateBlockId(),
    type: 'heading',
    level,
    content,
    styleId,
  };
}

/**
 * Create a heading from plain text
 */
export function createHeadingFromText(
  level: HeadingLevel,
  text: string,
  styleId?: string
): HeadingBlock {
  return createHeading(
    level,
    text ? [createTextRun(text)] : [],
    styleId
  );
}

/**
 * Convert a heading to a different level
 */
export function changeHeadingLevel(
  heading: HeadingBlock,
  newLevel: HeadingLevel
): HeadingBlock {
  return {
    ...heading,
    level: newLevel,
  };
}

/**
 * Convert a heading to a paragraph
 */
export function headingToParagraph(heading: HeadingBlock): ParagraphBlock {
  return {
    id: heading.id,
    type: 'paragraph',
    content: [...heading.content],
    styleId: heading.styleId,
  };
}

/**
 * Convert a paragraph to a heading
 */
export function paragraphToHeading(
  paragraph: ParagraphBlock,
  level: HeadingLevel
): HeadingBlock {
  return {
    id: paragraph.id,
    type: 'heading',
    level,
    content: [...paragraph.content],
    styleId: paragraph.styleId,
  };
}

/**
 * Get the default font size for a heading level
 */
export function getHeadingFontSize(level: HeadingLevel): number {
  const sizes: Record<HeadingLevel, number> = {
    1: 24,
    2: 20,
    3: 16,
    4: 14,
    5: 12,
    6: 11,
  };
  return sizes[level];
}

/**
 * Get the default line height multiplier for a heading level
 */
export function getHeadingLineHeight(level: HeadingLevel): number {
  const heights: Record<HeadingLevel, number> = {
    1: 1.2,
    2: 1.25,
    3: 1.3,
    4: 1.35,
    5: 1.4,
    6: 1.4,
  };
  return heights[level];
}

