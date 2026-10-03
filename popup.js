const ID_PATTERN = /^\s*(RJ|RE|VJ|BJ)(\d{8}|\d{6})\s*$/i;
const FLOOR = { RJ: 'maniax', RE: 'maniax', VJ: 'pro', BJ: 'books' };

const toggle = document.getElementById('enabled');
const form = document.getElementById('open-form');
const input = document.getElementById('id-input');
const error = document.getElementById('error');

chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
  toggle.checked = enabled;
});

toggle.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: toggle.checked });
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const m = input.value.match(ID_PATTERN);
  if (!m) {
    error.hidden = false;
    return;
  }
  const prefix = m[1].toUpperCase();
  const id = prefix + m[2];
  chrome.tabs.create({ url: `https://www.dlsite.com/${FLOOR[prefix]}/work/=/product_id/${id}.html` });
  window.close();
});

input.addEventListener('input', () => {
  error.hidden = true;
});
