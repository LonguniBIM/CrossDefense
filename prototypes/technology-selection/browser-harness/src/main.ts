export {};

const statusElement = document.querySelector<HTMLParagraphElement>('#status');

if (!statusElement) {
  throw new Error('PoC harness status element is missing.');
}

const params = new URLSearchParams(window.location.search);
const poc = params.get('poc');

if (poc === '3') {
  const module = await import('./poc3/durability');
  const api = module.createPoc3BrowserApi();

  Object.assign(window, {
    crossDefensePoc3: api,
  });

  await api.bootstrap();
  statusElement.textContent = 'PoC-3 durability harness ready.';
} else if (poc === '6') {
  const [{ createBrowserScenarioDriver }, { runSharedDurabilityScenario }] =
    await Promise.all([
      import('./poc6/browser-driver'),
      import('./poc6/shared-scenario'),
    ]);

  const driver = createBrowserScenarioDriver();

  Object.assign(window, {
    crossDefensePoc6: {
      run: () => runSharedDurabilityScenario(driver),
    },
  });

  statusElement.textContent = 'PoC-6 shared scenario harness ready.';
} else {
  statusElement.textContent = 'Browser PoC harness loaded.';
}
