import debounce from 'lodash.debounce';

export const DEBOUNCE_WAIT = 40;

/** @typedef {(frame: HTMLIFrameElement) => void} FrameCallback */

/**
 * FrameObserver detects iframes added and deleted from the document.
 *
 * To enable annotation, an iframe must be opted-in by adding the
 * `enable-annotation` attribute.
 *
 * We require the `enable-annotation` attribute to avoid the overhead of loading
 * the client into frames which are not useful to annotate. See
 * https://github.com/hypothesis/client/issues/530
 */
export class FrameObserver {
  /**
   * @param {Element} element - root of the DOM subtree to watch for the addition
   *   and removal of annotatable iframes
   * @param {FrameCallback} onFrameAdded - callback fired when an annotatable iframe is added
   * @param {FrameCallback} onFrameRemoved - callback triggered when the annotatable iframe is removed
   */
  constructor(element, onFrameAdded, onFrameRemoved) {
    this._element = element;
    this._onFrameAdded = onFrameAdded;
    this._onFrameRemoved = onFrameRemoved;
    /** @type {Set<HTMLIFrameElement>} */
    this._annotatableIFrames = new Set();
    this._isDisconnected = false;

    this._mutationObserver = new MutationObserver(
      debounce(() => {
        this._discoverFrames();
      }, DEBOUNCE_WAIT)
    );
    this._discoverFrames();
    this._mutationObserver.observe(this._element, {
      childList: true,
      subtree: true,
      attributeFilter: ['enable-annotation'],
    });
  }

  disconnect() {
    this._isDisconnected = true;
    this._mutationObserver.disconnect();
  }

  /**
   * @param {HTMLIFrameElement} iframe
   */
  async _addFrame(iframe) {
    this._annotatableIFrames.add(iframe);
    try {
      await onDocumentReady(iframe);
      if (this._isDisconnected) {
        return;
      }
      const iframeWindow = iframe.contentWindow;
      // @ts-expect-error
      // This line raises an exception if the iframe is from a different origin
      iframeWindow.addEventListener('unload', () => {
        this._removeFrame(iframe);
      });
      this._onFrameAdded(iframe);
    } catch (e) {
      console.warn(
        `Unable to inject the Hypothesis client (from '${document.location}' into a cross-origin iframe '${iframe.src}')`
      );
    }
  }

  /**
   * @param {HTMLIFrameElement} iframe
   */
  _removeFrame(iframe) {
    this._annotatableIFrames.delete(iframe);
    this._onFrameRemoved(iframe);
  }

  _discoverFrames() {
    const frames = new Set(
      /** @type {NodeListOf<HTMLIFrameElement> } */ (
        this._element.querySelectorAll('iframe[enable-annotation]')
      )
    );

    for (let frame of frames) {
      if (!this._annotatableIFrames.has(frame)) {
        this._annotatableIFrames.add(frame);
        this._addFrame(frame);
      }
    }

    for (let frame of this._annotatableIFrames) {
      if (!frames.has(frame)) {
        this._annotatableIFrames.delete(frame);
        this._removeFrame(frame);
      }
    }
  }
}

/**
 * Resolves a Promise when the iframe's document is ready (loaded and parsed)
 *
 * @param {HTMLIFrameElement} iframe
 * @return {Promise<void>}
 * @throws {Error} if trying to access a document from a cross-origin iframe
 */
export function onDocumentReady(iframe) {
  return new Promise(resolve => {
    // @ts-expect-error
    const iframeDocument = iframe.contentWindow.document;
    const state = iframeDocument.readyState;

    // Web browsers initially load a blank document before the final document.
    // This blank document is (1) accessible, (2) has a 'complete' readyState,
    // on Chrome and Safari, and an 'uninitialized' readyState on Firefox and
    // (3) has a empty body and head. If a blank document is detected and there
    // is a 'src' attribute, it is expected that the blank document will be
    // replaced by the document from 'src'.
    /* istanbul ignore next */
    if (
      // @ts-ignore
      state === 'uninitialized' ||
      (state === 'complete' &&
        iframe.hasAttribute('src') &&
        iframeDocument.head.hasChildNodes() === false &&
        iframeDocument.body.hasChildNodes() === false)
    ) {
      // Unfortunately, listening for 'DOMContentLoaded' on the iframeDocument
      // doesn't work. Instead, we need to wait for a 'load' event to be triggered.
      iframe.addEventListener('load', () => {
        resolve();
      });
      return;
    }

    /* istanbul ignore next */
    if (state === 'loading') {
      iframeDocument.addEventListener('DOMContentLoaded', () => resolve());
      return;
    }

    // state is 'interactive' or 'complete';
    resolve();
  });
}
