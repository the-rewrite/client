//import MuuriComponent from 'muuri-react';

import { useState } from 'preact/hooks';
import { Fragment } from 'preact';
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
const dateFormater = new Intl.DateTimeFormat({
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

/**
 * @typedef GridItemMetaProps
 * @prop {Annotation} annotation
 * @prop {Bridge} bridge
 * @param {GridItemMetaProps} props */
function GridItemMeta({ bridge, annotation }) {
  const showAnnotationsByUser = userId => {
    return event => {
      event.preventDefault();
      // REVIEW add bridge call
      console.log(`bridge.call ${userId}`);
    };
  };

  console.log('br', bridge);

  const scrollToAnnotation = event => {
    event.preventDefault();
    bridge.call('scrollToAnnotation', annotation.$tag);
  };

  const replyTo = event => {
    event.preventDefault();
    // REVIEW add bridge call
    console.log('bridge call, reply');
  };

  const permaLink = event => {
    event.preventDefault();
    // REVIEW add copy to clipboard
    console.log('copy to clipboard', annotation.links.html);
  };

  const output = dateFormater.format(new Date(annotation.created));

  return (
    <Fragment>
      <p>
        A <span>reply</span> by{' '}
        <a
          onClick={showAnnotationsByUser(annotation.user)}
          href="localhost/123"
        >
          {prettifyUser(annotation.user)}
        </a>{' '}
        on {output}
      </p>
      <p>
        <a href={annotation.links.incontext} onClick={scrollToAnnotation}>
          jump to
        </a>{' '}
        ·{' '}
        <a href="invalid/url" onClick={replyTo}>
          reply
        </a>{' '}
        · <a href={annotation.links.html}>permalink</a>
      </p>
    </Fragment>
  );
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
 * @param {string[]} sortedIds
 */
function GridItem({ bridge, thread, sortedIds }) {
  if (!thread.annotation) {
    return null;
  }
  const annotation = thread.annotation;
  const [expand, setExpand] = useState(/** @type boolean */ (false));
  const isWide = annotation.text.length > 500;
  const cropped = annotation.text.length > 1000;
  const text = annotation.text.substring(0, 1000);
  const tagClass = tagsToSingleClass(annotation.tags);
  const superscript = sortedIds.indexOf(thread.annotation.id);

  // REVIEW: Lang attribute is set for correct hypentation, super important!!
  const lang = 'en';

  const toggleExpand = () => {
    setExpand(prev => !prev);
  };

  return (
    <article
      id={annotation.id}
      className={`rewrite-grid-item outer ${isWide ? 'wide' : ''} ${tagClass}`}
    >
      <div className="inner" lang={lang}>
        <p className="number">{superscript}</p>
        <section>
          {expand ? (
            <MarkdownView lang={lang} markdown={annotation.text} />
          ) : (
            <MarkdownView lang={lang} markdown={text} />
          )}
          <p>
            {cropped && (
              <button onClick={toggleExpand}>
                {expand ? 'Collapse' : 'Read all'}
              </button>
            )}
          </p>
          <GridItemMeta bridge={bridge} annotation={annotation} />
          <GridItemReplies children={thread.children} />
        </section>
      </div>
    </article>
  );
}

/**
 * @typedef GridRowProps
 * @prop {Bridge} bridge
 * @prop {string} xpath
 * @prop {Thread[]} bucket
 * @prop {string[]} sortedIds
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ xpath, bridge, bucket, sortedIds }) {
  const items = bucket.map(a => (
    <GridItem key={a.id} bridge={bridge} thread={a} sortedIds={sortedIds} />
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
 * @prop {string[]} sortedIds
 */

/**
 * @param {TheRewriteGridProps} props
 */
function TheRewriteGrid({ bridge, buckets, sortedIds }) {
  // So the incoming buckets is a map of xpath parent path -> [ annotations ]
  // We create a list of values to use in the map below
  const bucketValues = Object.values(buckets) || [];
  // so that we can iterate over the xpath expression
  // and add a row for each xpath parent
  // then we use the index to get the corresponding values
  // from the bucketValues and pass these as a prop down
  const rows = (Object.keys(buckets) || []).map((b, i) => (
    <GridRow
      key={b}
      sortedIds={sortedIds}
      xpath={b}
      bridge={bridge}
      bucket={bucketValues[i]}
    />
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

export default TheRewriteGrid;
