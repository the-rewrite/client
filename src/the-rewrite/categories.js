export const THE_REWRITE_TAG_CATEGORY = 'the-rewrite_v1_category';
export const THE_REWRITE_TAG_CATEGORIES = 'the-rewrite_v1_categories';

export const COLORS = [
  '#7dffd8ff',
  '#ff4782ff',
  '#ffd37dff',
  '#62466bff',
  '#ad343eff',
  '#6765a4ff',
  '#84acceff',
  '#c44900ff',
  '#4357adff',
  '#f269c7ff',
];

/**
 * @typedef {import('../types/api').Annotation} Annotation
 * @typedef {{name: string, description: string, color: string, tag: string}} Category
 * @typedef {Category[]} Categories
 *
 * @param {Annotation[]} annotations
 */
export function getMetadataAnnotation(annotations) {
  if (annotations.length === 0) {
    return;
  }

  let matching = annotations.filter(a =>
    a.tags.includes(THE_REWRITE_TAG_CATEGORIES)
  );

  if (matching.length) {
    return matching.reduce(
      (prev, curr) => (prev.created < curr.created ? prev : curr),
      matching[0]
    );
  }
}

/**
 *
 * @param {string} s
 */
export function tagify(s) {
  // https://stackoverflow.com/a/1054862/597097
  return [
    THE_REWRITE_TAG_CATEGORY,
    s
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-'),
  ].join('_');
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
  let colorIndex = 0;
  while ((match = reItem.exec(list)) !== null && match.groups) {
    const { name, description } = match.groups;
    categories.push({
      name,
      description,
      color: COLORS[colorIndex % 10],
      tag: tagify(name),
    });
    colorIndex++;
  }
  return categories;
}

/**
 * @type {Categories}
 */
let currentCategories = [];

/**
 *
 * @param {Categories} categories
 */
export function updateCategories(categories) {
  const needUpdate =
    JSON.stringify(categories) !== JSON.stringify(currentCategories);
  if (needUpdate) {
    currentCategories = categories;
  }
  return needUpdate;
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

/**
 *
 * @param {Categories} categories
 */
export function injectCategoriesStyle(categories) {
  const style = document.createElement('style');
  if (categories.length) {
    const classes = categories.map(
      c => `.hypothesis-highlight.${c.tag} {
    background-image: linear-gradient(
      to right top,
      ${c.color} 0,
      ${c.color} 100%
    );
  }`
    );
    style.innerHTML = classes.join('\n\n');
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}

/**
 *
 * @param {Categories} categories
 */
export function injectCategoriesVariables(categories) {
  const style = document.createElement('style');
  if (categories.length) {
    const classes = categories.map(
      c => `.${c.tag} {
      --category-color: ${c.color};
  }`
    );
    style.innerHTML = classes.join('\n\n');
    document.getElementsByTagName('head')[0].appendChild(style);
  }
}

export function getCategories() {
  return currentCategories;
}
