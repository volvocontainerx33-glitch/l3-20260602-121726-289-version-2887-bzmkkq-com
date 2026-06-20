(function () {
  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
    } else {
      callback();
    }
  }

  window.startCinemaPlayer = function (streamUrl) {
    onReady(function () {
      var video = document.querySelector("[data-player-video]");
      var cover = document.querySelector("[data-player-cover]");
      var button = document.querySelector("[data-player-button]");
      if (!video || !streamUrl) {
        return;
      }

      var hlsInstance = null;
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(video);
      } else {
        video.src = streamUrl;
      }

      var begin = function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
        var promise = video.play();
        if (promise && typeof promise.catch === "function") {
          promise.catch(function () {});
        }
      };

      if (button) {
        button.addEventListener("click", begin);
      }
      if (cover) {
        cover.addEventListener("click", begin);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          begin();
        }
      });
      video.addEventListener("play", function () {
        if (cover) {
          cover.classList.add("is-hidden");
        }
      });
      window.addEventListener("pagehide", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  };
})();
