const BODY_ID = 'theRewrite--body-container';

export function enableLayout() {
  document.body.style.cssText = `
      max-width: 100%;
      margin-right: 50%;
      padding: 20px;
    `;
}

export function observeMutations() {
  const element = document.body;
  const options = {
    childList: true, // listen to listen to children being added or removed
    attributes: true, // listen to attributes changes
    subtree: true, // omit or set to false to observe only changes to the parent node
  };

  const callback = (mutationList, observer) => {
    mutationList.forEach(mutation => {
      switch (mutation.type) {
        case 'childList':
          // check mutation.addedNodes or mutation.removedNodes
          console.log('childlist', mutation);
          break;
        case 'attributes':
          console.log('attributes', mutation);
          /* An attribute value changed on the element in
           mutation.target; the attribute name is in
           mutation.attributeName and its previous value is in
           mutation.oldValue */
          break;
      }
    });
  };

  const observer = new MutationObserver(callback);
  observer.observe(element, options);
}

export function observeIntersections() {
  console.log('run observer');
  let options = {
    //root: document.getElementById(BODY_ID),
    root: document.body,
    rootMargin: '0px',
    threshold: 1.0,
  };

  function callback(entries) {
    entries.forEach(entry => {
      console.log(entry);
    });
  }

  const o = new IntersectionObserver(callback, options);
  document.querySelectorAll('.hypothesis-highlight').forEach(t => o.observe(t));
}
