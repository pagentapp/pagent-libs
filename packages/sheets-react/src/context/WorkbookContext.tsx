import React, { createContext, useContext, useMemo, useState, useCallback, useEffect } from 'react';
import { WorkbookImpl } from '@pagent-libs/sheets-core';

interface WorkbookContextValue {
  workbook: WorkbookImpl;
  updateWorkbook: (updater: (wb: WorkbookImpl) => void) => void;
}

const WorkbookContext = createContext<WorkbookContextValue | undefined>(undefined);

export function WorkbookProvider({
  workbook: initialWorkbook,
  children,
}: {
  workbook: WorkbookImpl;
  children: React.ReactNode;
}) {
  const [workbook] = useState<WorkbookImpl>(initialWorkbook);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // Subscribe to workbook events to trigger re-renders
  useEffect(() => {
    const handleCellChange = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    const handleSheetChange = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    const handleSheetAdd = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    const handleSheetDelete = () => {
      setUpdateTrigger((prev) => prev + 1);
    };

    workbook.on('cellChange', handleCellChange);
    workbook.on('sheetChange', handleSheetChange);
    workbook.on('sheetAdd', handleSheetAdd);
    workbook.on('sheetDelete', handleSheetDelete);

    return () => {
      workbook.off('cellChange', handleCellChange);
      workbook.off('sheetChange', handleSheetChange);
      workbook.off('sheetAdd', handleSheetAdd);
      workbook.off('sheetDelete', handleSheetDelete);
    };
  }, [workbook]);

  const updateWorkbook = useCallback((updater: (wb: WorkbookImpl) => void) => {
    updater(workbook);
    setUpdateTrigger((prev) => prev + 1);
  }, [workbook]);

  const value = useMemo(
    () => ({
      workbook,
      updateWorkbook,
    }),
    [workbook, updateWorkbook, updateTrigger]
  );

  return <WorkbookContext.Provider value={value}>{children}</WorkbookContext.Provider>;
}

export function useWorkbook(): WorkbookContextValue {
  const context = useContext(WorkbookContext);
  if (!context) {
    throw new Error('useWorkbook must be used within WorkbookProvider');
  }
  return context;
}

