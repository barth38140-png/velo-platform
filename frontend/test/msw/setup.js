import './server.js';

// The server exported by ./server.js registers a `server` variable.
// Importing this file will cause the server lifecycle hooks to be
// registered in the importing test file's runtime via the beforeAll/afterAll
// calls defined below.

import { server } from './server.js';

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

export { server };
