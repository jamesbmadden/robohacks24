const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  startConnect: () => ipcRenderer.send('start-connect'),
  disconnect: () => ipcRenderer.send('disconnect'),
  onConnected: (callback) => ipcRenderer.on('connected', _event => callback()),
  onFileContent: callback => ipcRenderer.on('file-content', (_event, data) => callback(data)),
  sendMsg: msg => ipcRenderer.send('send-msg', msg),
  readFile: fileName => ipcRenderer.send('read-file', fileName),
  saveToFile: (data, fileName) => ipcRenderer.send('save-path', data, fileName)
})