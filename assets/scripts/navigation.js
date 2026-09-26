/* Progressive site navigation keeps the repository-contained music player and
 * its live audio graph mounted while ordinary static HTML pages are exchanged. */
(function () {
  'use strict';

  if (document.documentElement.dataset.rdaNavigationLoaded === 'true') return;
  if (!/^https?:$/.test(window.location.protocol) || !window.fetch || !window.DOMParser) return;

  var content = document.querySelector('.site-shell-content');
  var header = document.querySelector('body > header');
  var footer = document.querySelector('body > footer');
  var loader = document.querySelector('script[data-rda-navigation]');
  if (!content || !content.querySelector('main') || !header || !footer || !loader) return;

  document.documentElement.dataset.rdaNavigationLoaded = 'true';
  var root = new URL('../../', loader.src);
  var displayedPage = pageKey(window.location.href);
  var request = null;
  var sequence = 0;
  var currentEntry = window.history.state && window.history.state.rdaEntry || entryKey();
  var positions = new Map();
  var announcement = document.createElement('span');
  announcement.className = 'navigation-status';
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  document.body.appendChild(announcement);

  function pageKey(value) {
    var url = new URL(value, window.location.href);
    return url.pathname + url.search;
  }

  function entryKey() {
    return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : Date.now() + '-' + Math.random();
  }

  function absoluteUrls(scope, base) {
    scope.querySelectorAll('[href],[src],[srcset],[poster],[action]').forEach(function (node) {
      ['href', 'src', 'poster', 'action'].forEach(function (attribute) {
        var value = node.getAttribute(attribute);
        if (value === null || value.indexOf('#') === 0 || /^(data|javascript):/i.test(value)) return;
        node.setAttribute(attribute, new URL(value, base).href);
      });
      var srcset = node.getAttribute('srcset');
      if (srcset === null || /^\s*data:/i.test(srcset)) return;
      node.setAttribute('srcset', srcset.split(',').map(function (candidate) {
        var match = candidate.trim().match(/^(\S+)(\s+.*)?$/);
        if (!match || /^(data|javascript):/i.test(match[1])) return candidate.trim();
        return new URL(match[1], base).href + (match[2] || '');
      }).join(', '));
    });
  }

  function isSharedStylesheet(node) {
    var href = node.href || '';
    return /site-shell\.css|music-player\.css|brand-lockup\.css|fonts\.googleapis\.com/i.test(href);
  }

  document.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(function (node) {
    if (!isSharedStylesheet(node)) node.dataset.rdaPageStyle = 'true';
  });

  async function synchronizeStyles(incoming, base) {
    var oldStyles = Array.from(document.head.querySelectorAll('[data-rda-page-style]'));
    var anchor = document.head.querySelector('link[href*="site-shell.css"]') || loader;
    var added = [];
    var pending = [];
    incoming.head.querySelectorAll('style,link[rel="stylesheet"]').forEach(function (source) {
      if (source.matches('link') && isSharedStylesheet(source)) return;
      var node = document.importNode(source, true);
      node.dataset.rdaPageStyle = 'true';
      if (node.matches('link')) {
        node.href = new URL(source.getAttribute('href'), base).href;
        pending.push(new Promise(function (resolve) {
          node.addEventListener('load', resolve, {once:true});
          node.addEventListener('error', resolve, {once:true});
        }));
      }
      anchor.parentNode.insertBefore(node, anchor);
      added.push(node);
    });
    await Promise.all(pending);
    oldStyles.forEach(function (node) { node.remove(); });
    return added;
  }

  function incomingMain(incoming) {
    var direct = incoming.querySelector('body > main');
    if (direct) return direct;
    var main = incoming.createElement('main');
    main.id = 'main-content';
    var sourceHeader = incoming.querySelector('body > header');
    var sourceFooter = incoming.querySelector('body > footer');
    var candidate = sourceHeader && sourceHeader.nextElementSibling;
    while (candidate && candidate !== sourceFooter) {
      var next = candidate.nextElementSibling;
      var support = /^(SCRIPT|STYLE|LINK)$/.test(candidate.tagName) || candidate.classList.contains('mobile-menu');
      if (!support) main.appendChild(candidate);
      candidate = next;
    }
    return main;
  }

  function shouldSkipScript(source) {
    var src = source.getAttribute('src') || '';
    var text = source.textContent || '';
    if (source.type === 'application/ld+json') return true;
    if (/site-shell\.js|music-player\.js|navigation\.js/i.test(src)) return true;
    return /utopia-bg-track|utopia-bg-playing|music-toggle|menu-toggle|last-updated/i.test(text);
  }

  async function runPageScripts(incoming, base) {
    var scripts = Array.from(incoming.body.querySelectorAll('script')).filter(function (source) {
      return !shouldSkipScript(source);
    });
    for (var index = 0; index < scripts.length; index += 1) {
      var source = scripts[index];
      var node = document.createElement('script');
      Array.from(source.attributes).forEach(function (attribute) {
        if (attribute.name !== 'src') node.setAttribute(attribute.name, attribute.value);
      });
      if (source.src || source.getAttribute('src')) {
        node.src = new URL(source.getAttribute('src'), base).href;
        await new Promise(function (resolve) {
          node.addEventListener('load', resolve, {once:true});
          node.addEventListener('error', resolve, {once:true});
          document.body.appendChild(node);
        });
      } else {
        node.textContent = source.textContent;
        document.body.appendChild(node);
      }
      node.remove();
    }
  }

  function saveScroll(persist) {
    var position = [window.scrollX, window.scrollY];
    positions.set(currentEntry, position);
    if (persist && window.history.state && window.history.state.rdaEntry === currentEntry) {
      window.history.replaceState(Object.assign({}, window.history.state, {rdaScroll:position}), '', window.location.href);
    }
  }

  function commitAddress(url, pop) {
    var state = pop ? Object.assign({}, window.history.state) : {};
    if (!state.rdaEntry) state.rdaEntry = entryKey();
    if (pop) window.history.replaceState(state, '', url.href);
    else window.history.pushState(state, '', url.href);
    currentEntry = state.rdaEntry;
  }

  function updateMetadata(incoming) {
    var selector = 'meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"],link[rel="canonical"],script[type="application/ld+json"]';
    document.head.querySelectorAll(selector).forEach(function (node) { node.remove(); });
    incoming.head.querySelectorAll(selector).forEach(function (node) {
      document.head.appendChild(document.importNode(node, true));
    });
  }

  function finish(url, position, focus) {
    requestAnimationFrame(function () {
      var target = null;
      try { if (url.hash) target = document.getElementById(decodeURIComponent(url.hash.slice(1))); } catch (error) {}
      if (position) window.scrollTo({left:position[0], top:position[1], behavior:'instant'});
      else if (target) target.scrollIntoView({behavior:'instant', block:'start'});
      else window.scrollTo({left:0, top:0, behavior:'instant'});
      if (focus) {
        var focusTarget = target || content.querySelector('main');
        if (focusTarget && !focusTarget.hasAttribute('tabindex')) focusTarget.setAttribute('tabindex', '-1');
        if (focusTarget) focusTarget.focus({preventScroll:true});
      }
      saveScroll(false);
    });
  }

  async function navigate(url, options) {
    options = options || {};
    var pop = options.pop || false;
    var position = options.position || null;
    var id = ++sequence;
    if (request) request.abort();
    request = new AbortController();
    saveScroll(!pop);

    if (pageKey(url) === displayedPage) {
      if (window.RDA_SITE_SHELL) window.RDA_SITE_SHELL.closeDrawer();
      commitAddress(url, pop);
      finish(url, position, true);
      return;
    }

    var currentMain = content.querySelector('main');
    currentMain.setAttribute('aria-busy', 'true');
    try {
      var response = await fetch(url.href, {signal:request.signal, headers:{Accept:'text/html'}});
      if (!response.ok || !(response.headers.get('content-type') || '').includes('text/html')) throw new Error('Not a site page');
      var finalUrl = new URL(response.url);
      if (finalUrl.origin !== window.location.origin) throw new Error('External redirect');
      finalUrl.hash = url.hash;
      var incoming = new DOMParser().parseFromString(await response.text(), 'text/html');
      var sourceMain = incomingMain(incoming);
      if (!sourceMain) throw new Error('Unsupported page');
      absoluteUrls(sourceMain, finalUrl.href);
      await synchronizeStyles(incoming, finalUrl.href);
      if (id !== sequence) return;

      document.dispatchEvent(new Event('rda:before-page'));
      if (window.RDA_SITE_SHELL) window.RDA_SITE_SHELL.closeDrawer();
      content.querySelectorAll('main video,main audio').forEach(function (media) { media.pause(); });
      var nextMain = document.importNode(sourceMain, true);
      currentMain.replaceWith(nextMain);
      document.body.className = incoming.body.className;
      document.body.classList.add('site-shell-ready');
      document.documentElement.lang = incoming.documentElement.lang || 'en';
      document.title = incoming.title;
      updateMetadata(incoming);
      commitAddress(finalUrl, pop);
      displayedPage = pageKey(finalUrl);
      if (window.RDA_SITE_SHELL) window.RDA_SITE_SHELL.updateForPage(nextMain, finalUrl.href);
      await runPageScripts(incoming, finalUrl.href);
      document.dispatchEvent(new Event('rda:page'));
      announcement.textContent = document.title;
      finish(finalUrl, position, true);
    } catch (error) {
      if (id !== sequence || error.name === 'AbortError') return;
      if (pop && window.location.href === url.href) window.location.reload();
      else if (pop) window.location.replace(url.href);
      else window.location.assign(url.href);
    } finally {
      if (id === sequence) {
        var main = content.querySelector('main');
        if (main) main.removeAttribute('aria-busy');
      }
    }
  }

  function eligible(url) {
    return url.origin === window.location.origin && url.pathname.indexOf(root.pathname) === 0 &&
      (url.pathname.endsWith('/') || url.pathname.endsWith('.html') || url.pathname.split('/').pop().indexOf('.') === -1);
  }

  absoluteUrls(document, document.baseURI);
  window.history.scrollRestoration = 'manual';
  window.history.replaceState(Object.assign({}, window.history.state, {rdaEntry:currentEntry}), '', window.location.href);
  saveScroll(false);
  window.addEventListener('scroll', function () { saveScroll(false); }, {passive:true});
  window.addEventListener('pagehide', function () { saveScroll(true); });

  document.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    var link = event.target.closest && event.target.closest('a[href]');
    if (!link || link.hasAttribute('download') || link.hasAttribute('data-full-navigation') || link.target && link.target !== '_self') return;
    var url = new URL(link.href, window.location.href);
    if (!eligible(url)) return;
    event.preventDefault();
    navigate(url);
  });

  window.addEventListener('popstate', function (event) {
    var position = positions.get(event.state && event.state.rdaEntry) || event.state && event.state.rdaScroll || [0, 0];
    navigate(new URL(window.location.href), {pop:true, position:position});
  });

  window.RDA_NAVIGATION_READY = true;
})();
