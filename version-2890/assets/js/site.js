
(function () {
  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function normalize(value) {
    return String(value || '').trim().toLowerCase();
  }

  function initMobileNav() {
    var button = qs('[data-mobile-menu-button]');
    var nav = qs('[data-mobile-nav]');
    if (!button || !nav) {
      return;
    }
    button.addEventListener('click', function () {
      nav.classList.toggle('open');
    });
  }

  function initHeroCarousel() {
    var carousel = qs('[data-hero-carousel]');
    if (!carousel) {
      return;
    }
    var slides = qsa('[data-hero-slide]', carousel);
    var prev = qs('[data-hero-prev]', carousel);
    var next = qs('[data-hero-next]', carousel);
    var dotsWrap = qs('[data-hero-dots]', carousel);
    var active = 0;
    var timer = null;

    function renderDots() {
      if (!dotsWrap) {
        return;
      }
      dotsWrap.innerHTML = '';
      slides.forEach(function (_, index) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot' + (index === active ? ' active' : '');
        dot.setAttribute('aria-label', '切换到第 ' + (index + 1) + ' 屏');
        dot.addEventListener('click', function () {
          show(index);
          restart();
        });
        dotsWrap.appendChild(dot);
      });
    }

    function show(index) {
      active = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === active);
      });
      renderDots();
    }

    function restart() {
      if (timer) {
        window.clearInterval(timer);
      }
      timer = window.setInterval(function () {
        show(active + 1);
      }, 5200);
    }

    if (prev) {
      prev.addEventListener('click', function () {
        show(active - 1);
        restart();
      });
    }
    if (next) {
      next.addEventListener('click', function () {
        show(active + 1);
        restart();
      });
    }
    show(0);
    restart();
  }

  function initLocalFilter() {
    qsa('[data-local-filter]').forEach(function (panel) {
      var input = qs('[data-filter-input]', panel);
      var year = qs('[data-year-filter]', panel);
      var list = qs('[data-filter-list]') || panel.parentNode.querySelector('[data-filter-list]');
      if (!list) {
        return;
      }
      var cards = qsa('.movie-card', list);

      function apply() {
        var keyword = normalize(input && input.value);
        var selectedYear = year ? year.value : '';
        cards.forEach(function (card) {
          var haystack = normalize([
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.textContent
          ].join(' '));
          var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          var okYear = !selectedYear || card.dataset.year === selectedYear;
          card.classList.toggle('is-hidden', !(okKeyword && okYear));
        });
      }

      if (input) {
        input.addEventListener('input', apply);
      }
      if (year) {
        year.addEventListener('change', apply);
      }
      apply();
    });
  }

  function initGlobalSearch() {
    var panel = qs('[data-global-search]');
    var list = qs('[data-search-list]');
    if (!panel || !list) {
      return;
    }
    var input = qs('[data-search-input]', panel);
    var category = qs('[data-search-category]', panel);
    var year = qs('[data-search-year]', panel);
    var region = qs('[data-search-region]', panel);
    var type = qs('[data-search-type]', panel);
    var reset = qs('[data-search-reset]', panel);
    var count = qs('[data-search-count]');
    var cards = qsa('.movie-card', list);
    var params = new URLSearchParams(window.location.search);

    if (input && params.get('q')) {
      input.value = params.get('q');
    }

    function apply() {
      var keyword = normalize(input && input.value);
      var selectedCategory = category ? category.value : '';
      var selectedYear = year ? year.value : '';
      var selectedRegion = region ? region.value : '';
      var selectedType = type ? type.value : '';
      var visible = 0;
      cards.forEach(function (card) {
        var haystack = normalize(card.textContent + ' ' + card.dataset.title + ' ' + card.dataset.region + ' ' + card.dataset.type + ' ' + card.dataset.category);
        var okKeyword = !keyword || haystack.indexOf(keyword) !== -1;
        var okCategory = !selectedCategory || card.dataset.category === selectedCategory;
        var okYear = !selectedYear || card.dataset.year === selectedYear;
        var okRegion = !selectedRegion || card.dataset.region === selectedRegion;
        var okType = !selectedType || card.dataset.type === selectedType;
        var ok = okKeyword && okCategory && okYear && okRegion && okType;
        card.classList.toggle('is-hidden', !ok);
        if (ok) {
          visible += 1;
        }
      });
      if (count) {
        count.textContent = '当前显示 ' + visible + ' 部影片';
      }
    }

    [input, category, year, region, type].forEach(function (el) {
      if (!el) {
        return;
      }
      el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', apply);
    });

    if (reset) {
      reset.addEventListener('click', function () {
        [input, category, year, region, type].forEach(function (el) {
          if (el) {
            el.value = '';
          }
        });
        apply();
      });
    }

    apply();
  }

  function loadHlsLibrary() {
    return new Promise(function (resolve, reject) {
      if (window.Hls) {
        resolve(window.Hls);
        return;
      }
      var script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
      script.async = true;
      script.onload = function () {
        if (window.Hls) {
          resolve(window.Hls);
        } else {
          reject(new Error('HLS library loaded without Hls object'));
        }
      };
      script.onerror = function () {
        reject(new Error('HLS library failed to load'));
      };
      document.head.appendChild(script);
    });
  }

  function initPlayers() {
    qsa('[data-player]').forEach(function (shell) {
      var video = qs('video[data-video-src]', shell);
      var button = qs('[data-player-button]', shell);
      var status = qs('[data-player-status]', shell);
      var hlsInstance = null;

      if (!video || !button) {
        return;
      }

      function setStatus(message) {
        if (status) {
          status.textContent = message;
        }
      }

      function play() {
        var source = video.getAttribute('data-video-src');
        if (!source) {
          setStatus('当前影片没有可用播放源。');
          return;
        }

        shell.classList.add('playing');
        setStatus('正在初始化播放源，请稍候。');

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = source;
          video.play().then(function () {
            setStatus('播放中。');
          }).catch(function () {
            setStatus('浏览器阻止自动播放，请再次点击播放器播放。');
          });
          return;
        }

        loadHlsLibrary().then(function (Hls) {
          if (!Hls.isSupported()) {
            video.src = source;
            return video.play();
          }
          if (hlsInstance) {
            hlsInstance.destroy();
          }
          hlsInstance = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hlsInstance.loadSource(source);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, function () {
            video.play().then(function () {
              setStatus('播放中。');
            }).catch(function () {
              setStatus('浏览器阻止自动播放，请再次点击播放器播放。');
            });
          });
          hlsInstance.on(Hls.Events.ERROR, function (_, data) {
            if (data && data.fatal) {
              setStatus('播放源加载失败，请稍后重试。');
            }
          });
        }).catch(function () {
          video.src = source;
          video.play().then(function () {
            setStatus('播放中。');
          }).catch(function () {
            setStatus('HLS 初始化失败，请检查网络或播放源。');
          });
        });
      }

      button.addEventListener('click', play);
    });
  }

  function initImageFallback() {
    qsa('img').forEach(function (img) {
      img.addEventListener('error', function () {
        img.style.opacity = '0';
        img.parentElement && img.parentElement.classList.add('image-missing');
      }, { once: true });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initMobileNav();
    initHeroCarousel();
    initLocalFilter();
    initGlobalSearch();
    initPlayers();
    initImageFallback();
  });
}());
