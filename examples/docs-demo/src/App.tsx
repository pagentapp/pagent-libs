import { useState, useEffect } from 'react';
import { DocumentProvider, DocumentEditor } from '@pagent-libs/docs-react';
import { DocumentImpl, type DocumentData, type HeaderFooterContent } from '@pagent-libs/docs-core';
import './App.css';

// Sample header configuration with document title
const sampleHeader: HeaderFooterContent = {
  blocks: [
    {
      type: 'paragraph',
      alignment: 'left',
      content: [
        { type: 'dynamicField', fieldType: 'title' },
      ],
    },
  ],
  differentFirstPage: true,
  firstPageBlocks: [], // No header on first page
};

// Sample footer configuration with page numbers
const sampleFooter: HeaderFooterContent = {
  blocks: [
    {
      type: 'paragraph',
      alignment: 'center',
      content: [
        { type: 'text', text: 'Page ' },
        { type: 'dynamicField', fieldType: 'pageNumber' },
        { type: 'text', text: ' of ' },
        { type: 'dynamicField', fieldType: 'totalPages' },
      ],
    },
  ],
};

// Sample document data in our JSON format
// This demonstrates how to load a document from a backend/database
const sampleDocumentData: DocumentData = {
  id: 'demo-document',
  title: 'Demo Document',
  defaultPageConfig: {
    size: { w: 816, h: 1056 },
    margins: { top: 96, right: 96, bottom: 96, left: 96, header: 48, footer: 48 },
    orientation: 'portrait',
  },
  // Style pool for efficient storage - same styles are deduplicated
  textStylePool: {
    'style_bold': { bold: true },
    'style_italic': { italic: true },
    'style_code': { fontFamily: 'monospace', backgroundColor: '#f5f5f5' },
    'style_highlight': { backgroundColor: '#fff3cd' },
    'style_link_style': { color: '#0066cc', underline: true },
  },
  paragraphStylePool: {},
  sections: [
    {
      id: 'section_main',
      pageConfig: {
        size: { w: 816, h: 1056 },
        margins: { top: 96, right: 96, bottom: 96, left: 96, header: 48, footer: 48 },
        orientation: 'portrait',
      },
      // Header and footer are part of the section data
      header: sampleHeader,
      footer: sampleFooter,
      blocks: [
        // Heading 1 - centered
        {
          id: 'block_1',
          type: 'heading',
          level: 1,
          alignment: 'center',
          content: [{ type: 'text', text: 'Welcome to Pagent Docs' }],
        },
        // Intro paragraph with mixed styling
        {
          id: 'block_2',
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a demonstration of the ' },
            { type: 'text', text: 'pagent-docs', styleId: 'style_code' },
            { type: 'text', text: ' document editor library. It provides a ' },
            { type: 'text', text: 'rich text editing', styleId: 'style_bold' },
            { type: 'text', text: ' experience similar to Google Docs.' },
          ],
        },
        // Heading 2
        {
          id: 'block_3',
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Features' }],
        },
        {
          id: 'block_4',
          type: 'paragraph',
          content: [{ type: 'text', text: 'The editor includes support for:' }],
        },
        // Bullet list items
        {
          id: 'block_5',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [
            { type: 'text', text: 'Rich text formatting (' },
            { type: 'text', text: 'bold', styleId: 'style_bold' },
            { type: 'text', text: ', ' },
            { type: 'text', text: 'italic', styleId: 'style_italic' },
            { type: 'text', text: ', underline)' },
          ],
        },
        {
          id: 'block_6',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [{ type: 'text', text: 'Multiple heading levels' }],
        },
        {
          id: 'block_7',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [{ type: 'text', text: 'Bulleted and numbered lists' }],
        },
        {
          id: 'block_8',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [{ type: 'text', text: 'Tables with customizable columns' }],
        },
        {
          id: 'block_9',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [{ type: 'text', text: 'Images with captions' }],
        },
        {
          id: 'block_10',
          type: 'list-item',
          listType: 'bullet',
          level: 0,
          content: [{ type: 'text', text: 'Page setup with margins' }],
        },
        // Page Configuration section
        {
          id: 'block_11',
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Page Configuration' }],
        },
        {
          id: 'block_12',
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Click the page setup button (📄) in the toolbar to configure page size, orientation, and margins. ' },
            { type: 'text', text: 'The ruler at the top', styleId: 'style_highlight' },
            { type: 'text', text: ' allows you to adjust margins by dragging the handles.' },
          ],
        },
        // Sample Table section
        {
          id: 'block_13',
          type: 'heading',
          level: 3,
          content: [{ type: 'text', text: 'Sample Table' }],
        },
        {
          id: 'block_14',
          type: 'table',
          rows: [
            {
              id: 'row_1',
              cells: [
                { id: 'cell_1_1', content: [{ type: 'text', text: 'Feature', styleId: 'style_bold' }] },
                { id: 'cell_1_2', content: [{ type: 'text', text: 'Status', styleId: 'style_bold' }] },
                { id: 'cell_1_3', content: [{ type: 'text', text: 'Notes', styleId: 'style_bold' }] },
              ],
            },
            {
              id: 'row_2',
              cells: [
                { id: 'cell_2_1', content: [{ type: 'text', text: 'Text Formatting' }] },
                { id: 'cell_2_2', content: [{ type: 'text', text: '✅ Complete' }] },
                { id: 'cell_2_3', content: [{ type: 'text', text: 'Bold, italic, underline' }] },
              ],
            },
            {
              id: 'row_3',
              cells: [
                { id: 'cell_3_1', content: [{ type: 'text', text: 'Page Layout' }] },
                { id: 'cell_3_2', content: [{ type: 'text', text: '✅ Complete' }] },
                { id: 'cell_3_3', content: [{ type: 'text', text: 'Multiple page sizes' }] },
              ],
            },
          ],
        },
        {
          id: 'block_15',
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The table above demonstrates basic table support. Tables can have custom column widths and cell content.' },
          ],
        },
        // Getting Started section
        {
          id: 'block_16',
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Getting Started' }],
        },
        {
          id: 'block_17',
          type: 'paragraph',
          content: [{ type: 'text', text: 'To use this library in your own project:' }],
        },
        // Numbered list
        {
          id: 'block_18',
          type: 'list-item',
          listType: 'numbered',
          level: 0,
          content: [
            { type: 'text', text: 'Install ' },
            { type: 'text', text: '@pagent-libs/docs-core', styleId: 'style_code' },
            { type: 'text', text: ' and ' },
            { type: 'text', text: '@pagent-libs/docs-react', styleId: 'style_code' },
          ],
        },
        {
          id: 'block_19',
          type: 'list-item',
          listType: 'numbered',
          level: 0,
          content: [
            { type: 'text', text: 'Create a ' },
            { type: 'text', text: 'DocumentImpl', styleId: 'style_code' },
            { type: 'text', text: ' instance' },
          ],
        },
        {
          id: 'block_20',
          type: 'list-item',
          listType: 'numbered',
          level: 0,
          content: [
            { type: 'text', text: 'Wrap your app with ' },
            { type: 'text', text: 'DocumentProvider', styleId: 'style_code' },
          ],
        },
        {
          id: 'block_21',
          type: 'list-item',
          listType: 'numbered',
          level: 0,
          content: [
            { type: 'text', text: 'Use the ' },
            { type: 'text', text: 'DocumentEditor', styleId: 'style_code' },
            { type: 'text', text: ' component' },
          ],
        },
        // Long paragraph for pagination demo
        {
          id: 'block_22',
          type: 'paragraph',
          content: [
            { 
              type: 'text', 
              text: 'Check the documentation for more details on customization and advanced features. '.repeat(20),
            },
          ],
        },
        // Additional content
        {
          id: 'block_23',
          type: 'heading',
          level: 2,
          content: [{ type: 'text', text: 'Additional Information' }],
        },
        {
          id: 'block_24',
          type: 'paragraph',
          content: [
            { 
              type: 'text', 
              text: 'Check the documentation for more details on customization and advanced features. '.repeat(20),
            },
          ],
        },
        {
          id: 'block_25',
          type: 'paragraph',
          content: [
            { 
              type: 'text', 
              text: 'Check the documentation for more details on customization and advanced features. '.repeat(20),
            },
          ],
        },
      ],
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function App() {
  const [document] = useState(() => {
    // Create a new document and load the sample data
    const doc = new DocumentImpl();
    doc.setData(sampleDocumentData);
    return doc;
  });

  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 72,
  });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight - 72,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSave = () => {
    const data = document.getData();
    console.log('Document data:', JSON.stringify(data, null, 2));
    alert('Document data logged to console (formatted JSON)');
  };

  const handleNew = () => {
    // Create a new blank document
    const blankData: DocumentData = {
      id: 'new-document',
      title: 'Untitled Document',
      defaultPageConfig: sampleDocumentData.defaultPageConfig,
      textStylePool: {},
      paragraphStylePool: {},
      sections: [
        {
          id: 'section_1',
          pageConfig: sampleDocumentData.defaultPageConfig,
          blocks: [
            {
              id: 'block_1',
              type: 'paragraph',
              content: [],
            },
          ],
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    document.setData(blankData);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <h1>Pagent Docs Demo</h1>
          <p>Standalone demo of pagent-docs library - No backend required</p>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={handleNew}>
            New Document
          </button>
          <button className="header-button" onClick={handleSave}>
            Save to Console
          </button>
        </div>
      </header>
      <main className="app-main">
        <DocumentProvider document={document}>
          <DocumentEditor 
            width={dimensions.width} 
            height={dimensions.height}
            showToolbar={true}
            showRuler={true}
          />
        </DocumentProvider>
      </main>
    </div>
  );
}

export default App;
