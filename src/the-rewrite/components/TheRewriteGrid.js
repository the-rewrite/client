//import MuuriComponent from 'muuri-react';

// REVIEW please review this implementation and add some typedefs

function GridItem({ annotation }) {
  return (
    <div id={annotation.id} className="rewrite-grid-item outer">
      <div className="inner">
        <p>{annotation.text}</p>
        <p>by {annotation.user}</p>
      </div>
    </div>
  );
}

function GridRow({ bucket }) {
  const items = bucket.map(a => <GridItem key={a.id} annotation={a} />);
  return <div className="rewrite-grid-row">{items}</div>;
}

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

export default TheRewriteGrid;
