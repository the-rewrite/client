// use muuri react
// where to build list of annotations? in guest or main context?
// muuri needs a parent element for positionng and an inner element for visibility
// probably we need an need item component

//import MuuriComponent from 'muuri-react';

// REVIEW please review this implementation and add some typedefs

function GridItem({ annotation }) {
  return (
    <div id="{key}" className="rewrite-grid-item outer">
      <div className="inner">
        <p>annotation: {annotation.id}</p>
      </div>
    </div>
  );
}

function GridRow({ bucket }) {
  const items = bucket.map(a => <GridItem key={a.id} annotation={a} />);
  return <div className="rewrite-grid-row">{items}</div>;
}

function TheRewriteGrid({ buckets }) {
  // So the incoming buckets
  const bucketValues = Object.values(buckets) || [];
  const rows = (Object.keys(buckets) || []).map((b, i) => (
    <GridRow key={b} bucket={bucketValues[i]} />
  ));
  return <div className="rewrite-grid-parent">{rows}</div>;
}

export default TheRewriteGrid;
