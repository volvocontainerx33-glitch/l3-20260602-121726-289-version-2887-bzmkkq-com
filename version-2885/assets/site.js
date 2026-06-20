(function () {
    function ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    }

    function initMenu() {
        var toggle = document.querySelector('[data-menu-toggle]');
        var nav = document.querySelector('[data-mobile-nav]');
        if (!toggle || !nav) {
            return;
        }
        toggle.addEventListener('click', function () {
            nav.classList.toggle('is-open');
        });
    }

    function initHero() {
        var slider = document.querySelector('[data-hero-slider]');
        if (!slider) {
            return;
        }
        var slides = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(slider.querySelectorAll('[data-hero-dot]'));
        var prev = slider.querySelector('[data-hero-prev]');
        var next = slider.querySelector('[data-hero-next]');
        var current = 0;
        var timer = null;

        function show(index) {
            if (!slides.length) {
                return;
            }
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
            });
        }

        function start() {
            stop();
            timer = window.setInterval(function () {
                show(current + 1);
            }, 5000);
        }

        function stop() {
            if (timer) {
                window.clearInterval(timer);
                timer = null;
            }
        }

        if (prev) {
            prev.addEventListener('click', function () {
                show(current - 1);
                start();
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                show(current + 1);
                start();
            });
        }
        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                show(index);
                start();
            });
        });
        slider.addEventListener('mouseenter', stop);
        slider.addEventListener('mouseleave', start);
        show(0);
        start();
    }

    function normalize(value) {
        return String(value || '').toLowerCase().trim();
    }

    function initFilters() {
        var forms = Array.prototype.slice.call(document.querySelectorAll('[data-filter-form]'));
        forms.forEach(function (form) {
            var scope = form.closest('[data-filter-scope]') || document;
            var input = form.querySelector('[data-filter-input]');
            var typeFilter = form.querySelector('[data-type-filter]');
            var regionFilter = form.querySelector('[data-region-filter]');
            var reset = form.querySelector('[data-filter-reset]');
            var cards = Array.prototype.slice.call(scope.querySelectorAll('[data-card]'));
            var empty = scope.querySelector('[data-empty-state]');

            function apply() {
                var query = normalize(input && input.value);
                var typeValue = normalize(typeFilter && typeFilter.value);
                var regionValue = normalize(regionFilter && regionFilter.value);
                var visible = 0;

                cards.forEach(function (card) {
                    var haystack = normalize(card.getAttribute('data-search'));
                    var typeText = normalize(card.getAttribute('data-type'));
                    var regionText = normalize(card.getAttribute('data-region'));
                    var matched = true;

                    if (query && haystack.indexOf(query) === -1) {
                        matched = false;
                    }
                    if (typeValue && typeText.indexOf(typeValue) === -1) {
                        matched = false;
                    }
                    if (regionValue && regionText.indexOf(regionValue) === -1) {
                        matched = false;
                    }

                    card.classList.toggle('is-hidden', !matched);
                    if (matched) {
                        visible += 1;
                    }
                });

                if (empty) {
                    empty.classList.toggle('is-visible', visible === 0);
                }
            }

            [input, typeFilter, regionFilter].forEach(function (control) {
                if (control) {
                    control.addEventListener('input', apply);
                    control.addEventListener('change', apply);
                }
            });

            if (reset) {
                reset.addEventListener('click', function () {
                    if (input) {
                        input.value = '';
                    }
                    if (typeFilter) {
                        typeFilter.value = '';
                    }
                    if (regionFilter) {
                        regionFilter.value = '';
                    }
                    apply();
                });
            }
        });
    }

    function initPlayers() {
        var shells = Array.prototype.slice.call(document.querySelectorAll('[data-player]'));
        shells.forEach(function (shell) {
            var video = shell.querySelector('video');
            var overlay = shell.querySelector('[data-play-overlay]');
            if (!video) {
                return;
            }

            function attach() {
                var source = video.getAttribute('data-stream');
                if (!source || video.getAttribute('data-ready') === '1') {
                    return;
                }

                if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = source;
                } else if (window.Hls && window.Hls.isSupported()) {
                    var hls = new window.Hls({ enableWorker: true });
                    hls.loadSource(source);
                    hls.attachMedia(video);
                    video._hlsInstance = hls;
                } else {
                    video.src = source;
                }
                video.setAttribute('data-ready', '1');
            }

            function play() {
                attach();
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
                video.setAttribute('controls', 'controls');
                var promise = video.play();
                if (promise && typeof promise.catch === 'function') {
                    promise.catch(function () {});
                }
            }

            if (overlay) {
                overlay.addEventListener('click', play);
            }
            video.addEventListener('click', function () {
                if (video.paused) {
                    play();
                }
            });
            video.addEventListener('play', function () {
                if (overlay) {
                    overlay.classList.add('is-hidden');
                }
            });
        });
    }

    ready(function () {
        initMenu();
        initHero();
        initFilters();
        initPlayers();
    });
}());
