import { describe, it, expect } from 'vitest';
import { parseFormula, Tokenizer, Parser } from '@/lib/parser';

describe('Tokenizer', () => {
  it('tokenizes numbers', () => {
    const tokenizer = new Tokenizer('42');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'NUMBER', value: '42', pos: 0 });
  });

  it('tokenizes negative numbers', () => {
    const tokenizer = new Tokenizer('-3.14');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'NUMBER', value: '-3.14', pos: 0 });
  });

  it('tokenizes strings', () => {
    const tokenizer = new Tokenizer('"Hello"');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'STRING', value: 'Hello', pos: 0 });
  });

  it('tokenizes cell references', () => {
    const tokenizer = new Tokenizer('A1');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'CELL_REF', value: 'A1', pos: 0 });
  });

  it('tokenizes absolute cell references', () => {
    const tokenizer = new Tokenizer('$A$1');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'CELL_REF', value: '$A$1', pos: 0 });
  });

  it('tokenizes operators', () => {
    const tokenizer = new Tokenizer('+ - * / ^');
    const tokens = tokenizer.tokenize();
    expect(tokens[0].type).toBe('OPERATOR');
    expect(tokens[0].value).toBe('+');
    expect(tokens[1].value).toBe('-');
    expect(tokens[2].value).toBe('*');
  });

  it('tokenizes function calls', () => {
    const tokenizer = new Tokenizer('SUM(A1:A10)');
    const tokens = tokenizer.tokenize();
    expect(tokens[0]).toEqual({ type: 'IDENTIFIER', value: 'SUM', pos: 0 });
    expect(tokens[1].type).toBe('LPAREN');
    expect(tokens[2].type).toBe('CELL_REF');
    expect(tokens[3].type).toBe('COLON');
    expect(tokens[4].type).toBe('CELL_REF');
    expect(tokens[5].type).toBe('RPAREN');
  });
});

describe('Parser', () => {
  it('parses simple numbers', () => {
    const ast = parseFormula('42');
    expect(ast).toEqual({
      type: 'Number',
      value: 42,
    });
  });

  it('parses addition', () => {
    const ast = parseFormula('1 + 2');
    expect(ast).toEqual({
      type: 'BinaryOp',
      operator: '+',
      left: { type: 'Number', value: 1 },
      right: { type: 'Number', value: 2 },
    });
  });

  it('parses multiplication with precedence', () => {
    const ast = parseFormula('1 + 2 * 3');
    expect(ast.type).toBe('BinaryOp');
    expect(ast.operator).toBe('+');
    expect(ast.left).toEqual({ type: 'Number', value: 1 });
    expect(ast.right?.type).toBe('BinaryOp');
    expect(ast.right?.operator).toBe('*');
  });

  it('parses parentheses', () => {
    const ast = parseFormula('(1 + 2) * 3');
    expect(ast.type).toBe('BinaryOp');
    expect(ast.operator).toBe('*');
    expect(ast.left?.type).toBe('BinaryOp');
    expect(ast.left?.operator).toBe('+');
  });

  it('parses exponentiation (right associative)', () => {
    const ast = parseFormula('2 ^ 3 ^ 2');
    expect(ast.type).toBe('BinaryOp');
    expect(ast.operator).toBe('^');
    expect(ast.left).toEqual({ type: 'Number', value: 2 });
    expect(ast.right?.type).toBe('BinaryOp');
    expect(ast.right?.operator).toBe('^');
  });

  it('parses cell references', () => {
    const ast = parseFormula('A1 + B2');
    expect(ast.type).toBe('BinaryOp');
    expect(ast.left).toEqual({ type: 'CellRef', cellRef: 'A1' });
    expect(ast.right).toEqual({ type: 'CellRef', cellRef: 'B2' });
  });

  it('parses absolute cell references', () => {
    const ast = parseFormula('$A$1 + B$2');
    expect(ast.left).toEqual({ type: 'CellRef', cellRef: '$A$1' });
    expect(ast.right).toEqual({ type: 'CellRef', cellRef: 'B$2' });
  });

  it('parses ranges', () => {
    const ast = parseFormula('SUM(A1:A10)');
    expect(ast.type).toBe('FunctionCall');
    expect(ast.name).toBe('SUM');
    expect(ast.args?.[0]).toEqual({
      type: 'RangeRef',
      start: 'A1',
      end: 'A10',
    });
  });

  it('parses functions with multiple arguments', () => {
    const ast = parseFormula('SUM(A1, B2, C3)');
    expect(ast.type).toBe('FunctionCall');
    expect(ast.name).toBe('SUM');
    expect(ast.args?.length).toBe(3);
  });

  it('parses nested functions', () => {
    const ast = parseFormula('SUM(AVG(A1:A5), MAX(B1:B5))');
    expect(ast.type).toBe('FunctionCall');
    expect(ast.name).toBe('SUM');
    expect(ast.args?.[0].type).toBe('FunctionCall');
    expect(ast.args?.[0].name).toBe('AVG');
  });

  it('removes leading = sign', () => {
    const ast1 = parseFormula('=42');
    const ast2 = parseFormula('42');
    expect(ast1).toEqual(ast2);
  });
});
