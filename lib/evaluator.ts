// Formula evaluator - executes parsed AST
import { ASTNode, EvalResult, A1Ref } from '@/types/sheet';
import { parseCellRef, a1ToAddress } from './a1';

export class EvalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvalError';
  }
}

export type CellGetter = (ref: string) => number | string | undefined;

export class Evaluator {
  private usedRefs: Set<A1Ref> = new Set();
  private getCellValue: CellGetter;

  constructor(getCellValue: CellGetter) {
    this.getCellValue = getCellValue;
  }

  evaluate(node: ASTNode): number | string {
    switch (node.type) {
      case 'Number':
        return node.value as number;
      
      case 'String':
        return node.value as string;
      
      case 'CellRef': {
        const ref = node.cellRef!;
        this.usedRefs.add(ref);
        
        const value = this.getCellValue(ref);
        if (value === undefined) return 0; // Empty cell
        return value;
      }
      
      case 'RangeRef': {
        // Ranges return array of values (for functions)
        const start = node.start!;
        const end = node.end!;
        
        this.usedRefs.add(start);
        this.usedRefs.add(end);
        
        const startAddr = a1ToAddress(start.replace(/\$/g, ''));
        const endAddr = a1ToAddress(end.replace(/\$/g, ''));
        
        if (!startAddr || !endAddr) {
          throw new EvalError('#REF!');
        }
        
        const values: (number | string)[] = [];
        const minRow = Math.min(startAddr.row, endAddr.row);
        const maxRow = Math.max(startAddr.row, endAddr.row);
        const minCol = Math.min(startAddr.col, endAddr.col);
        const maxCol = Math.max(startAddr.col, endAddr.col);
        
        for (let row = minRow; row <= maxRow; row++) {
          for (let col = minCol; col <= maxCol; col++) {
            const cellRef = this.addressToRef({ col, row });
            this.usedRefs.add(cellRef);
            const value = this.getCellValue(cellRef);
            if (value !== undefined) {
              values.push(value);
            }
          }
        }
        
        return values as any; // Special case for ranges
      }
      
      case 'BinaryOp': {
        const left = this.evaluate(node.left!);
        const right = this.evaluate(node.right!);
        
        const leftNum = this.toNumber(left);
        const rightNum = this.toNumber(right);
        
        switch (node.operator) {
          case '+':
            return leftNum + rightNum;
          case '-':
            return leftNum - rightNum;
          case '*':
            return leftNum * rightNum;
          case '/':
            if (rightNum === 0) throw new EvalError('#DIV/0!');
            return leftNum / rightNum;
          case '^':
            return Math.pow(leftNum, rightNum);
          default:
            throw new EvalError(`Unknown operator: ${node.operator}`);
        }
      }
      
      case 'FunctionCall':
        return this.evaluateFunction(node.name!, node.args || []);
      
      default:
        throw new EvalError(`Unknown node type: ${(node as any).type}`);
    }
  }

  private toNumber(value: number | string | any[]): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      if (isNaN(num)) throw new EvalError('#VALUE!');
      return num;
    }
    throw new EvalError('#VALUE!');
  }

  private addressToRef(addr: { col: number; row: number }): string {
    const col = String.fromCharCode(65 + (addr.col % 26));
    return col + (addr.row + 1);
  }

  private evaluateFunction(name: string, args: ASTNode[]): number {
    const values = this.collectNumericValues(args);
    
    switch (name) {
      case 'SUM':
        return values.reduce((sum, val) => sum + val, 0);
      
      case 'AVG':
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      
      case 'MIN':
        if (values.length === 0) return 0;
        return Math.min(...values);
      
      case 'MAX':
        if (values.length === 0) return 0;
        return Math.max(...values);
      
      case 'COUNT':
        return values.length;
      
      case 'AVERAGE':
        // Alias for AVG
        if (values.length === 0) return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      
      default:
        throw new EvalError(`Unknown function: ${name}`);
    }
  }

  private collectNumericValues(args: ASTNode[]): number[] {
    const values: number[] = [];
    
    for (const arg of args) {
      const result = this.evaluate(arg);
      
      if (Array.isArray(result)) {
        // Range result
        for (const val of result) {
          const num = this.tryToNumber(val);
          if (num !== null) values.push(num);
        }
      } else {
        const num = this.tryToNumber(result);
        if (num !== null) values.push(num);
      }
    }
    
    return values;
  }

  private tryToNumber(value: number | string): number | null {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const num = parseFloat(value);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  getUsedRefs(): A1Ref[] {
    return Array.from(this.usedRefs);
  }
}

export function evaluateFormula(
  ast: ASTNode,
  getCellValue: CellGetter
): EvalResult {
  const evaluator = new Evaluator(getCellValue);
  
  try {
    const result = evaluator.evaluate(ast);
    const usedRefs = evaluator.getUsedRefs();
    
    if (typeof result === 'number') {
      return {
        value: result,
        text: result.toString(),
        usedRefs,
      };
    } else if (typeof result === 'string') {
      return {
        text: result,
        usedRefs,
      };
    } else {
      return {
        error: '#VALUE!',
        usedRefs,
      };
    }
  } catch (error) {
    if (error instanceof EvalError) {
      return {
        error: error.message,
        usedRefs: evaluator.getUsedRefs(),
      };
    }
    return {
      error: '#ERROR!',
      usedRefs: evaluator.getUsedRefs(),
    };
  }
}
