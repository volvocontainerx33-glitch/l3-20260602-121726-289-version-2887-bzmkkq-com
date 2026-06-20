(function () {
    var mobileButton = document.querySelector("[data-menu-toggle]");
    var mobilePanel = document.querySelector("[data-mobile-panel]");

    if (mobileButton && mobilePanel) {
        mobileButton.addEventListener("click", function () {
            mobilePanel.classList.toggle("open");
        });
    }

    function initHero() {
        var hero = document.querySelector("[data-hero]");
        if (!hero) {
            return;
        }

        var slides = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-slide]"));
        var dots = Array.prototype.slice.call(hero.querySelectorAll("[data-hero-dot]"));
        var prev = hero.querySelector("[data-hero-prev]");
        var next = hero.querySelector("[data-hero-next]");
        var current = 0;
        var timer = null;

        function show(index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle("active", slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle("active", dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5200);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
            }
        }

        dots.forEach(function (dot) {
            dot.addEventListener("click", function () {
                show(Number(dot.getAttribute("data-hero-dot")) || 0);
                start();
            });
        });

        if (prev) {
            prev.addEventListener("click", function () {
                show(current - 1);
                start();
            });
        }

        if (next) {
            next.addEventListener("click", function () {
                show(current + 1);
                start();
            });
        }

        hero.addEventListener("mouseenter", stop);
        hero.addEventListener("mouseleave", start);
        show(0);
        start();
    }

    function initFilters() {
        var panels = Array.prototype.slice.call(document.querySelectorAll("[data-filter-panel]"));

        panels.forEach(function (panel) {
            var root = panel.parentElement || document;
            var input = panel.querySelector("[data-filter-input]");
            var cards = Array.prototype.slice.call(root.querySelectorAll("[data-card]"));
            var empty = panel.querySelector("[data-filter-empty]");
            var regionButtons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-region]"));
            var typeButtons = Array.prototype.slice.call(panel.querySelectorAll("[data-filter-type]"));
            var state = {
                region: "all",
                type: "all"
            };

            function setActive(buttons, activeButton) {
                buttons.forEach(function (button) {
                    button.classList.toggle("active", button === activeButton);
                });
            }

            function matchesCard(card, query) {
                var text = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-type"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-genre"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-summary")
                ].join(" ").toLowerCase();
                var region = card.getAttribute("data-region") || "";
                var type = card.getAttribute("data-type") || "";
                var queryMatch = !query || text.indexOf(query) !== -1;
                var regionMatch = state.region === "all" || region.indexOf(state.region) !== -1;
                var typeMatch = state.type === "all" || type.indexOf(state.type) !== -1;
                return queryMatch && regionMatch && typeMatch;
            }

            function apply() {
                var query = input ? input.value.trim().toLowerCase() : "";
                var visible = 0;

                cards.forEach(function (card) {
                    var matched = matchesCard(card, query);
                    card.style.display = matched ? "" : "none";
                    if (matched) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle("show", visible === 0);
                }
            }

            regionButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    state.region = button.getAttribute("data-filter-region") || "all";
                    setActive(regionButtons, button);
                    apply();
                });
            });

            typeButtons.forEach(function (button) {
                button.addEventListener("click", function () {
                    state.type = button.getAttribute("data-filter-type") || "all";
                    setActive(typeButtons, button);
                    apply();
                });
            });

            if (input) {
                var params = new URLSearchParams(window.location.search);
                var query = params.get("q");
                if (query) {
                    input.value = query;
                }
                input.addEventListener("input", apply);
            }

            apply();
        });
    }

    window.setupPlayer = function (url) {
        var video = document.getElementById("movie-player");
        var cover = document.querySelector("[data-player-cover]");
        var loaded = false;
        var hls = null;

        if (!video || !url) {
            return;
        }

        function load() {
            if (loaded) {
                return;
            }

            if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = url;
            } else if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(url);
                hls.attachMedia(video);
            } else {
                video.src = url;
            }

            loaded = true;
        }

        function play() {
            load();
            video.controls = true;

            if (cover) {
                cover.classList.add("hidden");
            }

            var playPromise = video.play();
            if (playPromise && typeof playPromise.catch === "function") {
                playPromise.catch(function () {
                    video.controls = true;
                });
            }
        }

        if (cover) {
            cover.addEventListener("click", play);
        }

        video.addEventListener("click", function () {
            if (!loaded || video.paused) {
                play();
            }
        });

        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    };

    document.addEventListener("DOMContentLoaded", function () {
        initHero();
        initFilters();
    });
})();
