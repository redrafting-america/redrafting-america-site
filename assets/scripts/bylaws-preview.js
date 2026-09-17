(function () {
  'use strict';

  function updateBreadcrumb() {
    var trail = document.querySelector('.site-category-trail');
    if (!trail) return;
    trail.innerHTML = '<li><a href="index.html">Home</a></li>' +
      '<li><a href="pages/about/index.html">About</a></li>' +
      '<li><a href="pages/about/bylaws.html">Bylaws</a></li>' +
      '<li aria-current="page">Temporary Article XXIII Preview</li>';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', updateBreadcrumb);
  else updateBreadcrumb();
  window.addEventListener('hashchange', updateBreadcrumb);

  var links = Array.prototype.slice.call(document.querySelectorAll('.article-outline a[href*="#section-"]'));
  var headings = links.map(function (link) {
    return document.getElementById(link.getAttribute('href').split('#')[1]);
  }).filter(Boolean);

  if (!links.length || !headings.length) return;

  var byId = {};
  links.forEach(function (link) {
    byId[link.getAttribute('href').split('#')[1]] = link;
  });

  function select(id) {
    links.forEach(function (link) {
      link.classList.toggle('is-current', link === byId[id]);
    });
  }

  links.forEach(function (link) {
    link.addEventListener('click', function (event) {
      var id = link.getAttribute('href').split('#')[1];
      var heading = document.getElementById(id);
      if (!heading) return;

      event.preventDefault();
      window.history.pushState(
        { bylawsSection: id },
        '',
        window.location.pathname + window.location.search + '#' + encodeURIComponent(id)
      );
      heading.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start'
      });
      select(id);
      updateBreadcrumb();
    });
  });

  if (!('IntersectionObserver' in window)) {
    select((window.location.hash || '').slice(1) || headings[0].id);
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    var visible = entries.filter(function (entry) { return entry.isIntersecting; });
    if (!visible.length) return;
    visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
    select(visible[0].target.id);
  }, { rootMargin: '-18% 0px -70% 0px', threshold: 0 });

  headings.forEach(function (heading) { observer.observe(heading); });
  select((window.location.hash || '').slice(1) || headings[0].id);
}());
