const status = document.querySelector<HTMLParagraphElement>('#status');

if (!status) {
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
  status.textContent = 'PoC-3 durability harness ready.';
} else {
  status.textContent = 'Browser PoC harness loaded.';
}
