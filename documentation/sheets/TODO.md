# Pagent-Libs Implementation TODO

This document tracks the remaining implementation tasks to fully align the codebase with the documented architecture.

## High Priority Tasks

### 1. Collaboration System Integration
**Status**: Not Implemented
**Impact**: Real-time collaboration features are documented but unavailable

- [ ] Add `CollaborationProvider` interface methods to `Workbook` interface in `packages/core/src/types.ts`
- [ ] Implement `setCollaborationProvider()` method in `WorkbookImpl` class
- [ ] Add collaboration provider property and event forwarding in workbook constructor
- [ ] Implement presence tracking and operation synchronization
- [ ] Add collaboration setup/cleanup in workbook lifecycle methods

### 2. Export API Integration
**Status**: Partially Implemented
**Impact**: CSV export/import functionality exists but not accessible via workbook API

- [ ] Add `exportToCSV(sheetId?: string): string` method to `Workbook` interface
- [ ] Add `importFromCSV(csv: string, sheetId?: string): void` method to `Workbook` interface
- [ ] Implement export methods in `WorkbookImpl` that delegate to existing CSV utilities
- [ ] Implement import methods in `WorkbookImpl` that delegate to existing CSV utilities
- [ ] Add proper error handling for malformed CSV data

### 3. Freeze Panes API Integration
**Status**: Configuration Only
**Impact**: Freeze pane configuration exists but cannot be programmatically controlled

- [ ] Add freeze pane methods to `Workbook` interface:
  - `setFrozenRows(rows: number, sheetId?: string): void`
  - `setFrozenCols(cols: number, sheetId?: string): void`
  - `getFrozenRows(sheetId?: string): number`
  - `getFrozenCols(sheetId?: string): number`
  - `unfreeze(sheetId?: string): void`
- [ ] Implement freeze methods in `WorkbookImpl` that update sheet configuration
- [ ] Ensure freeze changes trigger proper re-rendering and viewport updates
- [ ] Add validation for freeze pane limits

## Medium Priority Tasks

### 4. Workbook Interface Completeness
**Status**: Mostly Complete
**Impact**: Some documented methods may be missing from implementation

- [ ] Audit all methods in `Workbook` interface against `WorkbookImpl` implementation
- [ ] Ensure all documented interface methods have implementations
- [ ] Add missing method implementations if any are found
- [ ] Update TypeScript strict checks to catch interface mismatches

### 5. Feature Integration Testing
**Status**: Not Started
**Impact**: Ensures all integrated features work correctly

- [ ] Add integration tests for export functionality via workbook API
- [ ] Add integration tests for freeze pane functionality via workbook API
- [ ] Add integration tests for collaboration provider setup and teardown
- [ ] Test feature combinations (sorting + filtering, freeze + export, etc.)

## Implementation Guidelines

### Code Patterns to Follow

**Collaboration Provider Integration:**
```typescript
// In WorkbookImpl
private collaborationProvider?: CollaborationProvider;

setCollaborationProvider(provider: CollaborationProvider): void {
  this.collaborationProvider = provider;
  this.setupCollaboration();
}

private setupCollaboration(): void {
  if (!this.collaborationProvider) return;

  // Forward local changes to remote
  this.on('cellChange', (event) => {
    this.collaborationProvider!.emit('change', event);
  });

  // Listen for remote changes
  this.collaborationProvider.on('change', (operation) => {
    this.applyRemoteOperation(operation);
  });
}
```

**Export API Integration:**
```typescript
// In WorkbookImpl
exportToCSV(sheetId?: string): string {
  return exportToCSV(this, sheetId);
}

importFromCSV(csv: string, sheetId?: string): void {
  const sheet = this.getSheet(sheetId);
  importFromCSV(csv, sheet);
  this.events.emit('sheetChange', { sheetId });
}
```

**Freeze Pane Integration:**
```typescript
// In WorkbookImpl
setFrozenRows(rows: number, sheetId?: string): void {
  const sheet = this.getSheet(sheetId);
  sheet.config.frozenRows = rows;
  this.recordHistory();
  this.events.emit('sheetChange', { sheetId });
}
```

### Testing Requirements

- Unit tests for all new workbook methods
- Integration tests for feature combinations
- Performance tests to ensure no regressions
- Type safety validation

### Documentation Updates

- Update API reference documentation with new methods
- Add usage examples for collaboration, export, and freeze features
- Update interface definitions in documentation

## Priority Rationale

**High Priority**: These features are documented as core functionality but completely missing from the implementation. Users expect these features to work based on the documentation.

**Medium Priority**: These ensure completeness and reliability of the existing implementation.

## Completion Criteria

- [ ] All workbook methods documented in the interface are implemented
- [ ] Export functionality is accessible via workbook API
- [ ] Freeze panes can be programmatically controlled
- [ ] Collaboration providers can be integrated
- [ ] All new functionality has comprehensive tests
- [ ] Documentation accurately reflects implementation
- [ ] No performance regressions introduced
