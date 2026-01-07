// Collaboration types

export interface Presence {
  userId: string;
  username: string;
  color: string;
  selection?: {
    row: number;
    col: number;
  };
  cursor?: {
    row: number;
    col: number;
  };
}

export interface CollaborationOperation {
  type: 'cellChange' | 'selectionChange' | 'sheetChange';
  sheetId: string;
  row?: number;
  col?: number;
  value?: unknown;
  selection?: {
    row: number;
    col: number;
  };
  timestamp: number;
  userId: string;
}

export interface CollaborationProvider {
  connect(workbookId: string): Promise<void>;
  disconnect(): void;
  on(event: 'change' | 'presence' | 'cursor', handler: (data: unknown) => void): () => void;
  emit(event: 'change' | 'presence' | 'cursor', data: unknown): void;
  getPresences(): Presence[];
}

