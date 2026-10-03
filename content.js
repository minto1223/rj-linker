(() => {
  'use strict';

  const ID_PATTERN = /\b(RJ|RE|VJ|BJ)(\d{8}|\d{6})\b/gi;
  const FLOOR = { RJ: 'maniax', RE: 'maniax', VJ: 'pro', BJ: 'books' };
  const SKIP_TAGS = new Set([
    'A', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT',
    'OPTION', 'CODE', 'PRE', 'SVG', 'IFRAME', 'BUTTON',
  ]);
  const LINK_CLASS = 'dlsite-linker';

  function buildUrl(prefix, id) {
    return `https://www.dlsite.com/${FLOOR[prefix]}/work/=/product_id/${id}.html`;
  }

  function shouldSkip(textNode) {
    for (let el = textNode.parentElement; el; el = el.parentElement) {
      if (SKIP_TAGS.has(el.tagName)) return true;
      if (el.isContentEditable) return true;
    }
    return false;
  }

  function createLink(prefix, digits) {
    const id = prefix + digits;
    const a = document.createElement('a');
    a.href = buildUrl(prefix, id);
    a.textContent = id;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.className = LINK_CLASS;
    a.title = `DLsite で ${id} を開く`;
    // X(Twitter) などで親要素のクリック処理（ツイート詳細への遷移）を防ぐ
    a.addEventListener('click', (e) => e.stopPropagation());
    return a;
  }

  function linkifyTextNode(node) {
    const text = node.nodeValue;
    ID_PATTERN.lastIndex = 0;
    if (!ID_PATTERN.test(text)) return;
    ID_PATTERN.lastIndex = 0;

    const frag = document.createDocumentFragment();
    let last = 0;
    let m;
    while ((m = ID_PATTERN.exec(text)) !== null) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      frag.appendChild(createLink(m[1].toUpperCase(), m[2]));
      last = m.index + m[0].length;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }

  function scan(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentNode && !shouldSkip(root)) linkifyTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!/[RVB][JE]?\d/i.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return shouldSkip(node) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      },
    });
    const targets = [];
    while (walker.nextNode()) targets.push(walker.currentNode);
    targets.forEach(linkifyTextNode);
  }

  // 動的に追加される要素（無限スクロール等）をまとめて処理
  const pending = new Set();
  let scheduled = false;
  const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 50));

  function flush() {
    scheduled = false;
    const nodes = [...pending];
    pending.clear();
    nodes.forEach((n) => {
      if (n.isConnected) scan(n);
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const mu of mutations) {
      if (mu.type === 'characterData') {
        pending.add(mu.target);
      } else {
        mu.addedNodes.forEach((n) => {
          if (n.nodeType === Node.ELEMENT_NODE && n.classList.contains(LINK_CLASS)) return;
          pending.add(n);
        });
      }
    }
    if (pending.size && !scheduled) {
      scheduled = true;
      idle(flush, { timeout: 300 });
    }
  });

  function enable() {
    scan(document.body);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // 無効化時は挿入したリンクを元のテキストへ戻す
  function disable() {
    observer.disconnect();
    pending.clear();
    const parents = new Set();
    document.querySelectorAll(`a.${LINK_CLASS}`).forEach((a) => {
      parents.add(a.parentNode);
      a.replaceWith(document.createTextNode(a.textContent));
    });
    parents.forEach((p) => p && p.normalize());
  }

  chrome.storage.sync.get({ enabled: true }, ({ enabled }) => {
    if (enabled) enable();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes.enabled) return;
    if (changes.enabled.newValue) enable();
    else disable();
  });
})();
