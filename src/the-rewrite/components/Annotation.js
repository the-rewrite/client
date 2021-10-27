import classnames from 'classnames';

import { useStoreProxy } from './../../sidebar/store/use-store';
import { quote } from './../../sidebar/helpers/annotation-metadata';
import { withServices } from './../../sidebar/service-context';
import { isPrivate } from './../../sidebar/helpers/permissions';

import AnnotationActionBar from './../../sidebar/components/Annotation/AnnotationActionBar';
import AnnotationBody from './../../sidebar/components/Annotation/AnnotationBody';
import AnnotationEditor from './../../sidebar/components/Annotation/AnnotationEditor';
import AnnotationHeader from './../../sidebar/components/Annotation/AnnotationHeader';
import AnnotationQuote from './../../sidebar/components/Annotation/AnnotationQuote';
import AnnotationReplyToggle from './../../sidebar/components/Annotation/AnnotationReplyToggle';

/**
 * @typedef {import("../../../types/api").Annotation} Annotation
 * @typedef {import('../../../types/api').Group} Group
 */

/**
 * @typedef AnnotationProps
 * @prop {Annotation} [annotation] - The annotation to render. If undefined,
 *   this Annotation will render as a "missing annotation" and will stand in
 *   as an Annotation for threads that lack an annotation.
 * @prop {boolean} hasAppliedFilter - Is any filter applied currently?
 * @prop {boolean} isReply
 * @prop {VoidFunction} onToggleReplies - Callback to expand/collapse reply threads
 * @prop {number} replyCount - Number of replies to this annotation's thread
 * @prop {boolean} threadIsCollapsed - Is the thread to which this annotation belongs currently collapsed?
 * @prop {import('../../services/annotations').AnnotationsService} annotationsService
 * @prop {import('../services/frame-sync').FrameSyncService} frameSync
 * @prop {import toastMessages from '../../sidebar/store/modules/toast-messages'} toastMessenger;
 */

/**
 * A single annotation.
 *
 * @param {AnnotationProps} props
 */
function Annotation({
  annotation,
  hasAppliedFilter,
  isReply,
  onToggleReplies,
  replyCount,
  threadIsCollapsed,
  annotationsService,
  frameSync,
  toastMessenger,
}) {
  const isCollapsedReply = isReply && threadIsCollapsed;

  const store = useStoreProxy();

  const hasQuote = annotation && !!quote(annotation);
  const isFocused = annotation && store.isAnnotationFocused(annotation.$tag);
  const isSaving = annotation && store.isSavingAnnotation(annotation);
  const isEditing = annotation && !!store.getDraft(annotation) && !isSaving;
  const isLoggedIn = store.isLoggedIn();

  const userid = store.profile().userid;
  const showActions = !isSaving && !isEditing;
  const showReplyToggle = !isReply && !hasAppliedFilter && replyCount > 0;

  const onReply = event => {
    event.preventDefault();
    if (!isLoggedIn) {
      store.openSidebarPanel('loginPrompt');
      return;
    }
    annotationsService.reply(annotation, userid);
  };

  const onEdit = event => {
    event.preventDefault();
    store.createDraft(annotation, {
      tags: annotation.tags,
      text: annotation.text,
      isPrivate: isPrivate(annotation.permissions),
    });
  };

  const scrollToAnnotation = event => {
    event.preventDefault();
    frameSync.scrollToAnnotation(annotation.$tag);
  };

  return (
    <article
      className={classnames('Annotation', {
        'Annotation--missing': !annotation,
        'Annotation--reply': isReply,
        'is-collapsed': threadIsCollapsed,
        'is-focused': isFocused,
      })}
    >
      {annotation && (
        <>
          {hasQuote && (
            <AnnotationQuote annotation={annotation} isFocused={isFocused} />
          )}

          {!isCollapsedReply && !isEditing && (
            <AnnotationBody annotation={annotation} />
          )}

          {isEditing && <AnnotationEditor annotation={annotation} />}

          <AnnotationHeader
            annotation={annotation}
            isEditing={isEditing}
            replyCount={replyCount}
            threadIsCollapsed={threadIsCollapsed}
          />
        </>
      )}

      {!annotation && !isCollapsedReply && (
        <div>
          <em>Message not available.</em>
        </div>
      )}

      {!isCollapsedReply && (
        <footer className="Annotation__footer">
          <div className="Annotation__controls u-layout-row">
            {showReplyToggle && (
              <AnnotationReplyToggle
                onToggleReplies={onToggleReplies}
                replyCount={replyCount}
                threadIsCollapsed={threadIsCollapsed}
              />
            )}
            {isSaving && <div className="Annotation__actions">Saving...</div>}
            {annotation && showActions && (
              <div className="u-layout-row--justify-right u-stretch">
                <AnnotationActionBar
                  annotation={annotation}
                  onReply={onReply}
                />

                <p>
                  <a
                    href={annotation.links.incontext}
                    onClick={scrollToAnnotation}
                    target="_blank"
                  >
                    jump to
                  </a>{' '}
                  ·{' '}
                  <a href="invalid/url" onClick={onReply}>
                    reply
                  </a>{' '}
                  ·{' '}
                  <a href={annotation.links.html} target="_blank">
                    permalink
                  </a>
                  ·{' '}
                  <a href={annotation.links.html} onClick={onEdit}>
                    edit
                  </a>
                </p>
              </div>
            )}
          </div>
        </footer>
      )}
    </article>
  );
}

export default withServices(Annotation, [
  'annotationsService',
  'frameSync',
  'toastMessenger',
]);
