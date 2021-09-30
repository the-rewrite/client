const BODY_ID = 'theRewrite--body-container';

export function enableLayout() {
  document.body.style.cssText = `
      max-width: 100%;
      margin-right: 50%;
      padding: 20px;
    `;
}

/**
 * Normalize the xpath to work with html.
 *
 * @param {string} xpath
 * @returns {string}
 */
export function normalizeXPath(xpath) {
  if (!xpath.startsWith('/html/body')) {
    xpath = '/html/body' + xpath;
  }

  if (xpath.endsWith('/')) {
    xpath = xpath.slice(0, -1);
  }

  return xpath;
}

/**
 *
 * Return an array of elements matching the xpath.
 *
 * @param {string} xpath
 * @returns {Element[]}
 */
export function getElementsFromXPath(xpath) {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.ANY_TYPE,
    null
  );
  const elements = [];
  let /** @type {Node|null} */ node;
  while (true) {
    node = result.iterateNext();
    if (node !== null) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        elements.push(/** @type {Element} */ (node));
      }
    } else {
      break;
    }
  }
  return elements;
}

/**
 * Run callback on element intersection with the main view.
 * @param {string[]} xpaths - The xpaths to observe for intersections.
 * @param {IntersectionObserverCallback} cb - Callback to call when an xpath is in the viewport
 * @returns {() => void} - A function to stop observing intersections.
 */
export function observeIntersections(xpaths, cb) {
  let options = {
    rootMargin: '0px',
    threshold: 1,
  };

  const o = new IntersectionObserver(cb, options);
  for (let xpath of xpaths) {
    const elements = getElementsFromXPath(normalizeXPath(xpath));
    elements.forEach(e => o.observe(e));
  }
  return () => o.disconnect();
}
