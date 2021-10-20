const BODY_ID = 'theRewrite--body-container';

export function enableLayout() {
  // Change the style of the main document
  document.body.style.cssText = `
      max-width: 100%;
      margin-right: 50%;
      padding: 50px;
    `;

  // Change the style of the shadow root containing the sidebar
  const shadowRoot = document.querySelector('hypothesis-sidebar')?.shadowRoot;
  if (shadowRoot) {
    const annotatorFrame = shadowRoot.querySelector('.annotator-frame');
    if (annotatorFrame) {
      /** @type{HTMLElement} */ (annotatorFrame).style.cssText = `
        width: 50%;
        margin-left: -50%;
      `;
    }
  }
}

export function disableLayout() {
  // Change the style of the main document
  document.body.style.cssText = ``;

  // Change the style of the shadow root containing the sidebar
  const shadowRoot = document.querySelector('hypothesis-sidebar')?.shadowRoot;
  if (shadowRoot) {
    const annotatorFrame = shadowRoot.querySelector('.annotator-frame');
    if (annotatorFrame) {
      /** @type{HTMLElement} */ (annotatorFrame).style.cssText = ``;
    }
  }
}

export function enableLayoutInSidebar() {
  document.documentElement.style.cssText = `height: auto`;
  const content = document.querySelector('.HypothesisApp__content');
  if (content) {
    /** @type{HTMLElement} */ (content).style.cssText = `
      max-width: 100%;
      margin-right: 50%;
      padding: 50px;
    `;
  }
}

export function disableLayoutInSidebar() {
  document.documentElement.style.cssText = ``;
  const content = document.querySelector('.HypothesisApp__content');
  if (content) {
    /** @type{HTMLElement} */ (content).style.cssText = ``;
  }
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
 * @returns {HTMLElement[]}
 */
export function getElementsByXPathAndMarkThem(xpath) {
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
        // FIXME: not sure I can cast it to HTMLElement.
        const htmlElement = /** @type {HTMLElement} */ (node);
        elements.push(htmlElement);
      }
    } else {
      break;
    }
  }
  // FIXME: manually removing `/html/body`.
  elements.forEach(e => (e.dataset.xpath = xpath.substr(10)));
  return elements;
}

/**
 *
 * Return an array of elements matching an array of xpaths.
 *
 * @param {string[]} xpaths
 * @returns {HTMLElement[]}
 */
export function getAllElementsByXpaths(xpaths) {
  let all = [];
  for (let xpath of xpaths) {
    const elements = getElementsByXPathAndMarkThem(normalizeXPath(xpath));
    all = [...all, ...elements];
  }
  return all;
}

/**
 *
 * Return an array of elements that have `data-xpath` matching the array of
 * xpaths.
 *
 * @param {string[]} xpaths
 * @returns {HTMLElement[]}
 */
export function getAllElementsWithXpaths(xpaths) {
  let all = [];
  for (let xpath of xpaths) {
    const elements = document.querySelectorAll(`[data-xpath="${xpath}"]`);
    all = [...all, ...elements];
  }
  return all;
}

/**
 * Run callback on element intersection with the main view.
 * @param {HTMLElement[]} elements - The xpaths to observe for intersections.
 * @param {IntersectionObserverCallback} cb - Callback to call when an xpath is in the viewport
 * @param {Element|null} root - Callback to call when an xpath is in the viewport
 * @returns {() => void} - A function to stop observing intersections.
 */
export function observeIntersections(elements, cb, root = null) {
  let options = {
    root,
    rootMargin: '0px',
    threshold: 0.5,
  };
  const o = new IntersectionObserver(cb, options);
  elements.forEach(e => o.observe(e));
  return () => o.disconnect();
}
