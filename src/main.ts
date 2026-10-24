import { bootstrap } from './app/bootstrap';

bootstrap(document).catch((error: unknown) => {
  document.body.dataset['fatal'] = 'true';
  console.error(`[main] bootstrap failed: ${error instanceof Error ? error.message : String(error)}`);
  throw error;
});
