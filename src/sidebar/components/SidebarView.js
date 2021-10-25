import { useEffect, useRef, useState } from 'preact/hooks';

import useRootThread from './hooks/use-root-thread';
import { withServices } from '../service-context';
import { useStoreProxy } from '../store/use-store';
import { tabForAnnotation } from '../helpers/tabs';

import FilterStatus from './FilterStatus';
import LoggedOutMessage from './LoggedOutMessage';
import LoginPromptPanel from './LoginPromptPanel';
import SelectionTabs from './SelectionTabs';
import SidebarContentError from './SidebarContentError';
import ThreadList from './ThreadList';
import TheRewriteView from '../../the-rewrite/components/TheRewriteView';
import { enableLayout } from '../../the-rewrite/dom-utils';

/**
 * @typedef {import('./Thread').Thread} Thread
 * @typedef {{[key: string]:Thread[]}} Bucket
 */

/**
 * @typedef SidebarViewProps
 * @prop {() => any} onLogin
 * @prop {() => any} onSignUp
 * @prop {import('../../shared/bridge').Bridge} bridge
 * @prop {import('../services/frame-sync').FrameSyncService} frameSync
 * @prop {import('../services/load-annotations').LoadAnnotationsService} loadAnnotationsService
 * @prop {import('../services/streamer').StreamerService} streamer
 */

/**
 * Render the sidebar and its components
 *
 * @param {SidebarViewProps} props
 */
function SidebarView({
  bridge,
  frameSync,
  onLogin,
  onSignUp,
  loadAnnotationsService,
  streamer,
}) {
  const rootThread = useRootThread();
  const store = useStoreProxy();
  const [enableTheRewrite, setEnableTheRewrite] = useState(false);

  const handleEnableTheRewrite = () => {
    setEnableTheRewrite(!enableTheRewrite);
  };

  const [buckets, setBuckets] = useState(/** @type {Bucket} */ ({}));
  const [filters, setFilters] = useState([false, false, false]); // FIXME add typedefs for functions list
  const [hideReplies, setHideReplies] = useState(false);
  const [showPageNotes, setPageNotes] = useState(false);

  useEffect(() => {
    const /** @type {Bucket} */ localBuckets = {};
    const /** @type {(s: string)=>string} */ splitAtParent = xpath => {
        return xpath.split('/').slice(0, 4).join('/');
      };

    // filter has to happen here
    const children = [...rootThread.children].filter(child => {
      let include = true;
      if (filters[0]) {
        include = !child.annotation?.tags.includes('annotation');
      }
      if (filters[1]) {
        include = !child.annotation?.tags.includes('definition');
      }
      if (filters[2]) {
        include = !child.annotation?.tags.includes('correction');
      }
      return include;
    });

    /**
     * @param {Thread} t
     */
    function getStartTextPosition(t) {
      const annotation = t.annotation;
      let start = 0;
      if (annotation) {
        const selector = annotation.target[0].selector || [];
        for (let s of selector) {
          if (s.type === 'TextPositionSelector') {
            start = s.start;
          }
        }
      }
      return start;
    }

    children.sort((a, b) => getStartTextPosition(a) - getStartTextPosition(b));

    for (let c of children) {
      if (c.annotation) {
        const selector = c.annotation.target[0].selector || [];
        for (let s of selector) {
          if (s.type === 'RangeSelector') {
            const { startContainer } = s;
            const b = splitAtParent(startContainer);
            if (!localBuckets[b]) {
              localBuckets[b] = [];
            }
            localBuckets[b].push(c);
          }
        }
      }
    }

    localBuckets.aaa = store.allAnnotations().filter(a => {
      return (
        !a.target[0].hasOwnProperty('selector') &&
        a.group === store.focusedGroupId() &&
        a.$orphan === false
      );
    });

    bridge.call('theRewriteBuckets', localBuckets);
    setBuckets(localBuckets);
  }, [bridge, rootThread.children.length, filters]);

  useEffect(() => {
    // @ts-ignore
    if (window.SCROLLER) {
      // @ts-ignore
      window.SCROLLER.onBuckets(buckets);
    }
  }, [buckets]);

  // Store state values
  const focusedGroupId = store.focusedGroupId();
  const hasAppliedFilter =
    store.hasAppliedFilter() || store.hasSelectedAnnotations();
  const isLoading = store.isLoading();
  const isLoggedIn = store.isLoggedIn();

  const linkedAnnotationId = store.directLinkedAnnotationId();
  const linkedAnnotation = linkedAnnotationId
    ? store.findAnnotationByID(linkedAnnotationId)
    : undefined;
  const directLinkedTab = linkedAnnotation
    ? tabForAnnotation(linkedAnnotation)
    : 'annotation';

  const searchUris = store.searchUris();
  const sidebarHasOpened = store.hasSidebarOpened();
  const userId = store.profile().userid;

  // The local `$tag` of a direct-linked annotation; populated once it
  // has anchored: meaning that it's ready to be focused and scrolled to
  const linkedAnnotationAnchorTag =
    linkedAnnotation && linkedAnnotation.$orphan === false
      ? linkedAnnotation.$tag
      : null;

  // If, after loading completes, no `linkedAnnotation` object is present when
  // a `linkedAnnotationId` is set, that indicates an error
  const hasDirectLinkedAnnotationError =
    !isLoading && linkedAnnotationId ? !linkedAnnotation : false;

  const hasDirectLinkedGroupError = store.directLinkedGroupFetchFailed();

  const hasContentError =
    hasDirectLinkedAnnotationError || hasDirectLinkedGroupError;

  const showFilterStatus = !hasContentError;
  const showTabs = !hasContentError && !hasAppliedFilter;

  // Show a CTA to log in if successfully viewing a direct-linked annotation
  // and not logged in
  const showLoggedOutMessage =
    linkedAnnotationId &&
    !isLoggedIn &&
    !hasDirectLinkedAnnotationError &&
    !isLoading;

  /** @type {import("preact/hooks").Ref<string|null>} */
  const prevGroupId = useRef(focusedGroupId);

  // Reload annotations when group, user or document search URIs change
  useEffect(() => {
    if (!prevGroupId.current || prevGroupId.current !== focusedGroupId) {
      // Clear any selected annotations and filters when the group ID changes.
      //
      // We don't clear the selection/filters on the initial load when
      // the focused group transitions from null to non-null, as this would clear
      // any filters intended to be used for the initial display (eg. to focus
      // on a particular user).
      if (prevGroupId.current) {
        store.clearSelection();
      }
      prevGroupId.current = focusedGroupId;
    }
    if (focusedGroupId && searchUris.length) {
      loadAnnotationsService.load({
        groupId: focusedGroupId,
        uris: searchUris,
      });
    }
  }, [store, loadAnnotationsService, focusedGroupId, userId, searchUris]);

  // When a `linkedAnnotationAnchorTag` becomes available, scroll to it
  // and focus it
  useEffect(() => {
    if (linkedAnnotationAnchorTag) {
      frameSync.focusAnnotations([linkedAnnotationAnchorTag]);
      frameSync.scrollToAnnotation(linkedAnnotationAnchorTag);
      store.selectTab(directLinkedTab);
    } else if (linkedAnnotation) {
      // Make sure to allow for orphaned annotations (which won't have an anchor)
      store.selectTab(directLinkedTab);
    }
  }, [
    directLinkedTab,
    frameSync,
    linkedAnnotation,
    linkedAnnotationAnchorTag,
    store,
  ]);

  const filterChange = action => {
    const localFilters = [...filters];
    switch (action) {
      case 'AdditionsToggle':
        localFilters[0] = !localFilters[0];
        break;
      case 'DefinitionsToggle':
        localFilters[1] = !localFilters[1];
        break;
      case 'CorrectionsToggle':
        localFilters[2] = !localFilters[2];
        break;
      case 'ShowHideReplies':
        setHideReplies(!hideReplies);
        break;
      case 'ShowHidePageNotes':
        setPageNotes(!showPageNotes);
        break;
      default:
        throw new Error('No matching case branch for ' + action);
    }

    setFilters(localFilters);
  };

  // Connect to the streamer when the sidebar has opened or if user is logged in
  const hasFetchedProfile = store.hasFetchedProfile();
  useEffect(() => {
    if (hasFetchedProfile && (sidebarHasOpened || isLoggedIn)) {
      streamer.connect({ applyUpdatesImmediately: false });
    }
  }, [hasFetchedProfile, isLoggedIn, sidebarHasOpened, streamer]);

  return (
    <div>
      <h2 className="u-screen-reader-only">Annotations</h2>
      {showFilterStatus && <FilterStatus />}
      <LoginPromptPanel onLogin={onLogin} onSignUp={onSignUp} />
      {hasDirectLinkedAnnotationError && (
        <SidebarContentError
          errorType="annotation"
          onLoginRequest={onLogin}
          showClearSelection={true}
        />
      )}
      {hasDirectLinkedGroupError && (
        <SidebarContentError errorType="group" onLoginRequest={onLogin} />
      )}
      {!enableTheRewrite && showTabs && <SelectionTabs isLoading={isLoading} />}
      <label>
        The Rewrite{' '}
        <input
          checked={enableTheRewrite}
          onChange={handleEnableTheRewrite}
          type="checkbox"
        />
      </label>
      {enableTheRewrite ? (
        <TheRewriteView
          threads={rootThread.children}
          buckets={buckets}
          filterChange={filterChange}
          hideReplies={hideReplies}
        />
      ) : (
        <ThreadList threads={rootThread.children} />
      )}
      {showLoggedOutMessage && <LoggedOutMessage onLogin={onLogin} />}
    </div>
  );
}

export default withServices(SidebarView, [
  'bridge',
  'frameSync',
  'loadAnnotationsService',
  'streamer',
]);
