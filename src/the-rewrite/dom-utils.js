export function enableLayout() {
  const bodyContainer = document.createElement('div');
  const extensionContainer = document.createElement('div');
  while (document.body.hasChildNodes()) {
    const c = document.body.firstChild;
    if (c) {
      const tagName =
        c.nodeType === Node.ELEMENT_NODE
          ? /** @type {Element} */ (c).tagName
          : '';
      if (tagName.startsWith('HYPOTHESIS')) {
        // @ts-ignore
        extensionContainer.appendChild(document.body.firstChild);
      } else {
        // @ts-ignore
        bodyContainer.appendChild(document.body.firstChild);
      }
    }
  }

  document.body.style.cssText = `
      display: flex;
      max-width: 100%;
    `;

  bodyContainer.style.cssText = `
      width: calc(50% - 40px);
      padding: 20px;
    `;

  extensionContainer.style.cssText = `
      width: 50%;
    `;

  document.body.appendChild(bodyContainer);
  document.body.appendChild(extensionContainer);
}
