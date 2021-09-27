import { useEffect, useRef } from 'preact/hooks';

import useRootThread from '../../sidebar/components/hooks/use-root-thread';
import { withServices } from '../../sidebar/service-context';
import { useStoreProxy } from '../../sidebar/store/use-store';
import { tabForAnnotation } from '../../sidebar/helpers/tabs';

import FilterStatus from '../../sidebar/components/FilterStatus';
import LoggedOutMessage from '../../sidebar/components/LoggedOutMessage';
import LoginPromptPanel from '../../sidebar/components/LoginPromptPanel';
import SelectionTabs from '../../sidebar/components/SelectionTabs';
import SidebarContentError from '../../sidebar/components/SidebarContentError';
import ThreadList from './ThreadList';

/**
 * @typedef TheRewriteViewProps
 * @prop {() => any} onLogin
 * @prop {() => any} onSignUp
 * @prop {import('../../shared/bridge').Bridge} bridge
 * @prop {import('../../sidebar/services/frame-sync').FrameSyncService} frameSync
 * @prop {import('../../sidebar/services/load-annotations').LoadAnnotationsService} loadAnnotationsService
 * @prop {import('../../sidebar/services/streamer').StreamerService} streamer
 */

/**
 * Render The Rewrite view and its components
 *
 * @param {TheRewriteViewProps} props
 */
function TheRewriteView({
  bridge,
  frameSync,
  onLogin,
  onSignUp,
  loadAnnotationsService,
  streamer,
}) {
  const rootThread = useRootThread();

  useEffect(() => {
    window.parent.postMessage({ type: 'theRewriteReady' }, '*');
  }, []);
  const buckets = {};

  for (let c of rootThread.children) {
    if (c.annotation) {
      const selector = c.annotation.target[0].selector || [];
      for (let s of selector) {
        if (s.type === 'RangeSelector') {
          const { startContainer } = s;
          if (!buckets[startContainer]) {
            buckets[startContainer] = [];
          }
          buckets[startContainer].push(c.annotation);
        }
      }
    }
  }

  console.log(buckets);

  // Store state values
  const store = useStoreProxy();
  const focusedGroupId = store.focusedGroupId();
  console.log('group', focusedGroupId);
  console.log('store', store);
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

  // tests added by f
  const maxResults = 5000;
  const focusedGroup = store.focusedGroup();
  const groupId = focusedGroup?.id || store.directLinkedGroupId();

  const onLoadError = error => {
    console.error(error);
  };

  const hasFetchedProfile = store.hasFetchedProfile();

  useEffect(() => {
    window.addEventListener('message', e => {
      if (e.data?.type !== 'hypothesisGuestReady') {
        return;
      }
      if (e.ports.length === 0) {
        console.warn(
          'Ignoring `hypothesisGuestReady` message without a MessagePort'
        );
        return;
      }
      const port = e.ports[0];
      bridge.createChannel(port);
    });
    bridge.on('the-rewrite-test-event', () =>
      console.log('hey im the rewrite i got a test event')
    );
  }, [bridge]);

  useEffect(() => {
    if (hasFetchedProfile) {
      streamer.connect({ applyUpdatesImmediately: false });
    }
  }, [hasFetchedProfile, streamer]);

  useEffect(() => {
    // NB: In current implementation, this will only happen/load once (initial
    // annotation fetch on application startup), as there is no mechanism
    // within the Notebook to change the `focusedGroup`. If the focused group
    // is changed within the sidebar and the Notebook re-opened, an entirely
    // new iFrame/app is created. This will need to be revisited.
    store.setSortKey('Newest');
    if (groupId) {
      loadAnnotationsService.load({
        groupId,
        // Load annotations in reverse-chronological order because that is how
        // threads are sorted in the notebook view. By aligning the fetch
        // order with the thread display order we reduce the changes in visible
        // content as annotations are loaded. This reduces the amount of time
        // the user has to wait for the content to load before they can start
        // reading it.
        //
        // Fetching is still suboptimal because we fetch both annotations and
        // replies together from the backend, but the user initially sees only
        // the top-level threads.
        sortBy: 'updated',
        sortOrder: 'desc',
        maxResults,
        onError: onLoadError,
        streamFilterBy: 'group',
      });
    }
  }, [loadAnnotationsService, groupId, store]);

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

  // Connect to the streamer when the sidebar has opened or if user is logged in
  useEffect(() => {
    if (hasFetchedProfile && (sidebarHasOpened || isLoggedIn)) {
      streamer.connect({ applyUpdatesImmediately: false });
    }
  }, [hasFetchedProfile, isLoggedIn, sidebarHasOpened, streamer]);

  return (
    <div className="TheRewriteView">
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
      {showTabs && <SelectionTabs isLoading={isLoading} />}
      <ThreadList threads={rootThread.children} />
      {showLoggedOutMessage && <LoggedOutMessage onLogin={onLogin} />}
    </div>
  );
}

export default withServices(TheRewriteView, [
  'bridge',
  'frameSync',
  'loadAnnotationsService',
  'streamer',
]);
