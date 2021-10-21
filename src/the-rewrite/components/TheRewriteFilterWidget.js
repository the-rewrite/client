import { useState } from 'preact/hooks';

function log(...args) {
  console.log(window.location.protocol, ...args);
}

function TheRewriteFilterWidget() {
  // REVIEW: Get these values from somewhere
  const categoriesColors = [
    [
      'Additions',
      CircleSymbol('green'),
      () => log('toggle filter Additions'),
      1,
    ],
    [
      'Definitions',
      CircleSymbol('red'),
      () => log('toggle filter Definitions'),
      1,
    ],
    [
      'Corrections',
      CircleSymbol('yellow'),
      () => log('toggle filter Corrections'),
      1,
    ],
  ];

  const catButtons = categoriesColors.map(
    ([text, symbol, action, initalState]) => {
      return (
        <FilterButtonWithSymbol
          key={text}
          text={text}
          symbol={symbol}
          action={action}
          initalState={initalState}
        />
      );
    }
  );

  return (
    <section id="filter-widget">
      <section className="filters">
        {catButtons}
        <FilterButton
          text="Hide Replies"
          action={() => log('toggle replies')}
          initalState={0}
        />
        <FilterButton
          text="Page Notes"
          action={() => log('toggle page notes')}
          initalState={0}
        />
      </section>
      <section className="ordering">
        <FilterButton
          text="By date"
          initalState={1}
          action={() => log('toggle by date')}
        />
      </section>
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

function FilterButtonWithSymbol({ text, symbol, action, initalState }) {
  const [state, setState] = useState(initalState);
  const _action = toggle(action, state, setState);

  return (
    <button data-state={state} className="with-symbol" onClick={_action}>
      {symbol}
      {text}
    </button>
  );
}

function FilterButton({ text, action, initalState }) {
  const [state, setState] = useState(initalState);
  const _action = toggle(action, state, setState);
  return (
    <button data-state={state} onClick={_action}>
      {text}
    </button>
  );
}

function FilterDropDownButton({ text, action, initalState, items }) {
  const [state, setState] = useState(initalState);
  const _action = withDropDown(action, state, setState);
  return (
    <button data-state={state} onClick={_action}>
      {text}
    </button>
  );
}

function CircleSymbol({ color }) {
  return <div className={`circle ${color}`} />;
}

export default TheRewriteFilterWidget;
