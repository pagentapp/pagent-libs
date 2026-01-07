// Generic event emitter for framework-agnostic use

export interface EventData<T extends string = string> {
  type: T;
  payload: unknown;
}

export type EventHandler<T extends string = string> = (data: EventData<T>) => void;

export class EventEmitter<T extends string = string> {
  private handlers: Map<T, Set<EventHandler<T>>> = new Map();
  private batchQueue: EventData<T>[] = [];
  private isBatching = false;

  on(event: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  off(event: T, handler: EventHandler<T>): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: T, payload: unknown): void {
    const data: EventData<T> = { type: event, payload };

    if (this.isBatching) {
      this.batchQueue.push(data);
      return;
    }

    this.dispatch(data);
  }

  private dispatch(data: EventData<T>): void {
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

