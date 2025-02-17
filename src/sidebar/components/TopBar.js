import { IconButton, LinkButton } from '@hypothesis/frontend-shared';

import { serviceConfig } from '../config/service-config';
import { isThirdPartyService } from '../helpers/is-third-party-service';
import { applyTheme } from '../helpers/theme';
import { withServices } from '../service-context';
import { useStoreProxy } from '../store/use-store';

import GroupList from './GroupList';
import SearchInput from './SearchInput';
import SortMenu from './SortMenu';
import StreamSearchInput from './StreamSearchInput';
import UserMenu from './UserMenu';

/**
 * @typedef {import('../../types/config').MergedConfig} MergedConfig
 * @typedef {import('../components/UserMenu').AuthState} AuthState
 */

/**
 * @typedef TopBarProps
 * @prop {AuthState} auth
 * @prop {import('../services/frame-sync').FrameSyncService} frameSync
 * @prop {boolean} isSidebar - Flag indicating whether the app is the sidebar or a top-level page.
 * @prop {() => any} onLogin - Callback invoked when user clicks "Login" button.
 * @prop {() => any} onLogout - Callback invoked when user clicks "Logout" action in account menu.
 * @prop {() => any} onSignUp - Callback invoked when user clicks "Sign up" button.
 * @prop {MergedConfig} settings
 * @prop {import('../services/streamer').StreamerService} streamer
 */

/**
 * The toolbar which appears at the top of the sidebar providing actions
 * to switch groups, view account information, sort/filter annotations etc.
 *
 * @param {TopBarProps} props
 */
function TopBar({
  auth,
  frameSync,
  isSidebar,
  onLogin,
  onLogout,
  onSignUp,
  settings,
  streamer,
}) {
  const showSharePageButton = !isThirdPartyService(settings);
  const loginLinkStyle = applyTheme(['accentColor'], settings);

  const store = useStoreProxy();
  const filterQuery = store.filterQuery();
  const pendingUpdateCount = store.pendingUpdateCount();

  const applyPendingUpdates = () => streamer.applyPendingUpdates();

  const toggleSharePanel = () => {
    store.toggleSidebarPanel('shareGroupAnnotations');
  };

  const isHelpPanelOpen = store.isSidebarPanelOpen('help');
  const isAnnotationsPanelOpen = store.isSidebarPanelOpen(
    'shareGroupAnnotations'
  );

  /**
   * Open the help panel, or, if a service callback is configured to handle
   * help requests, fire a relevant event instead
   */
  const requestHelp = () => {
    const service = serviceConfig(settings);
    if (service && service.onHelpRequestProvided) {
      frameSync.notifyHost('helpRequested');
    } else {
      store.toggleSidebarPanel('help');
    }
  };

  const loginControl = (
    <>
      {auth.status === 'unknown' && (
        <span className="TopBar__login-links">⋯</span>
      )}
      {auth.status === 'logged-out' && (
        <span className="TopBar__login-links text-lg font-medium hyp-u-horizontal-spacing--2">
          <LinkButton
            classes="InlineLinkButton"
            onClick={onSignUp}
            style={loginLinkStyle}
            variant="primary"
          >
            Sign up
          </LinkButton>
          <div>/</div>
          <LinkButton
            classes="InlineLinkButton"
            onClick={onLogin}
            style={loginLinkStyle}
            variant="primary"
          >
            Log in
          </LinkButton>
        </span>
      )}
      {auth.status === 'logged-in' && (
        <UserMenu auth={auth} onLogout={onLogout} />
      )}
    </>
  );

  return (
    <div className="TopBar">
      {/* Single-annotation and stream views. */}
      {!isSidebar && (
        <div className="TopBar__inner content">
          <StreamSearchInput />
          <div className="hyp-u-stretch" />
          <IconButton
            icon="help"
            expanded={isHelpPanelOpen}
            onClick={requestHelp}
            size="small"
            title="Help"
          />
          {loginControl}
        </div>
      )}
      {/* Sidebar view */}
      {isSidebar && (
        <div className="TopBar__inner content">
          <GroupList />
          <div className="hyp-u-stretch" />
          {pendingUpdateCount > 0 && (
            <IconButton
              icon="refresh"
              onClick={applyPendingUpdates}
              size="small"
              variant="primary"
              title={`Show ${pendingUpdateCount} new/updated ${
                pendingUpdateCount === 1 ? 'annotation' : 'annotations'
              }`}
            />
          )}
          <SearchInput
            query={filterQuery || null}
            onSearch={store.setFilterQuery}
          />
          <SortMenu />
          {showSharePageButton && (
            <IconButton
              icon="share"
              expanded={isAnnotationsPanelOpen}
              onClick={toggleSharePanel}
              size="small"
              title="Share annotations on this page"
            />
          )}
          <IconButton
            icon="help"
            expanded={isHelpPanelOpen}
            onClick={requestHelp}
            size="small"
            title="Help"
          />
          {loginControl}
        </div>
      )}
    </div>
  );
}

export default withServices(TopBar, ['frameSync', 'settings', 'streamer']);
