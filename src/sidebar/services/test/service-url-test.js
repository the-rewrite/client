import { ServiceURLService } from '../service-url';
import { $imports } from '../service-url';

/** Return a fake store object. */
function fakeStore() {
  let links = null;
  return {
    updateLinks: function (newLinks) {
      links = newLinks;
    },
    getState: () => {
      return { links: links };
    },
  };
}

function createService(linksPromise) {
  const replaceURLParams = sinon
    .stub()
    .returns({ url: 'EXPANDED_URL', params: {} });

  $imports.$mock({
    '../util/url': { replaceURLParams },
  });

  const store = fakeStore();

  const apiRoutes = {
    links: sinon.stub().returns(linksPromise),
  };

  return {
    store: store,
    apiRoutes,
    service: new ServiceURLService(store, apiRoutes),
    replaceURLParams: replaceURLParams,
  };
}

describe('ServiceURLService', () => {
  beforeEach(() => {
    sinon.stub(console, 'warn');
  });

  afterEach(() => {
    console.warn.restore();
    $imports.$restore();
  });

  context('before the API response has been received', () => {
    let service;
    let apiRoutes;

    beforeEach(() => {
      // Create a service with an unresolved Promise that will
      // never be resolved - it never receives the links from store.links().
      const parts = createService(new Promise(() => {}));

      service = parts.service;
      apiRoutes = parts.apiRoutes;
    });

    it('sends one API request for the links at boot time', () => {
      assert.calledOnce(apiRoutes.links);
      assert.isTrue(apiRoutes.links.calledWithExactly());
    });

    it('returns an empty string for any link', () => {
      assert.equal(service.getURL('foo'), '');
    });

    it('returns an empty string even if link params are given', () => {
      assert.equal(service.getURL('foo', { bar: 'bar' }), '');
    });
  });

  context('after the API response has been received', () => {
    let store;
    let linksPromise;
    let replaceURLParams;
    let service;

    beforeEach(() => {
      // The links Promise that store.links() will return.
      linksPromise = Promise.resolve({
        first_link: 'http://example.com/first_page/:foo',
        second_link: 'http://example.com/second_page',
      });

      const parts = createService(linksPromise);

      store = parts.store;
      service = parts.service;
      replaceURLParams = parts.replaceURLParams;
    });

    it('updates store with the real links', () => {
      return linksPromise.then(function (links) {
        assert.deepEqual(store.getState(), { links: links });
      });
    });

    it('calls replaceURLParams with the path and given params', () => {
      return linksPromise.then(() => {
        const params = { foo: 'bar' };

        service.getURL('first_link', params);

        assert.calledOnce(replaceURLParams);
        assert.deepEqual(replaceURLParams.args[0], [
          'http://example.com/first_page/:foo',
          params,
        ]);
      });
    });

    it('passes an empty params object to replaceURLParams if no params are given', () => {
      return linksPromise.then(() => {
        service.getURL('first_link');

        assert.calledOnce(replaceURLParams);
        assert.deepEqual(replaceURLParams.args[0][1], {});
      });
    });

    it('returns the expanded URL from replaceURLParams', () => {
      return linksPromise.then(() => {
        const renderedUrl = service.getURL('first_link');

        assert.equal(renderedUrl, 'EXPANDED_URL');
      });
    });

    it("throws an error if it doesn't have the requested link", () => {
      return linksPromise.then(() => {
        assert.throws(
          () => {
            service.getURL('madeUpLinkName');
          },
          Error,
          'Unknown link madeUpLinkName'
        );
      });
    });

    it('throws an error if replaceURLParams returns unused params', () => {
      const params = { unused_param_1: 'foo', unused_param_2: 'bar' };
      replaceURLParams.returns({
        url: 'EXPANDED_URL',
        params: params,
      });

      return linksPromise.then(() => {
        assert.throws(
          () => {
            service('first_link', params);
          },
          Error,
          'Unknown link parameters: unused_param_1, unused_param_2'
        );
      });
    });
  });
});
