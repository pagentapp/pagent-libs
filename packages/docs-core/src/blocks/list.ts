// List item block creation and manipulation

import type { ListItemBlock, ListType, InlineContent, ParagraphBlock } from '../types';
import { generateBlockId, createTextRun } from './utils';

/**
 * Create a new list item block
 */
export function createListItem(
  listType: ListType,
  level: number = 0,
  content: InlineContent[] = [],
  styleId?: string
): ListItemBlock {
  return {
    id: generateBlockId(),
    type: 'list-item',
    listType,
    level: Math.max(0, Math.min(8, level)), // Clamp level between 0-8
    content,
    styleId,
  };
}

/**
 * Create a list item from plain text
 */
export function createListItemFromText(
  listType: ListType,
  text: string,
  level: number = 0,
  styleId?: string
): ListItemBlock {
  return createListItem(
    listType,
    level,
    text ? [createTextRun(text)] : [],
    styleId
  );
}

/**
 * Change the list type (bullet/numbered)
 */
export function changeListType(
  listItem: ListItemBlock,
  newType: ListType
): ListItemBlock {
  return {
    ...listItem,
    listType: newType,
  };
}

/**
 * Increase list item indentation level
 */
export function indentListItem(listItem: ListItemBlock): ListItemBlock {
  return {
    ...listItem,
    level: Math.min(8, listItem.level + 1),
  };
}

/**
 * Decrease list item indentation level
 */
export function outdentListItem(listItem: ListItemBlock): ListItemBlock {
  return {
    ...listItem,
    level: Math.max(0, listItem.level - 1),
  };
}

/**
 * Convert a list item to a paragraph
 */
export function listItemToParagraph(listItem: ListItemBlock): ParagraphBlock {
  return {
    id: listItem.id,
    type: 'paragraph',
    content: [...listItem.content],
    styleId: listItem.styleId,
  };
}

/**
 * Convert a paragraph to a list item
 */
export function paragraphToListItem(
  paragraph: ParagraphBlock,
  listType: ListType,
  level: number = 0
): ListItemBlock {
  return {
    id: paragraph.id,
    type: 'list-item',
    listType,
    level,
    content: [...paragraph.content],
    styleId: paragraph.styleId,
  };
}

/**
 * Get bullet character for a given level
 */
export function getBulletChar(level: number): string {
  const bullets = ['•', '◦', '▪', '▫', '‣', '⁃'];
  return bullets[level % bullets.length];
}

/**
 * Get numbering format for a given level
 */
export function getNumberFormat(level: number): 'decimal' | 'alpha' | 'roman' {
  const formats: Array<'decimal' | 'alpha' | 'roman'> = ['decimal', 'alpha', 'roman'];
  return formats[level % formats.length];
}

/**
 * Format a number according to the numbering format
 */
export function formatListNumber(index: number, format: 'decimal' | 'alpha' | 'roman'): string {
  switch (format) {
    case 'decimal':
      return `${index + 1}.`;
    case 'alpha':
      return `${String.fromCharCode(97 + (index % 26))}.`; // a, b, c, ...
    case 'roman':
      return `${toRoman(index + 1)}.`;
    default:
      return `${index + 1}.`;
  }
}

/**
 * Convert number to roman numerals
 */
function toRoman(num: number): string {
  const romanNumerals: [number, string][] = [
    [1000, 'm'],
    [900, 'cm'],
    [500, 'd'],
    [400, 'cd'],
    [100, 'c'],
    [90, 'xc'],
    [50, 'l'],
    [40, 'xl'],
    [10, 'x'],
    [9, 'ix'],
    [5, 'v'],
    [4, 'iv'],
    [1, 'i'],
  ];
  
  let result = '';
  let remaining = num;
  
  for (const [value, numeral] of romanNumerals) {
    while (remaining >= value) {
      result += numeral;
      remaining -= value;
    }
  }
  
  return result;
}

