const ID_PATTERN = /\b(RJ|RE|VJ|BJ)(\d{8}|\d{6})\b/gi;
const FLOOR = { RJ: 'maniax', RE: 'maniax', VJ: 'pro', BJ: 'books' };
const MENU_ID = 'dlsite-open';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: 'DLsiteで開く',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;
  const ids = new Set();
  for (const m of info.selectionText.matchAll(ID_PATTERN)) {
    ids.add(m[1].toUpperCase() + m[2]);
  }
  let index = tab ? tab.index + 1 : undefined;
  for (const id of ids) {
    const url = `https://www.dlsite.com/${FLOOR[id.slice(0, 2)]}/work/=/product_id/${id}.html`;
    chrome.tabs.create({ url, index, openerTabId: tab?.id });
    if (index !== undefined) index++;
  }
});
