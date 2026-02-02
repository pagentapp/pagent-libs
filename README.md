# pagent-libs

High-performance, **AI-first** spreadsheet and document libraries for React, optimized for performance and bundle size.

## ✨ AI-First Design

Pagent-libs is built from the ground up with AI agents in mind. Both documents and spreadsheets use **pure JSON** data structures that any LLM can understand and generate:

- **JSON-based storage** - Documents and sheets are simple JSON objects
- **MCP Server included** - Model Context Protocol server for Claude, Cursor, and other AI tools
- **Schema + validation** - AI gets type definitions, rules, and examples to generate valid JSON
- **Framework-agnostic** - The JSON format works anywhere, AI generates the data

This means AI agents can create, modify, and understand your documents and spreadsheets natively.

## Inspiration

For the past decade, I've dreamed of building my own encrypted drive application—primarily for personal use, but one that others could benefit from too. When I finally began development, I discovered a significant gap in the open-source ecosystem: there was no comprehensive library offering full-featured editors for spreadsheets, documents, and presentations.

Existing solutions were either:
- **Heavy and bloated** with unnecessary features
- **Incomplete** supporting only one document type
- **Proprietary or restrictive** with mixed licensing models

This inspired me to create **pagent-libs**—a forever-free, open-source library that delivers the full editing experience you'd expect from commercial suites like Google Workspace or Microsoft Office, but built for developers who value performance, flexibility, and complete control over their tools.

pagentapp.com will be a fully encrypted drive application powered by the pagent-libs editing experience.

Love, B.


## Quick Start

### Installation

Add the packages to your React project:

```bash
npm install @pagent-libs/core @pagent-libs/sheets
```

### Basic Usage - Spreadsheets

Here's how to add a spreadsheet to your React application:

```tsx
import React, { useState } from 'react';
import { WorkbookProvider, WorkbookCanvas } from '@pagent-libs/sheets';
import { WorkbookImpl } from '@pagent-libs/core';

function MySpreadsheet() {
  // 1. Create a workbook instance
  const [workbook] = useState(() => {
    const wb = new WorkbookImpl('my-workbook', 'My Spreadsheet');

    // Optional: Pre-populate with data
    const initialData = {
      id: 'my-workbook',
      name: 'My Spreadsheet',
      activeSheetId: 'sheet_1',
      sheets: [{
        id: 'sheet_1',
        name: 'Sheet1',
        cells: [
          { key: '0:0', cell: { value: 'Hello' } },
          { key: '0:1', cell: { value: 'World' } },
        ],
        config: {
          defaultRowHeight: 20,
          defaultColWidth: 100,
        },
        rowCount: 1000,
        colCount: 100,
      }],
      selection: {
        ranges: [],
        activeCell: { row: 0, col: 0 },
      },
    };

    wb.setData(initialData);
    return wb;
  });

  // Example: Access and save workbook data
  const saveToDb = () => {
    const workbookData = wb.getData();
    // Send to your backend API
    console.log('Saving workbook data:', workbookData);
    // Example: fetch('/api/workbooks', { method: 'POST', body: JSON.stringify(workbookData) })
  };

  return (
    <div style={{ width: '100%', height: '500px' }}>
      <button onClick={saveToDb} style={{ marginBottom: '10px', padding: '8px 16px' }}>
        Save Workbook
      </button>

      {/* 2. Wrap your app with WorkbookProvider */}
      <WorkbookProvider workbook={workbook}>
        {/* 3. Render the WorkbookCanvas component */}
        <WorkbookCanvas
          width={800}
          height={400}
          rowHeight={20}
          colWidth={100}
        />
      </WorkbookProvider>
    </div>
  );
}

export default MySpreadsheet;
```

### Key Components - Sheets

- **`WorkbookImpl`**: The core spreadsheet engine that manages data and state
- **`WorkbookProvider`**: React context provider that manages workbook state
- **`WorkbookCanvas`**: The main UI component that renders the spreadsheet

### Basic Usage - Documents

Here's how to add a document editor to your React application:

```bash
npm install @pagent-libs/docs-core @pagent-libs/docs-react
```

```tsx
import React, { useState } from 'react';
import { DocumentImpl, type DocumentData } from '@pagent-libs/docs-core';
import { DocumentProvider, DocumentEditor } from '@pagent-libs/docs-react';

// Document data in JSON format (can be loaded from backend/database)
const initialDocumentData: DocumentData = {
  id: 'my-document',
  title: 'My Document',
  defaultPageConfig: {
    size: { w: 816, h: 1056 }, // Letter size at 96 DPI
    margins: { top: 96, right: 96, bottom: 96, left: 96 },
    orientation: 'portrait',
  },
  textStylePool: {
    'style_bold': { bold: true },
  },
  paragraphStylePool: {},
  sections: [
    {
      id: 'section_1',
      pageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: 'portrait',
      },
      blocks: [
        {
          id: 'block_1',
          type: 'heading',
          level: 1,
          content: [{ type: 'text', text: 'Welcome to Pagent Docs' }],
        },
        {
          id: 'block_2',
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a ' },
            { type: 'text', text: 'rich text', styleId: 'style_bold' },
            { type: 'text', text: ' document editor.' },
          ],
        },
      ],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function MyDocumentEditor() {
  // 1. Create a document instance and load data
  const [doc] = useState(() => {
    const document = new DocumentImpl();
    document.setData(initialDocumentData);
    return document;
  });

  // Example: Access and save document data
  const saveToDb = () => {
    const documentData = doc.getData();
    // Send to your backend API
    console.log('Saving document data:', documentData);
    // Example: fetch('/api/documents', { method: 'POST', body: JSON.stringify(documentData) })
  };

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <button onClick={saveToDb} style={{ marginBottom: '10px', padding: '8px 16px' }}>
        Save Document
      </button>

      {/* 2. Wrap your app with DocumentProvider */}
      <DocumentProvider document={doc}>
        {/* 3. Render the DocumentEditor component */}
        <DocumentEditor
          showToolbar={true}
          showRuler={true}
        />
      </DocumentProvider>
    </div>
  );
}

export default MyDocumentEditor;
```

### Key Components - Docs

- **`DocumentImpl`**: The core document engine that manages content and state
- **`DocumentProvider`**: React context provider that manages document state
- **`DocumentEditor`**: The main UI component with toolbar, rulers, and paginated editing

### Features Included

**Spreadsheets:**
- ✅ Virtual scrolling for performance
- ✅ Cell editing with keyboard navigation
- ✅ Formula support (100+ functions coming soon)
- ✅ Customizable dimensions and styling
- ✅ Sparse data storage (only stores non-empty cells)

**Documents:**
- ✅ True page layout with line-level pagination
- ✅ Rich text formatting (bold, italic, fonts, colors)
- ✅ Headers & footers with dynamic fields (page numbers, date)
- ✅ Tables with cell formatting
- ✅ Images (block and inline)
- ✅ Undo/redo history

---

## 🤖 AI Integration with MCP Server

Pagent-libs includes an MCP (Model Context Protocol) server that enables AI agents to generate valid documents and spreadsheets.

### What is MCP?

MCP is a protocol that allows AI tools like Claude Desktop, Cursor, and others to interact with external services. The pagent MCP server teaches AI how to generate valid JSON for your documents and sheets.

### Installation

```bash
npm install @pagent-libs/mcp-server
```

### Configure with Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "pagent": {
      "command": "npx",
      "args": ["@pagent-libs/mcp-server"]
    }
  }
}
```

### Configure with Cursor

Add to your Cursor MCP settings:

```json
{
  "mcpServers": {
    "pagent": {
      "command": "npx",
      "args": ["@pagent-libs/mcp-server"]
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `create_document` | Returns TypeScript types, rules, and examples for generating DocumentData JSON |
| `create_sheet` | Returns TypeScript types, rules, and examples for generating WorkbookData JSON |
| `validate_document` | Validates DocumentData JSON and returns errors with suggestions |
| `validate_sheet` | Validates WorkbookData JSON and returns errors with suggestions |

### AI Workflow

```
1. User asks AI to "create a sales report spreadsheet"
2. AI calls create_sheet → receives schema, rules, examples
3. AI generates valid WorkbookData JSON
4. AI calls validate_sheet → confirms JSON is valid
5. AI returns the JSON to user
6. User loads it: workbook.setData(generatedJson)
```

### Example: AI-Generated Document

Ask Claude/Cursor: *"Create a project proposal document with an executive summary, timeline table, and budget section"*

The AI will use the MCP server to:
1. Get the document schema via `create_document`
2. Generate valid JSON with headings, paragraphs, and tables
3. Validate it via `validate_document`
4. Return ready-to-use JSON

```typescript
// Load AI-generated document
const aiGeneratedDoc = /* JSON from AI */;
const doc = new DocumentImpl();
doc.setData(aiGeneratedDoc);
```

### Example: AI-Generated Spreadsheet

Ask Claude/Cursor: *"Create a quarterly sales spreadsheet with product names, Q1-Q4 columns, totals, and styled headers"*

```typescript
// Load AI-generated spreadsheet
const aiGeneratedSheet = /* JSON from AI */;
const workbook = new WorkbookImpl('wb_1', 'Sales');
workbook.setData(aiGeneratedSheet);
```

---

## Development

Help is highly appreciated in improving performance, adding features and also porting to other frontend frameworks.

P.S. I am not a react pro in any way. Any support in improving code is highly welcome. 

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Type check
npm run type-check

# Lint
npm run lint
```

## Packages

| Package | Description |
|---------|-------------|
| `@pagent-libs/docs-core` | Document engine (framework-agnostic) |
| `@pagent-libs/docs-react` | React document editor components |
| `@pagent-libs/sheets-core` | Spreadsheet engine (framework-agnostic) |
| `@pagent-libs/sheets-react` | React spreadsheet components |
| `@pagent-libs/mcp-server` | MCP server for AI integration |
| `@pagent-libs/shared` | Shared utilities |

## Documentation

See the [`documentation/`](./documentation/) folder for detailed guides:

- **[Docs Architecture](./documentation/docs/architecture.md)** - Document editor internals
- **[Docs Components](./documentation/docs/components.md)** - React component reference
- **[Sheets Overview](./documentation/sheets/overview.md)** - Spreadsheet architecture
- **[MCP Server](./packages/mcp-server/README.md)** - AI integration guide

## License

MIT