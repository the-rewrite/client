import { useEffect, useRef, useState } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';

import TheRewriteGrid from './TheRewriteGrid';
import TheRewriteFilterWidget from './TheRewriteFilterWidget';
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
function TheRewriteView({ threads, buckets, bridge, filterChange }) {

  //useEffect(() => {
  //  setScroller(new Scroller(bridge, 'antani'));
  //}, [bridge]);

  // Add `the-rewrite` class to the HTML root element
  // document.documentElement.classList.add('the-rewrite');


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
      <TheRewriteFilterWidget filterChange={filterChange}/>
      <TheRewriteGrid bridge={bridge} buckets={buckets} />
    </div>
  );
}

export default withServices(TheRewriteView, ['bridge']);
