import { useEffect, useRef, useState } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';

import TheRewriteGrid from './TheRewriteGrid';
import Scroller from './Scroller';
import { disableLayoutInSidebar, enableLayoutInSidebar } from '../dom-utils';

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
  const [sortedIds, setSortedIds] = useState(/** @type {string[]} */ ([]));

  //useEffect(() => {
  //  setScroller(new Scroller(bridge, 'antani'));
  //}, [bridge]);

  // Add `the-rewrite` class to the HTML root element
  // document.documentElement.classList.add('the-rewrite');

  // REVIEW correct use of setState?
  useEffect(() => {
    // REVIEW: Take ids and sort them to create the superscript numbers
    const superscripts = threads.map(a => a.id).sort();
    bridge.call('updateSuperscripts', superscripts);
    setSortedIds(superscripts);
  }, [threads]);

  useEffect(() => {
    console.log('mount', bridge);
    enableLayoutInSidebar();
    bridge.call('theRewriteOpened');
    return () => {
      console.log('unmount');
      disableLayoutInSidebar();
      bridge.call('theRewriteClosed');
    };
  }, []);

  return (
    <div className="TheRewriteView">
      <TheRewriteGrid sortedIds={sortedIds} bridge={bridge} buckets={buckets} />
    </div>
  );
}

export default withServices(TheRewriteView, ['bridge']);
