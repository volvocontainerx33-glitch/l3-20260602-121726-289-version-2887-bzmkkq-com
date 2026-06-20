(function() {
  const header = document.querySelector('.site-header');
  const menuButton = document.querySelector('.menu-toggle');

  if (header && menuButton) {
    menuButton.addEventListener('click', function() {
      header.classList.toggle('is-open');
    });
  }

  const carousel = document.querySelector('[data-hero-carousel]');

  if (carousel) {
    const slides = Array.from(carousel.querySelectorAll('.hero-slide'));
    const dots = Array.from(carousel.querySelectorAll('.hero-dot'));
    const next = carousel.querySelector('.hero-next');
    const prev = carousel.querySelector('.hero-prev');
    let index = 0;

    const showSlide = function(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach(function(slide, slideIndex) {
        slide.classList.toggle('active', slideIndex === index);
      });
      dots.forEach(function(dot, dotIndex) {
        dot.classList.toggle('active', dotIndex === index);
      });
    };

    if (next) {
      next.addEventListener('click', function() {
        showSlide(index + 1);
      });
    }

    if (prev) {
      prev.addEventListener('click', function() {
        showSlide(index - 1);
      });
    }

    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        showSlide(Number(dot.dataset.slide || 0));
      });
    });

    window.setInterval(function() {
      showSlide(index + 1);
    }, 5200);
  }

  document.querySelectorAll('[data-rail]').forEach(function(rail) {
    const track = rail.querySelector('.rail-track');
    const left = rail.querySelector('.rail-left');
    const right = rail.querySelector('.rail-right');

    if (!track) {
      return;
    }

    if (left) {
      left.addEventListener('click', function() {
        track.scrollBy({ left: -420, behavior: 'smooth' });
      });
    }

    if (right) {
      right.addEventListener('click', function() {
        track.scrollBy({ left: 420, behavior: 'smooth' });
      });
    }
  });

  const textFilter = document.querySelector('.page-filter');
  const yearFilter = document.querySelector('.year-filter');

  if (textFilter || yearFilter) {
    const items = Array.from(document.querySelectorAll('[data-title]'));
    const applyFilter = function() {
      const query = textFilter ? textFilter.value.trim().toLowerCase() : '';
      const year = yearFilter ? yearFilter.value : '';

      items.forEach(function(item) {
        const haystack = [item.dataset.title, item.dataset.year, item.dataset.tags].join(' ').toLowerCase();
        const matchesText = !query || haystack.indexOf(query) !== -1;
        const matchesYear = !year || item.dataset.year === year;
        item.classList.toggle('is-filtered-out', !(matchesText && matchesYear));
      });
    };

    if (textFilter) {
      textFilter.addEventListener('input', applyFilter);
    }

    if (yearFilter) {
      yearFilter.addEventListener('change', applyFilter);
    }
  }
}());

function initMoviePlayer(streamUrl) {
  const video = document.getElementById('moviePlayer');
  const overlay = document.querySelector('.play-overlay');

  if (!video || !streamUrl) {
    return;
  }

  const bindSource = function() {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = streamUrl;
      return Promise.resolve();
    }

    if (window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls();
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      return new Promise(function(resolve) {
        hls.on(window.Hls.Events.MANIFEST_PARSED, function() {
          resolve();
        });
      });
    }

    video.src = streamUrl;
    return Promise.resolve();
  };

  let ready = false;
  const start = function() {
    const run = ready ? Promise.resolve() : bindSource();
    ready = true;
    run.then(function() {
      if (overlay) {
        overlay.classList.add('is-hidden');
      }
      return video.play();
    }).catch(function() {
      if (overlay) {
        overlay.classList.remove('is-hidden');
      }
    });
  };

  if (overlay) {
    overlay.addEventListener('click', start);
  }

  video.addEventListener('click', function() {
    if (video.paused) {
      start();
    }
  });
}

(function() {
  const results = document.getElementById('searchResults');
  const input = document.getElementById('searchInput');
  const stats = document.getElementById('searchStats');

  if (!results || !input || !window.SITE_MOVIES) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const firstQuery = params.get('q') || '';
  input.value = firstQuery;

  const renderCard = function(movie) {
    const tags = movie.tags.slice(0, 3).map(function(tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return [
      '<article class="movie-card">',
      '<a href="' + movie.detail + '" class="card-cover" aria-label="' + escapeHtml(movie.title) + '">',
      '<img src="' + movie.cover + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="card-badge">' + escapeHtml(movie.year) + '</span>',
      '</a>',
      '<div class="card-info">',
      '<a class="card-title" href="' + movie.detail + '">' + escapeHtml(movie.title) + '</a>',
      '<p>' + escapeHtml(movie.oneLine) + '</p>',
      '<div class="card-meta"><span>' + escapeHtml(movie.region) + '</span><span>' + escapeHtml(movie.type) + '</span></div>',
      '<div class="card-tags">' + tags + '</div>',
      '</div>',
      '</article>'
    ].join('');
  };

  const search = function() {
    const query = input.value.trim().toLowerCase();
    const matches = window.SITE_MOVIES.filter(function(movie) {
      const text = [movie.title, movie.region, movie.type, movie.year, movie.genre, movie.tags.join(' ')].join(' ').toLowerCase();
      return !query || text.indexOf(query) !== -1;
    }).slice(0, 80);

    results.innerHTML = matches.map(renderCard).join('');

    if (stats) {
      stats.textContent = query ? '搜索结果：' + matches.length + ' 条' : '热门影片推荐';
    }
  };

  input.addEventListener('input', search);
  search();

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, function(char) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[char];
    });
  }
}());
