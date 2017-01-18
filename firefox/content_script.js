/* global chrome */
console.log('my awesome content_script');

chrome.runtime.sendMessage(
  {
    action: 'hello world'
  },
  msg => {
    console.log(msg);
  }
);
