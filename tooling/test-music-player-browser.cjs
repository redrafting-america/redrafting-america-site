// Rendered acceptance coverage for the repository-contained RDA music player.
// Run from the repository root with the local preview on port 4179.
const assert = require('node:assert/strict');
const { chromium, webkit } = require('playwright-core');

const base = process.env.RDA_AUDIT_URL || 'http://127.0.0.1:4179/';
const skipNaturalTransition = process.env.RDA_SKIP_NATURAL_TRANSITION === '1';

async function waitForPlayer(page) {
  await page.waitForFunction(() => window.RDA_WEBAMP && window.RDA_LISTENING);
  await page.waitForSelector('[data-rda-music-player] .mobile-transport');
}

(async () => {
  for (const engine of [chromium, webkit]) {
    const browser = await engine.launch(engine === chromium
      ? { executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }
      : {});

    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await waitForPlayer(page);
      if (viewport.width < 760) {
        await page.locator('#site-nav-trigger').click();
        await page.waitForFunction(() => document.querySelector('#site-drawer').getAttribute('aria-hidden') === 'false');
      }

      const controls = await page.locator('[data-rda-music-player] [data-transport]').evaluateAll(buttons => buttons
        .filter(button => getComputedStyle(button).display !== 'none')
        .map(button => ({ label: button.getAttribute('aria-label'), width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })));
      assert.deepEqual([controls[0].label, controls[2].label, controls[3].label], ['Previous track', 'Stop', 'Next track']);
      assert.match(controls[1].label, /^(?:Play|Pause)$/);
      assert(controls.every(control => control.width === 44 && control.height === 44));
      assert.equal(await page.locator('[data-music-info]:visible,[data-toggle-order]:visible,[data-toggle-visualizations]:visible').count(), 0);

      await page.evaluate(() => {
        RDA_WEBAMP.setVolume(0);
        RDA_WEBAMP.stop();
      });
      await page.waitForFunction(() => RDA_WEBAMP.media._source._audio.paused);
      const play = page.locator('[data-transport="play"]');
      await play.click();
      await page.waitForFunction(() => {
        const audio = RDA_WEBAMP.media._source._audio;
        return !audio.paused && audio.currentTime > .2;
      });
      await play.click();
      await page.waitForFunction(() => RDA_WEBAMP.media._source._audio.paused);
      await page.waitForTimeout(350);
      const pausedAt = await page.evaluate(() => RDA_WEBAMP.media._source._audio.currentTime);
      await page.waitForTimeout(350);
      const afterPause = await page.evaluate(() => RDA_WEBAMP.media._source._audio.currentTime);
      assert(Math.abs(afterPause - pausedAt) < .15, 'Pause must retain the live position');

      await play.click();
      await page.waitForFunction(() => !RDA_WEBAMP.media._source._audio.paused);
      const previousFile = await page.evaluate(() => {
        const state = RDA_LISTENING.getState();
        return state.history[state.cursor];
      });
      await page.locator('[data-transport="next"]').click();
      await page.waitForFunction(file => {
        const state = RDA_LISTENING.getState();
        return state.history[state.cursor] !== file;
      }, previousFile);
      const nextFile = await page.evaluate(() => {
        const state = RDA_LISTENING.getState();
        return state.history[state.cursor];
      });
      await page.locator('[data-transport="previous"]').click();
      await page.waitForFunction(file => {
        const state = RDA_LISTENING.getState();
        return state.history[state.cursor] === file;
      }, previousFile);
      assert.notEqual(nextFile, previousFile);

      // Natural endings are independent of responsive placement, so exercise
      // one real transition per engine without duplicating the CDN seek on mobile.
      if (viewport.width >= 760 && !skipNaturalTransition) {
        await page.evaluate(() => RDA_LISTENING.playFile('abracadabra.mp3'));
        await page.waitForFunction(() => {
          const state = RDA_LISTENING.getState();
          return state.history[state.cursor] === 'abracadabra.mp3';
        });
        await page.waitForFunction(() => RDA_WEBAMP.media._source._audio.readyState >= 2);
        if (await page.evaluate(() => RDA_WEBAMP.media._source._audio.paused)) {
          await play.click();
          await page.waitForFunction(() => !RDA_WEBAMP.media._source._audio.paused);
        }
        await page.evaluate(() => {
          const audio = RDA_WEBAMP.media._source._audio;
          RDA_WEBAMP.seekToTime(audio.duration - .15);
        });
        await page.waitForFunction(() => {
          const state = RDA_LISTENING.getState();
          return state.history[state.cursor] === 'vote.mp3';
        }, null, { timeout: 10000 });
      }

      const sameAudio = await page.evaluate(() => {
        window.__rdaOriginalAudio = RDA_WEBAMP.media._source._audio;
        const link = document.createElement('a');
        link.href = 'pages/about/index.html';
        document.querySelector('main').append(link);
        link.click();
        link.remove();
        return true;
      });
      assert(sameAudio);
      await page.waitForFunction(() => /\/pages\/about\/(?:index\.html)?$/.test(location.pathname) && !document.querySelector('main').hasAttribute('aria-busy'));
      assert(await page.evaluate(() => window.__rdaOriginalAudio === RDA_WEBAMP.media._source._audio));
      if (viewport.width < 760) {
        await page.locator('#site-nav-trigger').click();
        await page.waitForFunction(() => document.querySelector('#site-drawer').getAttribute('aria-hidden') === 'false');
      }

      await page.emulateMedia({ reducedMotion: 'reduce' });
      const stop = page.locator('[data-transport="stop"]');
      assert.equal(await stop.evaluate(button => getComputedStyle(button).transitionDuration), '0s');
      await stop.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => RDA_WEBAMP.media._source._audio.paused && RDA_LISTENING.getState().position === 0);
      await page.reload();
      await waitForPlayer(page);
      assert.equal(await page.evaluate(() => RDA_WEBAMP.media._source._audio.currentTime), 0);
      assert.deepEqual(errors.filter(error => !error.includes('/cdn-cgi/rum')), []);
      await context.close();
      console.log(`PASS ${engine.name()} ${viewport.width} four controls, keyboard, transport states${viewport.width >= 760 && !skipNaturalTransition ? ', natural transition' : ''}, navigation, reload and reduced motion`);
    }

    const failure = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await failure.route('**/assets/scripts/music-player.js', route => route.abort());
    await failure.goto(base);
    await failure.waitForFunction(() => document.querySelector('[data-rda-music-player]')?.textContent.includes('Music player unavailable'));
    assert(await failure.locator('main a[href]').count());
    await failure.close();
    await browser.close();
    console.log(`PASS ${engine.name()} isolated component failure`);
  }
})().catch(error => {
  console.error(error);
  process.exit(1);
});
