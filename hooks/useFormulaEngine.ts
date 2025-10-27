import { useCallback, useMemo } from 'react';
import { Cell, CellAddress, EvalResult } from '@/types/sheet';
import { parseFormula, ParseError } from '@/lib/parser';
import { evaluateFormula, CellGetter } from '@/lib/evaluator';
import { DependencyGraph } from '@/lib/graph';
import { cellKey, a1ToAddress } from '@/lib/a1';

/**
 * Hook for formula parsing, evaluation, and dependency management
 */
export function useFormulaEngine(
  cells: Map<string, Cell>,
  dependencyGraph: DependencyGraph
) {
  // Get cell value for evaluation
  const getCellValue = useCallback(
    (ref: string): number | string | undefined => {
      const addr = a1ToAddress(ref.replace(/\$/g, '')); // Remove $ signs
      if (!addr) return undefined;

      const key = cellKey(addr);
      const cell = cells.get(key);
      
      if (!cell || cell.kind === 'empty') return undefined;
      if (cell.kind === 'error') return undefined;
      if (cell.kind === 'number' && cell.value !== undefined) return cell.value;
      if (cell.kind === 'text' && cell.raw) return cell.raw;
      if (cell.kind === 'formula' && cell.value !== undefined) return cell.value;
      
      return undefined;
    },
    [cells]
  );

  // Process a cell's raw input and determine its type
  const processCell = useCallback(
    (raw: string, addr: CellAddress): Cell => {
      const trimmed = raw.trim();
      
      // Empty cell
      if (!trimmed) {
        return {
          kind: 'empty',
          display: '',
        };
      }

      // Formula (starts with =)
      if (trimmed.startsWith('=')) {
        try {
          const ast = parseFormula(trimmed);
          const result = evaluateFormula(ast, getCellValue);

          const key = cellKey(addr);
          
          // Update dependencies
          const usedKeys = result.usedRefs.map(ref => {
            const refAddr = a1ToAddress(ref.replace(/\$/g, ''));
            return refAddr ? cellKey(refAddr) : ref;
          });
          dependencyGraph.updateCell(key, usedKeys);

          // Check for cycles
          if (dependencyGraph.hasCycle(key)) {
            return {
              kind: 'error',
              display: '#CYCLE!',
              error: '#CYCLE!',
              raw: trimmed,
            };
          }

          // Return result
          if (result.error) {
            return {
              kind: 'error',
              display: result.error,
              error: result.error,
              raw: trimmed,
            };
          }

          return {
            kind: 'formula',
            display: result.text || result.value?.toString() || '',
            value: result.value,
            raw: trimmed,
          };
        } catch (error) {
          const errorMsg = error instanceof ParseError ? error.message : '#ERROR!';
          return {
            kind: 'error',
            display: '#ERROR!',
            error: errorMsg,
            raw: trimmed,
          };
        }
      }

      // Try parsing as number
      const num = parseFloat(trimmed);
      if (!isNaN(num) && trimmed === num.toString()) {
        return {
          kind: 'number',
          display: trimmed,
          value: num,
          raw: trimmed,
        };
      }

      // Treat as text
      return {
        kind: 'text',
        display: trimmed,
        raw: trimmed,
      };
    },
    [getCellValue, dependencyGraph]
  );

  // Recalculate cells that depend on changed cells
  const recalculateDependents = useCallback(
    (changedKeys: string[]): Map<string, Cell> => {
      const updatedCells = new Map<string, Cell>();
      
      // Get cells that need recalculation in topological order
      const recalcKeys = dependencyGraph.getRecalcOrder(changedKeys);
      
      // Recalculate each cell
      for (const key of recalcKeys) {
        const cell = cells.get(key);
        if (!cell || !cell.raw) continue;

        const addr = a1ToAddress(key.replace(/^r(\d+)c(\d+)$/, (_, r, c) => {
          const row = parseInt(r, 10) + 1;
          const col = String.fromCharCode(65 + parseInt(c, 10));
          return col + row;
        }));
        
        if (!addr) continue;

        // Reprocess the cell
        const newCell = processCell(cell.raw, addr);
        updatedCells.set(key, newCell);
      }

      return updatedCells;
    },
    [cells, dependencyGraph, processCell]
  );

  return {
    processCell,
    recalculateDependents,
    getCellValue,
  };
}
