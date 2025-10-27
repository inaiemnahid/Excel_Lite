import { describe, it, expect } from 'vitest';
import { adjustFormulaForFill } from '@/lib/fill';

describe('Fill utilities', () => {
  describe('adjustFormulaForFill', () => {
    it('adjusts relative references when filling down', () => {
      const result = adjustFormulaForFill('=A1+B1', 1, 0);
      expect(result).toBe('=A2+B2');
    });

    it('adjusts relative references when filling right', () => {
      const result = adjustFormulaForFill('=A1+B1', 0, 1);
      expect(result).toBe('=B1+C1');
    });

    it('keeps absolute column fixed when filling right', () => {
      const result = adjustFormulaForFill('=$A1+B1', 0, 2);
      expect(result).toBe('=$A1+D1');
    });

    it('keeps absolute row fixed when filling down', () => {
      const result = adjustFormulaForFill('=A$1+B2', 3, 0);
      expect(result).toBe('=A$1+B5');
    });

    it('keeps fully absolute reference fixed', () => {
      const result = adjustFormulaForFill('=$A$1+B2', 2, 3);
      expect(result).toBe('=$A$1+E4');
    });

    it('adjusts range references', () => {
      const result = adjustFormulaForFill('=SUM(A1:B2)', 1, 0);
      expect(result).toBe('=SUM(A2:B3)');
    });

    it('handles mixed absolute references in ranges', () => {
      const result = adjustFormulaForFill('=SUM($A1:B$2)', 2, 1);
      expect(result).toBe('=SUM($A3:C$2)');
    });

    it('handles complex formulas', () => {
      const result = adjustFormulaForFill('=($A$1+B2)*C3', 1, 1);
      expect(result).toBe('=($A$1+C3)*D4');
    });

    it('handles nested functions', () => {
      const result = adjustFormulaForFill('=AVG(SUM(A1:A5),MAX(B1:B5))', 1, 0);
      expect(result).toBe('=AVG(SUM(A2:A6),MAX(B2:B6))');
    });

    it('returns original formula if parsing fails', () => {
      const result = adjustFormulaForFill('=INVALID(((', 1, 1);
      expect(result).toBe('=INVALID(((');
    });
  });
});
