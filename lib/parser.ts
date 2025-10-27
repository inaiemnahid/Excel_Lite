// Formula parser - tokenizer and parser for spreadsheet formulas
import { Token, TokenType, ASTNode } from '@/types/sheet';

export class ParseError extends Error {
  constructor(message: string, public pos: number = 0) {
    super(message);
    this.name = 'ParseError';
  }
}

export class Tokenizer {
  private pos = 0;
  private input: string;

  constructor(input: string) {
    this.input = input.trim();
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      
      // Skip whitespace
      if (/\s/.test(char)) {
        this.pos++;
        continue;
      }
      
      // Numbers
      if (/\d/.test(char) || (char === '-' && /\d/.test(this.peek()))) {
        tokens.push(this.readNumber());
        continue;
      }
      
      // Strings
      if (char === '"') {
        tokens.push(this.readString());
        continue;
      }
      
      // Operators
      if ('+-*/^'.includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char, pos: this.pos });
        this.pos++;
        continue;
      }
      
      // Parentheses
      if (char === '(') {
        tokens.push({ type: 'LPAREN', value: char, pos: this.pos });
        this.pos++;
        continue;
      }
      
      if (char === ')') {
        tokens.push({ type: 'RPAREN', value: char, pos: this.pos });
        this.pos++;
        continue;
      }
      
      // Comma
      if (char === ',') {
        tokens.push({ type: 'COMMA', value: char, pos: this.pos });
        this.pos++;
        continue;
      }
      
      // Colon (for ranges)
      if (char === ':') {
        tokens.push({ type: 'COLON', value: char, pos: this.pos });
        this.pos++;
        continue;
      }
      
      // Cell references or identifiers
      if (char === '$' || /[A-Za-z]/.test(char)) {
        const token = this.readIdentifierOrCellRef();
        tokens.push(token);
        continue;
      }
      
      throw new ParseError(`Unexpected character: ${char}`, this.pos);
    }
    
    tokens.push({ type: 'EOF', value: '', pos: this.pos });
    return tokens;
  }

  private peek(offset: number = 1): string {
    return this.input[this.pos + offset] || '';
  }

  private readNumber(): Token {
    const start = this.pos;
    let hasDecimal = false;
    
    if (this.input[this.pos] === '-') {
      this.pos++;
    }
    
    while (this.pos < this.input.length) {
      const char = this.input[this.pos];
      
      if (/\d/.test(char)) {
        this.pos++;
      } else if (char === '.' && !hasDecimal) {
        hasDecimal = true;
        this.pos++;
      } else {
        break;
      }
    }
    
    const value = this.input.substring(start, this.pos);
    return { type: 'NUMBER', value, pos: start };
  }

  private readString(): Token {
    const start = this.pos;
    this.pos++; // Skip opening quote
    
    let value = '';
    while (this.pos < this.input.length && this.input[this.pos] !== '"') {
      value += this.input[this.pos];
      this.pos++;
    }
    
    if (this.pos >= this.input.length) {
      throw new ParseError('Unterminated string', start);
    }
    
    this.pos++; // Skip closing quote
    return { type: 'STRING', value, pos: start };
  }

  private readIdentifierOrCellRef(): Token {
    const start = this.pos;
    let value = '';
    
    // Check for cell reference pattern: [$]COL[$]ROW
    const remaining = this.input.substring(this.pos);
    const cellRefMatch = remaining.match(/^(\$?)([A-Z]+)(\$?)(\d+)/i);
    
    if (cellRefMatch) {
      value = cellRefMatch[0];
      this.pos += value.length;
      return { type: 'CELL_REF', value, pos: start };
    }
    
    // Otherwise, read identifier
    while (this.pos < this.input.length && /[A-Za-z0-9_]/.test(this.input[this.pos])) {
      value += this.input[this.pos];
      this.pos++;
    }
    
    return { type: 'IDENTIFIER', value, pos: start };
  }
}

export class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ASTNode {
    const result = this.parseExpression();
    
    if (this.current().type !== 'EOF') {
      throw new ParseError(`Unexpected token: ${this.current().value}`, this.current().pos);
    }
    
    return result;
  }

  private current(): Token {
    return this.tokens[this.pos] || this.tokens[this.tokens.length - 1];
  }

  private consume(expected?: TokenType): Token {
    const token = this.current();
    
    if (expected && token.type !== expected) {
      throw new ParseError(`Expected ${expected}, got ${token.type}`, token.pos);
    }
    
    this.pos++;
    return token;
  }

  private peek(): Token {
    return this.tokens[this.pos + 1] || this.tokens[this.tokens.length - 1];
  }

  // expression := term (("+"|"-") term)*
  private parseExpression(): ASTNode {
    let left = this.parseTerm();
    
    while (this.current().type === 'OPERATOR' && '+-'.includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseTerm();
      left = {
        type: 'BinaryOp',
        operator,
        left,
        right,
      };
    }
    
    return left;
  }

  // term := factor (("*"|"/") factor)*
  private parseTerm(): ASTNode {
    let left = this.parseFactor();
    
    while (this.current().type === 'OPERATOR' && '*/'.includes(this.current().value)) {
      const operator = this.consume().value;
      const right = this.parseFactor();
      left = {
        type: 'BinaryOp',
        operator,
        left,
        right,
      };
    }
    
    return left;
  }

  // factor := power ("^" factor)?
  private parseFactor(): ASTNode {
    let left = this.parsePower();
    
    if (this.current().type === 'OPERATOR' && this.current().value === '^') {
      this.consume();
      const right = this.parseFactor(); // Right associative
      return {
        type: 'BinaryOp',
        operator: '^',
        left,
        right,
      };
    }
    
    return left;
  }

  // power := primary
  private parsePower(): ASTNode {
    return this.parsePrimary();
  }

  // primary := NUMBER | STRING | cellRef | rangeRef | functionCall | "(" expression ")"
  private parsePrimary(): ASTNode {
    const token = this.current();
    
    // Number
    if (token.type === 'NUMBER') {
      this.consume();
      return {
        type: 'Number',
        value: parseFloat(token.value),
      };
    }
    
    // String
    if (token.type === 'STRING') {
      this.consume();
      return {
        type: 'String',
        value: token.value,
      };
    }
    
    // Parenthesized expression
    if (token.type === 'LPAREN') {
      this.consume();
      const expr = this.parseExpression();
      this.consume('RPAREN');
      return expr;
    }
    
    // Cell reference or range or function call
    if (token.type === 'CELL_REF') {
      const cellRef = this.consume().value;
      
      // Check for range
      if (this.current().type === 'COLON') {
        this.consume();
        const endRef = this.consume('CELL_REF').value;
        return {
          type: 'RangeRef',
          start: cellRef,
          end: endRef,
        };
      }
      
      return {
        type: 'CellRef',
        cellRef,
      };
    }
    
    // Function call
    if (token.type === 'IDENTIFIER') {
      const name = this.consume().value;
      
      if (this.current().type === 'LPAREN') {
        this.consume();
        const args: ASTNode[] = [];
        
        if (this.current().type !== 'RPAREN') {
          args.push(this.parseExpression());
          
          while (this.current().type === 'COMMA') {
            this.consume();
            args.push(this.parseExpression());
          }
        }
        
        this.consume('RPAREN');
        
        return {
          type: 'FunctionCall',
          name: name.toUpperCase(),
          args,
        };
      }
      
      // Identifier without parentheses - treat as error
      throw new ParseError(`Unexpected identifier: ${name}`, token.pos);
    }
    
    throw new ParseError(`Unexpected token: ${token.value}`, token.pos);
  }
}

export function parseFormula(formula: string): ASTNode {
  // Remove leading = if present
  const cleanFormula = formula.trim().startsWith('=') ? formula.trim().substring(1) : formula.trim();
  
  const tokenizer = new Tokenizer(cleanFormula);
  const tokens = tokenizer.tokenize();
  
  const parser = new Parser(tokens);
  return parser.parse();
}
