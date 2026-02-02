/**
 * Document context for AI generation
 * Provides TypeScript types, rules, and examples for generating valid DocumentData JSON
 */

export const DOCUMENT_TYPES = `
// ============================================================================
// DocumentData - Root structure for pagent documents
// ============================================================================

interface DocumentData {
  id: string;                              // Unique document identifier
  title: string;                           // Document title
  defaultPageConfig: PageConfig;           // Default page settings
  textStylePool: Record<string, TextStyle>;      // Shared text styles (deduplicated)
  paragraphStylePool: Record<string, ParagraphStyle>; // Shared paragraph styles
  sections: SectionData[];                 // Document sections
  createdAt?: string;                      // ISO date string
  updatedAt?: string;                      // ISO date string
}

// ============================================================================
// Page Configuration
// ============================================================================

interface PageConfig {
  size: { w: number; h: number };          // Width and height in pixels (96 DPI)
  margins: PageMargins;
  orientation: 'portrait' | 'landscape';
}

interface PageMargins {
  top: number;      // Pixels from top edge
  right: number;
  bottom: number;
  left: number;
  header?: number;  // Header area offset (default: 48)
  footer?: number;  // Footer area offset (default: 48)
}

// Standard page sizes at 96 DPI:
// LETTER: { w: 816, h: 1056 }  - 8.5" x 11"
// A4:     { w: 794, h: 1123 }  - 210mm x 297mm
// LEGAL:  { w: 816, h: 1344 }  - 8.5" x 14"

// ============================================================================
// Sections
// ============================================================================

interface SectionData {
  id: string;                              // Unique section ID
  pageConfig: PageConfig;                  // Page settings for this section
  blocks: Block[];                         // Content blocks
  header?: HeaderFooterContent;            // Optional header
  footer?: HeaderFooterContent;            // Optional footer
}

// ============================================================================
// Block Types
// ============================================================================

type Block = 
  | ParagraphBlock 
  | HeadingBlock 
  | ListItemBlock 
  | TableBlock 
  | ImageBlock 
  | HorizontalRuleBlock 
  | PageBreakBlock;

interface ParagraphBlock {
  id: string;                              // Unique block ID (e.g., "block_1")
  type: 'paragraph';
  content: InlineContent[];                // Text runs and inline elements
  alignment?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;                         // Left indent in pixels
  lineSpacing?: LineSpacing;
  spaceBefore?: number;                    // Space before in pixels
  spaceAfter?: number;                     // Space after in pixels
}

interface HeadingBlock {
  id: string;
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;           // Heading level
  content: InlineContent[];
  alignment?: 'left' | 'center' | 'right';
}

interface ListItemBlock {
  id: string;
  type: 'list-item';
  listType: 'bullet' | 'numbered';         // List style
  level: number;                           // Nesting level (0 = top level)
  content: InlineContent[];
}

interface TableBlock {
  id: string;
  type: 'table';
  rows: TableRow[];
  colWidths?: number[];                    // Column widths in pixels
}

interface TableRow {
  id: string;                              // Unique row ID
  cells: TableCell[];
  height?: number;                         // Row height in pixels
}

interface TableCell {
  id: string;                              // Unique cell ID
  content: InlineContent[];
  colspan?: number;                        // Column span (default: 1)
  rowspan?: number;                        // Row span (default: 1)
}

interface ImageBlock {
  id: string;
  type: 'image';
  src: string;                             // Image URL or data URI
  width: number;                           // Width in pixels
  height: number;                          // Height in pixels
  alt?: string;                            // Alt text
  alignment?: 'left' | 'center' | 'right';
}

interface HorizontalRuleBlock {
  id: string;
  type: 'horizontal-rule';
}

interface PageBreakBlock {
  id: string;
  type: 'page-break';
}

// ============================================================================
// Inline Content (within blocks)
// ============================================================================

type InlineContent = TextRun | InlineImage | InlineLink;

interface TextRun {
  type: 'text';
  text: string;                            // The text content
  styleId?: string;                        // Reference to textStylePool
  // OR inline styles (when not using styleId):
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  superscript?: boolean;
  subscript?: boolean;
  fontFamily?: string;
  fontSize?: number;
  color?: string;                          // Hex color (e.g., "#FF0000")
  backgroundColor?: string;                // Highlight color
}

interface InlineImage {
  type: 'image';
  src: string;
  width: number;
  height: number;
  alt?: string;
}

interface InlineLink {
  type: 'link';
  text: string;
  href: string;
}

// ============================================================================
// Text and Paragraph Styles
// ============================================================================

interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontFamily?: string;                     // e.g., "Arial", "Times New Roman"
  fontSize?: number;                       // In points (e.g., 11, 12, 14)
  color?: string;                          // Hex color
  backgroundColor?: string;                // Highlight color
  superscript?: boolean;
  subscript?: boolean;
}

interface ParagraphStyle {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  lineSpacing?: LineSpacing;
  spaceBefore?: number;
  spaceAfter?: number;
  firstLineIndent?: number;
  leftIndent?: number;
  rightIndent?: number;
}

interface LineSpacing {
  type: 'single' | 'onePointFive' | 'double' | 'atLeast' | 'exactly' | 'multiple';
  value?: number;                          // Used with atLeast, exactly, multiple
}

// ============================================================================
// Headers and Footers
// ============================================================================

interface HeaderFooterContent {
  blocks: HeaderFooterParagraph[];
  differentFirstPage?: boolean;            // Use different content on first page
  firstPageBlocks?: HeaderFooterParagraph[];
}

interface HeaderFooterParagraph {
  type: 'paragraph';
  content: HeaderFooterInlineContent[];
  alignment?: 'left' | 'center' | 'right';
}

type HeaderFooterInlineContent = HeaderFooterTextRun | DynamicFieldRun;

interface HeaderFooterTextRun {
  type: 'text';
  text: string;
  bold?: boolean;
  italic?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

interface DynamicFieldRun {
  type: 'dynamicField';
  fieldType: 'pageNumber' | 'totalPages' | 'date' | 'time' | 'title';
}
`;

export const DOCUMENT_RULES = [
  "Every block must have a unique 'id' field. Use pattern: block_1, block_2, block_3, etc.",
  "Every section must have a unique 'id' field. Use pattern: section_1, section_2, etc.",
  "Table rows need unique IDs (row_1, row_2) and cells need unique IDs (cell_1_1, cell_1_2).",
  "When using styleId in content, that styleId MUST exist in textStylePool.",
  "Content arrays contain TextRun objects. Even empty paragraphs should have: content: []",
  "Page sizes are in pixels at 96 DPI. Letter size is { w: 816, h: 1056 }.",
  "Margins are in pixels. 1 inch = 96 pixels.",
  "For lists, consecutive list-item blocks with same listType form a single list.",
  "List level starts at 0 (top level). Increment for nested items.",
  "Colors use hex format: '#FF0000' for red, '#000000' for black.",
  "Font sizes are in points (pt), not pixels. Common sizes: 11, 12, 14, 16, 18, 24.",
];

export const DOCUMENT_EXAMPLES = [
  {
    description: "Simple document with heading and paragraph",
    json: {
      id: "doc_example_1",
      title: "Simple Document",
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: "portrait"
      },
      textStylePool: {},
      paragraphStylePool: {},
      sections: [
        {
          id: "section_1",
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: "portrait"
          },
          blocks: [
            {
              id: "block_1",
              type: "heading",
              level: 1,
              content: [{ type: "text", text: "Welcome" }]
            },
            {
              id: "block_2",
              type: "paragraph",
              content: [{ type: "text", text: "This is a simple paragraph." }]
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  },
  {
    description: "Document with styled text using textStylePool",
    json: {
      id: "doc_example_2",
      title: "Styled Document",
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: "portrait"
      },
      textStylePool: {
        "style_bold": { bold: true },
        "style_italic": { italic: true },
        "style_code": { fontFamily: "monospace", backgroundColor: "#f5f5f5" },
        "style_highlight": { backgroundColor: "#fff3cd" }
      },
      paragraphStylePool: {},
      sections: [
        {
          id: "section_1",
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: "portrait"
          },
          blocks: [
            {
              id: "block_1",
              type: "heading",
              level: 1,
              content: [{ type: "text", text: "Formatting Demo" }]
            },
            {
              id: "block_2",
              type: "paragraph",
              content: [
                { type: "text", text: "This text is " },
                { type: "text", text: "bold", styleId: "style_bold" },
                { type: "text", text: " and this is " },
                { type: "text", text: "italic", styleId: "style_italic" },
                { type: "text", text: "." }
              ]
            },
            {
              id: "block_3",
              type: "paragraph",
              content: [
                { type: "text", text: "Here is some " },
                { type: "text", text: "inline code", styleId: "style_code" },
                { type: "text", text: " in a sentence." }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    description: "Document with bullet list",
    json: {
      id: "doc_example_3",
      title: "List Document",
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: "portrait"
      },
      textStylePool: {},
      paragraphStylePool: {},
      sections: [
        {
          id: "section_1",
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: "portrait"
          },
          blocks: [
            {
              id: "block_1",
              type: "heading",
              level: 2,
              content: [{ type: "text", text: "Features" }]
            },
            {
              id: "block_2",
              type: "list-item",
              listType: "bullet",
              level: 0,
              content: [{ type: "text", text: "First feature" }]
            },
            {
              id: "block_3",
              type: "list-item",
              listType: "bullet",
              level: 0,
              content: [{ type: "text", text: "Second feature" }]
            },
            {
              id: "block_4",
              type: "list-item",
              listType: "bullet",
              level: 1,
              content: [{ type: "text", text: "Nested item under second" }]
            },
            {
              id: "block_5",
              type: "list-item",
              listType: "bullet",
              level: 0,
              content: [{ type: "text", text: "Third feature" }]
            }
          ]
        }
      ]
    }
  },
  {
    description: "Document with table",
    json: {
      id: "doc_example_4",
      title: "Table Document",
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96 },
        orientation: "portrait"
      },
      textStylePool: {
        "style_bold": { bold: true }
      },
      paragraphStylePool: {},
      sections: [
        {
          id: "section_1",
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96 },
            orientation: "portrait"
          },
          blocks: [
            {
              id: "block_1",
              type: "heading",
              level: 2,
              content: [{ type: "text", text: "Price List" }]
            },
            {
              id: "block_2",
              type: "table",
              rows: [
                {
                  id: "row_1",
                  cells: [
                    { id: "cell_1_1", content: [{ type: "text", text: "Item", styleId: "style_bold" }] },
                    { id: "cell_1_2", content: [{ type: "text", text: "Price", styleId: "style_bold" }] }
                  ]
                },
                {
                  id: "row_2",
                  cells: [
                    { id: "cell_2_1", content: [{ type: "text", text: "Widget A" }] },
                    { id: "cell_2_2", content: [{ type: "text", text: "$10.00" }] }
                  ]
                },
                {
                  id: "row_3",
                  cells: [
                    { id: "cell_3_1", content: [{ type: "text", text: "Widget B" }] },
                    { id: "cell_3_2", content: [{ type: "text", text: "$25.00" }] }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  },
  {
    description: "Document with header and footer",
    json: {
      id: "doc_example_5",
      title: "Document with Header/Footer",
      defaultPageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96, header: 48, footer: 48 },
        orientation: "portrait"
      },
      textStylePool: {},
      paragraphStylePool: {},
      sections: [
        {
          id: "section_1",
          pageConfig: {
            size: { w: 816, h: 1056 },
            margins: { top: 96, right: 96, bottom: 96, left: 96, header: 48, footer: 48 },
            orientation: "portrait"
          },
          header: {
            blocks: [
              {
                type: "paragraph",
                alignment: "left",
                content: [{ type: "dynamicField", fieldType: "title" }]
              }
            ],
            differentFirstPage: true,
            firstPageBlocks: []
          },
          footer: {
            blocks: [
              {
                type: "paragraph",
                alignment: "center",
                content: [
                  { type: "text", text: "Page " },
                  { type: "dynamicField", fieldType: "pageNumber" },
                  { type: "text", text: " of " },
                  { type: "dynamicField", fieldType: "totalPages" }
                ]
              }
            ]
          },
          blocks: [
            {
              id: "block_1",
              type: "heading",
              level: 1,
              content: [{ type: "text", text: "Chapter 1" }]
            },
            {
              id: "block_2",
              type: "paragraph",
              content: [{ type: "text", text: "This document has a header showing the title and a footer with page numbers." }]
            }
          ]
        }
      ]
    }
  }
];

export function getDocumentContext() {
  return {
    types: DOCUMENT_TYPES,
    rules: DOCUMENT_RULES,
    examples: DOCUMENT_EXAMPLES,
    version: "1.0.0"
  };
}
