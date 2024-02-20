const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const net = require('net');
// port stuff
const IP = "192.168.1.100";
const PORT = 80;

let win;
let client;

// initialize connection with the board
const connectToBoard = () => {

  console.log('starting connection');

  client = new net.Socket();
  client.connect(PORT, IP, () => {
    console.log('connected');
    sendMsg('connection init');
    win.webContents.send('connected');
  });

  client.on('data', data => {
    console.log('recieved ' + data);
  });

  client.on('error', err => {
    console.error(err);
  });

}

const disconnectFromBoard = () => {
  client.destroy();
}

// send a message to the board
const sendMsg = msg => {
  console.log('sending msg ' + msg);
  client.write(msg);
}

const saveToFile = (content, fileName) => {

  fs.writeFile(path.join(__dirname, fileName), content, err => {

  });

}

const readFile = fileName => {

  fs.readFile(path.join(__dirname, fileName), (err, data) => {
    win.webContents.send('file-content', data.toString());
  });

}

// electron boilerplate
const createWindow = () => {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
  ipcMain.on('start-connect', connectToBoard);
  ipcMain.on('disconnect', disconnectFromBoard);
  ipcMain.on('send-msg', (event, msg) => {sendMsg(msg)});
  ipcMain.on('save-path', (event, content, fileName) => {saveToFile(content, fileName)});
  ipcMain.on('read-file', (event, filePath) => {readFile(filePath)});

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});