// use muuri react
// where to build list of annotations? in guest or main context?
// muuri needs a parent element for positionng and an inner element for visibility
// probably we need an need item component

// TODO make one muuri component per bucket
// so that we can then scroll each of these elements
// in sync with the main content

// REVIEW check if alias works in project but also in editor
import { UseEffect } from 'react';
import MuuriComponent from 'muuri-react';

function GridItem({ key, annotation }) {
  return (
    <div id="{key}" className="rewrite-annotation outer">
      <div className="inner">
        <p>fart: {annotation.id}</p>
      </div>
    </div>
  );
}

function GridRow({ bucket }) {
  console.log(bucket);
  const items = bucket.map(a => GridItem(a.id, a));
  return <MuuriComponent>{items}</MuuriComponent>;
}

function TheRewriteGrid({ buckets }) {
  const rows = buckets.map(b => GridRow(b));
  return <div className="rewrite-grid">{rows}</div>;
}

export default TheRewriteGrid;
