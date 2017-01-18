function saveOptions (e) {
  browser.storage.local.set({
    colour: document.querySelector('#headset').value
  });
  e.preventDefault();
}

function loadOptions () {
  var gettingItem = browser.storage.local.get('webvr:headset');
  gettingItem.then(res => {
    document.querySelector('#headset').value = res.colour || 'HTC Vive';
  });
}
