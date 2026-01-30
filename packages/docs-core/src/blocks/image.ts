// Image block creation and manipulation

import type { ImageBlock, InlineContent, InlineImage } from '../types';
import { generateBlockId, createTextRun } from './utils';

/**
 * Create a new image block
 */
export function createImageBlock(
  src: string,
  width: number,
  height: number,
  options?: {
    alt?: string;
    alignment?: 'left' | 'center' | 'right';
    caption?: InlineContent[];
  }
): ImageBlock {
  return {
    id: generateBlockId(),
    type: 'image',
    src,
    width,
    height,
    alt: options?.alt,
    alignment: options?.alignment || 'center',
    caption: options?.caption,
  };
}

/**
 * Create an image block with a text caption
 */
export function createImageBlockWithCaption(
  src: string,
  width: number,
  height: number,
  caption: string,
  options?: {
    alt?: string;
    alignment?: 'left' | 'center' | 'right';
  }
): ImageBlock {
  return createImageBlock(src, width, height, {
    ...options,
    caption: caption ? [createTextRun(caption)] : undefined,
  });
}

/**
 * Create an inline image
 */
export function createInlineImage(
  src: string,
  width: number,
  height: number,
  alt?: string
): InlineImage {
  return {
    type: 'image',
    src,
    width,
    height,
    alt,
  };
}

/**
 * Resize an image block while maintaining aspect ratio
 */
export function resizeImageBlock(
  image: ImageBlock,
  newWidth?: number,
  newHeight?: number
): ImageBlock {
  const aspectRatio = image.width / image.height;
  
  let finalWidth = image.width;
  let finalHeight = image.height;
  
  if (newWidth !== undefined && newHeight !== undefined) {
    finalWidth = newWidth;
    finalHeight = newHeight;
  } else if (newWidth !== undefined) {
    finalWidth = newWidth;
    finalHeight = newWidth / aspectRatio;
  } else if (newHeight !== undefined) {
    finalHeight = newHeight;
    finalWidth = newHeight * aspectRatio;
  }
  
  return {
    ...image,
    width: Math.round(finalWidth),
    height: Math.round(finalHeight),
  };
}

/**
 * Resize an image block to fit within max dimensions while maintaining aspect ratio
 */
export function fitImageBlock(
  image: ImageBlock,
  maxWidth: number,
  maxHeight: number
): ImageBlock {
  const widthRatio = maxWidth / image.width;
  const heightRatio = maxHeight / image.height;
  const ratio = Math.min(widthRatio, heightRatio, 1); // Don't upscale
  
  return {
    ...image,
    width: Math.round(image.width * ratio),
    height: Math.round(image.height * ratio),
  };
}

/**
 * Set image alignment
 */
export function setImageAlignment(
  image: ImageBlock,
  alignment: 'left' | 'center' | 'right'
): ImageBlock {
  return {
    ...image,
    alignment,
  };
}

/**
 * Set image caption
 */
export function setImageCaption(
  image: ImageBlock,
  caption: InlineContent[]
): ImageBlock {
  return {
    ...image,
    caption,
  };
}

/**
 * Set image alt text
 */
export function setImageAlt(
  image: ImageBlock,
  alt: string
): ImageBlock {
  return {
    ...image,
    alt,
  };
}

