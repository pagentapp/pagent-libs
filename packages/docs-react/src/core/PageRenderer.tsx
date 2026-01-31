/**
 * PageRenderer - Renders a single page with content clipping
 * 
 * Each page is a container with overflow:hidden that shows only
 * its portion of the document content. This is the key to vertical
 * pagination - each page clips content at its boundaries.
 */

import React, { memo, useMemo } from 'react';
import { PageLayout, PageConfig } from './LayoutEngine';

export interface PageRendererProps {
  /** The page layout data */
  page: PageLayout;
  /** Page configuration (dimensions, margins) */
  pageConfig: PageConfig;
  /** Scale factor (zoom) */
  scale: number;
  /** The editor content element to clone/reference */
  editorContent: HTMLElement | null;
  /** Whether this is the page containing the actual editor */
  isEditorPage?: boolean;
  /** Children to render (for the editor page) */
  children?: React.ReactNode;
  /** Cumulative content offset from previous pages (for proper clipping alignment) */
  cumulativeOffset?: number;
}

/**
 * PageRenderer - Renders a single page
 * 
 * For the first page (isEditorPage=true), it renders the actual editor.
 * For subsequent pages, it shows a clipped view of the editor content
 * using negative margins to "scroll" to the right portion.
 */
export const PageRenderer = memo(function PageRenderer({
  page,
  pageConfig,
  scale,
  editorContent,
  isEditorPage = false,
  children,
  cumulativeOffset = 0,
}: PageRendererProps) {
  // Calculate dimensions - use Math.floor to avoid sub-pixel rendering issues
  const pageWidth = Math.floor(pageConfig.width * scale);
  const pageHeight = Math.floor(pageConfig.height * scale);
  const marginTop = Math.floor(pageConfig.margins.top * scale);
  const marginLeft = Math.floor(pageConfig.margins.left * scale);
  const marginRight = Math.floor(pageConfig.margins.right * scale);
  const marginBottom = Math.floor(pageConfig.margins.bottom * scale);
  const contentWidth = pageWidth - marginLeft - marginRight;
  const contentHeight = pageHeight - marginTop - marginBottom;

  // Use the cumulative offset passed from parent for proper clipping alignment
  const contentOffset = useMemo(() => {
    if (page.pageIndex === 0) return 0;
    
    // Use the passed cumulative offset (from layout.startOffset)
    if (cumulativeOffset > 0) return Math.floor(cumulativeOffset);
    
    // Fallback: use page index * content height
    return page.pageIndex * contentHeight;
  }, [page.pageIndex, cumulativeOffset, contentHeight]);

  return (
    <div
      className="page-container"
      style={{
        position: 'relative',
        width: pageWidth,
        height: pageHeight,
        backgroundColor: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        overflow: 'hidden', // Key: clip content at page boundaries
        flexShrink: 0,
      }}
    >
      {/* Content area with margins */}
      <div
        className="page-content-area"
        style={{
          position: 'absolute',
          top: marginTop,
          left: marginLeft,
          width: contentWidth,
          height: contentHeight,
          overflow: 'hidden', // Clip content within margins
        }}
      >
        {isEditorPage ? (
          // First page: render the actual editor
          // The editor content starts at position 0,0 and extends beyond the page
          // The page-content-area's overflow:hidden clips it at contentHeight
          <div
            className="editor-wrapper"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: contentWidth,
            }}
          >
            {children}
          </div>
        ) : (
          // Subsequent pages: show clipped view of content
          // We use absolute positioning with a negative top to "scroll" to this page's content
          <div
            className="content-clone"
            style={{
              position: 'absolute',
              top: -contentOffset, // Negative top positions content so the right portion is visible
              left: 0,
              width: contentWidth,
              // Prevent interaction - clicks should go to the actual editor
              pointerEvents: 'none',
            }}
          >
            {/* Clone the editor content */}
            {editorContent && (
              <div
                dangerouslySetInnerHTML={{
                  __html: editorContent.innerHTML,
                }}
                style={{
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Page number */}
      <div
        className="page-number"
        style={{
          position: 'absolute',
          bottom: Math.max(8, marginBottom / 2 - 8),
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 10 * scale,
          color: '#5f6368',
          pointerEvents: 'none',
          zIndex: 10,
        }}
      >
        {page.pageIndex + 1}
      </div>
    </div>
  );
});

/**
 * SelectionOverlay - Renders the caret and selection highlights
 * 
 * This component renders the visual cursor and selection rectangles
 * on top of the pages.
 */
export interface SelectionOverlayProps {
  /** Caret position (if selection is collapsed) */
  caretPosition: {
    pageIndex: number;
    x: number;
    y: number;
    height: number;
  } | null;
  /** Selection rectangles (if selection is a range) */
  selectionRects: Array<{
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  /** Page configuration */
  pageConfig: PageConfig;
  /** Scale factor */
  scale: number;
  /** Whether the editor is focused */
  isFocused: boolean;
  /** Gap between pages */
  pageGap: number;
}

export const SelectionOverlay = memo(function SelectionOverlay({
  caretPosition,
  selectionRects,
  pageConfig,
  scale,
  isFocused,
  pageGap,
}: SelectionOverlayProps) {
  const pageHeight = pageConfig.height * scale;
  const marginTop = pageConfig.margins.top * scale;
  const marginLeft = pageConfig.margins.left * scale;

  // Calculate Y position for a given page
  const getPageY = (pageIndex: number) => {
    return pageIndex * (pageHeight + pageGap);
  };

  return (
    <div
      className="selection-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {/* Render selection rectangles */}
      {selectionRects.map((rect, index) => (
        <div
          key={`selection-${index}`}
          className="selection-rect"
          style={{
            position: 'absolute',
            left: marginLeft + rect.x,
            top: getPageY(rect.pageIndex) + marginTop + rect.y,
            width: rect.width,
            height: rect.height,
            backgroundColor: 'rgba(66, 133, 244, 0.3)',
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* Render caret */}
      {caretPosition && isFocused && (
        <div
          className="caret"
          style={{
            position: 'absolute',
            left: marginLeft + caretPosition.x,
            top: getPageY(caretPosition.pageIndex) + marginTop + caretPosition.y,
            width: 2,
            height: caretPosition.height || 20,
            backgroundColor: '#000',
            pointerEvents: 'none',
            animation: 'blink 1s step-end infinite',
          }}
        />
      )}

      {/* Caret blink animation */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
});

