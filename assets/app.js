document.addEventListener("DOMContentLoaded", function () {
  var mobileToggle = document.querySelector("[data-mobile-toggle]");
  var mobileNav = document.querySelector("[data-mobile-nav]");

  if (mobileToggle && mobileNav) {
    mobileToggle.addEventListener("click", function () {
      mobileNav.classList.toggle("is-open");
    });
  }

  var hero = document.querySelector("[data-hero-carousel]");

  if (hero) {
    var slides = Array.prototype.slice.call(hero.querySelectorAll(".hero-slide"));
    var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
    var current = 0;

    function showSlide(index) {
      if (!slides.length) {
        return;
      }

      current = (index + slides.length) % slides.length;

      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });

      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        showSlide(index);
      });
    });

    if (slides.length > 1) {
      window.setInterval(function () {
        showSlide(current + 1);
      }, 5200);
    }
  }

  Array.prototype.slice.call(document.querySelectorAll("[data-filter-scope]")).forEach(function (scope) {
    var input = scope.querySelector("[data-filter-input]");
    var typeSelect = scope.querySelector("[data-filter-type]");
    var regionSelect = scope.querySelector("[data-filter-region]");
    var form = scope.querySelector("[data-local-filter]");
    var items = Array.prototype.slice.call(scope.querySelectorAll("[data-title]"));
    var empty = scope.querySelector("[data-empty-state]");

    function uniqueValues(name) {
      var values = [];

      items.forEach(function (item) {
        var value = item.getAttribute(name) || "";

        if (value && values.indexOf(value) === -1) {
          values.push(value);
        }
      });

      return values.sort(function (a, b) {
        return a.localeCompare(b, "zh-CN");
      });
    }

    function fillSelect(select, attr) {
      if (!select) {
        return;
      }

      uniqueValues(attr).forEach(function (value) {
        var option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        select.appendChild(option);
      });
    }

    fillSelect(typeSelect, "data-type");
    fillSelect(regionSelect, "data-region");

    function normalize(value) {
      return String(value || "").toLowerCase().replace(/\s+/g, "");
    }

    function applyFilter() {
      var keyword = normalize(input ? input.value : "");
      var typeValue = typeSelect ? typeSelect.value : "全部";
      var regionValue = regionSelect ? regionSelect.value : "全部";
      var visible = 0;

      items.forEach(function (item) {
        var haystack = normalize([
          item.getAttribute("data-title"),
          item.getAttribute("data-type"),
          item.getAttribute("data-region"),
          item.getAttribute("data-year"),
          item.getAttribute("data-genre")
        ].join(" "));
        var typeMatch = typeValue === "全部" || item.getAttribute("data-type") === typeValue;
        var regionMatch = regionValue === "全部" || item.getAttribute("data-region") === regionValue;
        var keywordMatch = !keyword || haystack.indexOf(keyword) !== -1;
        var isVisible = typeMatch && regionMatch && keywordMatch;

        item.classList.toggle("is-hidden", !isVisible);

        if (isVisible) {
          visible += 1;
        }
      });

      if (empty) {
        empty.hidden = visible !== 0;
      }
    }

    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        applyFilter();
      });
    }

    [input, typeSelect, regionSelect].forEach(function (control) {
      if (control) {
        control.addEventListener("input", applyFilter);
        control.addEventListener("change", applyFilter);
      }
    });

    var params = new URLSearchParams(window.location.search);

    if (input && params.get("q")) {
      input.value = params.get("q");
      applyFilter();
    }
  });

  Array.prototype.slice.call(document.querySelectorAll("[data-movie-player]")).forEach(function (root) {
    var video = root.querySelector("video");
    var button = root.querySelector("[data-play-button]");
    var url = root.getAttribute("data-video");
    var hlsInstance = null;

    function attachVideo() {
      if (!video || !url) {
        return;
      }

      if (root.getAttribute("data-ready") === "1") {
        video.play().catch(function () {});
        return;
      }

      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = url;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });

        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);

        hlsInstance.on(window.Hls.Events.ERROR, function (_, data) {
          if (!data || !data.fatal) {
            return;
          }

          if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
            hlsInstance.startLoad();
          } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
            hlsInstance.recoverMediaError();
          } else {
            hlsInstance.destroy();
          }
        });
      } else {
        video.src = url;
      }

      root.setAttribute("data-ready", "1");
      root.classList.add("is-playing");
      video.play().catch(function () {});
    }

    if (button) {
      button.addEventListener("click", attachVideo);
    }

    if (video) {
      video.addEventListener("click", function () {
        if (root.getAttribute("data-ready") !== "1") {
          attachVideo();
        }
      });

      video.addEventListener("play", function () {
        root.classList.add("is-playing");
      });
    }

    window.addEventListener("pagehide", function () {
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    });
  });
});
