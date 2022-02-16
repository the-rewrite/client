import { useEffect, useRef, useState } from 'preact/hooks';

import { withServices } from '../../sidebar/service-context';

import TheRewriteGrid from './TheRewriteGrid';
import TheRewriteFilterWidget from './TheRewriteFilterWidget';
import { disableLayoutInSidebar, enableLayoutInSidebar } from '../dom-utils';
import { dragToScroll } from '../scroll-utils';
import { useStoreProxy } from '../../sidebar/store/use-store';
import { TheRewriteEdit } from './TheRewriteEdit';
import {
  extractCategoriesFromMarkdown,
  getMetadataAnnotation,
  setCategories,
} from '../categories';

/**
 * @typedef {import('../../types/api').Annotation} Annotation
 * @typedef {import('../../sidebar/helpers/build-thread').Thread} Thread
 * @typedef {{[key: string]:Thread[]}} Bucket
 * */

/**
 * @param {import('../../sidebar/store').SidebarStore} store
 * @param {Thread[]} threads
 */
function getDrafts(store, threads) {
  let drafts = [];
  for (let t of threads) {
    if (t.annotation && store.getDraft(t.annotation)) {
      drafts.push(t);
    }
    drafts = [...drafts, ...getDrafts(store, t.children)];
  }
  return drafts;
}

/**
 * @typedef TheRewriteViewProps
 * @prop {Thread[]} threads
 * @prop {Date} update
 * @prop {Bucket} buckets
 * @prop {import('../../shared/bridge').Bridge} bridge
 * @prop {function} filterChange
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
  const store = useStoreProxy();
  const [draft] = getDrafts(store, threads);
  const metadata = getMetadataAnnotation(store.allAnnotations());
  console.log('asdasd', metadata);
  if (metadata) {
    const categories = extractCategoriesFromMarkdown(metadata.text);
    setCategories(categories);
  }
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
      {draft && (
        <TheRewriteEdit
          update={update}
          thread={draft}
          hideReplies={hideReplies}
        />
      )}
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
