// Style pool for shared style objects

import type { CellStyle } from './types';

export class StylePool {
  private styles: Map<string, CellStyle> = new Map();
  private styleToId: Map<string, string> = new Map();
  private nextId = 1;

  getOrCreate(style: CellStyle): string {
    const styleKey = this.getStyleKey(style);
    const existingId = this.styleToId.get(styleKey);
    if (existingId) {
      return existingId;
    }

    const id = `style_${this.nextId++}`;
    this.styles.set(id, style);
    this.styleToId.set(styleKey, id);
    return id;
  }

  get(styleId: string): CellStyle | undefined {
    return this.styles.get(styleId);
  }

  getStyleKey(style: CellStyle): string {
    // Create a deterministic key from style properties
    const keys = Object.keys(style).sort();
    return keys.map((key) => `${key}:${style[key as keyof CellStyle]}`).join('|');
  }

  clear(): void {
    this.styles.clear();
    this.styleToId.clear();
    this.nextId = 1;
  }

  size(): number {
    return this.styles.size;
  }

  getAllStyles(): Map<string, CellStyle> {
    return new Map(this.styles);
  }

  setStyleToId(styleToId: Map<string, string>): void {
    this.styleToId = styleToId;
  }
  setStyles(styles: Map<string, CellStyle>): void {
    this.styles = styles;
  }

  getNextId(): number {
    return this.nextId;
  }

  setNextId(nextId: number): void {
    this.nextId = nextId;
  }
}

