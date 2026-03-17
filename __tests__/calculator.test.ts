import { describe, it, expect } from 'vitest';
import { add, subtract, multiply, divide } from '../src/calculator.js';

describe('calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(1, 2)).toBe(3);
    });

    it('should add negative numbers', () => {
      expect(add(-1, -2)).toBe(-3);
    });

    it('should add positive and negative numbers', () => {
      expect(add(5, -3)).toBe(2);
    });

    it('should add zero', () => {
      expect(add(5, 0)).toBe(5);
      expect(add(0, 0)).toBe(0);
    });

    it('should add decimal numbers', () => {
      expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('subtract', () => {
    it('should subtract two positive numbers', () => {
      expect(subtract(5, 3)).toBe(2);
    });

    it('should subtract negative numbers', () => {
      expect(subtract(-1, -2)).toBe(1);
    });

    it('should subtract resulting in negative', () => {
      expect(subtract(3, 5)).toBe(-2);
    });

    it('should subtract zero', () => {
      expect(subtract(5, 0)).toBe(5);
    });

    it('should subtract decimal numbers', () => {
      expect(subtract(0.5, 0.2)).toBeCloseTo(0.3);
    });
  });

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12);
    });

    it('should multiply negative numbers', () => {
      expect(multiply(-2, -3)).toBe(6);
    });

    it('should multiply positive and negative numbers', () => {
      expect(multiply(2, -3)).toBe(-6);
    });

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0);
      expect(multiply(0, 0)).toBe(0);
    });

    it('should multiply by one', () => {
      expect(multiply(5, 1)).toBe(5);
      expect(multiply(1, 5)).toBe(5);
    });

    it('should multiply decimal numbers', () => {
      expect(multiply(0.5, 0.4)).toBeCloseTo(0.2);
    });
  });

  describe('divide', () => {
    it('should divide two positive numbers', () => {
      expect(divide(10, 2)).toBe(5);
    });

    it('should divide negative numbers', () => {
      expect(divide(-10, -2)).toBe(5);
    });

    it('should divide positive by negative', () => {
      expect(divide(10, -2)).toBe(-5);
    });

    it('should divide by one', () => {
      expect(divide(5, 1)).toBe(5);
    });

    it('should divide resulting in decimal', () => {
      expect(divide(5, 2)).toBe(2.5);
    });

    it('should throw error when dividing by zero', () => {
      expect(() => divide(5, 0)).toThrow('Division by zero is not allowed');
    });

    it('should throw error when zero divided by zero', () => {
      expect(() => divide(0, 0)).toThrow('Division by zero is not allowed');
    });
  });

  describe('edge cases', () => {
    it('should handle large numbers', () => {
      expect(add(Number.MAX_SAFE_INTEGER, 1)).toBe(Number.MAX_SAFE_INTEGER + 1);
      expect(multiply(1000000, 1000000)).toBe(1000000000000);
    });

    it('should handle very small numbers', () => {
      expect(add(0.000001, 0.000002)).toBeCloseTo(0.000003);
    });
  });
});
