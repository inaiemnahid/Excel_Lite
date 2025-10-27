import { useCallback } from 'react';
import { CellAddress, SelectionRange } from '@/types/sheet';

/**
 * Hook for managing cell selection and range operations
 */
export function useSelection() {
  // Check if a cell is in the current selection range
  const isInSelection = useCallback(
    (addr: CellAddress, selection: SelectionRange): boolean => {
      const minRow = Math.min(selection.anchor.row, selection.focus.row);
      const maxRow = Math.max(selection.anchor.row, selection.focus.row);
      const minCol = Math.min(selection.anchor.col, selection.focus.col);
      const maxCol = Math.max(selection.anchor.col, selection.focus.col);

      return (
        addr.row >= minRow &&
        addr.row <= maxRow &&
        addr.col >= minCol &&
        addr.col <= maxCol
      );
    },
    []
  );

  // Check if a cell is the active cell (focus)
  const isActiveCell = useCallback(
    (addr: CellAddress, selection: SelectionRange): boolean => {
      return addr.row === selection.focus.row && addr.col === selection.focus.col;
    },
    []
  );

  // Get selection bounds
  const getSelectionBounds = useCallback((selection: SelectionRange) => {
    return {
      minRow: Math.min(selection.anchor.row, selection.focus.row),
      maxRow: Math.max(selection.anchor.row, selection.focus.row),
      minCol: Math.min(selection.anchor.col, selection.focus.col),
      maxCol: Math.max(selection.anchor.col, selection.focus.col),
    };
  }, []);

  // Move selection in a direction
  const moveSelection = useCallback(
    (
      current: CellAddress,
      direction: 'up' | 'down' | 'left' | 'right' | 'home' | 'end' | 'pageup' | 'pagedown',
      maxCols: number,
      maxRows: number,
      pageSize: number = 10
    ): CellAddress => {
      let { row, col } = current;

      switch (direction) {
        case 'up':
          row = Math.max(0, row - 1);
          break;
        case 'down':
          row = Math.min(maxRows - 1, row + 1);
          break;
        case 'left':
          col = Math.max(0, col - 1);
          break;
        case 'right':
          col = Math.min(maxCols - 1, col + 1);
          break;
        case 'home':
          col = 0;
          break;
        case 'end':
          col = maxCols - 1;
          break;
        case 'pageup':
          row = Math.max(0, row - pageSize);
          break;
        case 'pagedown':
          row = Math.min(maxRows - 1, row + pageSize);
          break;
      }

      return { row, col };
    },
    []
  );

  // Extend selection (for Shift+arrow)
  const extendSelection = useCallback(
    (
      selection: SelectionRange,
      direction: 'up' | 'down' | 'left' | 'right',
      maxCols: number,
      maxRows: number
    ): SelectionRange => {
      const newFocus = moveSelection(selection.focus, direction, maxCols, maxRows, 0);
      return {
        anchor: selection.anchor,
        focus: newFocus,
      };
    },
    [moveSelection]
  );

  // Get all cells in selection range
  const getSelectionCells = useCallback((selection: SelectionRange): CellAddress[] => {
    const cells: CellAddress[] = [];
    const bounds = getSelectionBounds(selection);

    for (let row = bounds.minRow; row <= bounds.maxRow; row++) {
      for (let col = bounds.minCol; col <= bounds.maxCol; col++) {
        cells.push({ row, col });
      }
    }

    return cells;
  }, [getSelectionBounds]);

  // Get selection size
  const getSelectionSize = useCallback((selection: SelectionRange) => {
    const bounds = getSelectionBounds(selection);
    return {
      rows: bounds.maxRow - bounds.minRow + 1,
      cols: bounds.maxCol - bounds.minCol + 1,
    };
  }, [getSelectionBounds]);

  return {
    isInSelection,
    isActiveCell,
    getSelectionBounds,
    moveSelection,
    extendSelection,
    getSelectionCells,
    getSelectionSize,
  };
}
