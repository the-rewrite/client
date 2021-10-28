import Muuri from 'muuri';
/**
 * @typedef updateGridElementHeight
 * @param {Muuri.Grid} grid
 * @param {[items]} items
 * @returns {void}
 * */
export function updateGridElementHeight(grid, items) {
  const elem = grid.getElement();
  let max = 0;
  for (let item of items) {
    const y = item._top + item._height;
    if (y > max) {
      max = y;
    }
  }
  // @ts-ignore
  // Add a bit of slack to avoid redraw
  elem.style.height = `${max + 12 * 1.681}px`;
}
/**
 * @typedef createGrid
 * @param {HTMLElement} gridElement
 * @returns {Muuri.Grid}
 * */
export function createGrid(gridElement) {
  const grid = new Muuri(gridElement, {
    layout: {
      fillGaps: true,
      horizontal: true,
    },
  });
  grid.on('layoutEnd', items => {
    updateGridElementHeight(grid, items);
  });
  return grid.layout(true);
}
