// A1 notation converter utilities
import { CellAddress, CellRef } from '@/types/sheet';

/**
 * Convert column index (0-based) to column letter(s)
 * 0 -> A, 25 -> Z, 26 -> AA, etc.
 */
export function colToLetter(col: number): string {
  let result = '';
  let num = col + 1; // Convert to 1-based
  
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  
  return result;
}

/**
 * Convert column letter(s) to index (0-based)
 * A -> 0, Z -> 25, AA -> 26, etc.
 */
export function letterToCol(letters: string): number {
  let result = 0;
  const upper = letters.toUpperCase();
  
  for (let i = 0; i < upper.length; i++) {
    const charCode = upper.charCodeAt(i) - 64; // A=1, B=2, etc.
    result = result * 26 + charCode;
  }
  
  return result - 1; // Convert to 0-based
}

/**
 * Convert cell address to A1 notation
 * { col: 0, row: 0 } -> "A1"
 */
export function addressToA1(addr: CellAddress): string {
  return colToLetter(addr.col) + (addr.row + 1);
}

/**
 * Convert A1 notation to cell address
 * "A1" -> { col: 0, row: 0 }
 * Returns null if invalid
 */
export function a1ToAddress(a1: string): CellAddress | null {
  const match = a1.match(/^([A-Z]+)(\d+)$/i);
  if (!match) return null;
  
  const col = letterToCol(match[1]);
  const row = parseInt(match[2], 10) - 1; // Convert to 0-based
  
  if (row < 0 || col < 0) return null;
  
  return { col, row };
}

/**
 * Parse cell reference with absolute markers
 * "$A$1" -> { col: 0, row: 0, absCol: true, absRow: true }
 * "A$1" -> { col: 0, row: 0, absCol: false, absRow: true }
 */
export function parseCellRef(ref: string): CellRef | null {
  const match = ref.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/i);
  if (!match) return null;
  
  const absCol = match[1] === '$';
  const colLetter = match[2];
  const absRow = match[3] === '$';
  const rowNum = match[4];
  
  const col = letterToCol(colLetter);
  const row = parseInt(rowNum, 10) - 1; // Convert to 0-based
  
  if (row < 0 || col < 0) return null;
  
  return { col, row, absCol, absRow };
}

/**
 * Convert cell reference to A1 notation with absolute markers
 */
export function cellRefToA1(ref: CellRef): string {
  const colStr = (ref.absCol ? '$' : '') + colToLetter(ref.col);
  const rowStr = (ref.absRow ? '$' : '') + (ref.row + 1);
  return colStr + rowStr;
}

/**
 * Generate cell key for Map storage
 * { col: 0, row: 0 } -> "r0c0"
 */
export function cellKey(addr: CellAddress): string {
  return `r${addr.row}c${addr.col}`;
}

/**
 * Parse cell key back to address
 * "r0c0" -> { col: 0, row: 0 }
 */
export function keyToAddress(key: string): CellAddress | null {
  const match = key.match(/^r(\d+)c(\d+)$/);
  if (!match) return null;
  
  return {
    row: parseInt(match[1], 10),
    col: parseInt(match[2], 10),
  };
}

/**
 * Check if address is within bounds
 */
export function isValidAddress(addr: CellAddress, maxCols: number, maxRows: number): boolean {
  return addr.col >= 0 && addr.col < maxCols && addr.row >= 0 && addr.row < maxRows;
}

/**
 * Get all cells in a range (inclusive)
 */
export function getRangeCells(start: CellAddress, end: CellAddress): CellAddress[] {
  const cells: CellAddress[] = [];
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);
  const minCol = Math.min(start.col, end.col);
  const maxCol = Math.max(start.col, end.col);
  
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      cells.push({ row, col });
    }
  }
  
  return cells;
}

/**
 * Adjust cell reference for fill operation
 */
export function adjustRefForFill(
  ref: CellRef,
  deltaRow: number,
  deltaCol: number
): CellRef {
  return {
    col: ref.absCol ? ref.col : ref.col + deltaCol,
    row: ref.absRow ? ref.row : ref.row + deltaRow,
    absCol: ref.absCol,
    absRow: ref.absRow,
  };
}
