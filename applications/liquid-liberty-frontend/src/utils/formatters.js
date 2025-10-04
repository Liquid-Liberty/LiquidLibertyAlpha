// Utility functions for text formatting

/**
 * Convert a category string to proper title case
 * Handles camelCase, hyphen-separated, and keeps articles/prepositions lowercase
 * @param {string} category - The category string to format
 * @returns {string} Properly formatted title case string
 */
export const formatCategoryTitle = (category) => {
  if (!category) return '';

  // Words that should remain lowercase (unless they're the first word)
  const lowercaseWords = new Set([
    'and', 'or', 'but', 'nor', 'for', 'so', 'yet',  // coordinating conjunctions
    'a', 'an', 'the',                                // articles
    'at', 'by', 'for', 'in', 'of', 'on', 'to',      // prepositions
    'up', 'as', 'is', 'it', 'be', 'are'             // common short words
  ]);

  return category
    .replace(/([A-Z])/g, ' $1')        // Handle camelCase: "webDevelopment" → "web Development"
    .trim()                            // Remove leading space
    .split(/[\s-]+/)                   // Split on spaces AND hyphens
    .map((word, index) => {
      const lowerWord = word.toLowerCase();

      // Always capitalize the first word, regardless of what it is
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }

      // Keep articles and prepositions lowercase (unless first word)
      if (lowercaseWords.has(lowerWord)) {
        return lowerWord;
      }

      // Capitalize all other words
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};