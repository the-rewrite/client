//import MuuriComponent from 'muuri-react';

import { useEffect, useRef, useState } from 'preact/hooks';
import { Fragment } from 'preact';
import MarkdownView from '../../sidebar/components/MarkdownView';
import { tagsToSingleClass } from '../annotation-utils';
import Muuri from 'muuri';

/**
 *
 * @param {string} s
 * @returns
 */
function prettifyUser(s) {
  return s.split(':')[1].split('@')[0];
}

const dateFormatter = new Intl.DateTimeFormat({
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
  const tagClass = tagsToSingleClass(annotation.tags);

  const showAnnotationsByUser = userId => {
    return event => {
      event.preventDefault();
      // REVIEW add bridge call
      console.log(`bridge.call ${userId}`);
    };
  };

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

  const output = dateFormatter.format(new Date(annotation.created));

  return (
    <Fragment>
      <p>
        A <span className={tagClass}>{tagClass}</span> by{' '}
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
        ·{' '}
        <a href={annotation.links.html} onClick={permaLink}>
          permalink
        </a>
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
              <p>↝ Reply by {prettifyUser(c.annotation.user)}</p>
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
 * @prop {boolean} hideReplies
 * @param {GridItemProps} props
 */
function GridItem({ bridge, thread, hideReplies }) {
  if (!thread.annotation) {
    return null;
  }
  const annotation = thread.annotation;
  const [expand, setExpand] = useState(/** @type boolean */ (false));
  const isWide = annotation.text.length > 500;
  const cropped = annotation.text.length > 1000;
  const text = annotation.text.substring(0, 1000);
  const superscript = annotation.$tag.split('t')[1];

  // REVIEW: Lang attribute is set for correct hypentation, super important!!
  const lang = 'en';

  const toggleExpand = () => {
    setExpand(prev => !prev);
  };

  return (
    <article
      id={annotation.id}
      className={`rewrite-grid-item outer ${isWide ? 'wide' : ''}`}
    >
      <div className="inner" lang={lang}>
        <p className="number">{superscript}</p>
        <section>
          {expand ? (
            <MarkdownView lang={lang} markdown={annotation.text} />
          ) : (
            <MarkdownView lang={lang} markdown={text} />
          )}
          {cropped && (
            <p>
              <button onClick={toggleExpand}>
                {expand ? '↑ Collapse' : '↓ Read all'}
              </button>
            </p>
          )}
          <GridItemMeta bridge={bridge} annotation={annotation} />
          {!hideReplies && <GridItemReplies children={thread.children} />}
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
 * @prop {boolean} hideReplies
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ xpath, bridge, bucket, hideReplies }) {
  const items = bucket.map(a => (
    <GridItem key={a.id} bridge={bridge} thread={a} hideReplies={hideReplies} />
  ));

  const gridEl = useRef(null);
  //const [grid, setGrid] = useState(null);

  useEffect(() => {
    if (!gridEl) {
      return;
    }
    const grid = new Muuri(gridEl.current, {
      layout: {
        fillGaps: true,
        horizontal: true,
      },
    });
    grid.on('layoutEnd', items => {
      let max = 0;
      for (let item of items) {
        const y = item._top + item._height;
        if (y > max) {
          max = y;
        }
      }
      // @ts-ignore
      // Add a bit of slack to avoid redraw
      gridEl.current.style.height = `${max + 10}px`;
    });
    grid.layout(true);

    return () => {
      grid.destroy();
    };
  }, [gridEl, bucket]);

  return (
    <div ref={gridEl} data-xpath={xpath} className="rewrite-grid-row">
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
 * @prop {boolean} hideReplies
 */

/**
 * @param {TheRewriteGridProps} props
 */
function TheRewriteGrid({ bridge, buckets, hideReplies }) {
  // So the incoming buckets is a map of xpath parent path -> [ annotations ]
  // We create a list of values to use in the map below
  const bucketValues = Object.values(buckets) || [];
  // so that we can iterate over the xpath expression
  // and add a row for each xpath parent
  // then we use the index to get the corresponding values
  // from the bucketValues and pass these as a prop down
  const rows = (Object.keys(buckets) || []).map((b, i) => (
    <GridRow key={b} xpath={b} bridge={bridge} bucket={bucketValues[i]} hideReplies={hideReplies}/>
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

export default TheRewriteGrid;
