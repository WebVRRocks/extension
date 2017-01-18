/* global chrome */
var app = {};
app.config = function (ctrl) {
  return function (element, isInitialized) {
    if (isInitialized) {
      return;
    }

    function forward (event) {
      play();
      event.preventDefault();
    }
    function backward (event) {
      play(true);
      event.preventDefault();
    }
    function showPointer () {
      element.style.cursor = 'default';
    }
    function hidePointer () {
      element.style.cursor = 'none';
    }
    function isPointerVisible () {
      return element.style.cursor !== 'none';
    }
    function requestFullscreen () {
      if (element.webkitRequestFullScreen) {
        element.webkitRequestFullScreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
      hidePointer();
    }
    function exitFullscreen () {
      if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      showPointer();
    }
    function hasFullScreenElement () {
      return !(!document.webkitFullscreenElement &&
               !document.mozFullScreenElement &&
               !document.msFullscreenElement);
    }
    function navigate (event) {
      switch (event.keyCode) {
        case 13:   // Enter
        case 32:   // Space
        case 39:   // ArrowRight
        case 40:   // ArrowDown
          play();
          break;
        case 8:    // Backspace
        case 37:   // ArrowLeft
        case 38:   // ArrowUp
          play(true);
          break;
        case 67:   // KeyC
          if (isPointerVisible()) {
            hidePointer();
          } else {
            showPointer();
          }
          break;
        case 190:  // Period
          exitFullscreen();
          break;
        default:
          return;
      }
      event.preventDefault();
    }

    function play (reverse) {
      if (!hasFullScreenElement()) {
        requestFullscreen();
        return;
      }

      m.startComputation();
      ctrl.rotateSlide(reverse);
      m.endComputation();
    }

    window.addEventListener('click', forward);
    window.addEventListener('touchend', forward);
    window.addEventListener('contextmenu', backward);
    window.addEventListener('keydown', navigate);
  };
};

app.SiteList = function () {
  return m.request({
    method: 'GET',
    url: 'sites.json'
  });
};

app.controller = function () {
  var sites = app.SiteList();
  sites.then(function(sites) {
    sites.forEach(function(slide) {
      if (slide.image) {
        var image = new Image();
        image.src = slide.image.src;
      }
    });
  });
  return {
    currentSlide: function () {
      return sites()[0];
    },
    rotateSlide: function (reverse) {
      if (reverse) {
        sites().unshift(sites().pop());
      } else {
        sites().push(sites().shift());
      }
    }
  };
};

app.view = function (ctrl) {
  var slide = ctrl.currentSlide();
  return [
    m('div#slide', {
      config: app.config(ctrl)
    }, [
      m('div#objects', [
        !slide.image    ? '' : m('img', slide.image),
        !slide.title    ? '' : m('h1', m.trust(slide.title)),
        !slide.subtitle ? '' : m('h3', m.trust(slide.subtitle)),
        !slide.codes    ? '' : m('pre', slide.codes.join('\n')),
        !slide.embed    ? '' : m('iframe', slide.embed),
        !slide.bullets  ? '' : m('ul',
          slide.bullets.map(function (bullet) {
            return m('li', bullet);
          })
        )
      ])
    ]),
  ];
};

document.body = document.createElement('body');

m.module(document.body, app);
