//import MuuriComponent from 'muuri-react';

import { useState } from 'preact/hooks';
import MarkdownView from '../../sidebar/components/MarkdownView';
import { tagsToSingleClass } from '../annotation-utils';

/**
 *
 * @param {string} s
 * @returns
 */
function prettifyUser(s) {
  return s.split(':')[1].split('@')[0];
}

/**
 * @typedef {import('../../types/api').Annotation} Annotation
 * @typedef {import('../../shared/bridge').Bridge} Bridge
 * @typedef {import('../../sidebar/helpers/build-thread').Thread} Thread
 *
 */

/**
 * @typedef GridItemRepliesProps
 * @prop {Thread[]} children
 * @param {GridItemRepliesProps} props
 */
function GridItemReplies({ children }) {
  if (children.length === 0) {
    return null;
  }

  return (
    <ul>
      {children.map(
        c =>
          c.annotation && (
            <li>
              <strong>Reply by {prettifyUser(c.annotation.user)}</strong>
              <MarkdownView markdown={c.annotation.text} />
              <GridItemReplies children={c.children} />
            </li>
          )
      )}
    </ul>
  );
}

/**
 * @typedef GridItemProps
 * @prop {Thread} thread
 * @prop {Bridge} bridge
 * @param {GridItemProps} props
 */
function GridItem({ bridge, thread }) {
  if (!thread.annotation) {
    return null;
  }
  const annotation = thread.annotation;
  const [expand, setExpand] = useState(/** @type boolean */ (false));
  const isWide = annotation.text.length > 500;
  const cropped = annotation.text.length > 1000;
  const text = annotation.text.substring(0, 1000);
  const tagClass = tagsToSingleClass(annotation.tags);
  const superscript = annotation.$tag.split('t')[1];

  // REVIEW: Lang attribute is set for correct hypentation, super important!!
  const lang = 'en';

  const toggleExpand = () => {
    setExpand(prev => !prev);
  };

  const scrollToAnnotation = () => {
    bridge.call('scrollToAnnotation', annotation.$tag);
  };

  return (
    <div
      id={annotation.id}
      className={`rewrite-grid-item outer ${isWide ? 'wide' : ''} ${tagClass}`}
    >
      <div className="inner" lang={lang}>
        <sup>
          {superscript}
        </sup>
        <p>
          {expand ? (
            <MarkdownView markdown={annotation.text} />
          ) : (
            <MarkdownView markdown={text} />
          )}
        </p>
        <p>
          {cropped && (
            <button onClick={toggleExpand}>
              {expand ? 'Collapse' : 'Read all'}
            </button>
          )}
          <button onClick={scrollToAnnotation}>Scroll to annotation</button>
        </p>
        <p>by {prettifyUser(annotation.user)}</p>
      </div>
      <GridItemReplies children={thread.children} />
    </div>
  );
}

/**
 * @typedef GridRowProps
 * @prop {Bridge} bridge
 * @prop {string} xpath
 * @prop {Thread[]} bucket
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ xpath, bridge, bucket }) {
  const items = bucket.map(a => (
    <GridItem key={a.id} bridge={bridge} thread={a} />
  ));
  return (
    <div data-xpath={xpath} className="rewrite-grid-row">
      {items}
    </div>
  );
}

/**
 * @typedef {import('./TheRewriteView').Bucket} Bucket
 *
 * @typedef TheRewriteGridProps
 * @prop {Bridge} bridge
 * @prop {Bucket} buckets
 */

/**
 * @param {TheRewriteGridProps} props
 */
function TheRewriteGrid({ bridge, buckets }) {
  // So the incoming buckets is a map of xpath parent path -> [ annotations ]
  // We create a list of values to use in the map below
  const bucketValues = Object.values(buckets) || [];
  // so that we can iterate over the xpath expression
  // and add a row for each xpath parent
  // then we use the index to get the corresponding values
  // from the bucketValues and pass these as a prop down
  const rows = (Object.keys(buckets) || []).map((b, i) => (
    <GridRow key={b} xpath={b} bridge={bridge} bucket={bucketValues[i]} />
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

// TODO add wide annotations

export default TheRewriteGrid;
