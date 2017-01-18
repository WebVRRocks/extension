/* jshint esversion: 6 */
/* eslint-env es6 */
const TITLE_ENTER_VR = chrome.i18n.getMessage('extensionPageActionEnterVRTitle');
const TITLE_EXIT_VR = chrome.i18n.getMessage('extensionPageActionExitVRTitle');
const ALLOWED_PROTOCOLS = ['file:', 'http:', 'https:'];

var SITES = {};
SITES['https://aframe.io/aframe/examples/showcase/spheres-and-fog/'] = {};

var RECIPES = {};
RECIPES['aframe.io'] = `
  var scene = document.querySelector('a-scene');
  var run = function () {
    return scene.enterVR();
  };
  if (scene.hasLoaded) {
    run();
  } else {
    scene.addEventListener('loaded', run);
  }
`;

const ON_BEFORE_SEND_HEADERS_LISTENER = details => {
  var headers = details.requestHeaders;

  var injectHeader = false;

  for (var header of headers) {
    if (header.name.toLowerCase() === 'accept-vr-display') {
      injectHeader = true;
      break;
    }
  }

  if (injectHeader) {
    headers.push({
      name: 'Accept-VR-Display',
      value: 'htc_vive'
    });
  }

  return {
    requestHeaders: headers
  };
};
const ON_BEFORE_SEND_HEADERS_FILTER = {
  urls: [
    '<all_urls>'
  ]
};
const ON_BEFORE_SEND_HEADERS_EXTRA_INFO_SPEC = [
  'requestHeaders',
  'blocking'
];

let counter = 0;

chrome.webRequest.onBeforeSendHeaders.addListener(
  ON_BEFORE_SEND_HEADERS_LISTENER,
  ON_BEFORE_SEND_HEADERS_FILTER,
  ON_BEFORE_SEND_HEADERS_EXTRA_INFO_SPEC);

// TODO: Ensure URL has protocol `http:`, `https:`, or `file:`.

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log('[background] msg', msg);
  if (!msg.action) {
    return;
  }
  switch (msg.action) {
    case 'hello world':
      counter++;  // Increment the counter.
      console.log(`new visit, total count : ${counter}`);  // Log the counter's value.
      break;
    case 'reset_counter':
      counter = 0;  // Reset the counter.
      console.log('counter reset to zero');  // Log it
      break;
    default:
      break;
  }
  updateBadge(counter);
  sendResponse({
    counter: counter
  });
});

/**
 * Update the browserAction's badge with the given text.
 *
 * @param {string} text - Text to set as the browserAction's badge.
 */
function updateBadge (text) {
  chrome.browserAction.setBadgeText({
    text: `${text}`
  });
}

function toggleVRMode (tab) {
  console.log('toggle vr mode', tab);
  if (navigator.rocksVr.isPresenting) {
    browser.pageAction.setIcon({tabId: tab.id, path: 'icons/vr-mode-orange.svg'});
    browser.pageAction.setTitle({tabId: tab.id, title: TITLE_EXIT_VR});
    // browser.tabs.insertCSS({code: CSS});
  } else {
    console.log('gray');
    if (navigator.rocksVr.connectedDisplays) {
      browser.pageAction.setIcon({tabId: tab.id, path: 'icons/vr-mode-blue.svg'});
    } else {
      browser.pageAction.setIcon({tabId: tab.id, path: 'icons/vr-mode-gray.svg'});
    }
    browser.pageAction.setTitle({tabId: tab.id, title: TITLE_ENTER_VR});
    // browser.tabs.removeCSS({code: CSS});
  }
}

/**
 * Returns true only if the URL's protocol is in `ALLOWED_PROTOCOLS`.
 */
var hasAllowedProtocol = (function () {
  var anchor = document.createElement('a');
  return (url) => {
    anchor.href = url;
    return ALLOWED_PROTOCOLS.includes(anchor.protocol);
  };
})();

function getOrigin (url) {
  return (url || '').replace(/^www\./, '');
}

/**
 * Initialize the page action: set icon and title, and then show.
 * Operates on tabs with tabs of valid protocols.
 */
function initPageAction (tab) {
  console.log('tab', tab.id);

  browser.pageAction.setIcon({tabId: tab.id, path: 'icons/vr-mode-gray.svg'});
  browser.pageAction.setTitle({tabId: tab.id, title: TITLE_ENTER_VR});

  // alert(1)
  // browser.pageAction.show(tab.id);

  var origin = getOrigin(tab.url);
  var recipe = RECIPES[origin];
  if (recipe) {
    console.log('injecting recipe for %s', origin);
    browser.tabs.executeScript(tab.id, recipe);
  }

  if (hasAllowedProtocol(tab.url)) {
    console.log('SHOW');
    browser.pageAction.show(tab.id);
  } else {
    console.log('HIDE');
    browser.pageAction.hide(tab.id);
  }
}

/**
 * When first loaded, initialize the page action for all tabs.
 */
console.log('hello');
browser.tabs.query({}).then((tabs) => {
  console.log('query');
  for (var tab of tabs) {
    initPageAction(tab);
  }
});

browser.browserAction.onClicked.addListener(() => {
console.log('0 tab');

browser.tabs.query({}).then((tabs) => {
  console.log('0 query');
  for (var tab of tabs) {
    initPageAction(tab);
  }
});

});

/**
 * Each time a tab is updated, reset the page action for that tab.
 */
browser.tabs.onUpdated.addListener((id, changeInfo, tab) => {
  initPageAction(tab);
});

/**
 * Toggle CSS when the page action is clicked.
 */
browser.pageAction.onClicked.addListener(toggleVRMode);


var ICON_DEFAULT = {
  32: 'icons/camcorder-32.png',
  64: 'icons/camcorder-64.png'
};
var ICON_BLUE = {
  32: 'icons/camcorder-blue-32.png',
  64: 'icons/camcorder-blue-64.png'
};
var ICON_GREEN = {
  32: 'icons/camcorder-green-32.png',
  64: 'icons/camcorder-green-64.png'
};
var ICON_RED = {
  32: 'icons/camcorder-red-32.png',
  64: 'icons/camcorder-red-64.png'
};

// var currentTab;

// /**
//  * Updates the browserAction icon to reflect whether the current page
//  * is ready to record or stop recording.
//  */
// function updateIcon (icon) {
//   chrome.browserAction.setIcon({
//     path: icon,
//     tabId: currentTab.id
//   });
// }

// console.log('hello world');

// // updateBadge(counter);

// function updateActiveTab (tabs) {
//   chrome.tabs.query({
//     active: true,
//     currentWindow: true
//   }).then(tabs => {
//     currentTab = tabs[0];
//     updateIcon();
//   });
// }

// // Listen to tab URL changes.
// chrome.tabs.onUpdated.addListener(updateActiveTab);

// // Listen to tab switching.
// chrome.tabs.onActivated.addListener(updateActiveTab);

// // Update when the extension loads initially.
// updateActiveTab();

// function onCreated () {
//   if (browser.runtime.lastError) {
//     console.log('[background] error creating item:', browser.runtime.lastError);
//   } else {
//     console.log('[background] item created successfully');
//   }
// }

// browser.contextMenus.create({
//   id: 'radio-green',
//   type: 'radio',
//   title: 'Make it green',
//   contexts: ['all'],
//   checked: false
// }, onCreated);

// browser.contextMenus.create({
//   id: 'radio-blue',
//   type: 'radio',
//   title: 'Make it blue',
//   contexts: ['all'],
//   checked: false
// }, onCreated);

// var makeItBlue = `document.body.style.border = '5px solid blue';`;
// var makeItGreen = `document.body.style.border = '5px solid green';`;

// browser.contextMenus.onClicked.addListener((info, tab) => {
//   if (info.menuItemId === 'radio-blue') {
//     browser.tabs.executeScript(tab.id, {
//       code: makeItBlue
//     });
//   } else if (info.menuItemId === 'radio-green') {
//     browser.tabs.executeScript(tab.id, {
//       code: makeItGreen
//     });
//   }
// });
