(function () {
  var menuButton = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  if (menuButton && menu) {
    menuButton.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('open');
      menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  var audio = document.getElementById('bg-audio');
  var musicButton = document.getElementById('music-toggle');
  if (audio && musicButton) {
    var trackKey = 'utopia-bg-track';
    var playingKey = 'utopia-bg-playing';
    var audioRoot = document.body.getAttribute('data-audio-root') || 'assets/audio/';
    var tracks = ['abracadabra.mp3', 'vote.mp3'];
    var storedTrack = sessionStorage.getItem(trackKey);
    var chosen = storedTrack ? storedTrack.split('/').pop() : '';
    if (!chosen) {
      chosen = tracks[Math.floor(Math.random() * tracks.length)];
      sessionStorage.setItem(trackKey, 'assets/audio/' + chosen);
    }
    audio.src = audioRoot + chosen;
    audio.loop = true;
    audio.volume = 0.35;

    function setPlayingUI(isPlaying) {
      musicButton.classList.toggle('playing', isPlaying);
      musicButton.setAttribute('aria-pressed', isPlaying ? 'true' : 'false');
      musicButton.setAttribute('aria-label', isPlaying ? 'Pause background music' : 'Play background music');
    }

    function tryPlay() {
      var playPromise = audio.play();
      if (playPromise && playPromise.then) {
        playPromise.then(function () {
          setPlayingUI(true);
          sessionStorage.setItem(playingKey, '1');
        }).catch(function () {
          setPlayingUI(false);
        });
      }
    }

    if (sessionStorage.getItem(playingKey) === '1') tryPlay();
    musicButton.addEventListener('click', function () {
      if (audio.paused) {
        tryPlay();
      } else {
        audio.pause();
        setPlayingUI(false);
        sessionStorage.setItem(playingKey, '0');
      }
    });
  }

  var searchInput = document.getElementById('publication-search');
  var clearSearch = document.getElementById('clear-publication-search');
  var tagSelect = document.getElementById('publication-tag');
  var categoryButtons = Array.prototype.slice.call(document.querySelectorAll('[data-category].filter-button'));
  var publicationCards = Array.prototype.slice.call(document.querySelectorAll('[data-publication]'));
  var publicationSections = Array.prototype.slice.call(document.querySelectorAll('[data-publication-section]'));
  var resultsMessage = document.getElementById('publication-results');
  var emptyMessage = document.getElementById('publication-empty');
  var resetFilters = document.getElementById('reset-publication-filters');

  if (searchInput && tagSelect && publicationCards.length) {
    var selectedCategory = 'all';

    function normalize(value) {
      return (value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    }

    function applyPublicationFilters() {
      var query = normalize(searchInput.value);
      var selectedTag = normalize(tagSelect.value);
      var visibleCount = 0;

      publicationCards.forEach(function (card) {
        var categoryMatches = selectedCategory === 'all' || card.getAttribute('data-category') === selectedCategory;
        var tags = normalize(card.getAttribute('data-tags'));
        var tagMatches = selectedTag === 'all' || tags.indexOf(selectedTag) !== -1;
        var searchText = normalize(card.textContent + ' ' + tags + ' ' + card.getAttribute('data-category'));
        var searchMatches = !query || searchText.indexOf(query) !== -1;
        var isVisible = categoryMatches && tagMatches && searchMatches;
        card.hidden = !isVisible;
        if (isVisible) visibleCount += 1;
      });

      publicationSections.forEach(function (section) {
        section.hidden = !section.querySelector('[data-publication]:not([hidden])');
      });

      clearSearch.hidden = !searchInput.value;
      emptyMessage.hidden = visibleCount !== 0;
      resultsMessage.textContent = visibleCount === publicationCards.length
        ? 'Showing all ' + visibleCount + ' publications.'
        : 'Showing ' + visibleCount + ' of ' + publicationCards.length + (visibleCount === 1 ? ' publication.' : ' publications.');
    }

    function resetPublicationFilters() {
      searchInput.value = '';
      tagSelect.value = 'all';
      selectedCategory = 'all';
      categoryButtons.forEach(function (button) {
        var isAll = button.getAttribute('data-category') === 'all';
        button.classList.toggle('is-active', isAll);
        button.setAttribute('aria-pressed', isAll ? 'true' : 'false');
      });
      applyPublicationFilters();
      searchInput.focus();
    }

    searchInput.addEventListener('input', applyPublicationFilters);
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && searchInput.value) resetPublicationFilters();
    });
    clearSearch.addEventListener('click', function () {
      searchInput.value = '';
      applyPublicationFilters();
      searchInput.focus();
    });
    tagSelect.addEventListener('change', applyPublicationFilters);
    categoryButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectedCategory = button.getAttribute('data-category');
        categoryButtons.forEach(function (candidate) {
          var isActive = candidate === button;
          candidate.classList.toggle('is-active', isActive);
          candidate.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        applyPublicationFilters();
      });
    });
    resetFilters.addEventListener('click', resetPublicationFilters);
    applyPublicationFilters();
  }

  var updated = document.getElementById('last-updated');
  if (updated) {
    var modified = new Date(document.lastModified);
    updated.textContent = 'Updated: ' + modified.toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
  }
})();
