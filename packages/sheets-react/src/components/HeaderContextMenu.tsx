import React, { memo, useEffect, useRef } from 'react';

interface HeaderContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onHide?: () => void;
  onShow?: () => void;
  onUnhideAdjacent?: () => void;
  onInsert?: () => void;
  onDelete?: () => void;
  onSortAsc?: () => void;
  onSortDesc?: () => void;
  onFilter?: () => void;
  isHidden?: boolean;
  hasHiddenAdjacent?: boolean;
  type: 'row' | 'column';
}

export const HeaderContextMenu = memo(function HeaderContextMenu({
  x,
  y,
  onClose,
  onHide,
  onShow,
  onUnhideAdjacent,
  onInsert,
  onDelete,
  onSortAsc,
  onSortDesc,
  onFilter,
  isHidden = false,
  hasHiddenAdjacent = false,
  type,
}: HeaderContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    // Use a small delay to avoid closing immediately when menu opens
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('keydown', handleEscape, true);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape, true);
    };
  }, [onClose]);

  const MenuItem = memo(
    ({
      onClick,
      children,
      disabled,
    }: {
      onClick?: () => void;
      children: React.ReactNode;
      disabled?: boolean;
    }) => (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled && onClick) {
            onClick();
          }
        }}
        style={{
          padding: '6px 12px',
          cursor: disabled ? 'default' : 'pointer',
          fontSize: '12px',
          color: disabled ? '#999' : '#333',
          backgroundColor: disabled ? 'transparent' : undefined,
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        {children}
      </div>
    )
  );

  MenuItem.displayName = 'HeaderContextMenuMenuItem';

  const typeLabel = type === 'row' ? 'Row' : 'Column';

  return (
    <div
      ref={menuRef}
      className="header-context-menu"
      style={{
        position: 'fixed',
        left: x,
        top: y,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '2px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        minWidth: '150px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isHidden ? (
        <MenuItem onClick={onShow}>Show {typeLabel}</MenuItem>
      ) : (
        <MenuItem onClick={onHide}>Hide {typeLabel}</MenuItem>
      )}
      {hasHiddenAdjacent && !isHidden && (
        <MenuItem onClick={onUnhideAdjacent}>Unhide {typeLabel}s</MenuItem>
      )}
      {type === 'column' && (
        <>
          <div
            style={{
              height: '1px',
              backgroundColor: '#e0e0e0',
              margin: '4px 0',
            }}
          />
          <MenuItem onClick={onSortAsc}>Sort sheet A to Z</MenuItem>
          <MenuItem onClick={onSortDesc}>Sort sheet Z to A</MenuItem>
          <MenuItem onClick={onFilter}>Filter</MenuItem>
        </>
      )}
      <div
        style={{
          height: '1px',
          backgroundColor: '#e0e0e0',
          margin: '4px 0',
        }}
      />
      <MenuItem onClick={onInsert}>Insert {typeLabel}</MenuItem>
      <MenuItem onClick={onDelete}>Delete {typeLabel}</MenuItem>
    </div>
  );
});

HeaderContextMenu.displayName = 'HeaderContextMenu';