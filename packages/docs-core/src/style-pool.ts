// Style pools for text and paragraph styles

import type { TextStyle, ParagraphStyle, TextStylePool, ParagraphStylePool } from './types';

function generateStyleId(): string {
  return `style_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function hashStyle(style: Record<string, unknown>): string {
  const sortedKeys = Object.keys(style).sort();
  const normalized = sortedKeys
    .filter(key => style[key] !== undefined)
    .map(key => `${key}:${JSON.stringify(style[key])}`)
    .join('|');
  return normalized;
}

export class TextStylePoolImpl implements TextStylePool {
  styles: Map<string, TextStyle> = new Map();
  private hashToId: Map<string, string> = new Map();

  getOrCreate(style: TextStyle): string {
    const hash = hashStyle(style as Record<string, unknown>);
    
    // Check if we already have this exact style
    const existingId = this.hashToId.get(hash);
    if (existingId) {
      return existingId;
    }

    // Create new style
    const id = generateStyleId();
    this.styles.set(id, { ...style });
    this.hashToId.set(hash, id);
    return id;
  }

  get(styleId: string): TextStyle | undefined {
    return this.styles.get(styleId);
  }

  getAllStyles(): Map<string, TextStyle> {
    return new Map(this.styles);
  }

  setFromData(data: Record<string, TextStyle>): void {
    this.styles.clear();
    this.hashToId.clear();
    
    for (const [id, style] of Object.entries(data)) {
      this.styles.set(id, style);
      const hash = hashStyle(style as Record<string, unknown>);
      this.hashToId.set(hash, id);
    }
  }

  toData(): Record<string, TextStyle> {
    const result: Record<string, TextStyle> = {};
    for (const [id, style] of this.styles) {
      result[id] = style;
    }
    return result;
  }
}

export class ParagraphStylePoolImpl implements ParagraphStylePool {
  styles: Map<string, ParagraphStyle> = new Map();
  private hashToId: Map<string, string> = new Map();

  getOrCreate(style: ParagraphStyle): string {
    const hash = hashStyle(style as Record<string, unknown>);
    
    // Check if we already have this exact style
    const existingId = this.hashToId.get(hash);
    if (existingId) {
      return existingId;
    }

    // Create new style
    const id = generateStyleId();
    this.styles.set(id, { ...style });
    this.hashToId.set(hash, id);
    return id;
  }

  get(styleId: string): ParagraphStyle | undefined {
    return this.styles.get(styleId);
  }

  getAllStyles(): Map<string, ParagraphStyle> {
    return new Map(this.styles);
  }

  setFromData(data: Record<string, ParagraphStyle>): void {
    this.styles.clear();
    this.hashToId.clear();
    
    for (const [id, style] of Object.entries(data)) {
      this.styles.set(id, style);
      const hash = hashStyle(style as Record<string, unknown>);
      this.hashToId.set(hash, id);
    }
  }

  toData(): Record<string, ParagraphStyle> {
    const result: Record<string, ParagraphStyle> = {};
    for (const [id, style] of this.styles) {
      result[id] = style;
    }
    return result;
  }
}

