# pagent-libs

High-performance spreadsheet, docs and slides libraries for React, optimized for performance and bundle size.

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

### Key Components

- **`WorkbookImpl`**: The core spreadsheet engine that manages data and state
- **`WorkbookProvider`**: React context provider that manages workbook state
- **`WorkbookCanvas`**: The main UI component that renders the spreadsheet

### Features Included

- ✅ Virtual scrolling for performance
- ✅ Cell editing with keyboard navigation
- ✅ Formula support (when using core features)
- ✅ Customizable dimensions and styling
- ✅ Sparse data storage (only stores non-empty cells)

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

