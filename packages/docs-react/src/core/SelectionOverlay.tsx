/**
 * SelectionOverlay - Renders caret and selection highlights as a separate DOM layer
 * 
 * This component renders the visual representation of the text selection and cursor
 * as absolutely positioned elements overlaid on the painted pages. It uses coordinate
 * transforms from the layout engine to position elements correctly.
 * 
 * Features:
 * - Selection rectangles rendered as semi-transparent highlights
 * - Caret rendered as a blinking vertical line
 * - Positioned absolutely over the viewport
 * - pointer-events: none to allow interaction with underlying content
 */

import { memo, useEffect } from 'react';

export interface LayoutRect {
  /** Page index (0-based) */
  pageIndex: number;
  /** X position in layout space */
  x: number;
  /** Y position in layout space */
  y: number;
  /** Width in layout space */
  width: number;
  /** Height in layout space */
  height: number;
}

export interface CaretPosition {
  /** Page index (0-based) */
  pageIndex: number;
  /** X position in layout space */
  x: number;
  /** Y position in layout space */
  y: number;
  /** Height of the caret */
  height: number;
}

export interface SelectionOverlayProps {
  /** Selection rectangles to render */
  selectionRects: LayoutRect[];
  /** Caret position (null if selection is a range, not collapsed) */
  caretPosition: CaretPosition | null;
  /** Height of each page in layout units */
  pageHeight: number;
  /** Vertical gap between pages */
  pageGap: number;
  /** Current zoom level */
  zoom: number;
  /** Function to convert page-local coordinates to viewport coordinates */
  convertToViewportCoords: (pageIndex: number, x: number, y: number) => { x: number; y: number } | null;
  /** Whether the editor is focused */
  isFocused: boolean;
}

// Caret blink animation keyframes (injected once)
const CARET_KEYFRAMES = `
@keyframes caretBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
`;

let keyframesInjected = false;

function injectKeyframes(): void {
  if (keyframesInjected) return;
  const style = document.createElement('style');
  style.textContent = CARET_KEYFRAMES;
  document.head.appendChild(style);
  keyframesInjected = true;
}

/**
 * Renders a single selection rectangle
 */
function SelectionRect({
  rect,
  convertToViewportCoords,
}: {
  rect: LayoutRect;
  pageHeight: number;
  pageGap: number;
  zoom: number;
  convertToViewportCoords: SelectionOverlayProps['convertToViewportCoords'];
}) {
  // rect.x and rect.y are already page-local (relative to page content area)
  const coords = convertToViewportCoords(rect.pageIndex, rect.x, rect.y);
  
  if (!coords) return null;

  return (
    <div
      className="selection-rect"
      style={{
        position: 'absolute',
        left: coords.x,
        top: coords.y,
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
        backgroundColor: 'rgba(51, 132, 255, 0.35)',
        borderRadius: 2,
        pointerEvents: 'none',
      }}
    />
  );
}

/**
 * Renders the caret (blinking cursor)
 */
function Caret({
  position,
  convertToViewportCoords,
  isFocused,
}: {
  position: CaretPosition;
  pageHeight: number;
  pageGap: number;
  zoom: number;
  convertToViewportCoords: SelectionOverlayProps['convertToViewportCoords'];
  isFocused: boolean;
}) {
  // position.x and position.y are already page-local (relative to page content area)
  const coords = convertToViewportCoords(position.pageIndex, position.x, position.y);
  
  if (!coords) return null;

  return (
    <div
      className="selection-caret"
      style={{
        position: 'absolute',
        left: coords.x,
        top: coords.y,
        width: 2,
        height: position.height,
        backgroundColor: '#000',
        pointerEvents: 'none',
        animation: isFocused ? 'caretBlink 1s step-end infinite' : 'none',
        opacity: isFocused ? 1 : 0,
      }}
    />
  );
}

/**
 * SelectionOverlay component
 * 
 * Renders selection highlights and caret as an overlay layer positioned
 * absolutely over the painted pages.
 */
export const SelectionOverlay = memo(function SelectionOverlay({
  selectionRects,
  caretPosition,
  pageHeight,
  pageGap,
  zoom,
  convertToViewportCoords,
  isFocused,
}: SelectionOverlayProps) {
  // Inject keyframes on first render
  useEffect(() => {
    injectKeyframes();
  }, []);

  return (
    <div
      className="selection-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* Selection rectangles */}
      {selectionRects.map((rect, index) => (
        <SelectionRect
          key={`sel-${index}`}
          rect={rect}
          pageHeight={pageHeight}
          pageGap={pageGap}
          zoom={zoom}
          convertToViewportCoords={convertToViewportCoords}
        />
      ))}

      {/* Caret (only shown when selection is collapsed) */}
      {caretPosition && (
        <Caret
          position={caretPosition}
          pageHeight={pageHeight}
          pageGap={pageGap}
          zoom={zoom}
          convertToViewportCoords={convertToViewportCoords}
          isFocused={isFocused}
        />
      )}
    </div>
  );
});

