# Pagent-Libs Documentation

## Table of Contents

### Getting Started

- **[Overview](overview.md)** - High-level architecture and design principles

### Core Package

The framework-agnostic core that implements spreadsheet functionality:

- **[Core Architecture](core/architecture.md)** - Workbook, Sheet models, sparse storage, event system
- **[Rendering System](core/rendering.md)** - Canvas-based rendering, viewport optimization, freeze panes
- **[Formula Engine](core/formulas.md)** - Formula parser, dependency graph, incremental recalculation
- **[Features](core/features.md)** - Sorting, filtering, freeze panes, export functionality
- **[Collaboration](core/collaboration.md)** - Real-time multi-user editing and presence

### React Components

UI components that provide the spreadsheet interface:

- **[Sheets Architecture](sheets/architecture.md)** - React component architecture and state management
- **[Component Reference](sheets/components.md)** - Complete guide to all React components

### Development

Resources for contributors and developers:

- **[Data Structures](data-structures.md)** - Complete type definitions and interfaces
- **[Extending the Library](contributing/extending.md)** - Guide for adding new features and functionality

## Architecture Overview

Pagent-libs follows a modular architecture with clear separation of concerns:

```
pagent-libs/
├── core/                    # Framework-agnostic business logic
│   ├── workbook.ts         # Main data model
│   ├── canvas/             # Rendering system
│   ├── formula-parser/     # Formula engine
│   ├── features/           # Advanced features
│   └── collaboration/      # Real-time sync
└── sheets/                 # React components
    ├── components/         # UI components
    └── context/            # State management
```

### Key Design Principles

- **Performance-First**: Optimized for large spreadsheets with smooth 60fps rendering
- **Framework-Agnostic Core**: Business logic works without React dependencies
- **Modular Architecture**: Clean separation between data, rendering, and UI
- **Type Safety**: Full TypeScript coverage with strict mode
- **Extensible**: Clear APIs for adding new features and functionality

## Quick Start

### Basic Usage

```typescript
import { WorkbookImpl } from '@pagent-libs/core';
import { WorkbookProvider, WorkbookCanvas } from '@pagent-libs/sheets';

// Create workbook
const workbook = new WorkbookImpl('workbook_1', 'My Workbook');

// Use in React
function App() {
  return (
    <WorkbookProvider workbook={workbook}>
      <WorkbookCanvas width={800} height={600} />
    </WorkbookProvider>
  );
}
```

### Advanced Features

```typescript
// Add formulas
workbook.setCellValue(undefined, 0, 2, '=SUM(A1:B1)');

// Apply sorting
workbook.setSortOrder([{ column: 0, direction: 'asc' }]);

// Enable collaboration
workbook.setCollaborationProvider(new FirebaseCollaborationProvider(config));

// Export data
const csvData = workbook.exportToCSV();
```

## Performance Characteristics

- **Rendering**: < 16ms for 10k cells at 60fps
- **Memory**: < 50MB for 10k cells with sparse storage
- **Bundle Size**: < 200KB gzipped with tree shaking
- **Formula Calculation**: < 100ms for complex dependency graphs

## API Reference

### Core Classes

- **`WorkbookImpl`** - Main spreadsheet document
- **`SheetImpl`** - Individual worksheet
- **`CanvasRenderer`** - High-performance rendering engine
- **`FormulaParser`** - Expression parsing and evaluation
- **`SortManager`** - Column sorting functionality
- **`FilterManager`** - Data filtering operations

### React Components

- **`WorkbookCanvas`** - Main spreadsheet component
- **`CanvasGrid`** - Low-level canvas grid
- **`EditOverlay`** - Cell editing interface
- **`Toolbar`** - Formatting and action controls
- **`FormulaBar`** - Formula input and display
- **`SheetTabs`** - Sheet navigation

### Key Interfaces

- **`Workbook`** - Spreadsheet document API
- **`Sheet`** - Worksheet API
- **`Cell`** - Individual cell data structure
- **`CellStyle`** - Visual formatting options
- **`CellFormat`** - Number/text formatting rules
- **`Selection`** - User selection state

## Contributing

We welcome contributions! See the [extending guide](contributing/extending.md) for information on:

- Adding new formula functions
- Implementing custom export formats
- Creating new collaboration providers
- Extending the rendering system
- Adding new React components

### Development Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Type checking
npm run type-check
```

## Examples

Check out the examples directory for complete usage examples:

- **[Sheets Demo](../examples/sheets-demo/)** - Complete spreadsheet application
- **[Custom Components](../examples/custom-components/)** - Extending with custom UI
- **[Advanced Features](../examples/advanced-features/)** - Sorting, filtering, collaboration

## License

This documentation covers the pagent-libs library. See the main repository for licensing information.

## Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Ask questions and share ideas
- **Documentation**: This documentation is continuously updated

---

**Last Updated**: January 2026
**Version**: 0.1.0
