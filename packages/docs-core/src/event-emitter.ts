// Event emitter for document events

import type { DocumentEventData, DocumentEventHandler, DocumentEventType } from './types';

export class DocumentEventEmitter {
  private handlers: Map<DocumentEventType, Set<DocumentEventHandler>> = new Map();
  private batchQueue: DocumentEventData[] = [];
  private isBatching = false;

  on(event: DocumentEventType, handler: DocumentEventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: DocumentEventType, handler: DocumentEventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: DocumentEventType, payload: unknown): void {
    const data: DocumentEventData = { type: event, payload };

    if (this.isBatching) {
      this.batchQueue.push(data);
      return;
    }

    this.dispatch(data);
  }

  private dispatch(data: DocumentEventData): void {
    const handlers = this.handlers.get(data.type);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(data);
        } catch (error) {
          console.error('Error in document event handler:', error);
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

