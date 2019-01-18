// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
const{ remote } = require('electron')

const urlCount = 16
const thumbnailCount = urlCount / 2;
let file = '';
let pos = 0;
remote.app.on('url-file-opened', f => {
    file = f;
    pos = 0;
    remote.app.emit('load-urls', {size: urlCount})
})

let detailImg = document.getElementById('detail');
function thumbnailClicked(e) {
    detailImg.src = e.target.src;
}

let picDivs = []
let thumbDiv = document.querySelector('.thumbnails');
let fileInfo = document.getElementById('fileinfo');
let downBtn = document.querySelector('.download-btn');

remote.app.on('url-added', url => {
    pos++;
    if(picDivs.length >= urlCount) {
        let s = picDivs.shift();
        s.remove()
    }
    
    let c = document.createElement('div');
    c.addEventListener('click', thumbnailClicked)
    c.innerHTML = "<div><img src=\"" + url + "\" /></div>";
    if (picDivs.length >= thumbnailCount) {
        picDivs[thumbnailCount - 1].style.display = "";
        c.style = "display: none;"
    }
    thumbDiv.appendChild(c);
    picDivs.push(c);

    fileInfo.innerHTML = file + ' (' + pos + ')';
})

document.querySelector('.next-btn').addEventListener('click', e => {
    remote.app.emit('load-urls', {size: thumbnailCount})
})

downBtn.addEventListener('click', e => {
    console.log('clicked download');
    if (detailImg.src && detailImg.src.length) {
        remote.app.emit('save-url', {url: detailImg.src});
    }
});