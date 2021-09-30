import { createShadowRoot } from '../annotator/util/shadow-root';
import { render } from 'preact';
import TheRewriteModal from './components/TheRewriteModal';
import useRootThread from '../sidebar/components/hooks/use-root-thread';
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
    let disconnectObserver = () => {};
    this.guest.crossframe.on(
      'theRewriteBuckets',
      /** @type {(b: Bucket)=>void} */ buckets => {
        console.log('observe', buckets);
        disconnectObserver();
        disconnectObserver = observeIntersections(
          Object.keys(buckets),
          this.onViewport
        );
      }
    );
    //this.guest._emitter.subscribe('loadAnnotations', console.log);
    //const rootThread = useRootThread();
    //observeMutations();
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
      console.log('in view', e);
    });
  }

  destroy() {
    render(null, this.shadowRoot);
    this._outerContainer.remove();
  }
}
