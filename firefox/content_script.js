/* global browser, chrome */
console.log('my awesome content_script');

// chrome.runtime.sendMessage(
//   {
//     action: 'hello world'
//   },
//   function (msg) {
//     console.log('message', msg);
//   }
// );

var ObjectEventTarget = function () {
  'use strict';

  var
    PREFIX = '@@',
    ObjectEventTarget = {},
    descriptor = {
      // in ES5 does not bother with enumeration
      configurable: true,
      value: null
    },
    defineProperty = Object.defineProperty ||
    function defineProperty(obj, prop, desc) {
      // in ES3 obj.hasOwnProperty() in for/in loops
      // is still mandatory since there's no way
      // to simulate non enumerable properties
      obj[prop] = desc.value;
    },
    indexOf = [].indexOf || function indexOf(value) {
      var i = this.length;
      while (i-- && this[i] !== value) {}
      return i;
    },
    has = ObjectEventTarget.hasOwnProperty;

  function configure(obj, prop, value) {
    descriptor.value = value;
    defineProperty(obj, prop, descriptor);
    descriptor.value = null;
  }

  function on(self, type, listener) {
    var array;
    if (has.call(self, type)) {
      array = self[type];
    } else {
      configure(self, type, array = []);
    }
    if (indexOf.call(array, listener) < 0) {
      array.push(listener);
    }
  }

  function dispatch(self, type, evt) {
    var array, current, i;
    if (has.call(self, type)) {
      evt.target = self;
      array = self[type].slice(0);
      for (i = 0; i < array.length; i++) {
        current = array[i];
        if (typeof current === 'function') {
          current.call(self, evt);
        } else if (typeof current.handleEvent === 'function') {
          current.handleEvent(evt);
        }
      }
    }
  }

  function off(self, type, listener) {
    var array, i;
    if (has.call(self, type)) {
      array = self[type];
      i = indexOf.call(array, listener);
      if (-1 < i) {
        array.splice(i, 1);
        if (!array.length) {
          delete self[type];
        }
      }
    }
  }

  configure(
    ObjectEventTarget,
    'addEventListener',
    function addEventListener(type, listener) {
      on(this, PREFIX + type, listener);
    }
  );

  configure(
    ObjectEventTarget,
    'dispatchEvent',
    function dispatchEvent(evt) {
      dispatch(this, PREFIX + evt.type, evt);
    }
  );

  configure(
    ObjectEventTarget,
    'removeEventListener',
    function removeEventListener(type, listener) {
      off(this, PREFIX + type, listener);
    }
  );

  return ObjectEventTarget;

}();

if (!('vr' in navigator)) {
  (function (navigator) {
    if (!('Promise' in window)) {
      throw new Error('"Promise" is not supported');
    }
    var ObjectEventTargetMixin = function () {};
    ObjectEventTargetMixin.prototype.addEventListener = ObjectEventTarget.addEventListener;
    ObjectEventTargetMixin.prototype.removeEventListener = ObjectEventTarget.removeEventListener;
    ObjectEventTargetMixin.prototype.dispatchEvent = ObjectEventTarget.dispatchEvent;
    var displaysBefore;
    var oldAvailability = 'vrEnabled' in navigator ? navigator.vrEnabled : false;
    var newAvailability;  // NOTE: We cannot observe `navigator.vrEnabled` unfortunately.
    var oldDisplays;
    var newDisplays;
    var oldDisplaysPresenting = {};
    var browserMsgListener = function (msg, sender, sendResponse) {
      if (msg.referringDisplay) {
        var referringDisplayStr = msg.refferingDisplay;
        var referringDisplayId = referringDisplayStr.split(':', 1)[0];
        var referringDisplayName = '';
        if (referringDisplayId) {
          var referringDisplayIdStr = referringDisplayId;
          referringDisplayId = parseInt(referringDisplayIdStr, 10);
          referringDisplayName = referringDisplayStr.substr(referringDisplayIdStr.length + 1);
        }
        // TODO: Check `referringDisplayId` and filter for the matching display.
        // Check if it's consistently unique in existing implementations.)
        var findReferringDisplay = function (displays) {
          for (var i = 0; i < displays.length; i++) {
            if (navigator.vr.referringDisplay) {
              return;
            }
            if (displays[i].displayName === referringDisplayName) {
              navigator.vr.referringDisplay = displays[i];
            }
          }
        };
        if (oldDisplays) {
          oldDisplays.forEach(findReferringDisplay);
        } else {
          navigator.getVRDisplays()
            .then(findReferringDisplay)
            .catch(console.warn.bind(console));
        }
      }
    };
    var transformDisplays = function (displays) {
      oldDisplays = displays;
      return oldDisplays.map(function (display) {
        oldDisplaysPresenting[display.displayId] = display.isPresenting;
        ['addEventListener', 'removeEventListener', 'dispatchEvent'].forEach(function (name) {
          display[name] = ObjectEventTargetMixin.prototype[name];
        });
        display.connected = null;
        display.presenting = null;
        display.mounted = null;
        return display;
      });
    };
    if ('getVRDisplays' in navigator) {
      navigator.getVRDisplays().then(transformDisplays).catch(console.warn.bind(console));
    }
    if (browser && 'onMessage' in browser.runtime) {
      browser.runtime.onMessage.addListener(browserMsgListener);
    }
    navigator.vr = new ObjectEventTargetMixin();
    console.log(navigator.vr);
    navigator.vr.getDisplays = 'getVRDisplays' in navigator ? function () {
      return navigator.getVRDisplays().then(transformDisplays);
    } : function () {
      throw new Error('"navigator.vr.getDisplays" is not supported');
    };
    navigator.vr.getAvailability = function () {
      return Promise.resolve('vrEnabled' in navigator ? navigator.vrEnabled : false);
    };
    var browser = 'browser' in window ? browser : chrome;
    var logEvent = function (eType) {
      return function (e) {
        if (!e.display && 'getVRDisplays' in navigator) {
          navigator.getVRDisplays.then(function (displays) {
            newDisplays = displays.map(function (display) {
              // newDisplaysPresenting[display.displayId] = display.isPresenting;
              Object.assign(display, new ObjectEventTargetMixin());
              display.connected = null;
              display.presenting = null;
              display.mounted = null;
              return display;
            });
            var i = 0;
            for (; i < oldDisplays.length; i++) {
              if ((e.type === 'vrdisplayconnected' || e.type === 'vrdisplayconnect') &&
                  newDisplays.indexOf(oldDisplays[i]) === -1) {  // TODO: Ensure this finds the correct display in Firefox.
                dispatchEvents('displaydisconnected', newDisplays[newDisplays.indexOf(oldDisplays[i])]);
                return;
              }
            }
            for (; i < newDisplays.length; i++) {
              if ((e.type === 'vrdisplaydisconnected' || e.type === 'vrdisplaydisconnect') &&
                  oldDisplays.indexOf(display) === -1) {  // TODO: Ensure this finds the correct display in Firefox.
                dispatchEvents('displayconnected', newDisplays[i]);
                return;
              }
            }
            dispatchEventsFromOldEvents(e);
            oldDisplays = transformDisplays(newDisplays);
          });
        }
        var dispatchEvents = function (name, display, value) {
          display = oldDisplays.filter(function (d) {
            return d.displayId === display.id;
          })[0] || transformDisplays([display])[0];
          if (!display) {
            console.warn('No old display found');
          }

          display.connected = display.isConnected;
          display.presenting = display.isPresenting;
          // delete display.isConnected;
          // delete display.isPresenting;
          var eventData = {
            target: display,
            display: display
          };
          if (typeof value !== 'undefined') {
            eventData.value = value;
          }
          navigator.vr.dispatchEvent(Object.assign(eventData, {type: name}));
          // TODO: Fix.
          // console.log('dispatching', name, Object.assign(eventData, {type: name.substr('display'.length)}));
          display.dispatchEvent(Object.assign(eventData, {type: name.substr('display'.length)}));
        };
        var dispatchEventsFromOldEvents = function (e) {
          if (e.type === 'vrdisplayconnected' || e.type === 'vrdisplayconnect') {
            dispatchEvents('displayconnected', e.display);
          }
          if (e.type === 'vrdisplaydisconnected' || e.type === 'vrdisplaydisconnect') {
            dispatchEvents('displaydisconnected', e.display);
          }
        };
        if (e.display) {
          if (e.type === 'vrdisplayactivate') {
            if (e.reason === 'mounted') {
              e.display.mounted = true;
            }
            dispatchEvents('displaymounted', e.display);
          } else if (e.type === 'vrdisplaydeactivate') {
            if (e.reason === 'unmounted') {
              e.display.mounted = false;
            }
            dispatchEvents('displayunmounted', e.display);
          } else if (e.type === 'vrdisplayconnect') {
            dispatchEvents('displayconnected', e.display);
          } else if (e.type === 'vrdisplaydisconnect') {
            dispatchEvents('displaydisconnected', e.display);
          } else if (e.type === 'vrdisplaypresentchange') {
            if ('getVRDisplays' in navigator) {
              navigator.getVRDisplays().then(function (displays) {
                var oldDisplayPresenting = oldDisplaysPresenting[e.display.displayId]
                console.log(oldDisplaysPresenting, e.display.isPresenting);
                if (oldDisplayPresenting !== e.display.isPresenting) {
                  dispatchEvents('displaypresentchange', e.display);
                  if (oldDisplayPresenting === false && e.display.isPresenting === true) {
                    dispatchEvents('displaypresentbegin', e.display);
                  } else if (oldDisplayPresenting === true && e.display.isPresenting === false) {
                    dispatchEvents('displaypresentend', e.display);
                  }
                }
                oldDisplays = transformDisplays(displays);
              });
            }
          }
        }
        console.log('[content_script] event fired:', eType || '', e.type, e);
      };
    };

    window.addEventListener('vrdisplayconnected', logEvent('vrdisplayconnected'));
    window.addEventListener('vrdisplayconnect', logEvent('vrdisplayconnect'));
    window.addEventListener('vrdisplaydisconnected', logEvent('vrdisplaydisconnected'));
    window.addEventListener('vrdisplaydisconnect', logEvent('vrdisplayconnect'));
    window.addEventListener('vrdisplayactivate', logEvent('vrdisplayactivate'));
    window.addEventListener('vrdisplaydeactivate', logEvent('vrdisplaydeactivate'));
    window.addEventListener('vrdisplayblur', logEvent('vrdisplayblur'));
    window.addEventListener('vrdisplayfocus', logEvent('vrdisplayfocus'));
    window.addEventListener('vrdisplaypresentchange', logEvent('vrdisplaypresentchange'));
    // window.addEventListener('appinstalled', logEvent('appinstalled'));
    // window.addEventListener('load', logEvent('load'));
  })(navigator);
  console.log('navigator.vr polyfilled:', navigator.vr);
} else {
  console.log('navigator.vr not polyfilled:', navigator.vr);
}

/*

navigator.vr.referringDisplay;
navigator.vr.addEventListener('availabilitychanged', function () {
});
navigator.vr.getAvailability().then(bool => {
});

// or `displayconnected`
navigator.vr.addEventListener('displayadded', function () {
});

navigator.vr.addEventListener('displaychanged', function () {
});

// or `displaydisconnected`
navigator.vr.addEventListener('displayremoved', function () {
});

// (future API possibly, especially if we end up using the Permissions API)
navigator.vr.requestPresent({displayName: 'HTC Vive', sources: [canvas]});

navigator.vr.getDisplays(displays => {
  if (!displays.length) {
    return;
  }
  var display = displays[0];

  // TODO: Figure out better way of presenting layers.
  display.requestPresent([{source: canvas}]).then(success => {
    console.log()
  }, error => {
    console.error('Could not present', error);
  });

  display.connected;  // previously `isConnected`: true, false
  // or display.connectionState
  display.presenting;  // previously `isPresenting`: true, false
  // or display.presentationState

  // choose one of these
  display.mounted;  // true, false
  display.state;  // previously `vrdisplayactivate`, `vrdisplaydeactivate`: 'mounted', 'unmounted', 'pending'

  display.visibility;  // 'visible', 'hidden', 'unloaded'
  display.visibilityState;  // 'visible', 'hidden', 'unloaded'

  // (may be unnecessary)
  display.isPrimary;   // true, false

  display.addEventListener('valuechanged', function (event) {
    let display = event.target;
    console.log(display, display.property, display.value);  // `property` could also be `name`
  });
});

*/

/*

<meta name="defaultLanguage" content="en-US">
<meta name="availableLanguages" content="en-US, fr">

<meta name="vrDefaultDisplay" content="HTC Vive">
<meta name="vrAvailableDisplays" content="HTC Vive, Oculus Rift, Gear VR, Google Daydream">

*/

var logEvent = function (eType) {
  return function (e) {
    console.log('[event]', eType || ''  , e.type, e);
  };
};

window.addEventListener('vrdisplayconnected', logEvent('vrdisplayconnected'));
window.addEventListener('vrdisplayconnect', logEvent('vrdisplayconnect'));
window.addEventListener('vrdisplaydisconnected', logEvent('vrdisplaydisconnected'));
window.addEventListener('vrdisplaydisconnect', logEvent('vrdisplayconnect'));
window.addEventListener('vrdisplayactivate', logEvent('vrdisplayactivate'));
window.addEventListener('vrdisplaydeactivate', logEvent('vrdisplaydeactivate'));
window.addEventListener('vrdisplayblur', logEvent('vrdisplayblur'));
window.addEventListener('vrdisplayfocus', logEvent('vrdisplayfocus'));
window.addEventListener('vrdisplaypresentchange', logEvent('vrdisplaypresentchange'));
window.addEventListener('appinstalled', logEvent('appinstalled'));
window.addEventListener('load', logEvent('load'));
