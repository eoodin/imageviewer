// Modules to control application life and create native browser window

const { app, BrowserWindow, Menu, dialog } = require('electron')
const fs = require('fs');
const request = require('request');
const crypto = require('crypto');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 1200, height: 900 })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  
  //mainWindow.webContents.session.setProxy({proxyRules:"socks5://localhost:1086"}, function () {});
  
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Menu',
      submenu: [
        {
          label: 'Open URL File...',
          accelerator: 'CmdOrCtrl+O',
          click() {
            dialog.showOpenDialog({ properties: ['openFile'] }, files => {
              if (files && files.length) {
                app.emit('open-url-file', files[0]);
              }
            })
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          click() {
            app.quit();
          }
        }]
    }
  ]));

  // Open the DevTools.
  mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

function* lineReader(filename) {
  let fileSize = fs.statSync(filename).size;
  let fd = fs.openSync(filename, 'r')
  let bufferSize = 64 * 1024;
  let readChunk = Buffer.alloc(bufferSize);
  let position = 0;
  let left = 0;
  try {
    while (position < fileSize) {
      position += fs.readSync(fd, readChunk, left, bufferSize, position);
      lines = readChunk.toString().split('\n');
      for (let i = 0; i < lines.length - 1; ++i) {
        yield lines[i];
      }
      left = lines[lines.length - 1].length;
      readChunk.write(lines[lines.length - 1]);
    }

    if (left > 0) {
      yield readChunk.slice(0, left).toString()
    }
  } catch (e) {
    console.log('exception caught')
    fs.closeSync(fd);
    return;
  }

  fs.close(fd)
}

var urlFile;

app.on('open-url-file', f => {
  if (urlFile) {
    urlFile.throw('close');
  }

  urlFile = lineReader(f);
  app.emit('url-file-opened', f);
});

app.on('load-urls', arg => {
  let {size = 10} = arg;

  if (urlFile) {
    for (let i = 0; i < size; ++i) {
      app.emit('url-added', urlFile.next().value);
    }
  }
})

let md5digester = crypto.createHash('md5');
let downloadFolder = '';

function save(url) {
  console.log('saving url', url);
  let ext = url.split('.').pop()
  let name = md5digester.update(url).digest('hex');
  let filename = downloadFolder + '/' + name + '.' + ext;
  request(url).pipe(fs.createWriteStream(filename));
  console.log('saving started.');
}

app.on('save-url', args => {
  let {url} = args;
  if (!downloadFolder) {
    dialog.showOpenDialog({ properties: ['openDirectory'] }, folders => {
      downloadFolder = folders[0];
      save(url);
    });
    return;
  }
  save(url);
})
