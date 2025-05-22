import puppeteer from 'puppeteer';
import WebSocket from 'ws';
import chokidar from 'chokidar';

const CONTINUE_WS = new WebSocket('ws://localhost:65432'); // Continue agent socket

(async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://localhost:9222',
  });
  const [page] = await browser.pages();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const stack = msg.text();
      console.log('[Console Error]:', stack);
      CONTINUE_WS.send(JSON.stringify({
        type: 'continue.chat',
        prompt: `
A front-end error occurred in the browser:

${stack}

Please identify the bug in the corresponding codebase and auto-fix it. Make minimal edits and save the file.`,
      }));
    }
  });

  chokidar.watch(['src/**/*.{js,jsx,ts,tsx,vue}']).on('change', path => {
    CONTINUE_WS.send(JSON.stringify({ type: 'devServer.reload', path }));
  });
})();
