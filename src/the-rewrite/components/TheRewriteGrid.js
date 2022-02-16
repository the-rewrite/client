import { useEffect, useRef, useState } from 'preact/hooks';
import { tagsToSingleClass } from '../annotation-utils';
import ThreadCard from './ThreadCard';
//import ThreadCard from '../../sidebar/components/ThreadCard';
import { createGrid } from '../grid-utils';
import { countVisible } from '../../sidebar/helpers/thread';
import { withServices } from './../../sidebar/service-context';
import { Bridge } from '../../shared/bridge';

/**
 * @typedef {import('../../sidebar/helpers/build-thread').Thread} Thread
 *
 * @param {string} s
 * @returns
 */
function prettifyUser(s) {
  return s.split(':')[1].split('@')[0];
}

/**
 * @typedef GridItemProps
 * @prop {Date} update
 * @prop {Thread} thread
 * @prop {Bridge} bridge
 * @prop {boolean} hideReplies
 * @param {GridItemProps} props
 */
function GridItem({ bridge, thread, hideReplies, update, frameSync }) {
  if (!thread.annotation) {
    return null;
  }
  const annotation = thread.annotation;
  const superscript = annotation.$tag.split('t')[1] || '⋇';

  // REVIEW: Lang attribute is set for correct hypentation, super important!!
  const lang = 'en';

  const visibleChildren = thread.children.reduce(
    (sum, child) => sum + countVisible(child),
    0
  );

  const scrollToAnnotation = event => {
    event.preventDefault();
    console.log(annotation.$tag);
    frameSync.scrollToAnnotation(annotation.$tag);
  };

  const isWide = annotation.text.length > 500 || visibleChildren > 2;

  return (
    <article
      id={annotation.id}
      className={`rewrite-grid-item outer ${isWide ? 'wide' : ''} ${
        thread.include ? '' : 'rewrite-hide-item'
      } ${tagsToSingleClass(thread.annotation?.tags)}`}
    >
      <div className="inner" lang={lang}>
        <p className="number" onClick={scrollToAnnotation}>
          <span>{superscript}</span>
        </p>

        {/*
        <div className="ThreadList__card" id={thread.id} key={thread.id}>
          <ThreadCard thread={thread} />
        </div>
        */}
        <ThreadCard thread={thread} update={update} hideReplies={hideReplies} />
      </div>
    </article>
  );
}

/**
 * @typedef GridRowProps
 * @prop {Date} update
 * @prop {Bridge} bridge
 * @prop {string} xpath
 * @prop {Thread[]} bucket
 * @prop {boolean} hideReplies
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ update, xpath, bridge, bucket, hideReplies, frameSync }) {
  const gridEl = useRef(null);
  const [grid, setGrid] = useState(null);

  useEffect(() => {
    // console.log('render grid', gridEl.current);
    if (!gridEl) {
      return;
    }
    const grid = createGrid(gridEl.current);
    setGrid(grid);

    return () => {
      grid.destroy();
    };
  }, [gridEl, bucket, update]);

  const items = bucket.map(a => (
    <GridItem
      key={a.id}
      bridge={bridge}
      thread={a}
      update={update}
      hideReplies={hideReplies}
      frameSync={frameSync}
    />
  ));

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
 * @prop {Date} update
 * @prop {Bridge} bridge
 * @prop {Bucket} buckets
 * @prop {boolean} hideReplies
 */

/**
 * @param {TheRewriteGridProps} props
 */
function TheRewriteGrid({ update, bridge, buckets, hideReplies, frameSync }) {
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
      xpath={b}
      bridge={bridge}
      bucket={bucketValues[i]}
      update={update}
      hideReplies={hideReplies}
      frameSync={frameSync}
    />
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

export default withServices(TheRewriteGrid, ['frameSync']);
