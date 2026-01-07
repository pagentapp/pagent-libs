import React, { memo, useCallback, useState, useEffect, useRef } from 'react';
import { useWorkbook } from '../context/WorkbookContext';
import { columnIndexToLabel } from '@pagent-libs/sheets-core';

interface FormulaBarProps {
  activeCell: { row: number; col: number } | null;
  onFormulaChange?: (formula: string) => void;
}

export const FormulaBar = memo(function FormulaBar({
  activeCell,
  onFormulaChange,
}: FormulaBarProps) {
  const { workbook } = useWorkbook();
  const [inputValue, setInputValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input value when active cell changes
  useEffect(() => {
    if (!activeCell) {
      setInputValue('');
      setIsEditing(false);
      return;
    }

    if (!isEditing) {
      const cell = workbook.getCell(undefined, activeCell.row, activeCell.col);
      const displayValue = cell?.formula || cell?.value?.toString() || '';
      setInputValue(displayValue);
    }
  }, [activeCell, workbook, isEditing]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setIsEditing(true);
  }, []);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    setIsEditing(false);
    if (activeCell && onFormulaChange) {
      onFormulaChange(inputValue);
    }
  }, [activeCell, inputValue, onFormulaChange]);

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inputRef.current?.blur();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setIsEditing(false);
        if (activeCell) {
          const cell = workbook.getCell(undefined, activeCell.row, activeCell.col);
          setInputValue(cell?.formula || cell?.value?.toString() || '');
        }
      }
    },
    [activeCell, workbook]
  );

  const cellReference = activeCell
    ? `${columnIndexToLabel(activeCell.col)}${activeCell.row + 1}`
    : '';

  return (
    <div
      className="formula-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        height: '32px',
        borderBottom: '1px solid #e8eaed',
        backgroundColor: '#ffffff',
        padding: '0 12px',
        gap: '10px',
      }}
    >
      <div
        className="cell-reference"
        style={{
          minWidth: '70px',
          fontSize: '12px',
          fontWeight: 500,
          color: '#5f6368',
          textAlign: 'center',
          padding: '6px 10px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e8eaed',
          borderRadius: '4px',
        }}
      >
        {cellReference}
      </div>
      <div
        className="formula-input-container"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          border: '1px solid #e8eaed',
          borderRadius: '4px',
          padding: '0 8px',
          backgroundColor: '#ffffff',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            color: '#5f6368',
            marginRight: '6px',
            fontWeight: 500,
          }}
        >
          =
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={(e) => {
            handleInputFocus();
            e.currentTarget.parentElement!.style.borderColor = '#1a73e8';
          }}
          onBlur={(e) => {
            handleInputBlur();
            e.currentTarget.parentElement!.style.borderColor = '#e8eaed';
          }}
          onKeyDown={handleInputKeyDown}
          placeholder="Enter formula or value"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            padding: '4px 0',
            backgroundColor: 'transparent',
            color: '#202124',
          }}
        />
      </div>
    </div>
  );
});

