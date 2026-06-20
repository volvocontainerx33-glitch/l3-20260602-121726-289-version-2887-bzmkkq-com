(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var nav = document.querySelector('[data-main-nav]');
  var search = document.querySelector('.nav-search');

  if (menuButton && nav && search) {
    menuButton.addEventListener('click', function () {
      nav.classList.toggle('open');
      search.classList.toggle('open');
    });
  }

  var slides = Array.prototype.slice.call(document.querySelectorAll('[data-hero-slide]'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('[data-hero-dot]'));
  var active = 0;

  function showSlide(index) {
    if (!slides.length) {
      return;
    }

    active = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('active', i === active);
    });
    dots.forEach(function (dot, i) {
      dot.classList.toggle('active', i === active);
    });
  }

  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () {
      showSlide(i);
    });
  });

  if (slides.length > 1) {
    showSlide(0);
    window.setInterval(function () {
      showSlide(active + 1);
    }, 5200);
  }

  var params = new URLSearchParams(window.location.search);
  var query = params.get('q');
  var cards = Array.prototype.slice.call(document.querySelectorAll('[data-card]'));
  var noResults = document.querySelector('[data-no-results]');
  var searchInput = document.querySelector('.nav-search input[name="q"]');

  function filterCards(value) {
    var normalized = (value || '').trim().toLowerCase();
    var visible = 0;

    cards.forEach(function (card) {
      var text = ((card.getAttribute('data-title') || '') + ' ' + (card.getAttribute('data-meta') || '')).toLowerCase();
      var matched = !normalized || text.indexOf(normalized) !== -1;
      card.style.display = matched ? '' : 'none';
      if (matched) {
        visible += 1;
      }
    });

    if (noResults) {
      noResults.style.display = visible ? 'none' : 'block';
    }
  }

  if (query) {
    if (searchInput) {
      searchInput.value = query;
    }
    filterCards(query);
  }

  var inlineSearch = document.querySelector('[data-inline-search]');
  if (inlineSearch) {
    inlineSearch.addEventListener('input', function () {
      filterCards(inlineSearch.value);
    });
  }

  function setupPlayer(frame) {
    var video = frame.querySelector('video');
    var button = frame.querySelector('[data-play-button]');
    var source = frame.getAttribute('data-video-src');
    var ready = false;

    function bindSource() {
      if (ready || !video || !source) {
        return;
      }

      ready = true;

      if (window.Hls && window.Hls.isSupported()) {
        var hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(source);
        hls.attachMedia(video);
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
      } else {
        video.src = source;
      }
    }

    function playVideo() {
      bindSource();
      frame.classList.add('is-playing');
      video.play().catch(function () {
        frame.classList.remove('is-playing');
      });
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('click', function () {
        bindSource();
        if (video.paused) {
          playVideo();
        } else {
          video.pause();
        }
      });
      video.addEventListener('pause', function () {
        if (!video.ended) {
          frame.classList.remove('is-playing');
        }
      });
      video.addEventListener('play', function () {
        frame.classList.add('is-playing');
      });
    }
  }

  Array.prototype.slice.call(document.querySelectorAll('[data-player]')).forEach(setupPlayer);
})();
