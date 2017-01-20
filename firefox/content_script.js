/* global chrome */
console.log('my awesome content_script');

alert(1);

// chrome.runtime.sendMessage(
//   {
//     action: 'hello world'
//   },
//   msg => {
//     console.log(msg);
//   }
// );



// class ObjectEventTarget {
//   constructor () {
//     if (this.initialized) {
//       return;
//     }
//     this.initialized = true;
//     const args = [];
//     for (let i = 1; i < arguments.length; ++i) {
//       args[i - 1] = arguments[i];
//     }
//   }

//   addEventListener (type, callback, options) {
//     if (!this.initialized || !(this instanceof ObjectEventTarget)) {
//       throw new TypeError('Illegal invocation');
//     }
//     if (arguments.length < 2) {
//       throw new TypeError(`Failed to execute 'addEventListener' on 'EventTarget': 2 argument required, but only ${arguments.length} present.`);
//     }
//     const args = [];
//     for (let i = 0; i < arguments.length && i < 3; ++i) {
//       args[i] = arguments[i];
//     }
//     args[0] = conversions.DOMString(args[0]);
//     return Impl.interface.prototype.addEventListener.apply(this, args);
//   }

//   removeEventListener (type, callback) {
//     if (!this.initialized || !(this instanceof ObjectEventTarget)) {
//       throw new TypeError('Illegal invocation');
//     }
//     if (arguments.length < 2) {
//       throw new TypeError(`Failed to execute 'removeEventListener' on 'EventTarget': 2 argument required, but only ${arguments.length} present.`);
//     }
//     const args = [];
//     for (let i = 0; i < arguments.length && i < 3; ++i) {
//       args[i] = arguments[i];
//     }
//     args[0] = conversions.DOMString(args[0]);
//     return Impl.interface.prototype.removeEventListener.apply(this, args);
//   }

//   dispatchEvent (event) {
//     if (!this.initialized || !(this instanceof ObjectEventTarget)) {
//       throw new TypeError('Illegal invocation');
//     }
//     if (arguments.length < 1) {
//       throw new TypeError(`Failed to execute 'dispatchEvent' on 'EventTarget': 1 argument required, but only ${arguments.length} present.`);
//     }
//     const args = [];
//     for (let i = 0; i < arguments.length && i < 1; ++i) {
//       args[i] = arguments[i];
//     }
//     return Impl.interface.prototype.dispatchEvent.apply(this, args);
//   }
// }

// navigator.rocksVr = new ObjectEventTarget();

// navigator.getVRDisplays().then(displays => {
//   console.log('displays', displays);
// });

var logEvent = e => {
  console.log('[event]', e.type, e);
};

window.addEventListener('vrdisplayconnected', logEvent);
window.addEventListener('vrdisplayconnect', logEvent);
window.addEventListener('vrdisplaydisconnected', logEvent);
window.addEventListener('vrdisplaydisconnect', logEvent);
window.addEventListener('vrdisplayactivate', logEvent);
window.addEventListener('vrdisplaydeactivate', logEvent);
window.addEventListener('vrdisplayblur', logEvent);
window.addEventListener('vrdisplayfocus', logEvent);
window.addEventListener('vrdisplaypresentchange', logEvent);
window.addEventListener('appinstalled', logEvent);
window.addEventListener('load', logEvent);

console.log('loaded');
