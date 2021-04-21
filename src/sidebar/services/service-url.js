import { replaceURLParams } from '../util/url';

/**
 * A service for generating URLs to various pages in the annotation service,
 * such as the signup page or a page for a specific user or tag.
 *
 * The H API has an `/api/links` endpoint that returns a map of route names to
 * URL templates:
 *
 * ```
 * {
 *   signup: "http://localhost:5000/signup",
 *   user: "http://localhost:5000/u/:user",
 *   ...
 * }
 * ```
 *
 * This link map is fetched from H when the service is initialized and
 * persisted in the store. The `getURL` method of this service can then be used
 * to render a specific URL with given template parameters.
 *
 * The link map is fetched asynchronously and `getURL` returns an empty string
 * if called before it is fetched.
 *
 * @inject
 */
export class ServiceURLService {
  /**
   * Initialize the service and request URL templates from the backend.
   *
   * @param {import('../store').SidebarStore} store
   * @param {import('./api-routes').APIRoutesService} apiRoutes
   */
  constructor(store, apiRoutes) {
    this._apiRoutes = apiRoutes;
    this._store = store;

    this._fetchLinks();
  }

  /**
   * Fetch the link map from the backend and persist it in the store.
   */
  async _fetchLinks() {
    try {
      const links = await this._apiRoutes.links();
      this._store.updateLinks(links);
    } catch (err) {
      console.warn('The links API request was rejected: ' + err.message);
    }
  }

  /**
   * Return the URL for a given `linkName` and URL template `params`.
   *
   * Returns an empty string if called before links are fetched.
   *
   * @param {string} linkName
   * @param {Record<string,string>} params
   */
  getURL(linkName, params = {}) {
    const links = this._store.getState().links;

    if (links === null) {
      return '';
    }

    const path = links[linkName];
    if (!path) {
      throw new Error('Unknown link ' + linkName);
    }

    const url = replaceURLParams(path, params);
    const unused = Object.keys(url.params);
    if (unused.length > 0) {
      throw new Error('Unknown link parameters: ' + unused.join(', '));
    }

    return url.url;
  }
}
