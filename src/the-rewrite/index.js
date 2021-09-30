import { createShadowRoot } from '../annotator/util/shadow-root';
import { render } from 'preact';
import TheRewriteModal from './components/TheRewriteModal';
import { observeIntersections } from './dom-utils';

/** @typedef {import('./components/TheRewriteView').Bucket} Bucket*/
/** @typedef {import('../types/annotator').Destroyable} Destroyable */

/** @implements Destroyable */
export default class TheRewrite {
  /**
   * @typedef {import('../annotator/guest').default} Guest
   *
   * @param {HTMLElement} element
   * @param {import('../annotator/util/emitter').EventBus} eventBus -
   *   Enables communication between components sharing the same eventBus
   * @param {Guest} guest -
   *   The `Guest` instance for the current frame. It is currently assumed that
   *   it is always possible to annotate in the frame where the sidebar is
   *   displayed.
   * @param {Record<string, any>} config
   */
  constructor(element, eventBus, guest, config = {}) {
    /**
     * Un-styled shadow host for the notebook content.
     * This isolates the notebook from the page's styles.
     */
    this.guest = guest;
    /** @type {HTMLElement[]}*/ this.visibleAnnotations = [];

    let disconnectObserver = () => {};
    this.guest.crossframe.on(
      'theRewriteBuckets',
      /** @type {(b: Bucket)=>void} */ buckets => {
        console.log('observe', buckets);
        disconnectObserver();
        disconnectObserver = observeIntersections(
          Object.keys(buckets),
          this.onViewport.bind(this)
        );
      }
    );

    this._outerContainer = document.createElement('hypothesis-the-rewrite');
    element.appendChild(this._outerContainer);
    this.shadowRoot = createShadowRoot(this._outerContainer);
    this.ready = /** @type {Promise<void>} */ (
      new Promise(resolve => {
        window.addEventListener('message', event => {
          console.log('[TheRewrite] got message:', event.data);
          if (event.data.type === 'theRewriteReady') {
            this.iframe = this.shadowRoot.querySelector('iframe');
            resolve();
          }
        });
      })
    );

    window.addEventListener('scroll', this.onScroll.bind(this));

    render(
      <TheRewriteModal eventBus={eventBus} config={config} />,
      this.shadowRoot
    );
  }

  /**
   *
   * @param {IntersectionObserverEntry[]} entries
   */
  onViewport(entries) {
    entries.forEach(e => {
      const htmlElement = /** @type {HTMLElement} */ (e.target);
      if (e.isIntersecting) {
        this.visibleAnnotations.push(htmlElement);
      } else {
        const index = this.visibleAnnotations.indexOf(htmlElement);
        this.visibleAnnotations.splice(index, 1);
      }
    });
  }

  onScroll() {
    const center = document.documentElement.clientHeight / 2;
    let closestDistance = Infinity;
    let /** @type {HTMLElement|undefined} */ closestElement;
    for (let e of this.visibleAnnotations) {
      const r = e.getBoundingClientRect();
      const m = (r.top + r.bottom) / 2;
      const d = Math.abs(m - center);
      if (d < closestDistance) {
        closestDistance = d;
        closestElement = e;
      }
    }
    document
      .querySelectorAll('.closest')
      .forEach(e => e.classList.remove('closest'));
    if (closestElement) {
      closestElement.classList.add('closest');
      const xpath = closestElement.dataset.xpath;
      this.guest.crossframe.call('theRewriteScrollToBucket', xpath);
    }
  }

  destroy() {
    render(null, this.shadowRoot);
    this._outerContainer.remove();
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }
}
