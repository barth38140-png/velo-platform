
import { beforeAll, afterAll, afterEach } from 'vitest';
import { server } from './server.js';

// Démarre MSW avant tous les tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });
});

// Réinitialise les handlers après chaque test
afterEach(() => {
  server.resetHandlers();
});

// Arrête MSW après tous les tests
afterAll(() => {
  server.close();
});

export { server };
