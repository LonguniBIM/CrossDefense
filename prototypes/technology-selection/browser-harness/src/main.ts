const status = document.querySelector<HTMLParagraphElement>('#status');

if (!status) {
  throw new Error('PoC harness status element is missing.');
}

status.textContent = 'Browser PoC harness loaded.';
