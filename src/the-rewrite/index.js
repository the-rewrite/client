import { createShadowRoot } from '../annotator/util/shadow-root';
import { render } from 'preact';
import TheRewriteModal from './components/TheRewriteModal';
import Scroller from './components/Scroller';

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
    this.scroller = new Scroller(guest.crossframe._bridge);
    /**
     * Un-styled shadow host for the notebook content.
     * This isolates the notebook from the page's styles.
     */

    //this._outerContainer = document.createElement('hypothesis-the-rewrite');
    //element.appendChild(this._outerContainer);
    //this.shadowRoot = createShadowRoot(this._outerContainer);
    //this.ready = /** @type {Promise<void>} */ (
    //  new Promise(resolve => {
    //    window.addEventListener('message', event => {
    //      console.log('[TheRewrite] got message:', event.data);
    //      if (event.data.type === 'theRewriteReady') {
    //        this.iframe = this.shadowRoot.querySelector('iframe');
    //        resolve();
    //      }
    //    });
    //  })
    //);

    //render(
    //  <TheRewriteModal eventBus={eventBus} config={config} />,
    //  this.shadowRoot
    //);
  }

  destroy() {
    this.scroller.destroy();
    //render(null, this.shadowRoot);
    //this._outerContainer.remove();
  }
}
