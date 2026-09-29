export {};

const statusElement = document.querySelector<HTMLParagraphElement>('#status');
const mainElement = document.querySelector<HTMLElement>('main');

if (!statusElement || !mainElement) {
  throw new Error('PoC harness host elements are missing.');
}

const params = new URLSearchParams(window.location.search);
const poc = params.get('poc');

if (poc === '2') {
  const { mountPoc2 } = await import('./poc2/dom-build');
  const root = document.createElement('section');
  root.id = 'poc-root';
  mainElement.append(root);

  const api = mountPoc2(root);

  Object.assign(window, {
    crossDefensePoc2: api,
  });

  statusElement.textContent = 'PoC-2 DOM Build interaction ready.';
} else if (poc === '3') {
  const module = await import('./poc3/durability');
  const api = module.createPoc3BrowserApi();

  await api.bootstrap();

  Object.assign(window, {
    crossDefensePoc3: api,
  });

  statusElement.textContent = 'PoC-3 durability harness ready.';
} else if (poc === '4') {
  const { createPoc4Api } = await import('./poc4/content-pack');
  const api = createPoc4Api();

  Object.assign(window, {
    crossDefensePoc4: api,
  });

  statusElement.textContent = 'PoC-4 offline content harness ready.';
} else if (poc === '5') {
  const { createPoc5SessionLock } = await import('./poc5/session-lock');
  const api = createPoc5SessionLock();

  Object.assign(window, {
    crossDefensePoc5: api,
  });

  statusElement.textContent = 'PoC-5 Workspace Session Lock ready.';
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
