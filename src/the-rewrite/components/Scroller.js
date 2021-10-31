import {
  getAllElementsByXpaths,
  getAllElementsWithXpaths,
  observeIntersections,
} from '../dom-utils';
import jump from '../scroll-utils';

// @ts-ignore
const pointRight = require('../images/1f449.svg');

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
      this.createReadingIndex();
    }
  }

  createReadingIndex() {
    this.readingIndex = document.createElement('span');
    this.readingIndex.id = 'the-rewrite-reading-index';
    this.readingIndex.innerHTML = pointRight;
    this.readingIndex.style.cssText = `
      filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
      width: 40px;
      height: 40px;
      position: fixed;
      left:0;
      top:50%;
    `;

    document.body.appendChild(this.readingIndex);
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
      const style = getComputedStyle(e);
      this.isScrolling = true;
      this.stopScrolling = jump(e, {
        offset: -parseInt(style.marginTop, 10),
        callback: this.onScrollEnd.bind(this),
      });
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

  calculateReadingHeightRatio() {
    let v = 0.2;
    let clientHeight = document.documentElement.clientHeight;
    let { top, height } = document.documentElement.getBoundingClientRect();
    let ratio = top / (clientHeight - height);
    if (ratio < v) {
      return (0.5 * ratio) / v;
    } else if (ratio > 1 - v) {
      return 1 - (0.5 * (1 - ratio)) / v;
    } else {
      return 0.5;
    }
    //return ratio;
  }

  onScroll() {
    if (this.isScrolling || this.passive) {
      return;
    }
    const heightRatio = this.calculateReadingHeightRatio();
    const readingHeight = document.documentElement.clientHeight * heightRatio;
    if (this.readingIndex) {
      this.readingIndex.style.top = `calc(${heightRatio * 100}% - ${
        this.readingIndex.getBoundingClientRect().height / 2
      }px)`;

      this.readingIndex.style.left =
        5 *
          Math.sin(document.documentElement.getBoundingClientRect().top / 500) +
        'px';
    }
    let closestDistance = Infinity;
    /** @type {HTMLElement|undefined} */
    let closestElement;
    let closestRect;
    for (let e of this.visibleAnnotations) {
      const r = e.getBoundingClientRect();
      const m = (r.top + r.bottom) / 2;
      const d = readingHeight - m;
      if (Math.abs(d) < Math.abs(closestDistance)) {
        closestDistance = d;
        closestElement = e;
        closestRect = r;
      }
    }
    document
      .querySelectorAll('.closest')
      .forEach(e => e.classList.remove('closest'));
    if (closestElement && closestRect) {
      closestElement.classList.add('closest');
      const xpath = closestElement.dataset.xpath;
      this.bridge.call('theRewriteScrollToBucket', xpath, closestDistance);
    }
  }

  destroy() {
    if (!this.passive) {
      this.readingIndex?.remove();
      this.disconnectObserver();
      window.removeEventListener('scroll', this.onScroll.bind(this));
    }
  }
}
