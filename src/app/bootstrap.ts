export async function bootstrap(doc: Document): Promise<void> {
  doc.body.dataset['stage'] = '1';
  if (import.meta.env.DEV) await import('./dev_panel');
}
