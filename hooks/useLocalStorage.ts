import { useEffect, useRef, useCallback } from 'react';
import { SheetState, Cell } from '@/types/sheet';

const STORAGE_KEY = 'sheet-lite:v1';
const SAVE_DEBOUNCE_MS = 500;

export interface SerializedSheet {
  cols: number;
  rows: number;
  cells: Record<string, Cell>;
  columnWidths: number[];
}

/**
 * Hook for persisting sheet state to localStorage
 */
export function useLocalStorage(state: SheetState | null) {
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial state from localStorage
  const loadState = useCallback((): SerializedSheet | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return parsed;
    } catch (error) {
      console.error('Failed to load sheet from localStorage:', error);
      return null;
    }
  }, []);

  // Save state to localStorage (debounced)
  const saveState = useCallback((state: SheetState) => {
    if (typeof window === 'undefined') return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save
    saveTimeoutRef.current = setTimeout(() => {
      try {
        // Convert Map to plain object for serialization
        const cellsObj: Record<string, Cell> = {};
        state.cells.forEach((cell, key) => {
          cellsObj[key] = cell;
        });

        const serialized: SerializedSheet = {
          cols: state.cols,
          rows: state.rows,
          cells: cellsObj,
          columnWidths: state.columnWidths,
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
      } catch (error) {
        console.error('Failed to save sheet to localStorage:', error);
      }
    }, SAVE_DEBOUNCE_MS);
  }, []);

  // Save state whenever it changes
  useEffect(() => {
    if (state) {
      saveState(state);
    }

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, saveState]);

  // Clear saved state
  const clearState = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, []);

  // Export state as JSON
  const exportState = useCallback((state: SheetState): string => {
    const cellsObj: Record<string, Cell> = {};
    state.cells.forEach((cell, key) => {
      cellsObj[key] = cell;
    });

    const serialized: SerializedSheet = {
      cols: state.cols,
      rows: state.rows,
      cells: cellsObj,
      columnWidths: state.columnWidths,
    };

    return JSON.stringify(serialized, null, 2);
  }, []);

  // Import state from JSON
  const importState = useCallback((json: string): SheetState | null => {
    try {
      const parsed: SerializedSheet = JSON.parse(json);
      
      // Validate structure
      if (
        typeof parsed.cols !== 'number' ||
        typeof parsed.rows !== 'number' ||
        !parsed.cells ||
        !Array.isArray(parsed.columnWidths)
      ) {
        throw new Error('Invalid sheet data structure');
      }

      // Convert cells object to Map
      const cellsMap = new Map<string, Cell>();
      Object.entries(parsed.cells).forEach(([key, cell]) => {
        cellsMap.set(key, cell);
      });

      return {
        cols: parsed.cols,
        rows: parsed.rows,
        cells: cellsMap,
        selection: { anchor: { col: 0, row: 0 }, focus: { col: 0, row: 0 } },
        columnWidths: parsed.columnWidths,
      };
    } catch (error) {
      console.error('Failed to import sheet:', error);
      return null;
    }
  }, []);

  return {
    loadState,
    saveState,
    clearState,
    exportState,
    importState,
  };
}
