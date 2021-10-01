//import MuuriComponent from 'muuri-react';

import { useState } from 'preact/hooks';

/**
 * @typedef {import('../../types/api').Annotation} Annotation
 * @typedef {import('../../shared/bridge').Bridge} Bridge
 *
 * @typedef GridItemProps
 * @prop {Annotation} annotation
 * @prop {Bridge} bridge
 */


/**
 * @param {GridItemProps} props
 */
function GridItem({ bridge, annotation }) {
  const [expand, setExpand] = useState(/** @type boolean */ (false));
  const isWide = annotation.text.length > 500;
  const cropped = annotation.text.length > 1000;
  const text = annotation.text.substring(0, 1000);
  let tagClass = '';

  if(annotation.tags.length !== 0) {
    tagClass = annotation.tags[0].split(' ')[0].split(',')[0];
  }

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
        <p>{expand ? annotation.text : text}</p>
        <p>
          {cropped && (
            <button onClick={toggleExpand}>
              {expand ? 'Collapse' : 'Read all'}
            </button>
          )}
          <button onClick={scrollToAnnotation}>Scroll to annotation</button>
        </p>
        <p>by {annotation.user}</p>
      </div>
    </div>
  );
}

/**
 * @typedef GridRowProps
 * @prop {Bridge} bridge
 * @prop {string} xpath
 * @prop {Annotation[]} bucket
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ xpath, bridge, bucket }) {
  const items = bucket.map(a => (
    <GridItem key={a.id} bridge={bridge} annotation={a} />
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
