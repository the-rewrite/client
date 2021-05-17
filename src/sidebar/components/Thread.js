import { IconButton, LabeledButton } from '@hypothesis/frontend-shared';
import classnames from 'classnames';
import { useCallback, useMemo } from 'preact/hooks';

import { useStoreProxy } from '../store/use-store';
import { withServices } from '../service-context';
import { countHidden, countVisible } from '../helpers/thread';

import Annotation from './Annotation';
import ModerationBanner from './ModerationBanner';

/** @typedef {import('../helpers/build-thread').Thread} Thread */

/**
 * @typedef ThreadProps
 * @prop {Thread} thread
 * @prop {import('../services/threads').ThreadsService} threadsService
 */

/**
 * A thread, which contains a single annotation at its top level, and its
 * recursively-rendered children (i.e. replies). A thread may have a parent,
 * and at any given time it may be `collapsed`.
 *
 * @param {ThreadProps} props
 */
function Thread({ thread, threadsService }) {
  // Render this thread's replies only if the thread is expanded
  const showChildren = !thread.collapsed;

  // Applied search filters will "hide" non-matching threads. If there are
  // hidden items within this thread, provide a control to un-hide them.
  const showHiddenToggle = countHidden(thread) > 0;

  // Render a control to expand/collapse the current thread if this thread has
  // a parent (i.e. is a reply thread)
  const showThreadToggle = !!thread.parent;

  // Render the annotation header which contains information about the target
  // document only if this thread is hidden, has no parent and contains a top level annotation
  const showAnnotationHeader =
    !thread.visible && !thread.parent && !!thread.annotation;
  const toggleIcon = thread.collapsed ? 'collapsed' : 'expand-menu';
  const toggleTitle = thread.collapsed ? 'Expand replies' : 'Collapse replies';

  // If rendering child threads, only render those that have at least one
  // visible item within them—i.e. don't render empty/totally-hidden threads.
  const visibleChildren = thread.children.filter(
    child => countVisible(child) > 0
  );

  const store = useStoreProxy();
  const hasAppliedFilter = store.hasAppliedFilter();
  const onToggleReplies = useCallback(
    () => store.setExpanded(thread.id, !!thread.collapsed),
    [store, thread.id, thread.collapsed]
  );

  // Memoize annotation content to avoid re-rendering an annotation when content
  // in other annotations/threads change.
  const annotationContent = useMemo(() => {
    // The annotation header includes the document target.
    // We want to show this information always, even when the first thread is is hidden.
    // This information is a very important, specially in the context
    // of the notebook, which displays annotations from different documents.
    const visibility = thread.visible
      ? 'visible'
      : thread.parent
      ? 'hidden'
      : 'header-only';
    return (
      <>
        {thread.visible && thread.annotation && (
          <ModerationBanner annotation={thread.annotation} />
        )}
        <Annotation
          visibility={visibility}
          annotation={thread.annotation}
          hasAppliedFilter={hasAppliedFilter}
          isReply={!!thread.parent}
          onToggleReplies={onToggleReplies}
          replyCount={thread.replyCount}
          threadIsCollapsed={thread.collapsed}
        />
      </>
    );
  }, [
    hasAppliedFilter,
    onToggleReplies,
    thread.annotation,
    thread.parent,
    thread.replyCount,
    thread.collapsed,
    thread.visible,
  ]);

  return (
    <section
      className={classnames('Thread', {
        'Thread--reply': thread.depth > 0,
        'is-collapsed': thread.collapsed,
      })}
    >
      {showThreadToggle && (
        <div className="Thread__collapse">
          <div className="Thread__collapse-button-container">
            <IconButton
              className="NonResponsiveIconButton"
              expanded={!thread.collapsed}
              icon={toggleIcon}
              title={toggleTitle}
              onClick={onToggleReplies}
              size="medium"
              variant="light"
            />
          </div>
        </div>
      )}

      <div className="Thread__content">
        {annotationContent}

        {showHiddenToggle && (
          <div
            // Do not fix vertical alignment for the first thread
            className={classnames({
              'Thread__hidden-toggle-button-container': !showAnnotationHeader,
            })}
          >
            <LabeledButton onClick={() => threadsService.forceVisible(thread)}>
              Show {countHidden(thread)} more in conversation
            </LabeledButton>
          </div>
        )}

        {showChildren && (
          <ul className="Thread__children">
            {visibleChildren.map(child => (
              <li key={child.id}>
                <Thread thread={child} threadsService={threadsService} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default withServices(Thread, ['threadsService']);
