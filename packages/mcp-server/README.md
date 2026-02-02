# @pagent-libs/mcp-server

Model Context Protocol (MCP) server for AI-assisted document and spreadsheet generation with pagent-libs.

## Overview

This MCP server enables AI agents (Claude, GPT, etc.) to generate valid JSON for pagent-libs documents and spreadsheets. It provides:

1. **Context tools** - Return schema definitions, rules, and examples for AI to learn the JSON format
2. **Validation tools** - Verify AI-generated JSON before use

## Tools

### `create_document`

Returns comprehensive context for generating valid `DocumentData` JSON:
- TypeScript type definitions
- Validation rules
- Multiple examples (headings, lists, tables, styled text)
- Generation instructions

### `create_sheet`

Returns comprehensive context for generating valid `WorkbookData` JSON:
- TypeScript type definitions
- Validation rules
- Multiple examples (data tables, formulas, styled headers)
- Generation instructions

### `validate_document`

Validates a `DocumentData` JSON object:

```json
{
  "json": { ... },
  "strict": true
}
```

Returns:
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "summary": "Document is valid and ready to use."
}
```

### `validate_sheet`

Validates a `WorkbookData` JSON object:

```json
{
  "json": { ... },
  "strict": true
}
```

Returns validation results with errors, warnings, and suggestions.

## Installation

```bash
npm install @pagent-libs/mcp-server
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

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

### With Cursor

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

### Running Directly

```bash
# Build
npm run build

# Run
node dist/index.js
```

## AI Workflow

1. **Get Context**: Call `create_document` or `create_sheet` to get schema/rules/examples
2. **Generate JSON**: Based on user request and context, generate valid JSON
3. **Validate**: Call `validate_document` or `validate_sheet` to check for errors
4. **Fix Issues**: If validation fails, fix errors based on suggestions
5. **Return JSON**: Provide the valid JSON to the user

## Example: Generating a Document

AI calls `create_document` → receives context → generates:

```json
{
  "id": "doc_1",
  "title": "Project Proposal",
  "defaultPageConfig": {
    "size": { "w": 816, "h": 1056 },
    "margins": { "top": 96, "right": 96, "bottom": 96, "left": 96 },
    "orientation": "portrait"
  },
  "textStylePool": {
    "style_bold": { "bold": true }
  },
  "paragraphStylePool": {},
  "sections": [
    {
      "id": "section_1",
      "pageConfig": { ... },
      "blocks": [
        {
          "id": "block_1",
          "type": "heading",
          "level": 1,
          "content": [{ "type": "text", "text": "Project Proposal" }]
        },
        {
          "id": "block_2",
          "type": "paragraph",
          "content": [
            { "type": "text", "text": "This proposal outlines..." }
          ]
        }
      ]
    }
  ]
}
```

AI calls `validate_document` → confirms valid → returns to user.

## Example: Generating a Spreadsheet

AI calls `create_sheet` → receives context → generates:

```json
{
  "id": "workbook_1",
  "name": "Sales Report",
  "activeSheetId": "sheet_1",
  "defaultRowHeight": 20,
  "defaultColWidth": 100,
  "stylePool": {
    "style_header": { "bold": true, "backgroundColor": "#4472C4", "fontColor": "#FFFFFF" }
  },
  "sheets": [
    {
      "id": "sheet_1",
      "name": "Q1 Sales",
      "cells": [
        { "key": "0:0", "cell": { "value": "Product", "styleId": "style_header" } },
        { "key": "0:1", "cell": { "value": "Revenue", "styleId": "style_header" } },
        { "key": "1:0", "cell": { "value": "Widget A" } },
        { "key": "1:1", "cell": { "value": 50000 } }
      ],
      "config": {},
      "rowCount": 1000,
      "colCount": 100
    }
  ]
}
```

## Strict vs Non-Strict Validation

- **strict: true** (default): Issues are reported as errors, validation fails
- **strict: false**: Issues are reported as warnings, validation passes

Use non-strict mode for lenient validation when minor issues are acceptable.

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Type check
npm run type-check
```

## License

MIT
