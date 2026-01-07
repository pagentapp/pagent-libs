// Format pool for shared format objects

import type { CellFormat } from './types';

export class FormatPool {
  private formats: Map<string, CellFormat> = new Map();
  private formatToId: Map<string, string> = new Map();
  private nextId = 1;

  getOrCreate(format: CellFormat): string {
    const formatKey = this.getFormatKey(format);
    const existingId = this.formatToId.get(formatKey);
    if (existingId) {
      return existingId;
    }

    const id = `format_${this.nextId++}`;
    this.formats.set(id, format);
    this.formatToId.set(formatKey, id);
    return id;
  }

  get(formatId: string): CellFormat | undefined {
    return this.formats.get(formatId);
  }

  getFormatKey(format: CellFormat): string {
    // Create a deterministic key from format properties
    const keys = Object.keys(format).sort();
    return keys.map((key) => `${key}:${format[key as keyof CellFormat]}`).join('|');
  }

  clear(): void {
    this.formats.clear();
    this.formatToId.clear();
    this.nextId = 1;
  }

  size(): number {
    return this.formats.size;
  }

  getAllFormats(): Map<string, CellFormat> {
    return new Map(this.formats);
  }

  setFormatToId(formatToId: Map<string, string>): void {
    this.formatToId = formatToId;
  }
  setFormats(formats: Map<string, CellFormat>): void {
    this.formats = formats;
  }

  getNextId(): number {
    return this.nextId;
  }

  setNextId(nextId: number): void {
    this.nextId = nextId;
  }
}
