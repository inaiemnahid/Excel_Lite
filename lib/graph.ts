// Dependency graph for formula recalculation
import { A1Ref, CellAddress } from '@/types/sheet';
import { cellKey } from './a1';

export interface GraphNode {
  key: string; // cell key
  dependencies: Set<string>; // cells this cell depends on
  dependents: Set<string>; // cells that depend on this cell
}

export class DependencyGraph {
  private nodes = new Map<string, GraphNode>();

  /**
   * Update dependencies for a cell
   */
  updateCell(key: string, dependencies: A1Ref[]): void {
    // Remove old dependencies
    const oldNode = this.nodes.get(key);
    if (oldNode) {
      for (const dep of oldNode.dependencies) {
        const depNode = this.nodes.get(dep);
        if (depNode) {
          depNode.dependents.delete(key);
        }
      }
    }

    // Create or update node
    const node: GraphNode = {
      key,
      dependencies: new Set(dependencies),
      dependents: oldNode?.dependents || new Set(),
    };
    this.nodes.set(key, node);

    // Add new dependencies
    for (const dep of dependencies) {
      let depNode = this.nodes.get(dep);
      if (!depNode) {
        depNode = {
          key: dep,
          dependencies: new Set(),
          dependents: new Set(),
        };
        this.nodes.set(dep, depNode);
      }
      depNode.dependents.add(key);
    }
  }

  /**
   * Remove a cell from the graph
   */
  removeCell(key: string): void {
    const node = this.nodes.get(key);
    if (!node) return;

    // Remove from dependents
    for (const dep of node.dependencies) {
      const depNode = this.nodes.get(dep);
      if (depNode) {
        depNode.dependents.delete(key);
      }
    }

    // Remove from dependencies
    for (const dependent of node.dependents) {
      const dependentNode = this.nodes.get(dependent);
      if (dependentNode) {
        dependentNode.dependencies.delete(key);
      }
    }

    this.nodes.delete(key);
  }

  /**
   * Get all cells that depend on the given cell (directly or indirectly)
   */
  getAffectedCells(key: string): Set<string> {
    const affected = new Set<string>();
    const queue = [key];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);

      const node = this.nodes.get(current);
      if (!node) continue;

      for (const dependent of node.dependents) {
        affected.add(dependent);
        queue.push(dependent);
      }
    }

    return affected;
  }

  /**
   * Check if there's a cycle involving the given cell
   */
  hasCycle(key: string): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (current: string): boolean => {
      visited.add(current);
      recursionStack.add(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            if (dfs(dep)) return true;
          } else if (recursionStack.has(dep)) {
            return true; // Cycle detected
          }
        }
      }

      recursionStack.delete(current);
      return false;
    };

    return dfs(key);
  }

  /**
   * Find all cells involved in a cycle containing the given cell
   */
  findCycle(key: string): string[] | null {
    const visited = new Set<string>();
    const recursionStack: string[] = [];
    const path: string[] = [];

    const dfs = (current: string): boolean => {
      visited.add(current);
      recursionStack.push(current);
      path.push(current);

      const node = this.nodes.get(current);
      if (node) {
        for (const dep of node.dependencies) {
          if (!visited.has(dep)) {
            if (dfs(dep)) return true;
          } else if (recursionStack.includes(dep)) {
            // Found cycle - extract it
            const cycleStart = recursionStack.indexOf(dep);
            return true;
          }
        }
      }

      recursionStack.pop();
      return false;
    };

    if (dfs(key)) {
      return path;
    }
    return null;
  }

  /**
   * Get topological order for recalculation
   * Returns cells in order such that dependencies are computed before dependents
   */
  getTopologicalOrder(keys: Set<string>): string[] | null {
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];

    // Initialize in-degrees
    for (const key of keys) {
      const node = this.nodes.get(key);
      if (!node) continue;

      let degree = 0;
      for (const dep of node.dependencies) {
        if (keys.has(dep)) {
          degree++;
        }
      }
      inDegree.set(key, degree);

      if (degree === 0) {
        queue.push(key);
      }
    }

    // Kahn's algorithm
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const node = this.nodes.get(current);
      if (!node) continue;

      for (const dependent of node.dependents) {
        if (!keys.has(dependent)) continue;

        const degree = inDegree.get(dependent)! - 1;
        inDegree.set(dependent, degree);

        if (degree === 0) {
          queue.push(dependent);
        }
      }
    }

    // If not all nodes are in result, there's a cycle
    if (result.length !== keys.size) {
      return null; // Cycle detected
    }

    return result;
  }

  /**
   * Get cells that need to be recalculated when a cell changes
   */
  getRecalcOrder(changedKeys: string[]): string[] {
    const affected = new Set<string>();

    // Get all affected cells
    for (const key of changedKeys) {
      const deps = this.getAffectedCells(key);
      for (const dep of deps) {
        affected.add(dep);
      }
    }

    // Get topological order
    const order = this.getTopologicalOrder(affected);
    return order || Array.from(affected); // Return affected cells even if there's a cycle
  }

  /**
   * Get all cells that have cycles
   */
  getAllCyclicCells(): Set<string> {
    const cyclic = new Set<string>();

    for (const key of this.nodes.keys()) {
      if (this.hasCycle(key)) {
        cyclic.add(key);
      }
    }

    return cyclic;
  }

  /**
   * Clear the entire graph
   */
  clear(): void {
    this.nodes.clear();
  }
}
