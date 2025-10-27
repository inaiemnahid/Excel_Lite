import { describe, it, expect } from 'vitest';
import { evaluateFormula, Evaluator } from '@/lib/evaluator';
import { parseFormula } from '@/lib/parser';

describe('Evaluator', () => {
  it('evaluates simple numbers', () => {
    const ast = parseFormula('42');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(42);
    expect(result.text).toBe('42');
  });

  it('evaluates addition', () => {
    const ast = parseFormula('1 + 2');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(3);
  });

  it('evaluates subtraction', () => {
    const ast = parseFormula('5 - 3');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(2);
  });

  it('evaluates multiplication', () => {
    const ast = parseFormula('3 * 4');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(12);
  });

  it('evaluates division', () => {
    const ast = parseFormula('10 / 2');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(5);
  });

  it('handles division by zero', () => {
    const ast = parseFormula('10 / 0');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.error).toBe('#DIV/0!');
  });

  it('evaluates exponentiation', () => {
    const ast = parseFormula('2 ^ 3');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(8);
  });

  it('respects operator precedence', () => {
    const ast = parseFormula('1 + 2 * 3');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(7);
  });

  it('respects parentheses', () => {
    const ast = parseFormula('(1 + 2) * 3');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(9);
  });

  it('evaluates cell references', () => {
    const ast = parseFormula('A1 + B2');
    const getCellValue = (ref: string) => {
      if (ref === 'A1') return 10;
      if (ref === 'B2') return 20;
      return undefined;
    };
    const result = evaluateFormula(ast, getCellValue);
    expect(result.value).toBe(30);
    expect(result.usedRefs).toContain('A1');
    expect(result.usedRefs).toContain('B2');
  });

  it('treats empty cells as zero', () => {
    const ast = parseFormula('A1 + 5');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(5);
  });

  it('evaluates SUM function', () => {
    const ast = parseFormula('SUM(1, 2, 3)');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(6);
  });

  it('evaluates AVG function', () => {
    const ast = parseFormula('AVG(10, 20, 30)');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(20);
  });

  it('evaluates MIN function', () => {
    const ast = parseFormula('MIN(5, 2, 8, 1)');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(1);
  });

  it('evaluates MAX function', () => {
    const ast = parseFormula('MAX(5, 2, 8, 1)');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.value).toBe(8);
  });

  it('handles type coercion in arithmetic', () => {
    const ast = parseFormula('A1 + 2');
    const getCellValue = (ref: string) => {
      if (ref === 'A1') return '3'; // String "3"
      return undefined;
    };
    const result = evaluateFormula(ast, getCellValue);
    expect(result.value).toBe(5); // "3" + 2 = 5
  });

  it('handles invalid type coercion', () => {
    const ast = parseFormula('A1 + 2');
    const getCellValue = (ref: string) => {
      if (ref === 'A1') return 'abc'; // Invalid number
      return undefined;
    };
    const result = evaluateFormula(ast, getCellValue);
    expect(result.error).toBe('#VALUE!');
  });

  it('evaluates strings', () => {
    const ast = parseFormula('"Hello"');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.text).toBe('Hello');
  });

  it('handles unknown functions', () => {
    const ast = parseFormula('UNKNOWN(1, 2)');
    const result = evaluateFormula(ast, () => undefined);
    expect(result.error).toBe('Unknown function: UNKNOWN');
  });
});
