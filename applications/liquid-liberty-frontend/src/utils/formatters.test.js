/**
 * Unit tests for formatter utilities
 */

import { describe, it, expect } from 'vitest';
import { formatCategoryTitle } from './formatters';

describe('Formatters', () => {
  describe('formatCategoryTitle', () => {
    it('should convert camelCase to title case', () => {
      expect(formatCategoryTitle('webDevelopment')).toBe('Web Development');
      expect(formatCategoryTitle('graphicDesign')).toBe('Graphic Design');
    });

    it('should handle hyphenated categories', () => {
      expect(formatCategoryTitle('web-development')).toBe('Web Development');
      expect(formatCategoryTitle('graphic-design')).toBe('Graphic Design');
    });

    it('should keep articles and prepositions lowercase', () => {
      expect(formatCategoryTitle('art and design')).toBe('Art and Design');
      expect(formatCategoryTitle('booksAndLiterature')).toBe('Books and Literature');
    });

    it('should capitalize the first word always', () => {
      expect(formatCategoryTitle('the market')).toBe('The Market');
      expect(formatCategoryTitle('a new category')).toBe('A New Category');
    });

    it('should handle empty strings', () => {
      expect(formatCategoryTitle('')).toBe('');
      expect(formatCategoryTitle(null)).toBe('');
      expect(formatCategoryTitle(undefined)).toBe('');
    });

    it('should handle single word categories', () => {
      expect(formatCategoryTitle('books')).toBe('Books');
      expect(formatCategoryTitle('TECHNOLOGY')).toBe('Technology');
    });

    it('should handle already formatted titles', () => {
      expect(formatCategoryTitle('Art and Design')).toBe('Art and Design');
    });

    it('should handle mixed formatting', () => {
      expect(formatCategoryTitle('webDevelopment-and-design')).toBe('Web Development and Design');
    });
  });
});
