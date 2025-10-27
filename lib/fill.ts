// Fill handle logic - adjusts relative references when copying cells
import { parseFormula } from './parser';
import { ASTNode } from '@/types/sheet';
import { parseCellRef, cellRefToA1, adjustRefForFill } from './a1';

/**
 * Adjust a formula when filling cells
 * Relative references are adjusted, absolute references stay fixed
 */
export function adjustFormulaForFill(
  formula: string,
  deltaRow: number,
  deltaCol: number
): string {
  try {
    // Parse the formula
    const ast = parseFormula(formula);
    
    // Adjust all cell references in the AST
    const adjustedAst = adjustASTReferences(ast, deltaRow, deltaCol);
    
    // Convert back to string
    return '=' + astToString(adjustedAst);
  } catch (error) {
    // If parsing fails, return original formula
    return formula;
  }
}

/**
 * Recursively adjust cell references in AST
 */
function adjustASTReferences(node: ASTNode, deltaRow: number, deltaCol: number): ASTNode {
  switch (node.type) {
    case 'CellRef': {
      const ref = parseCellRef(node.cellRef!);
      if (!ref) return node;
      
      const adjusted = adjustRefForFill(ref, deltaRow, deltaCol);
      return {
        ...node,
        cellRef: cellRefToA1(adjusted),
      };
    }
    
    case 'RangeRef': {
      const startRef = parseCellRef(node.start!);
      const endRef = parseCellRef(node.end!);
      
      if (!startRef || !endRef) return node;
      
      const adjustedStart = adjustRefForFill(startRef, deltaRow, deltaCol);
      const adjustedEnd = adjustRefForFill(endRef, deltaRow, deltaCol);
      
      return {
        ...node,
        start: cellRefToA1(adjustedStart),
        end: cellRefToA1(adjustedEnd),
      };
    }
    
    case 'BinaryOp':
      return {
        ...node,
        left: adjustASTReferences(node.left!, deltaRow, deltaCol),
        right: adjustASTReferences(node.right!, deltaRow, deltaCol),
      };
    
    case 'UnaryOp':
      return {
        ...node,
        operand: adjustASTReferences(node.operand!, deltaRow, deltaCol),
      };
    
    case 'FunctionCall':
      return {
        ...node,
        args: node.args?.map(arg => adjustASTReferences(arg, deltaRow, deltaCol)),
      };
    
    default:
      return node;
  }
}

/**
 * Convert AST back to formula string
 */
function astToString(node: ASTNode): string {
  switch (node.type) {
    case 'Number':
      return node.value.toString();
    
    case 'String':
      return `"${node.value}"`;
    
    case 'CellRef':
      return node.cellRef!;
    
    case 'RangeRef':
      return `${node.start}:${node.end}`;
    
    case 'BinaryOp': {
      const left = astToString(node.left!);
      const right = astToString(node.right!);
      
      // Add parentheses for clarity
      const needsParensLeft = needsParentheses(node.left!, node.operator!);
      const needsParensRight = needsParentheses(node.right!, node.operator!);
      
      const leftStr = needsParensLeft ? `(${left})` : left;
      const rightStr = needsParensRight ? `(${right})` : right;
      
      return `${leftStr}${node.operator}${rightStr}`;
    }
    
    case 'UnaryOp':
      return `${node.operator}${astToString(node.operand!)}`;
    
    case 'FunctionCall': {
      const args = node.args?.map(arg => astToString(arg)).join(',') || '';
      return `${node.name}(${args})`;
    }
    
    default:
      return '';
  }
}

/**
 * Check if parentheses are needed for an operand
 */
function needsParentheses(operand: ASTNode, parentOp: string): boolean {
  if (operand.type !== 'BinaryOp') return false;
  
  const opPrecedence: Record<string, number> = {
    '^': 3,
    '*': 2,
    '/': 2,
    '+': 1,
    '-': 1,
  };
  
  const parentPrec = opPrecedence[parentOp] || 0;
  const operandPrec = opPrecedence[operand.operator!] || 0;
  
  // Need parentheses if operand has lower precedence
  return operandPrec < parentPrec;
}

/**
 * Fill cells in a range with a pattern
 * Supports filling down or right from a source cell
 */
export interface FillOptions {
  sourceRow: number;
  sourceCol: number;
  targetStartRow: number;
  targetStartCol: number;
  targetEndRow: number;
  targetEndCol: number;
}

export function generateFillValues(
  sourceValue: string,
  options: FillOptions
): Map<string, string> {
  const result = new Map<string, string>();
  
  const {
    sourceRow,
    sourceCol,
    targetStartRow,
    targetStartCol,
    targetEndRow,
    targetEndCol,
  } = options;
  
  // Determine fill direction
  const isVertical = targetStartCol === sourceCol && targetEndCol === sourceCol;
  const isHorizontal = targetStartRow === sourceRow && targetEndRow === sourceRow;
  
  if (!isVertical && !isHorizontal) {
    // Complex fill not supported yet
    return result;
  }
  
  // Check if source is a formula
  const isFormula = sourceValue.trim().startsWith('=');
  
  if (isVertical) {
    // Fill down
    for (let row = targetStartRow; row <= targetEndRow; row++) {
      const deltaRow = row - sourceRow;
      const key = `r${row}c${sourceCol}`;
      
      if (isFormula) {
        result.set(key, adjustFormulaForFill(sourceValue, deltaRow, 0));
      } else {
        result.set(key, sourceValue); // Copy value as-is
      }
    }
  } else if (isHorizontal) {
    // Fill right
    for (let col = targetStartCol; col <= targetEndCol; col++) {
      const deltaCol = col - sourceCol;
      const key = `r${sourceRow}c${col}`;
      
      if (isFormula) {
        result.set(key, adjustFormulaForFill(sourceValue, 0, deltaCol));
      } else {
        result.set(key, sourceValue); // Copy value as-is
      }
    }
  }
  
  return result;
}
