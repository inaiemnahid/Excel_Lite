// Core types for the spreadsheet application

export type CellAddress = { col: number; row: number }; // 0-based
export type A1Ref = string; // e.g., "B12", "$A$1"

export type CellKind = 'empty' | 'text' | 'number' | 'formula' | 'error';

export interface Cell {
  kind: CellKind;
  display: string;     // computed text shown in the grid (cached)
  value?: number;      // computed numeric value (if applicable)
  raw?: string;        // user-entered raw content (for text/number/formula)
  error?: string;      // e.g., '#VALUE!', '#CYCLE!'
}

export interface SheetState {
  cols: number; 
  rows: number;
  cells: Map<string, Cell>; // key: "r{row}c{col}" only stores non-empty cells
  selection: { anchor: CellAddress; focus: CellAddress }; // range
  editing?: { addr: CellAddress; draft: string };
  columnWidths: number[]; // px
}

export interface SelectionRange {
  anchor: CellAddress;
  focus: CellAddress;
}

// Parser & Evaluator types
export type TokenType =
  | 'NUMBER'
  | 'STRING'
  | 'OPERATOR'
  | 'LPAREN'
  | 'RPAREN'
  | 'COMMA'
  | 'COLON'
  | 'CELL_REF'
  | 'IDENTIFIER'
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export type ASTNodeType =
  | 'Number'
  | 'String'
  | 'CellRef'
  | 'RangeRef'
  | 'BinaryOp'
  | 'UnaryOp'
  | 'FunctionCall';

export interface ASTNode {
  type: ASTNodeType;
  value?: any;
  operator?: string;
  left?: ASTNode;
  right?: ASTNode;
  operand?: ASTNode;
  name?: string;
  args?: ASTNode[];
  cellRef?: string;
  start?: string;
  end?: string;
}

export interface EvalResult {
  value?: number;
  text?: string;
  error?: string;
  usedRefs: A1Ref[];
}

export interface CellRef {
  col: number;
  row: number;
  absCol: boolean;
  absRow: boolean;
}
