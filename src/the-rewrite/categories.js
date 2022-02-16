export const THE_REWRITE_TAG_CATEGORIES = 'the-rewrite:v1:categories';

/**
 * @typedef {import('../types/api').Annotation} Annotation
 * @typedef {{name: string, description: string, color: string}} Category
 * @typedef {Category[]} Categories
 *
 * @param {Annotation[]} annotations
 */
export function getMetadataAnnotation(annotations) {
  if (annotations.length === 0) {
    return;
  }

  let lowest = annotations
    .filter(a => a.tags.includes(THE_REWRITE_TAG_CATEGORIES))
    .reduce(
      (prev, curr) => (prev.created < curr.created ? prev : curr),
      annotations[0]
    );

  return lowest;
}

/**
 * @param {string} text
 * @returns {Categories}
 */
export function extractCategoriesFromMarkdown(text) {
  // /^\s*-\s*(?<name>[^:]*)\s*:\s*(?<description>[^-]*)/gm
  const categories = [];
  const reTitle = /^\s*#\s*categories/gim;
  reTitle.exec(text);
  const list = text.substring(reTitle.lastIndex);
  const reItem = /^\s*-\s*(?<name>[^:]*)\s*:\s*(?<description>[^-]*)/gim;
  let match;
  while ((match = reItem.exec(list)) !== null && match.groups) {
    const { name, description } = match.groups;
    categories.push({
      name,
      description,
      color: 'tomato',
    });
  }
  return categories;
}

/**
 * @type {Categories}
 */
let currentCategories = [];

/**
 *
 * @param {Categories} c
 */
export function setCategories(c) {
  currentCategories = c;
}

export function getCategories2() {
  return {
    Definition: '#7dffd8',
    Addition: '#ff4782',
    Deletion: '#fff27d',
    Correction: '#59a7e8',
    Speculation: '#fbc168',
  };
}

export function injectCategoriesStyle() {
  const style = document.createElement('style');
  const categories = getCategories2();
  const classes = Object.keys(categories).map(
    c => `.hypothesis-highlight.${c.toLowerCase()} {
    background-image: linear-gradient(
      to right top,
      ${categories[c]} 0,
      ${categories[c]} 100%
    );
  }`
  );
  style.innerHTML = classes.join('\n\n');
  document.getElementsByTagName('head')[0].appendChild(style);
}

export function injectCategoriesVariables() {
  const style = document.createElement('style');
  const categories = getCategories2();
  const classes = Object.keys(categories).map(
    c => `.${c.toLowerCase()} {
      --category-color: ${categories[c]};
  }`
  );
  style.innerHTML = classes.join('\n\n');
  document.getElementsByTagName('head')[0].appendChild(style);
}

export function getCategories() {
  return currentCategories;
}
