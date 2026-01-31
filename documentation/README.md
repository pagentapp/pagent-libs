# Pagent-Libs Documentation

Pagent-Libs is a suite of high-performance productivity components for React, providing Google Docs-like document editing and Google Sheets-like spreadsheet functionality.

## Packages

| Package | Description |
|---------|-------------|
| `@pagent-libs/docs-core` | Framework-agnostic document engine |
| `@pagent-libs/docs-react` | React document editor with true page layout |
| `@pagent-libs/sheets-core` | Framework-agnostic spreadsheet engine |
| `@pagent-libs/sheets-react` | React spreadsheet with canvas rendering |
| `@pagent-libs/shared` | Shared utilities and types |

---

## 📄 Document Editor (Docs)

A Google Docs-like document editor with true page-based layout and real-time pagination.

### Documentation

- **[Architecture](docs/architecture.md)** - Core concepts, layout engine, and design principles
- **[Component Reference](docs/components.md)** - Complete guide to React components
- **[Data Structures](docs/data-structures.md)** - Type definitions and interfaces

### Quick Start

```typescript
import { DocumentImpl } from '@pagent-libs/docs-core';
import { DocumentProvider, DocumentEditor } from '@pagent-libs/docs-react';

// Create document
const doc = new DocumentImpl('doc_1', 'My Document');

function App() {
  return (
    <DocumentProvider document={doc}>
      <DocumentEditor showToolbar={true} showRuler={true} />
    </DocumentProvider>
  );
}
```

### Key Features

- **True Page Layout**: Line-level pagination for accurate print preview
- **Rich Text Editing**: Full formatting with ProseMirror-powered editing
- **Headers & Footers**: Dynamic fields (page numbers, date, title)
- **Tables**: Full table support with cell formatting
- **Images**: Block and inline images with resizing
- **Undo/Redo**: Complete history management

---

## 📊 Spreadsheet (Sheets)

A Google Sheets-like spreadsheet with high-performance canvas rendering.

### Documentation

- **[Overview](sheets/overview.md)** - High-level architecture and design principles
- **[Core Architecture](sheets/core/architecture.md)** - Workbook, Sheet models, sparse storage
- **[Rendering System](sheets/core/rendering.md)** - Canvas rendering, viewport optimization
- **[Formula Engine](sheets/core/formulas.md)** - Formula parser, dependency graph
- **[Features](sheets/core/features.md)** - Sorting, filtering, freeze panes
- **[Collaboration](sheets/core/collaboration.md)** - Real-time multi-user editing
- **[React Components](sheets/architecture.md)** - Component architecture
- **[Component Reference](sheets/components.md)** - All React components
- **[Data Structures](sheets/data-structures.md)** - Type definitions

### Quick Start

```typescript
import { WorkbookImpl } from '@pagent-libs/sheets-core';
import { WorkbookProvider, WorkbookCanvas } from '@pagent-libs/sheets-react';

// Create workbook
const workbook = new WorkbookImpl('workbook_1', 'My Workbook');

function App() {
  return (
    <WorkbookProvider workbook={workbook}>
      <WorkbookCanvas width={800} height={600} />
    </WorkbookProvider>
  );
}
```

### Key Features

- **Canvas Rendering**: 60fps performance for large datasets
- **Formula Engine**: 100+ functions with dependency tracking
- **Sparse Storage**: Efficient memory usage
- **Freeze Panes**: Lock rows/columns while scrolling
- **Sorting & Filtering**: Column operations
- **CSV Export/Import**: Data interchange

---

## Architecture Overview

```
pagent-libs/
├── packages/
│   ├── docs-core/          # Document engine
│   │   ├── document.ts     # Document model
│   │   ├── blocks/         # Block types
│   │   └── prosemirror/    # PM integration
│   │
│   ├── docs-react/         # Document React components
│   │   ├── components/     # UI components
│   │   ├── context/        # React context
│   │   └── core/           # Layout engine
│   │
│   ├── sheets-core/        # Spreadsheet engine
│   │   ├── workbook.ts     # Workbook model
│   │   ├── canvas/         # Rendering
│   │   └── formula-parser/ # Formulas
│   │
│   ├── sheets-react/       # Spreadsheet React components
│   │   ├── components/     # UI components
│   │   └── context/        # React context
│   │
│   └── shared/             # Shared utilities
│
├── examples/
│   ├── docs-demo/          # Document editor demo
│   └── sheets-demo/        # Spreadsheet demo
│
└── documentation/          # This documentation
    ├── docs/               # Document editor docs
    └── sheets/             # Spreadsheet docs
```

---

## Design Principles

### Performance-First
- Canvas rendering for spreadsheets at 60fps
- Virtual rendering for documents
- Sparse storage for memory efficiency

### Framework-Agnostic Core
- Core packages work without React
- Easy to port to Vue, Angular, etc.
- Clear separation of concerns

### Type Safety
- Full TypeScript with strict mode
- Comprehensive type definitions
- No `any` types

### Extensibility
- Plugin architecture
- Custom block types
- Custom formula functions

---

## Development Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Type checking
npm run type-check

# Start dev server
npm run dev
```

---

## Examples

- **[Docs Demo](../examples/docs-demo/)** - Complete document editor
- **[Sheets Demo](../examples/sheets-demo/)** - Complete spreadsheet

---

## Contributing

- **[Extending the Library](sheets/contributing/extending.md)** - Add new features

---

**Last Updated**: January 2026  
**Version**: 0.1.0
