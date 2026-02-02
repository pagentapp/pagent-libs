#!/usr/bin/env node
/**
 * Pagent MCP Server
 * 
 * Model Context Protocol server for AI-assisted document and spreadsheet generation.
 * 
 * Tools:
 * - create_document: Returns context for generating valid DocumentData JSON
 * - create_sheet: Returns context for generating valid WorkbookData JSON
 * - validate_document: Validates DocumentData JSON
 * - validate_sheet: Validates WorkbookData JSON
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { createDocument } from './tools/create-document.js';
import { createSheet } from './tools/create-sheet.js';
import { validateDocumentTool } from './tools/validate-document.js';
import { validateSheetTool } from './tools/validate-sheet.js';

// Create server instance
const server = new Server(
  {
    name: 'pagent-mcp-server',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'create_document',
    description: `Returns comprehensive context for generating valid Pagent DocumentData JSON.

This tool provides:
- TypeScript type definitions for all document structures
- Rules and constraints for valid documents
- Multiple examples showing common patterns (headings, lists, tables, styled text)
- Instructions for the generation workflow

Use this before generating a document to understand the required JSON structure.
After generation, use validate_document to verify your output.`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'create_sheet',
    description: `Returns comprehensive context for generating valid Pagent WorkbookData JSON.

This tool provides:
- TypeScript type definitions for all spreadsheet structures
- Rules and constraints for valid workbooks
- Multiple examples showing common patterns (data tables, formulas, styled headers)
- Instructions for the generation workflow

Use this before generating a spreadsheet to understand the required JSON structure.
After generation, use validate_sheet to verify your output.`,
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'validate_document',
    description: `Validates a DocumentData JSON object against the Pagent document schema.

Returns validation results including:
- Whether the document is valid
- List of errors (issues that must be fixed)
- List of warnings (recommendations)
- Actionable suggestions for fixing each issue

Use this after generating document JSON to verify it's correct before use.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        json: {
          type: 'object' as const,
          description: 'The DocumentData JSON object to validate',
        },
        strict: {
          type: 'boolean' as const,
          description: 'If true (default), treat issues as errors. If false, treat as warnings.',
          default: true,
        },
      },
      required: ['json'],
    },
  },
  {
    name: 'validate_sheet',
    description: `Validates a WorkbookData JSON object against the Pagent spreadsheet schema.

Returns validation results including:
- Whether the workbook is valid
- List of errors (issues that must be fixed)
- List of warnings (recommendations)
- Actionable suggestions for fixing each issue

Use this after generating spreadsheet JSON to verify it's correct before use.`,
    inputSchema: {
      type: 'object' as const,
      properties: {
        json: {
          type: 'object' as const,
          description: 'The WorkbookData JSON object to validate',
        },
        strict: {
          type: 'boolean' as const,
          description: 'If true (default), treat issues as errors. If false, treat as warnings.',
          default: true,
        },
      },
      required: ['json'],
    },
  },
];

// Handle list_tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'create_document': {
      const result = createDocument();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'create_sheet': {
      const result = createSheet();
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'validate_document': {
      const input = args as { json: unknown; strict?: boolean };
      const result = validateDocumentTool(input);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    case 'validate_sheet': {
      const input = args as { json: unknown; strict?: boolean };
      const result = validateSheetTool(input);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Pagent MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
