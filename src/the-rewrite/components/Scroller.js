import {
  getAllElementsByXpaths,
  getAllElementsWithXpaths,
  observeIntersections,
} from '../dom-utils';
import jump from '../scroll-utils';

/** @typedef {import('../components/TheRewriteView').Bucket} Bucket*/
/** @typedef {import('../../types/annotator').Destroyable} Destroyable */

/** @implements Destroyable */
export default class Scroller {
  /**
   * @typedef {import('../../shared/bridge').Bridge} Bridge
   *
   * @param {Bridge} bridge -
   * @param {boolean} passive -
   */
  constructor(bridge, passive = false) {
    /**
     * Un-styled shadow host for the notebook content.
     * This isolates the notebook from the page's styles.
     */
    this.bridge = bridge;
    this.passive = passive;
    this.isScrolling = false;
    this.stopScrolling = () => {};

    /** @type {HTMLElement[]}*/
    this.visibleAnnotations = [];
    this.disconnectObserver = () => {};
    this.bridge.on('theRewriteBuckets', this.onBuckets.bind(this));
    this.bridge.on(
      'theRewriteScrollToBucket',
      this.onScrollToBucket.bind(this)
    );

    if (!passive) {
      window.addEventListener('scroll', this.onScroll.bind(this));
    }
  }

  /** @param {Bucket} buckets */
  onBuckets(buckets) {
    if (this.passive) {
      return;
    }
    const xpaths = Object.keys(buckets);
    this.disconnectObserver();
    this.disconnectObserver = observeIntersections(
      // FIXME: forgive me father for I have sinned.
      // The right function depends on the caller. Maybe I can pass it in the
      // constructor.
      [...getAllElementsByXpaths(xpaths), ...getAllElementsWithXpaths(xpaths)],
      this.onIntersection.bind(this)
    );
  }

  /**
   *
   * @param {string} xpath
   * @param {number} distance
   */
  onScrollToBucket(xpath, distance) {
    this.stopScrolling();
    const e = document.querySelector(`[data-xpath="${xpath}"]`);
    document
      .querySelectorAll('.closest')
      .forEach(e => e.classList.remove('closest'));
    if (e) {
      e.classList.add('closest');
      this.isScrolling = true;
      this.stopScrolling = jump(e, { callback: this.onScrollEnd.bind(this) });
    }
  }

  onScrollEnd() {
    this.isScrolling = false;
  }

  /**
   * @param {IntersectionObserverEntry[]} entries
   */
  onIntersection(entries) {
    entries.forEach(e => {
      const htmlElement = /** @type {HTMLElement} */ (e.target);
      if (e.isIntersecting) {
        this.visibleAnnotations.push(htmlElement);
      } else {
        const index = this.visibleAnnotations.indexOf(htmlElement);
        if (index > 0) {
          this.visibleAnnotations.splice(index, 1);
        }
      }
    });
  }

  onScroll() {
    if (this.isScrolling) {
      return;
    }
    const center = document.documentElement.clientHeight / 2;
    let closestDistance = Infinity;
    /** @type {HTMLElement|undefined} */
    let closestElement;
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
      this.bridge.call('theRewriteScrollToBucket', xpath, closestDistance);
    }
  }

  destroy() {
    if (!passive) {
      this.disconnectObserver();
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }
}
