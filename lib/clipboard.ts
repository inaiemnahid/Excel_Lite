// Clipboard utilities for in-app copy/paste
import { Cell, CellAddress } from '@/types/sheet';
import { cellKey, getRangeCells } from './a1';

export interface ClipboardData {
  cells: Map<string, Cell>;
  range: {
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  };
}

/**
 * Copy cells from a range
 */
export function copyCells(
  cells: Map<string, Cell>,
  anchor: CellAddress,
  focus: CellAddress
): ClipboardData | null {
  const minRow = Math.min(anchor.row, focus.row);
  const maxRow = Math.max(anchor.row, focus.row);
  const minCol = Math.min(anchor.col, focus.col);
  const maxCol = Math.max(anchor.col, focus.col);

  const copiedCells = new Map<string, Cell>();
  const rangeCells = getRangeCells(
    { row: minRow, col: minCol },
    { row: maxRow, col: maxCol }
  );

  for (const addr of rangeCells) {
    const key = cellKey(addr);
    const cell = cells.get(key);
    
    if (cell) {
      // Deep copy the cell
      copiedCells.set(key, { ...cell });
    }
  }

  return {
    cells: copiedCells,
    range: {
      startRow: minRow,
      startCol: minCol,
      endRow: maxRow,
      endCol: maxCol,
    },
  };
}

/**
 * Paste cells to a new location
 * Returns a map of new cell keys to values
 */
export function pasteCells(
  clipboardData: ClipboardData,
  targetAnchor: CellAddress
): Map<string, string> {
  const result = new Map<string, string>();
  
  const { range, cells } = clipboardData;
  const rowOffset = targetAnchor.row - range.startRow;
  const colOffset = targetAnchor.col - range.startCol;

  // Iterate through copied cells and paste at new location
  for (const [key, cell] of cells.entries()) {
    const match = key.match(/^r(\d+)c(\d+)$/);
    if (!match) continue;

    const origRow = parseInt(match[1], 10);
    const origCol = parseInt(match[2], 10);
    
    const newRow = origRow + rowOffset;
    const newCol = origCol + colOffset;
    const newKey = `r${newRow}c${newCol}`;

    // Paste the raw value
    if (cell.raw) {
      result.set(newKey, cell.raw);
    }
  }

  return result;
}

/**
 * Serialize clipboard data to string (for potential system clipboard integration)
 */
export function serializeClipboard(data: ClipboardData): string {
  const rows: string[][] = [];
  const { range } = data;
  
  for (let row = range.startRow; row <= range.endRow; row++) {
    const rowData: string[] = [];
    
    for (let col = range.startCol; col <= range.endCol; col++) {
      const key = `r${row}c${col}`;
      const cell = data.cells.get(key);
      rowData.push(cell?.display || '');
    }
    
    rows.push(rowData);
  }
  
  // Tab-separated values
  return rows.map(row => row.join('\t')).join('\n');
}

/**
 * Parse clipboard string to data structure
 */
export function parseClipboardString(text: string, targetAnchor: CellAddress): Map<string, string> {
  const result = new Map<string, string>();
  const lines = text.split('\n');
  
  for (let rowIdx = 0; rowIdx < lines.length; rowIdx++) {
    const line = lines[rowIdx];
    const cells = line.split('\t');
    
    for (let colIdx = 0; colIdx < cells.length; colIdx++) {
      const value = cells[colIdx].trim();
      if (value) {
        const row = targetAnchor.row + rowIdx;
        const col = targetAnchor.col + colIdx;
        const key = `r${row}c${col}`;
        result.set(key, value);
      }
    }
  }
  
  return result;
}
