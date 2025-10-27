import { useMemo, useCallback } from 'react';

const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 28;
const HEADER_WIDTH = 50;
const HEADER_HEIGHT = 32;

/**
 * Hook for grid measurements and layout calculations
 */
export function useGridMeasurements(
  cols: number,
  rows: number,
  columnWidths: number[]
) {
  // Get column width
  const getColumnWidth = useCallback(
    (col: number): number => {
      return columnWidths[col] || DEFAULT_COL_WIDTH;
    },
    [columnWidths]
  );

  // Get row height (currently uniform)
  const getRowHeight = useCallback((): number => {
    return DEFAULT_ROW_HEIGHT;
  }, []);

  // Calculate total grid width
  const totalWidth = useMemo(() => {
    let width = HEADER_WIDTH; // Row header
    for (let col = 0; col < cols; col++) {
      width += getColumnWidth(col);
    }
    return width;
  }, [cols, getColumnWidth]);

  // Calculate total grid height
  const totalHeight = useMemo(() => {
    return HEADER_HEIGHT + rows * DEFAULT_ROW_HEIGHT;
  }, [rows]);

  // Get column offset (x position)
  const getColumnOffset = useCallback(
    (col: number): number => {
      let offset = HEADER_WIDTH;
      for (let i = 0; i < col; i++) {
        offset += getColumnWidth(i);
      }
      return offset;
    },
    [getColumnWidth]
  );

  // Get row offset (y position)
  const getRowOffset = useCallback((row: number): number => {
    return HEADER_HEIGHT + row * DEFAULT_ROW_HEIGHT;
  }, []);

  // Find column at x position
  const getColumnAtX = useCallback(
    (x: number): number => {
      let offset = HEADER_WIDTH;
      for (let col = 0; col < cols; col++) {
        const width = getColumnWidth(col);
        if (x >= offset && x < offset + width) {
          return col;
        }
        offset += width;
      }
      return -1;
    },
    [cols, getColumnWidth]
  );

  // Find row at y position
  const getRowAtY = useCallback(
    (y: number): number => {
      if (y < HEADER_HEIGHT) return -1;
      const row = Math.floor((y - HEADER_HEIGHT) / DEFAULT_ROW_HEIGHT);
      return row >= 0 && row < rows ? row : -1;
    },
    [rows]
  );

  // Get visible range for virtualization
  const getVisibleRange = useCallback(
    (
      scrollLeft: number,
      scrollTop: number,
      viewportWidth: number,
      viewportHeight: number
    ) => {
      // Find visible columns
      let startCol = 0;
      let offset = HEADER_WIDTH;
      for (let col = 0; col < cols; col++) {
        if (offset >= scrollLeft) {
          startCol = col;
          break;
        }
        offset += getColumnWidth(col);
      }

      let endCol = startCol;
      offset = getColumnOffset(startCol);
      while (endCol < cols && offset < scrollLeft + viewportWidth) {
        offset += getColumnWidth(endCol);
        endCol++;
      }
      endCol = Math.min(endCol, cols - 1);

      // Find visible rows
      const startRow = Math.max(
        0,
        Math.floor((scrollTop - HEADER_HEIGHT) / DEFAULT_ROW_HEIGHT)
      );
      const endRow = Math.min(
        rows - 1,
        Math.floor((scrollTop + viewportHeight - HEADER_HEIGHT) / DEFAULT_ROW_HEIGHT)
      );

      return {
        startCol,
        endCol,
        startRow,
        endRow,
      };
    },
    [cols, rows, getColumnWidth, getColumnOffset]
  );

  return {
    getColumnWidth,
    getRowHeight,
    getColumnOffset,
    getRowOffset,
    getColumnAtX,
    getRowAtY,
    getVisibleRange,
    totalWidth,
    totalHeight,
    headerWidth: HEADER_WIDTH,
    headerHeight: HEADER_HEIGHT,
    defaultRowHeight: DEFAULT_ROW_HEIGHT,
    defaultColWidth: DEFAULT_COL_WIDTH,
  };
}
