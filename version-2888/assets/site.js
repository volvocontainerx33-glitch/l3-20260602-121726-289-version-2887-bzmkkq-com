(function () {
  function ready(callback) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback);
    } else {
      callback();
    }
  }

  ready(function () {
    initHero();
    initFilters();
    initPlayer();
  });

  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) {
      return;
    }

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.hero-slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.hero-dot'));
    var prev = hero.querySelector('[data-hero-prev]');
    var next = hero.querySelector('[data-hero-next]');
    var index = 0;
    var timer = null;

    function show(nextIndex) {
      if (!slides.length) {
        return;
      }

      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('active', i === index);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('active', i === index);
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

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        show(i);
        restart();
      });
    });

    show(0);
    restart();
  }

  function initFilters() {
    var panel = document.querySelector('[data-filter-panel]');
    if (!panel) {
      return;
    }

    var input = panel.querySelector('[data-filter-search]');
    var year = panel.querySelector('[data-filter-year]');
    var type = panel.querySelector('[data-filter-type]');
    var region = panel.querySelector('[data-filter-region]');
    var cards = Array.prototype.slice.call(document.querySelectorAll('.video-card'));
    var result = document.querySelector('[data-result-count]');
    var empty = document.querySelector('[data-empty-state]');

    function match(card) {
      var q = input ? input.value.trim().toLowerCase() : '';
      var yearValue = year ? year.value : '';
      var typeValue = type ? type.value : '';
      var regionValue = region ? region.value : '';
      var text = [
        card.dataset.title,
        card.dataset.genre,
        card.dataset.type,
        card.dataset.region,
        card.dataset.year
      ].join(' ').toLowerCase();

      if (q && text.indexOf(q) === -1) {
        return false;
      }
      if (yearValue && card.dataset.year !== yearValue) {
        return false;
      }
      if (typeValue && card.dataset.type.indexOf(typeValue) === -1) {
        return false;
      }
      if (regionValue && card.dataset.region.indexOf(regionValue) === -1) {
        return false;
      }
      return true;
    }

    function apply() {
      var count = 0;
      cards.forEach(function (card) {
        var visible = match(card);
        card.classList.toggle('is-hidden', !visible);
        if (visible) {
          count += 1;
        }
      });
      if (result) {
        result.textContent = '当前显示 ' + count + ' 部影片';
      }
      if (empty) {
        empty.classList.toggle('show', count === 0);
      }
    }

    [input, year, type, region].forEach(function (el) {
      if (!el) {
        return;
      }
      el.addEventListener('input', apply);
      el.addEventListener('change', apply);
    });

    apply();
  }

  function initPlayer() {
    var video = document.querySelector('[data-video-player]');
    var button = document.querySelector('[data-play-button]');
    var overlay = document.querySelector('[data-play-overlay]');
    var status = document.querySelector('[data-player-status]');

    if (!video || !button) {
      return;
    }

    var source = video.dataset.src;
    var loaded = false;

    function setStatus(text) {
      if (status) {
        status.textContent = text;
      }
    }

    function loadAndPlay() {
      if (!source) {
        setStatus('当前播放源为空，请检查 m3u8 地址。');
        return;
      }

      if (!loaded) {
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
        } else if (window.Hls && window.Hls.isSupported()) {
          var hls = new window.Hls({
            enableWorker: true,
            lowLatencyMode: false
          });
          hls.loadSource(source);
          hls.attachMedia(video);
        } else {
          video.src = source;
        }
        loaded = true;
      }

      video.controls = true;
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      video.play().then(function () {
        setStatus('正在播放');
      }).catch(function () {
        setStatus('已载入播放源，请再次点击播放器开始播放。');
      });
    }

    button.addEventListener('click', loadAndPlay);
    if (overlay) {
      overlay.addEventListener('click', loadAndPlay);
    }
  }
})();
