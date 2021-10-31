export function getCategories() {
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
  const categories = getCategories();
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
  const categories = getCategories();
  const classes = Object.keys(categories).map(
    c => `.${c.toLowerCase()} {
      --category-color: ${categories[c]};
  }`
  );
  style.innerHTML = classes.join('\n\n');
  document.getElementsByTagName('head')[0].appendChild(style);
}
