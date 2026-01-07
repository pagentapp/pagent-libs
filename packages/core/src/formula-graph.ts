// Formula dependency graph for incremental recalculation

import type { FormulaGraph, FormulaNode, CellValue } from './types';

export class FormulaGraphImpl implements FormulaGraph {
  nodes: Map<string, FormulaNode> = new Map();

  addFormula(cellKey: string, formula: string, dependencies: Set<string>): void {
    const node: FormulaNode = {
      cellKey,
      formula,
      dependencies: new Set(dependencies),
      dependents: new Set(),
      isDirty: true,
    };

    // Update dependents of dependencies
    for (const depKey of dependencies) {
      const depNode = this.nodes.get(depKey);
      if (depNode) {
        depNode.dependents.add(cellKey);
      }
    }

    this.nodes.set(cellKey, node);
  }

  removeFormula(cellKey: string): void {
    const node = this.nodes.get(cellKey);
    if (!node) return;

    // Remove from dependents of dependencies
    for (const depKey of node.dependencies) {
      const depNode = this.nodes.get(depKey);
      if (depNode) {
        depNode.dependents.delete(cellKey);
      }
    }

    this.nodes.delete(cellKey);
  }

  getDependents(cellKey: string): Set<string> {
    const node = this.nodes.get(cellKey);
    return node ? new Set(node.dependents) : new Set();
  }

  getDependencies(cellKey: string): Set<string> {
    const node = this.nodes.get(cellKey);
    return node ? new Set(node.dependencies) : new Set();
  }

  invalidate(cellKey: string): void {
    const node = this.nodes.get(cellKey);
    if (!node) return;

    node.isDirty = true;
    node.cachedValue = undefined;

    // Invalidate all dependents
    for (const dependentKey of node.dependents) {
      this.invalidate(dependentKey);
    }
  }

  getDirtyCells(): Set<string> {
    const dirty = new Set<string>();
    for (const [key, node] of this.nodes) {
      if (node.isDirty) {
        dirty.add(key);
      }
    }
    return dirty;
  }

  markClean(cellKey: string, value: CellValue): void {
    const node = this.nodes.get(cellKey);
    if (node) {
      node.isDirty = false;
      node.cachedValue = value;
    }
  }
}

