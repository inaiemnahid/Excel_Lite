import { describe, it, expect } from 'vitest';
import {
  colToLetter,
  letterToCol,
  addressToA1,
  a1ToAddress,
  parseCellRef,
  cellRefToA1,
  cellKey,
  keyToAddress,
  adjustRefForFill,
} from '@/lib/a1';

describe('A1 notation utilities', () => {
  describe('colToLetter', () => {
    it('converts single letter columns', () => {
      expect(colToLetter(0)).toBe('A');
      expect(colToLetter(25)).toBe('Z');
    });

    it('converts double letter columns', () => {
      expect(colToLetter(26)).toBe('AA');
      expect(colToLetter(27)).toBe('AB');
      expect(colToLetter(51)).toBe('AZ');
    });

    it('converts triple letter columns', () => {
      expect(colToLetter(702)).toBe('AAA');
    });
  });

  describe('letterToCol', () => {
    it('converts single letters', () => {
      expect(letterToCol('A')).toBe(0);
      expect(letterToCol('Z')).toBe(25);
    });

    it('converts double letters', () => {
      expect(letterToCol('AA')).toBe(26);
      expect(letterToCol('AB')).toBe(27);
      expect(letterToCol('AZ')).toBe(51);
    });

    it('is case insensitive', () => {
      expect(letterToCol('a')).toBe(0);
      expect(letterToCol('aa')).toBe(26);
    });
  });

  describe('addressToA1 and a1ToAddress', () => {
    it('converts address to A1', () => {
      expect(addressToA1({ col: 0, row: 0 })).toBe('A1');
      expect(addressToA1({ col: 1, row: 0 })).toBe('B1');
      expect(addressToA1({ col: 0, row: 1 })).toBe('A2');
      expect(addressToA1({ col: 26, row: 99 })).toBe('AA100');
    });

    it('converts A1 to address', () => {
      expect(a1ToAddress('A1')).toEqual({ col: 0, row: 0 });
      expect(a1ToAddress('B1')).toEqual({ col: 1, row: 0 });
      expect(a1ToAddress('A2')).toEqual({ col: 0, row: 1 });
      expect(a1ToAddress('AA100')).toEqual({ col: 26, row: 99 });
    });

    it('handles invalid A1 notation', () => {
      expect(a1ToAddress('123')).toBeNull();
      expect(a1ToAddress('ABC')).toBeNull();
      expect(a1ToAddress('')).toBeNull();
    });

    it('round trips correctly', () => {
      const addr = { col: 5, row: 10 };
      expect(a1ToAddress(addressToA1(addr))).toEqual(addr);
    });
  });

  describe('parseCellRef', () => {
    it('parses relative references', () => {
      expect(parseCellRef('A1')).toEqual({
        col: 0,
        row: 0,
        absCol: false,
        absRow: false,
      });
    });

    it('parses absolute column', () => {
      expect(parseCellRef('$A1')).toEqual({
        col: 0,
        row: 0,
        absCol: true,
        absRow: false,
      });
    });

    it('parses absolute row', () => {
      expect(parseCellRef('A$1')).toEqual({
        col: 0,
        row: 0,
        absCol: false,
        absRow: true,
      });
    });

    it('parses fully absolute reference', () => {
      expect(parseCellRef('$A$1')).toEqual({
        col: 0,
        row: 0,
        absCol: true,
        absRow: true,
      });
    });
  });

  describe('cellRefToA1', () => {
    it('converts relative reference', () => {
      expect(cellRefToA1({ col: 0, row: 0, absCol: false, absRow: false })).toBe('A1');
    });

    it('converts absolute column', () => {
      expect(cellRefToA1({ col: 0, row: 0, absCol: true, absRow: false })).toBe('$A1');
    });

    it('converts absolute row', () => {
      expect(cellRefToA1({ col: 0, row: 0, absCol: false, absRow: true })).toBe('A$1');
    });

    it('converts fully absolute reference', () => {
      expect(cellRefToA1({ col: 0, row: 0, absCol: true, absRow: true })).toBe('$A$1');
    });
  });

  describe('cellKey and keyToAddress', () => {
    it('converts address to key', () => {
      expect(cellKey({ col: 0, row: 0 })).toBe('r0c0');
      expect(cellKey({ col: 10, row: 20 })).toBe('r20c10');
    });

    it('converts key to address', () => {
      expect(keyToAddress('r0c0')).toEqual({ col: 0, row: 0 });
      expect(keyToAddress('r20c10')).toEqual({ col: 10, row: 20 });
    });

    it('handles invalid keys', () => {
      expect(keyToAddress('invalid')).toBeNull();
      expect(keyToAddress('r0')).toBeNull();
    });

    it('round trips correctly', () => {
      const addr = { col: 5, row: 10 };
      expect(keyToAddress(cellKey(addr))).toEqual(addr);
    });
  });

  describe('adjustRefForFill', () => {
    it('adjusts relative references', () => {
      const ref = { col: 0, row: 0, absCol: false, absRow: false };
      const adjusted = adjustRefForFill(ref, 2, 3);
      expect(adjusted).toEqual({ col: 3, row: 2, absCol: false, absRow: false });
    });

    it('keeps absolute column fixed', () => {
      const ref = { col: 0, row: 0, absCol: true, absRow: false };
      const adjusted = adjustRefForFill(ref, 2, 3);
      expect(adjusted).toEqual({ col: 0, row: 2, absCol: true, absRow: false });
    });

    it('keeps absolute row fixed', () => {
      const ref = { col: 0, row: 0, absCol: false, absRow: true };
      const adjusted = adjustRefForFill(ref, 2, 3);
      expect(adjusted).toEqual({ col: 3, row: 0, absCol: false, absRow: true });
    });

    it('keeps fully absolute reference fixed', () => {
      const ref = { col: 0, row: 0, absCol: true, absRow: true };
      const adjusted = adjustRefForFill(ref, 2, 3);
      expect(adjusted).toEqual({ col: 0, row: 0, absCol: true, absRow: true });
    });
  });
});
