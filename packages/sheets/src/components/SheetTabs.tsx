import React, { memo, useCallback, useState, useEffect } from 'react';
import { useWorkbook } from '../context/WorkbookContext';

interface SheetTabsProps {
  onSheetSelect?: (sheetId: string) => void;
  onSheetRename?: (sheetId: string, newName: string) => void;
  onSheetAdd?: () => void;
  onSheetDelete?: (sheetId: string) => void;
}

export const SheetTabs = memo(function SheetTabs({
  onSheetSelect,
  onSheetRename,
  onSheetAdd,
  onSheetDelete,
}: SheetTabsProps) {
  const { workbook } = useWorkbook();
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [, forceUpdate] = useState({});

  const sheets = Array.from(workbook.sheets.values());
  const activeSheetId = workbook.activeSheetId;

  // Force re-render when sheets change
  useEffect(() => {
    const handleSheetChange = () => {
      forceUpdate({});
    };
    
    workbook.on('sheetAdd', handleSheetChange);
    workbook.on('sheetDelete', handleSheetChange);
    
    return () => {
      workbook.off('sheetAdd', handleSheetChange);
      workbook.off('sheetDelete', handleSheetChange);
    };
  }, [workbook]);

  const handleSheetClick = useCallback(
    (sheetId: string) => {
      if (sheetId !== activeSheetId) {
        workbook.setActiveSheet(sheetId);
        onSheetSelect?.(sheetId);
      }
    },
    [activeSheetId, workbook, onSheetSelect]
  );

  const handleSheetDoubleClick = useCallback(
    (sheetId: string, currentName: string) => {
      setEditingSheetId(sheetId);
      setEditingName(currentName);
    },
    []
  );

  const handleRenameSubmit = useCallback(
    (sheetId: string) => {
      if (editingName.trim() && editingName !== workbook.getSheet(sheetId).name) {
        workbook.renameSheet(sheetId, editingName.trim());
        onSheetRename?.(sheetId, editingName.trim());
      }
      setEditingSheetId(null);
      setEditingName('');
    },
    [editingName, workbook, onSheetRename]
  );

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent, sheetId: string) => {
      if (e.key === 'Enter') {
        handleRenameSubmit(sheetId);
      } else if (e.key === 'Escape') {
        setEditingSheetId(null);
        setEditingName('');
      }
    },
    [handleRenameSubmit]
  );

  const handleAddSheet = useCallback(() => {
    const newSheet = workbook.addSheet(`Sheet${sheets.length + 1}`);
    workbook.setActiveSheet(newSheet.id);
    onSheetAdd?.();
  }, [workbook, sheets.length, onSheetAdd]);

  const handleDeleteSheet = useCallback(
    (sheetId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      if (sheets.length > 1) {
        workbook.deleteSheet(sheetId);
        onSheetDelete?.(sheetId);
      }
    },
    [workbook, sheets.length, onSheetDelete]
  );

  return (
    <div
      className="sheet-tabs"
      style={{
        display: 'flex',
        alignItems: 'center',
        borderTop: '1px solid #e0e0e0',
        backgroundColor: '#f8f9fa',
        overflowX: 'auto',
        overflowY: 'hidden',
        minHeight: '36px',
        height: '36px',
        flexShrink: 0,
        boxShadow: '0 -1px 4px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {sheets.map((sheet) => {
        const isActive = sheet.id === activeSheetId;
        const isEditing = editingSheetId === sheet.id;

        return (
          <div
            key={sheet.id}
            className="sheet-tab"
            style={{
              position: 'relative',
              padding: '8px 28px 8px 16px',
              marginRight: '2px',
              backgroundColor: isActive ? '#ffffff' : 'transparent',
              cursor: 'pointer',
              userSelect: 'none',
              minWidth: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? '#1a73e8' : '#5f6368',
              borderRadius: isActive ? '0 0 8px 8px' : '0',
              borderTop: isActive ? '2px solid #1a73e8' : '2px solid transparent',
              transition: 'all 0.15s ease',
              transform: isActive ? 'translateY(2px)' : 'none',
              boxShadow: isActive ? '0 2px 4px rgba(0, 0, 0, 0.08)' : 'none',
            }}
            onClick={() => handleSheetClick(sheet.id)}
            onDoubleClick={() => handleSheetDoubleClick(sheet.id, sheet.name)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#f1f3f4';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameSubmit(sheet.id)}
                onKeyDown={(e) => handleRenameKeyDown(e, sheet.id)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  border: '2px solid #1a73e8',
                  outline: 'none',
                  padding: '4px 8px',
                  fontSize: '13px',
                  width: '100%',
                  maxWidth: '150px',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff',
                  color: '#202124',
                }}
                autoFocus
              />
            ) : (
              <>
                <span style={{ flex: 1, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {sheet.name}
                </span>
                {sheets.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSheet(sheet.id, e)}
                    style={{
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      fontSize: '18px',
                      color: '#5f6368',
                      padding: '2px 6px',
                      lineHeight: 1,
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    title="Delete sheet"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#ea4335';
                      e.currentTarget.style.color = '#ffffff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#5f6368';
                    }}
                  >
                    ×
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        onClick={handleAddSheet}
        style={{
          padding: '8px 16px',
          border: 'none',
          marginLeft: '4px',
          backgroundColor: 'transparent',
          cursor: 'pointer',
          fontSize: '20px',
          color: '#5f6368',
          lineHeight: 1,
          borderRadius: '4px',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '32px',
          height: '32px',
        }}
        title="Add new sheet"
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f1f3f4';
          e.currentTarget.style.color = '#1a73e8';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#5f6368';
        }}
      >
        +
      </button>
    </div>
  );
});

