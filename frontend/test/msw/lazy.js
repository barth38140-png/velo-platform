// Lightweight lazy MSW starter.
// Attach small wrappers to global fetch and XMLHttpRequest so that the MSW
// server is started automatically on the first real network request.

let __msw_start_promise = null;
let __msw_started = false;

async function ensureStarted() {
  if (__msw_started) return;
  if (__msw_start_promise) return __msw_start_promise;
  __msw_start_promise = (async () => {
    // dynamic import of server.js which exports `server`
    const mod = await import('./server.js');
    const { server } = mod;
    // register lifecycle hooks in this test worker
    // ensure we only call listen once per worker
    server.listen({ onUnhandledRequest: 'warn' });
    // register reset/close hooks
    try {
      // Use global before/after hooks provided by Vitest/Jest-like env
      if (typeof beforeEach === 'function') {
        afterEach(() => server.resetHandlers());
        afterAll(() => server.close());
      }
    } catch (e) {
      // ignore if hooks are not available
    }
    __msw_started = true;
  })();
  return __msw_start_promise;
}

// Wrap fetch
if (typeof globalThis.fetch === 'function') {
  const _fetch = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async function (...args) {
    await ensureStarted();
    return _fetch(...args);
  };
}

// Wrap XMLHttpRequest: delay send until server started
if (typeof globalThis.XMLHttpRequest === 'function') {
  const XHR = globalThis.XMLHttpRequest;
  const origSend = XHR.prototype.send;
  XHR.prototype.send = function (...args) {
    if (__msw_started) {
      return origSend.apply(this, args);
    }
    // Start MSW and then perform the actual send once started
    ensureStarted().then(() => {
      try {
        origSend.apply(this, args);
      } catch (e) {
        // swallow; original behavior will surface errors in tests
        throw e;
      }
    });
    // Do not call original send synchronously to ensure server is listening
    return undefined;
  };
}

export { ensureStarted };
