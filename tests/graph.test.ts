import { describe, it, expect } from 'vitest';
import { DependencyGraph } from '@/lib/graph';

describe('DependencyGraph', () => {
  it('creates nodes and tracks dependencies', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1', 'r0c2']);
    
    const affected = graph.getAffectedCells('r0c1');
    expect(affected.has('r0c0')).toBe(true);
  });

  it('updates dependencies when cell changes', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c0', ['r0c2']); // Change dependency
    
    const affected1 = graph.getAffectedCells('r0c1');
    const affected2 = graph.getAffectedCells('r0c2');
    
    expect(affected1.has('r0c0')).toBe(false);
    expect(affected2.has('r0c0')).toBe(true);
  });

  it('detects direct cycles', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c0']); // Self-reference
    
    expect(graph.hasCycle('r0c0')).toBe(true);
  });

  it('detects indirect cycles', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c1', ['r0c2']);
    graph.updateCell('r0c2', ['r0c0']); // Cycle: r0c0 -> r0c1 -> r0c2 -> r0c0
    
    expect(graph.hasCycle('r0c0')).toBe(true);
    expect(graph.hasCycle('r0c1')).toBe(true);
    expect(graph.hasCycle('r0c2')).toBe(true);
  });

  it('does not detect cycles in acyclic graph', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c1', ['r0c2']);
    graph.updateCell('r0c3', ['r0c2']);
    
    expect(graph.hasCycle('r0c0')).toBe(false);
    expect(graph.hasCycle('r0c1')).toBe(false);
    expect(graph.hasCycle('r0c2')).toBe(false);
  });

  it('gets all affected cells', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c2', ['r0c0']); // r0c1 -> r0c0 -> r0c2
    graph.updateCell('r0c3', ['r0c2']); // r0c1 -> r0c0 -> r0c2 -> r0c3
    
    const affected = graph.getAffectedCells('r0c1');
    expect(affected.size).toBe(3);
    expect(affected.has('r0c0')).toBe(true);
    expect(affected.has('r0c2')).toBe(true);
    expect(affected.has('r0c3')).toBe(true);
  });

  it('returns topological order for acyclic graph', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c2', ['r0c0', 'r0c1']);
    
    const cells = new Set(['r0c0', 'r0c1', 'r0c2']);
    const order = graph.getTopologicalOrder(cells);
    
    expect(order).not.toBeNull();
    expect(order?.length).toBe(3);
    
    // r0c1 should come before r0c0 and r0c2
    const idx1 = order!.indexOf('r0c1');
    const idx0 = order!.indexOf('r0c0');
    const idx2 = order!.indexOf('r0c2');
    
    expect(idx1).toBeLessThan(idx0);
    expect(idx0).toBeLessThan(idx2);
  });

  it('returns null for cyclic graph in topological order', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c1', ['r0c0']); // Cycle
    
    const cells = new Set(['r0c0', 'r0c1']);
    const order = graph.getTopologicalOrder(cells);
    
    expect(order).toBeNull();
  });

  it('removes cell and updates dependencies', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c2', ['r0c0']);
    
    graph.removeCell('r0c0');
    
    const affected = graph.getAffectedCells('r0c1');
    expect(affected.has('r0c0')).toBe(false);
    expect(affected.has('r0c2')).toBe(false);
  });

  it('gets recalc order for changed cells', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c2', ['r0c0']);
    graph.updateCell('r0c3', ['r0c2']);
    
    const order = graph.getRecalcOrder(['r0c1']);
    
    expect(order.length).toBe(3);
    expect(order).toContain('r0c0');
    expect(order).toContain('r0c2');
    expect(order).toContain('r0c3');
  });

  it('clears the graph', () => {
    const graph = new DependencyGraph();
    graph.updateCell('r0c0', ['r0c1']);
    graph.updateCell('r0c2', ['r0c0']);
    
    graph.clear();
    
    const affected = graph.getAffectedCells('r0c1');
    expect(affected.size).toBe(0);
  });
});
