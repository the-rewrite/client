import classnames from 'classnames';
import debounce from 'lodash.debounce';
import { useCallback, useMemo } from 'preact/hooks';

import { useStoreProxy } from './../../sidebar/store/use-store';
import { withServices } from './../../sidebar/service-context';

import Thread from './Thread';

/**
 * @typedef {import('../../types/config').MergedConfig} MergedConfig
 */

/**
 * @typedef ThreadCardProps
 * @prop {import('../helpers/build-thread').Thread} thread
 * @prop {import('../services/frame-sync').FrameSyncService} frameSync
 * @prop {boolean} hideReplies
 */

/**
 * A "top-level" `Thread`, rendered as a "card" in the sidebar. A `Thread`
 * renders its own child `Thread`s within itself.
 *
 * @param {ThreadCardProps} props
 */
function ThreadCard({ frameSync, thread, destroyGridNow, destroyGridTimeout, hideReplies }) {
  const store = useStoreProxy();
  const threadTag = thread.annotation && thread.annotation.$tag;
  const isFocused = threadTag && store.isAnnotationFocused(threadTag);
  const focusThreadAnnotation = useMemo(
    () =>
      debounce(tag => {
        const focusTags = tag ? [tag] : [];
        frameSync.focusAnnotations(focusTags);
      }, 10),
    [frameSync]
  );

  const scrollToAnnotation = useCallback(
    tag => {
      frameSync.scrollToAnnotation(tag);
    },
    [frameSync]
  );

  /**
   * Is the target's event an <a> or <button> element, or does it have
   * either as an ancestor?
   *
   * @param {Element} target
   */
  const isFromButtonOrLink = target => {
    return !!target.closest('button') || !!target.closest('a');
  };
  // Memoize threads to reduce avoid re-rendering when something changes in a
  // parent component but the `Thread` itself has not changed.
  const threadContent = useMemo(() => <Thread hideReplies={hideReplies} destroyGridNow={destroyGridNow} destroyGridTimeout={destroyGridTimeout} thread={thread} />, [thread]);

  return (
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
    <div
      onMouseEnter={() => focusThreadAnnotation(threadTag)}
      onMouseLeave={() => focusThreadAnnotation(null)}
      key={thread.id}
      className={classnames('ThreadCard', {
        'is-focused': isFocused,
      })}
    >
      {threadContent}
    </div>
  );
}

export default withServices(ThreadCard, ['frameSync']);
