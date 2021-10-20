import { useEffect, useRef, useState } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';

import TheRewriteGrid from './TheRewriteGrid';
import Scroller from './Scroller';

/**
 * @typedef {import('../../types/api').Annotation} Annotation
 * @typedef {import('../../sidebar/helpers/build-thread').Thread} Thread
 * @typedef {{[key: string]:Thread[]}} Bucket
 * */

/**
 * @typedef TheRewriteViewProps
 * @prop {Thread[]} threads
 * @prop {Bucket} buckets
 * @prop {import('../../shared/bridge').Bridge} bridge
 */

/**
 * Render The Rewrite view and its components
 *
 * @param {TheRewriteViewProps} props
 */
function TheRewriteView({ threads, buckets, bridge }) {

  //useEffect(() => {
  //  setScroller(new Scroller(bridge, 'antani'));
  //}, [bridge]);

  // Add `the-rewrite` class to the HTML root element
  document.documentElement.classList.add('the-rewrite');


  // The following two blocks are used to setup communication
  // between this view, that is run in the its own iframe context,
  // and the code that is run in the context of the annotated text.
  useEffect(() => {
    // first we signal to our parent that the view is ready
    // please see line 53 in index.js and src/annotator/index.js
    window.parent.postMessage({ type: 'theRewriteReady' }, '*');
  }, []);

  useEffect(() => {
    // as soon as the we connect in src/annotator/index.js
    // the bridge is going to post a 'hypothesisGuestReady'
    // message and finish the connection here
    window.addEventListener('message', e => {
      if (e.data?.type !== 'hypothesisGuestReady') {
        return;
      }
      if (e.ports.length === 0) {
        console.warn(
          'Ignoring `hypothesisGuestReady` message without a MessagePort'
        );
        return;
      }
      const port = e.ports[0];
      bridge.createChannel(port);
    });
  }, [bridge]);

  return (
    <div className="TheRewriteView">
      <TheRewriteGrid bridge={bridge} buckets={buckets} />
    </div>
  );
}

export default withServices(TheRewriteView, ['bridge']);
