const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./database')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(__dirname, '../logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'default',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'))
  }
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ---- IPC handlers ----
function register(entity, handlers) {
  for (const [name, fn] of Object.entries(handlers)) {
    ipcMain.handle(`${entity}:${name}`, (_e, ...args) => fn(...args))
  }
}

register('filaments',   db.filaments)
register('imprimantes', db.imprimantes)
register('plateaux',    db.plateaux)
register('profils',     db.profils)
register('bobines',     db.bobines)
ipcMain.handle('stats:get', () => db.stats.get())

ipcMain.handle('dialog:openFile', (event, opts) =>
  dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), opts))
ipcMain.handle('dialog:saveFile', (event, opts) =>
  dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), opts))
ipcMain.handle('fs:readFile', (_, p) => fs.readFileSync(p, 'utf8'))
ipcMain.handle('fs:writeFile', (_, p, c) => { fs.writeFileSync(p, c, 'utf8'); return true })
