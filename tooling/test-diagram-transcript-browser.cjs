// Rendered acceptance for the Lexicon transcript in the built Cloudflare site.
// Run while dist is served on the normal local audit URL.
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

const base = process.env.RDA_AUDIT_URL || 'http://127.0.0.1:4179/';

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium
      ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
      : {});

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const page = await browser.newPage({ viewport });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      assert.equal(await page.locator('text=Open accessible HTML version').count(), 0);
      const link = page.locator('a', { hasText: 'Open text transcript' });
      assert.equal(await link.count(), 1);
      assert.equal(await link.getAttribute('target'), '_blank');
      assert.match(await link.getAttribute('rel'), /(?:^|\s)noopener(?:\s|$)/);
      assert.equal(await link.getAttribute('data-full-navigation'), '');
      await page.locator('#lexicon-dialog').evaluate(dialog => dialog.showModal());
      assert(await link.isVisible());
      await page.waitForFunction(() => {
        const image = document.querySelector('#lexicon-dialog img');
        return image && image.complete && image.naturalWidth > 0;
      });
      await page.locator('#lexicon-dialog img').evaluate(async image => { await image.decode(); });
      await page.waitForTimeout(500);
      await page.screenshot({ path: `tmp/lexicon-dialog-${engine.name()}-${viewport.width}.png`, fullPage: false });
      const [transcriptPage] = await Promise.all([
        page.waitForEvent('popup'),
        link.click()
      ]);
      await transcriptPage.waitForLoadState('domcontentloaded');
      await transcriptPage.waitForURL(/portrait-transcript-v10(?:\.html)?$/);
      assert(await page.locator('#lexicon-dialog').evaluate(dialog => dialog.open));
      assert.equal(await transcriptPage.locator('body > header, body > footer, #site-nav, [data-rda-music-player]').count(), 0);
      const result = await transcriptPage.locator('pre').evaluate(element => ({
        fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
        text: element.textContent,
        pageWidth: document.documentElement.scrollWidth,
        viewportWidth: document.documentElement.clientWidth
      }));
      assert(result.fontSize >= 16, `Transcript is ${result.fontSize}px, below the 12-point equivalent`);
      assert(result.text.includes("We don't need better leaders. We need a better system."));
      assert(!/(?:â.|Ã.|Â.|ï¿½|�)/u.test(result.text));
      assert(result.pageWidth <= result.viewportWidth, 'Transcript creates horizontal page overflow');
      assert.deepEqual(errors.filter(error => !error.includes('/cdn-cgi/rum')), []);
      await transcriptPage.screenshot({ path: `tmp/transcript-${engine.name()}-${viewport.width}.png`, fullPage: true });
      await transcriptPage.close();
      await page.close();
      console.log(`PASS ${engine.name()} ${viewport.width}px readable transcript at ${result.fontSize}px`);
    }
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
