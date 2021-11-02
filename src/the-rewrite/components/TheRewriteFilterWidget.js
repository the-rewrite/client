import { useState } from 'preact/hooks';
import { withServices } from '../../sidebar/service-context';
import { useStoreProxy } from '../../sidebar/store/use-store';
import { getCategories } from '../categories';

function log(...args) {
  console.log(window.location.protocol, ...args);
}

function TheRewriteFilterWidget({ streamer, filterChange }) {
  const store = useStoreProxy();
  const pendingUpdateCount = store.pendingUpdateCount();
  const applyPendingUpdates = () => streamer.applyPendingUpdates();
  // REVIEW: Get these values from somewhere
  const categories = getCategories();
  const categoriesButtons = Object.keys(categories).map((c, i) => (
    <FilterButtonWithSymbol
      key={c}
      text={c}
      symbol={<CircleSymbol color={categories[c]} />}
      action={() => filterChange('toggleCategory', i)}
      initialState={1}
    />
  ));

  return (
    <section id="filter-widget">
      <section className="filters">
        {categoriesButtons}
        <FilterButton
          text="Hide Replies"
          action={() => filterChange('ShowHideReplies')}
          initialState={0}
        />
        {pendingUpdateCount > 0 && (
          <FilterButton
            text="Load new annotations"
            action={applyPendingUpdates}
            initialState={0}
          />
        )}
        {/* FIXME: Add PAGENOTES button */}
        {/* <FilterButton */}
        {/*   text="Page Notes" */}
        {/*   action={() => filterChange('ShowHidePageNotes')} */}
        {/*   initialState={0} */}
        {/* /> */}
      </section>
      {/*/ FIXME: Add Dropdown buttons here */}
      {/* <section className="ordering"> */}
      {/*   <FilterButton */}
      {/*     text="By date" */}
      {/*     initialState={1} */}
      {/*     action={() => log('toggle by date')} */}
      {/*   /> */}
      {/* </section> */}
    </section>
  );
}

function actionReducer(action, state, setState, reducer) {
  return () => {
    action();
    setState(reducer(state));
  };
}

const toggle = (action, state, setState) => {
  return actionReducer(action, state, setState, state => (state + 1) % 2);
};

const withDropDown = (action, state, setState) => {
  return actionReducer(action, state, setState, state => (state + 1) % 3);
};

function FilterButtonWithSymbol({ text, symbol, action, initialState }) {
  const [state, setState] = useState(initialState);
  const _action = toggle(action, state, setState);

  return (
    <button data-state={state} className="with-symbol" onClick={_action}>
      {symbol}
      {text}
    </button>
  );
}

function FilterButton({ text, action, initialState }) {
  const [state, setState] = useState(initialState);
  const _action = toggle(action, state, setState);
  return (
    <button data-state={state} onClick={_action}>
      {text}
    </button>
  );
}

function FilterDropDownButton({ text, action, initialState, items }) {
  const [state, setState] = useState(initialState);
  const _action = withDropDown(action, state, setState);
  return (
    <button data-state={state} onClick={_action}>
      {text}
    </button>
  );
}

function CircleSymbol({ color }) {
  return <div className="circle" style={`background-color: ${color}`} />;
}

//export default TheRewriteFilterWidget;

export default withServices(TheRewriteFilterWidget, ['streamer']);
