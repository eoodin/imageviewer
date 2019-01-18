// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const{ remote } = require('electron')

remote.app.on('url-file-opened', f => {
    remote.app.emit('load-urls', {size: 15})
})

remote.app.on('url-added', url => {
    let c = document.createElement('div');
    c.innerHTML = "<img src=\"" + url + "\" ></img>";
    document.querySelector('.gallery').appendChild(c);
})