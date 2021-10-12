/**
 * Inspired by: Vanilla scrollTo implementation (smoothly scroll/"jump" to an
 * element) by github.com/andreasvirkus
 * Source: https://gist.github.com/andreasvirkus/e50ff1c8a3ffd63d9acdf4e8a0133283
 *
 * Default easing is:
 *  Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
 *
 * @param {Element} target selector to scroll to
 * @param {{duration?: number; callback?: ()=>void}} options Optionally defined duration, offset, callback and easing
 *
 * @return {()=>void}
 */
export default function jump(target, options = {}) {
  let clientHeight = document.documentElement.clientHeight;
  let r = target.getBoundingClientRect();
  let start = window.pageYOffset;
  let opt = {
    duration: options.duration || 500,
    offset: 0,
    callback: options.callback,
    easing: easeInOutQuad,
  };
  let distance = opt.offset + (r.top + r.bottom) / 2 - clientHeight / 2;
  let duration = opt.duration;
  let timeStart;
  let timeElapsed;
  let run = true;

  requestAnimationFrame(time => {
    timeStart = time;
    loop(time);
  });

  /**
   *
   * @param {number} time
   */
  function loop(time) {
    if (!run) {
      return;
    }
    timeElapsed = time - timeStart;
    window.scrollTo(0, opt.easing(timeElapsed, start, distance, duration));
    if (timeElapsed < duration) requestAnimationFrame(loop);
    else end();
  }

  function end() {
    window.scrollTo(0, start + distance);
    if (typeof opt.callback === 'function') requestAnimationFrame(opt.callback);
  }

  /**
   *
   * @param {number} t
   * @param {number} b
   * @param {number} c
   * @param {number} d
   * @returns
   */
  function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;

    return (-c / 2) * (t * (t - 2) - 1) + b;
  }

  return () => {
    run = false;
  };
}
