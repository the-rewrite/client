//import MuuriComponent from 'muuri-react';

import { useState } from 'preact/hooks';

/**
 * @typedef {import('../../types/api').Annotation} Annotation
 *
 * @typedef GridItemProps
 * @prop {Annotation} annotation
 */

/**
 * @param {GridItemProps} props
 * */
function GridItem({ annotation }) {
  const [expand, setExpand] = useState(/** @type boolean */ (false));
  const isWide = annotation.text.length > 500;
  const cropped = annotation.text.length > 1000;
  const text = annotation.text.substring(0, 1000);

  // REVIEW: Lang attribute is set for correct hypentation, super important!!
  const lang = 'en';

  const toggleExpand = () => {
    setExpand(prev => !prev);
  };

  return (
    <div
      id={annotation.id}
      className={`rewrite-grid-item outer ${isWide ? 'wide' : ''}`}
    >
      <div className="inner" lang={lang}>
        <p>{expand ? annotation.text : text}</p>
        {cropped && (
          <p>
            <button onClick={toggleExpand}>
              {expand ? 'Collapse' : 'Read all'}
            </button>
          </p>
        )}
        <p>by {annotation.user}</p>
      </div>
    </div>
  );
}

/**
 * @typedef GridRowProps
 * @prop {Annotation[]} bucket
 */

/**
 * @param {GridRowProps} props
 */
function GridRow({ bucket }) {
  const items = bucket.map(a => <GridItem key={a.id} annotation={a} />);
  return <div className="rewrite-grid-row">{items}</div>;
}

/**
 * @typedef {import('./TheRewriteView').Bucket} Bucket
 *
 * @typedef TheRewriteGridProps
 * @prop {Bucket} buckets
 */

/**
 * @param {TheRewriteGridProps} props
 */
function TheRewriteGrid({ buckets }) {
  // So the incoming buckets is a map of xpath parent path -> [ annotations ]
  // We create a list of values to use in the map below
  const bucketValues = Object.values(buckets) || [];
  // so that we can iterate over the xpath expression
  // and add a row for each xpath parent
  // then we use the index to get the corresponding values
  // from the bucketValues and pass these as a prop down
  const rows = (Object.keys(buckets) || []).map((b, i) => (
    <GridRow key={b} bucket={bucketValues[i]} />
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

// TODO add wide annotations

export default TheRewriteGrid;
