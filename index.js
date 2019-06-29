const client = require('discord-rich-presence')('594174908263694403')
const { app, BrowserWindow, Tray, Menu } = require('electron')
// const expressApp = require('express')()
const iTunes = require('./iTunes')
// const http = require('http').createServer(expressApp)
// const io = require('socket.io').listen(http)
// const path = require('path')
// expressApp.get('/', function (req, res) {
//   res.sendFile(`${__dirname}/index.html`)
// })

// http.listen(3000, function () {
//   console.log('listening on *:3000')
// })

let mainWindow
let tray

const createWindow = () => {
  app.setName('Apple Music Presence')

  let width = 600 // 320
  let height = 280 // 500

  tray = new Tray('./images/am.png')
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Quit', type: 'normal', role: 'quit' }
  ])
  tray.setToolTip('Apple Music Presence')
  tray.setContextMenu(contextMenu)

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    resizable: true,
    show: false,
    titleBarStyle: 'hidden',
    title: 'Apple Music Presence',
    webPreferences: {
      nodeIntegration: true
    },
    icon: `${__dirname}/images/AppIcon.icns`
  })

  mainWindow.setTitle('Apple Music Presence')

  mainWindow.on('ready-to-show', () => {
    // mainWindow.show()
  })
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.on('did-finish-load', async () => {
    mainWindow.webContents.send('ready', 'Client is ready.')
  })
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) { createWindow() }
})

process.on('unhandledRejection', err => {
  console.error(err.stack)
})

const update = async () => {
  const { artist, title, position, duration, state } = await iTunes()

  const positionMs = position * 1000
  const durationMs = duration * 1000
  const startTimestamp = new Date(Date.now() - positionMs)
  const endTimestamp = new Date(Date.now() + (durationMs - positionMs))

  mainWindow.webContents.send('update', { artist, title, position, duration, state, startTimestamp, endTimestamp })
  // socket.emit('update', { artist, title, position, duration, state, startTimestamp, endTimestamp })

  const contextMenu = Menu.buildFromTemplate([
    { label: title, type: 'normal' },
    { type: 'separator' },
    { label: 'Quit', type: 'normal', role: 'quit' }
  ])
  tray.setContextMenu(contextMenu)

  if (state === 'paused') {
    client.updatePresence({
      state: artist,
      details: `Paused: ${title}`,
      //   startTimestamp: startTimestamp,
      //   endTimestamp: endTimestamp,
      largeImageKey: 'am',
      smallImageKey: 'pause'
    })
    return
  }

  client.updatePresence({
    state: artist,
    details: title,
    startTimestamp: startTimestamp,
    largeImageKey: 'am',
    largeImageText: 'Presence by _Adam_#2917'
  })
}

console.log('RPC ready. Updating now, and every 3 seconds.')
//   const refresh = () => update(socket)
setInterval(update, 3000)

// io.on('connection', async (socket) => {
//   console.log('RPC ready. Updating now, and every 3 seconds.')
//   const refresh = () => update(socket)
//   setInterval(refresh, 3000)
// })

const { systemPreferences } = require('electron')

systemPreferences.subscribeNotification(
  'AppleInterfaceThemeChangedNotification',
  function theThemeHasChanged () {
    // updateMyAppTheme(systemPreferences.isDarkMode())
  }
)
