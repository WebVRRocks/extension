const CSS = 'body { border: 20px solid red; }';
const TITLE_APPLY = 'Apply CSS';
const TITLE_REMOVE = 'Remove CSS';
const APPLICABLE_PROTOCOLS = ['http:', 'https:'];

let counter = 0;

chrome.webRequest.onBeforeSendHeaders.addListener(
    function(info) {
        var headers = info.requestHeaders;

        headers.push({
            name: "Awesome-Header",
            value: "awesome-header-data"
        });

        return {
            requestHeaders: headers
        };
    },
    // filters
    {
      urls: [
        "<all_urls>"
      ]
    },
    // extraInfoSpec
    [
      'requestHeaders',
      'blocking'
    ]
);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log(msg);
  if (!msg.action) {
    return;
  }
  switch (msg.action) {
    case 'hello world':
      chrome.browserAction()
      counter++; // increment the counter
      console.log(`new visit, total count : ${counter}`); // log the counter's value
      break;
    case 'reset_counter':
      counter = 0; // reset counter
      console.log('counter reset to zero'); // log it
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

var currentTab;

/**
 * Updates the browserAction icon to reflect whether the current page
 * is ready to record or stop recording.
 */
function updateIcon (icon) {
  chrome.browserAction.setIcon({
    path: icon,
    tabId: currentTab.id
  });
}

console.log('hello world');
updateBadge(counter);
