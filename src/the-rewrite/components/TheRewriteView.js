import { useEffect, useRef, useState } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';

import TheRewriteGrid from './TheRewriteGrid';
import TheRewriteFilterWidget from './TheRewriteFilterWidget';
import { disableLayoutInSidebar, enableLayoutInSidebar } from '../dom-utils';
import { dragToScroll } from '../scroll-utils';

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
 * @prop {function} filterCharge
 * @prop {boolean} hideReplies
 */

/**
 * Render The Rewrite view and its components
 *
 * @param {TheRewriteViewProps} props
 */
function TheRewriteView({
  threads,
  update,
  buckets,
  bridge,
  filterChange,
  hideReplies,
}) {
  // Add `the-rewrite` class to the HTML root element
  // document.documentElement.classList.add('the-rewrite');

  useEffect(() => {
    console.log('mount', bridge);
    enableLayoutInSidebar();
    //@ts-ignore
    const unsubscribe = dragToScroll(document.documentElement);
    bridge.call('theRewriteOpened');
    return () => {
      console.log('unmount');
      disableLayoutInSidebar();
      bridge.call('theRewriteClosed');
      unsubscribe();
    };
  }, []);

  return (
    <div className="TheRewriteView">
      <TheRewriteFilterWidget filterChange={filterChange} />
      <TheRewriteGrid
        update={update}
        bridge={bridge}
        buckets={buckets}
        hideReplies={hideReplies}
      />
    </div>
  );
}

export default withServices(TheRewriteView, ['bridge']);
