import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = process.env.RDA_AUDIT_URL || 'http://127.0.0.1:4179/';
const origin = new URL(baseUrl).origin;

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(absolute);
    return entry.isFile() && entry.name.endsWith('.html') ? [absolute] : [];
  });
}

const files = [path.join(root, 'index.html'), path.join(root, '404.html'), ...htmlFiles(path.join(root, 'pages'))];
const routes = files.map(file => '/' + path.relative(root, file).split(path.sep).join('/'));
const routeSet = new Set(routes);

function routeFor(value) {
  const url = new URL(value, baseUrl);
  return url.origin === origin ? url.pathname : null;
}

async function settle(page) {
  await page.waitForFunction(() => document.body.classList.contains('site-shell-ready'));
  await page.waitForSelector('[data-rda-music-player] .mobile-transport');
  await page.waitForFunction(() => window.RDA_NAVIGATION_READY === true);
  await page.waitForTimeout(75);
}

async function snapshot(page) {
  return page.evaluate(() => {
    const main = document.querySelector('main');
    const heading = main?.querySelector('h1,h2');
    const panel = main?.querySelector('section,article,nav,div');
    const pick = node => {
      if (!node) return null;
      const style = getComputedStyle(node);
      return {
        display: style.display,
        position: style.position,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderRadius: style.borderRadius,
        padding: style.padding
      };
    };
    const buttons = [...document.querySelectorAll('[data-rda-music-player] button')]
      .filter(button => getComputedStyle(button).display !== 'none')
      .map(button => {
        const bounds = button.getBoundingClientRect();
        return [button.getAttribute('aria-label'), bounds.width, bounds.height];
      });
    return {
      title: document.title,
      main: pick(main),
      heading: pick(heading),
      panel: pick(panel),
      mainClass: main?.className || '',
      bodyClass: document.body.className,
      skipPosition: document.querySelector('.skip-link') ? getComputedStyle(document.querySelector('.skip-link')).position : null,
      playerCount: document.querySelectorAll('[data-rda-music-player]').length,
      buttons,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      stylesheetPaths: [...document.querySelectorAll('link[rel="stylesheet"]')]
        .map(link => new URL(link.href).pathname)
        .filter(value => !value.includes('fonts.googleapis.com'))
        .sort(),
      references: [...document.querySelectorAll('[href],[src]')].flatMap(node => ['href', 'src']
        .map(attribute => node.getAttribute(attribute))
        .filter(Boolean)
        .map(value => new URL(value, document.baseURI).href)),
      links: [...document.querySelectorAll('a[href]')].map(link => ({
        raw: link.getAttribute('href'),
        absolute: link.href,
        visible: Boolean(link.offsetWidth || link.offsetHeight || link.getClientRects().length)
      }))
    };
  });
}

const browser = await chromium.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
});

try {
  const direct = new Map();
  const incomingEdge = new Map();
  const localReferences = new Set();
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
    for (const route of routes) {
      const page = await browser.newPage({ viewport });
      const problems = [];
      page.on('pageerror', error => problems.push(`page error: ${error.message}`));
      page.on('console', message => {
        if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
      });
      page.on('response', response => {
        const url = new URL(response.url());
        if (url.origin === origin && response.status() >= 400) problems.push(`${response.status()} ${url.pathname}`);
      });
      const response = await page.goto(new URL(route, baseUrl).href, { waitUntil: 'domcontentloaded' });
      assert(response && response.ok(), `${route} did not load successfully`);
      await settle(page);
      const state = await snapshot(page);
      assert.equal(problems.length, 0, `${route} emitted errors at ${viewport.width}px: ${problems.join('; ')}`);
      assert(state.main, `${route} has no main element`);
      assert.notEqual(state.main.fontFamily, '"Times New Roman"', `${route} rendered with default browser type`);
      assert.equal(state.playerCount, 1, `${route} has ${state.playerCount} player mounts`);
      const controlLabels = state.buttons.map(button => button[0]);
      assert.equal(controlLabels[0], 'Previous track', `${route} has the wrong Previous control`);
      assert.match(controlLabels[1] || '', /^(Play|Pause)$/, `${route} has the wrong Play/Pause control`);
      assert.deepEqual(controlLabels.slice(2), ['Stop', 'Next track'], `${route} exposes the wrong Stop/Next controls`);
      assert(state.buttons.every(button => button[1] === 44 && button[2] === 44), `${route} changed transport geometry`);
      assert(state.horizontalOverflow <= 1, `${route} overflows horizontally by ${state.horizontalOverflow}px at ${viewport.width}px`);
      if (viewport.width === 1440) {
        direct.set(route, state);
        state.references.forEach(reference => {
          const url = new URL(reference);
          if (url.origin === origin) {
            url.hash = '';
            localReferences.add(url.href);
          }
        });
        for (const href of state.links) {
          const target = routeFor(href.absolute);
          const existing = target ? incomingEdge.get(target) : null;
          if (target && routeSet.has(target) && target !== route && (!existing || (!existing.visible && href.visible))) {
            incomingEdge.set(target, { source: route, href: href.raw, visible: href.visible });
          }
        }
      }
      await page.close();
    }
  }

  for (const reference of localReferences) {
    const response = await fetch(reference, { method: 'HEAD', redirect: 'follow' });
    assert(response.ok, `Broken local reference: ${reference} returned ${response.status}`);
  }

  for (const [target, edge] of incomingEdge) {
    console.log(`CLICK: ${edge.source} -> ${target}`);
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const problems = [];
    page.on('pageerror', error => problems.push(`page error: ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') problems.push(`console error: ${message.text()}`);
    });
    page.on('response', response => {
      const url = new URL(response.url());
      if (url.origin === origin && response.status() >= 400) problems.push(`${response.status()} ${url.pathname}`);
    });
    await page.goto(new URL(edge.source, baseUrl).href, { waitUntil: 'domcontentloaded' });
    await settle(page);
    const link = page.locator(`a[href="${edge.href}"]`).filter({ visible: true }).first();
    await link.click();
    await page.waitForTimeout(500);
    assert.equal(new URL(page.url()).pathname, target, `${edge.source} link did not reach ${target}`);
    await settle(page);
    const state = await snapshot(page);
    const expected = direct.get(target);
    assert.equal(problems.length, 0, `${edge.source} -> ${target} emitted errors: ${problems.join('; ')}`);
    assert.deepEqual(state.main, expected.main, `${target} main styling differs after clicked navigation`);
    assert.deepEqual(state.heading, expected.heading, `${target} heading styling differs after clicked navigation`);
    assert.deepEqual(state.panel, expected.panel, `${target} panel styling differs after clicked navigation`);
    assert.deepEqual(state.stylesheetPaths, expected.stylesheetPaths, `${target} stylesheets differ after clicked navigation`);
    assert.equal(state.playerCount, 1, `${target} duplicated the player after clicked navigation`);
    assert.equal(state.horizontalOverflow <= 1, true, `${target} overflows after clicked navigation`);
    await page.close();
  }

  console.log(`PASS: ${routes.length} routes loaded directly at desktop and mobile sizes; ${localReferences.size} local references resolved; ${incomingEdge.size} clicked destinations matched direct rendering.`);
} finally {
  await browser.close();
}
