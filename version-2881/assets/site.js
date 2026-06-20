(function () {
  var toggle = document.querySelector('[data-menu-toggle]');
  var nav = document.querySelector('[data-site-nav]');
  var search = document.querySelector('.nav-search');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('is-open');
      if (search) {
        search.classList.toggle('is-open');
      }
    });
  }

  var hero = document.querySelector('[data-hero-root]');
  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function showSlide(nextIndex) {
      if (!slides.length) {
        return;
      }
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('is-active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('is-active', dotIndex === index);
      });
    }

    function startTimer() {
      window.clearInterval(timer);
      timer = window.setInterval(function () {
        showSlide(index + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        showSlide(index - 1);
        startTimer();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        showSlide(index + 1);
        startTimer();
      });
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        showSlide(Number(dot.getAttribute('data-hero-dot')) || 0);
        startTimer();
      });
    });

    showSlide(0);
    startTimer();
  }

  var filterRoot = document.querySelector('[data-filter-root]');
  var list = document.querySelector('[data-filter-list]');
  if (filterRoot && list) {
    var input = filterRoot.querySelector('[data-filter-input]');
    var year = filterRoot.querySelector('[data-filter-year]');
    var type = filterRoot.querySelector('[data-filter-type]');
    var category = filterRoot.querySelector('[data-filter-category]');
    var reset = filterRoot.querySelector('[data-filter-reset]');
    var empty = document.querySelector('[data-empty-state]');
    var cards = Array.prototype.slice.call(list.querySelectorAll('.movie-card'));
    var params = new URLSearchParams(window.location.search);
    var initialQuery = params.get('q') || '';

    if (input && initialQuery) {
      input.value = initialQuery;
    }

    function matches(card) {
      var query = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      var categoryValue = category ? category.value : '';
      var haystack = (card.getAttribute('data-search') || '').toLowerCase();
      var ok = true;

      if (query) {
        ok = ok && haystack.indexOf(query) !== -1;
      }
      if (yearValue) {
        ok = ok && card.getAttribute('data-year') === yearValue;
      }
      if (typeValue) {
        ok = ok && card.getAttribute('data-type') === typeValue;
      }
      if (categoryValue) {
        ok = ok && card.getAttribute('data-category') === categoryValue;
      }
      return ok;
    }

    function applyFilter() {
      var shown = 0;
      cards.forEach(function (card) {
        var ok = matches(card);
        card.style.display = ok ? '' : 'none';
        if (ok) {
          shown += 1;
        }
      });
      if (empty) {
        empty.style.display = shown ? 'none' : 'block';
      }
    }

    [input, year, type, category].forEach(function (control) {
      if (control) {
        control.addEventListener('input', applyFilter);
        control.addEventListener('change', applyFilter);
      }
    });

    if (reset) {
      reset.addEventListener('click', function () {
        if (input) {
          input.value = '';
        }
        if (year) {
          year.value = '';
        }
        if (type) {
          type.value = '';
        }
        if (category) {
          category.value = '';
        }
        applyFilter();
      });
    }

    applyFilter();
  }
})();

function initStaticPlayer(videoId, overlayId, buttonId, source) {
  var video = document.getElementById(videoId);
  var overlay = document.getElementById(overlayId);
  var button = document.getElementById(buttonId);
  var loaded = false;
  var hls = null;

  if (!video || !source) {
    return;
  }

  function hideOverlay() {
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
    if (button) {
      button.setAttribute('aria-hidden', 'true');
    }
  }

  function tryPlay() {
    hideOverlay();
    var playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(function () {
        if (overlay) {
          overlay.classList.remove('is-hidden');
        }
      });
    }
  }

  function loadPlayer() {
    if (loaded) {
      tryPlay();
      return;
    }

    loaded = true;

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    } else if (window.Hls && window.Hls.isSupported()) {
      hls = new window.Hls({ enableWorker: true });
      hls.loadSource(source);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, tryPlay);
    } else {
      video.src = source;
      video.addEventListener('loadedmetadata', tryPlay, { once: true });
    }

    window.setTimeout(tryPlay, 240);
  }

  if (overlay) {
    overlay.addEventListener('click', loadPlayer);
  }

  if (button) {
    button.addEventListener('click', loadPlayer);
  }

  video.addEventListener('click', function () {
    if (video.paused) {
      loadPlayer();
    }
  });
}
