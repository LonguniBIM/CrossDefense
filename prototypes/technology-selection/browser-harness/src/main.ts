export {};

const statusElement = document.querySelector<HTMLParagraphElement>('#status');

if (!statusElement) {
  throw new Error('PoC harness status element is missing.');
}

const params = new URLSearchParams(window.location.search);

if (params.get('poc') === '3') {
  const module = await import('./poc3/durability');
  const api = module.createPoc3BrowserApi();

  Object.assign(window, {
    crossDefensePoc3: api,
  });

  await api.bootstrap();
  statusElement.textContent = 'PoC-3 durability harness ready.';
} else {
  statusElement.textContent = 'Browser PoC harness loaded.';
}
