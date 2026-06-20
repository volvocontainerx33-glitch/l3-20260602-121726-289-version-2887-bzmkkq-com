(function () {
  var menuButton = document.querySelector('[data-menu-toggle]');
  var mobilePanel = document.querySelector('[data-mobile-panel]');

  if (menuButton && mobilePanel) {
    menuButton.addEventListener('click', function () {
      mobilePanel.classList.toggle('open');
    });
  }

  document.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () {
      img.classList.add('image-missing');
    });
  });

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(index + 1);
      }, 5000);
    }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(Number(dot.getAttribute('data-hero-dot')) || 0);
        restart();
      });
    });

    if (prev) {
      prev.addEventListener('click', function () {
        show(index - 1);
        restart();
      });
    }

    if (next) {
      next.addEventListener('click', function () {
        show(index + 1);
        restart();
      });
    }

    show(0);
    restart();
  }

  function normalize(value) {
    return String(value || '').toLowerCase().trim();
  }

  function initFilters() {
    document.querySelectorAll('[data-filter-scope]').forEach(function (scope) {
      var input = scope.querySelector('[data-filter-input]');
      var year = scope.querySelector('[data-filter-year]');
      var category = scope.querySelector('[data-filter-category]');
      var list = scope.querySelector('[data-filter-list]');

      if (!list) {
        return;
      }

      var items = Array.prototype.slice.call(list.children);
      var params = new URLSearchParams(window.location.search);
      var queryParam = params.get('q');

      if (input && queryParam) {
        input.value = queryParam;
      }

      function filter() {
        var q = normalize(input ? input.value : '');
        var selectedYear = normalize(year ? year.value : '');
        var selectedCategory = normalize(category ? category.value : '');

        items.forEach(function (item) {
          var haystack = normalize([
            item.getAttribute('data-title'),
            item.getAttribute('data-year'),
            item.getAttribute('data-region'),
            item.getAttribute('data-genre'),
            item.getAttribute('data-category'),
            item.textContent
          ].join(' '));
          var itemYear = normalize(item.getAttribute('data-year'));
          var itemCategory = normalize(item.getAttribute('data-category'));
          var matched = true;

          if (q && haystack.indexOf(q) === -1) {
            matched = false;
          }

          if (selectedYear && itemYear !== selectedYear) {
            matched = false;
          }

          if (selectedCategory && itemCategory !== selectedCategory) {
            matched = false;
          }

          item.classList.toggle('is-hidden', !matched);
        });
      }

      [input, year, category].forEach(function (control) {
        if (control) {
          control.addEventListener('input', filter);
          control.addEventListener('change', filter);
        }
      });

      filter();
    });
  }

  function loadHlsLibrary() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }

      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js';
      script.async = true;
      script.onload = function () {
        resolve(window.Hls);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function initPlayer() {
    var shell = document.querySelector('[data-video-player]');
    if (!shell) {
      return;
    }

    var video = shell.querySelector('video');
    var button = shell.querySelector('[data-play-button]');
    var source = shell.getAttribute('data-video-url');
    var poster = shell.getAttribute('data-poster');
    var initialized = false;

    if (poster && video) {
      video.setAttribute('poster', poster);
    }

    function setupSource() {
      if (initialized || !video || !source) {
        return Promise.resolve();
      }

      initialized = true;

      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = source;
        return Promise.resolve();
      }

      return loadHlsLibrary().then(function (Hls) {
        if (Hls && Hls.isSupported()) {
          var hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(source);
          hls.attachMedia(video);
          shell.hls = hls;
        } else {
          video.src = source;
        }
      }).catch(function () {
        video.src = source;
      });
    }

    function playVideo() {
      setupSource().then(function () {
        shell.classList.add('playing');
        var playResult = video.play();
        if (playResult && typeof playResult.catch === 'function') {
          playResult.catch(function () {
            shell.classList.remove('playing');
          });
        }
      });
    }

    if (button) {
      button.addEventListener('click', playVideo);
    }

    if (video) {
      video.addEventListener('play', function () {
        shell.classList.add('playing');
      });
      video.addEventListener('pause', function () {
        if (video.currentTime === 0) {
          shell.classList.remove('playing');
        }
      });
      video.addEventListener('click', function () {
        if (!initialized) {
          playVideo();
        }
      });
    }
  }

  initHero();
  initFilters();
  initPlayer();
})();
