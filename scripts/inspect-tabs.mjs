// Chrome CDP ile .excel-sheet-tab öğelerinin computed renk/opaklık değerlerini alır.
import { spawn } from 'node:child_process';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chrome = spawn(CHROME, [
  '--headless=new',
  '--remote-debugging-port=9223',
  '--no-sandbox',
  '--disable-gpu',
  'http://localhost:4321/',
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch('http://localhost:9223/json');
      if (res.ok) {
        const pages = await res.json();
        console.error('targets:', pages.map((p) => p.type + ' ' + p.url));
        const page = pages.find((p) => p.type === 'page' && p.url.startsWith('http://localhost'));
        if (page) return page.webSocketDebuggerUrl;
      }
    } catch {}
    await sleep(250);
  }
  throw new Error('CDP bağlantısı kurulamadı');
}

const wsUrl = await main();
const ws = new WebSocket(wsUrl);
let evaluated = false;
ws.onopen = () => {
  ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: `document.readyState` } }));
};
ws.onmessage = (m) => {
  const data = JSON.parse(m.data);
  if (data.id === 1) {
    const ready = data.result?.result?.value;
    ws.send(
      JSON.stringify({
        id: 2,
        method: 'Runtime.evaluate',
        params: {
          expression: `JSON.stringify({ href: location.href, ready: document.readyState, count: document.querySelectorAll('.excel-sheet-tab').length, items: [...document.querySelectorAll('.excel-sheet-tab')].slice(0,3).map(e => ({ cls: e.className, color: getComputedStyle(e).color, opacity: getComputedStyle(e).opacity, bg: getComputedStyle(e).backgroundColor })) })`,
          returnByValue: true,
        },
      })
    );
  }
  if (data.id === 2) {
    console.log(JSON.stringify(JSON.parse(data.result.result.value), null, 1));
    chrome.kill();
    process.exit(0);
  }
};
setTimeout(() => {
  chrome.kill();
  process.exit(1);
}, 15000);
