// Event emitter for workbook events

import type { EventData, EventHandler, EventType } from './types';

export class EventEmitter {
  private handlers: Map<EventType, Set<EventHandler>> = new Map();
  private batchQueue: EventData[] = [];
  private isBatching = false;

  on(event: EventType, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: EventType, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: EventType, payload: unknown): void {
    const data: EventData = { type: event, payload };

    if (this.isBatching) {
      this.batchQueue.push(data);
      return;
    }

    this.dispatch(data);
  }

  private dispatch(data: EventData): void {
    const handlers = this.handlers.get(data.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in event handler:', error);
        }
      }
    }
  }

  batch(operations: () => void): void {
    this.isBatching = true;
    this.batchQueue = [];

    try {
      operations();
    } finally {
      this.isBatching = false;
      const events = [...this.batchQueue];
      this.batchQueue = [];

      // Dispatch all batched events
      for (const event of events) {
        this.dispatch(event);
      }
    }
  }

  clear(): void {
    this.handlers.clear();
    this.batchQueue = [];
  }
}

