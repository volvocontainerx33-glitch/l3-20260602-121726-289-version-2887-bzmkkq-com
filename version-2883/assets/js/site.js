(function () {
  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  function bySelector(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  ready(function () {
    var toggle = document.querySelector("[data-mobile-toggle]");
    var menu = document.querySelector("[data-mobile-menu]");
    if (toggle && menu) {
      toggle.addEventListener("click", function () {
        menu.classList.toggle("is-open");
      });
    }

    bySelector("[data-scroller]").forEach(function (scroller) {
      var track = scroller.querySelector("[data-scroll-track]");
      var left = scroller.querySelector("[data-scroll-left]");
      var right = scroller.querySelector("[data-scroll-right]");
      if (!track) {
        return;
      }
      var move = function (direction) {
        track.scrollBy({
          left: direction * 420,
          behavior: "smooth"
        });
      };
      if (left) {
        left.addEventListener("click", function () {
          move(-1);
        });
      }
      if (right) {
        right.addEventListener("click", function () {
          move(1);
        });
      }
    });

    var hero = document.querySelector("[data-hero]");
    if (hero) {
      var slides = bySelector("[data-hero-slide]", hero);
      var dots = bySelector("[data-hero-dot]", hero);
      var prev = hero.querySelector("[data-hero-prev]");
      var next = hero.querySelector("[data-hero-next]");
      var index = 0;
      var timer = null;
      var show = function (nextIndex) {
        if (!slides.length) {
          return;
        }
        index = (nextIndex + slides.length) % slides.length;
        slides.forEach(function (slide, slideIndex) {
          slide.classList.toggle("is-active", slideIndex === index);
        });
        dots.forEach(function (dot, dotIndex) {
          dot.classList.toggle("is-active", dotIndex === index);
        });
      };
      var restart = function () {
        if (timer) {
          window.clearInterval(timer);
        }
        timer = window.setInterval(function () {
          show(index + 1);
        }, 5000);
      };
      dots.forEach(function (dot) {
        dot.addEventListener("click", function () {
          show(Number(dot.getAttribute("data-hero-dot")) || 0);
          restart();
        });
      });
      if (prev) {
        prev.addEventListener("click", function () {
          show(index - 1);
          restart();
        });
      }
      if (next) {
        next.addEventListener("click", function () {
          show(index + 1);
          restart();
        });
      }
      restart();
    }

    bySelector("[data-filter-root]").forEach(function (root) {
      var keyword = root.querySelector("[data-filter-keyword]");
      var year = root.querySelector("[data-filter-year]");
      var genre = root.querySelector("[data-filter-genre]");
      var list = document.querySelector("[data-filter-list]");
      var empty = document.querySelector("[data-filter-empty]");
      var cards = list ? bySelector("[data-movie-card]", list) : [];
      var apply = function () {
        var key = keyword ? keyword.value.trim().toLowerCase() : "";
        var y = year ? year.value : "";
        var g = genre ? genre.value : "";
        var visible = 0;
        cards.forEach(function (card) {
          var text = [
            card.getAttribute("data-title") || "",
            card.getAttribute("data-region") || "",
            card.getAttribute("data-genre") || ""
          ].join(" ").toLowerCase();
          var ok = true;
          if (key && text.indexOf(key) === -1) {
            ok = false;
          }
          if (y && card.getAttribute("data-year") !== y) {
            ok = false;
          }
          if (g && (card.getAttribute("data-genre") || "").indexOf(g) === -1) {
            ok = false;
          }
          card.classList.toggle("hidden-card", !ok);
          if (ok) {
            visible += 1;
          }
        });
        if (empty) {
          empty.hidden = visible !== 0;
        }
      };
      [keyword, year, genre].forEach(function (el) {
        if (el) {
          el.addEventListener("input", apply);
          el.addEventListener("change", apply);
        }
      });
    });

    var searchInput = document.querySelector("[data-search-input]");
    var searchResults = document.querySelector("[data-search-results]");
    var searchNote = document.querySelector("[data-search-note]");
    if (searchInput && searchResults && Array.isArray(window.SITE_MOVIES)) {
      var params = new URLSearchParams(window.location.search);
      var q = params.get("q") || "";
      searchInput.value = q;
      var createCard = function (item) {
        return [
          '<a class="movie-card" href="' + item.url + '">',
          '<div class="poster-wrap">',
          '<img src="' + item.cover + '" alt="' + item.title + '" loading="lazy">',
          '</div>',
          '<div class="card-info">',
          '<h3 class="card-title">' + item.title + '</h3>',
          '<div class="card-meta"><span>' + item.year + ' · ' + item.region + '</span><span class="card-badge">' + item.category + '</span></div>',
          '<p class="card-summary">' + item.oneLine + '</p>',
          '</div>',
          '</a>'
        ].join("");
      };
      var render = function () {
        var value = searchInput.value.trim().toLowerCase();
        if (!value) {
          searchResults.innerHTML = "";
          if (searchNote) {
            searchNote.textContent = "请输入关键词开始搜索";
          }
          return;
        }
        var found = window.SITE_MOVIES.filter(function (item) {
          return [item.title, item.region, item.genre, item.year, item.tags, item.oneLine, item.category]
            .join(" ")
            .toLowerCase()
            .indexOf(value) !== -1;
        }).slice(0, 120);
        searchResults.innerHTML = found.map(createCard).join("");
        if (searchNote) {
          searchNote.textContent = found.length ? "找到 " + found.length + " 部相关影片" : "未找到相关影片";
        }
      };
      searchInput.addEventListener("input", render);
      render();
    }
  });
})();
