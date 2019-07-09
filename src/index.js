require('dotenv').config()

// Imports
const { app, BrowserWindow, Tray, Menu, systemPreferences, dialog } = require('electron')
const { autoUpdater } = require('electron-updater')
const connectivity = require('connectivity')
const Sentry = require('@sentry/electron')
const path = require('path')
const iTunesHelper = require('./helper/iTunesHelper')
const iTunes = new iTunesHelper() // eslint-disable-line

// Setup sentry for that sweet sweet error handlng
Sentry.init({ dsn: process.env.SENTRY_DSN })

// lets
let client
let mainWindow
let tray
let shown = false
let quit = false

// Functions
const ready = () => {
  if (process.platform === 'darwin') {
    if (!app.isInApplicationsFolder) {
      dialog.showMessageBox(null, {
        title: 'App must be in applications folder',
        buttons: ['Ok']
      })
    }
  }
  app.dock.hide()
  app.setName('Apple Music Presence')
  app.setAboutPanelOptions({
    applicationName: 'Apple Music Presence',
    applicationVersion: app.getVersion()
  })
  connectivity(online => {
    if (online) {
      autoUpdater.fullChangelog = true
      autoUpdater.allowPrerelease = true
      autoUpdater.checkForUpdatesAndNotify()

      client = require('discord-rich-presence')('594174908263694403')
      createWindow()
      createTray()

      console.log('RPC ready. Updating now, and every 3 seconds.')
      setInterval(update, 3000)
    } else {
      let theme = systemPreferences.isDarkMode()
      if (theme === true) systemPreferences.setAppLevelAppearance('dark')
      dialog.showMessageBox(null, {
        title: 'Connection',
        message: 'No interent connection found...',
        type: 'error',
        icon: `${__dirname}/images/AMP.png`
      })
    }
  })
}
const createTray = () => {
  const image = path.join(__dirname, './images/Tray.png')
  tray = new Tray(image)
  configTray(tray)
}
const configTray = (tray) => {
  let contextMenu
  if (!shown) {
    contextMenu = Menu.buildFromTemplate([
      { label: 'Show Player',
        accelerator: 'Command+P',
        click: () => {
          shown = true
          configTray(tray)
          mainWindow.show()
        }
      },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
    ])
  } else {
    contextMenu = Menu.buildFromTemplate([
      { label: 'Hide Player',
        accelerator: 'Command+P',
        click: () => {
          shown = false
          configTray(tray)
          mainWindow.hide()
        }
      },
      { type: 'separator' },
      { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
    ])
  }
  tray.setToolTip('Apple Music Presence')
  tray.setContextMenu(contextMenu)
}
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 280,
    resizable: true,
    show: false,
    titleBarStyle: 'hidden',
    title: 'Apple Music Presence',
    webPreferences: {
      nodeIntegration: true
    },
    icon: `${__dirname}/images/icon.icns`,
    darkTheme: true
  })

  mainWindow.setTitle('Apple Music Presence')

  mainWindow.loadURL(`file://${__dirname}/views/index.html`)

  mainWindow.on('closed', (e) => {
    if (!quit) {
      e.preventDefault()
      shown = false
      configTray(tray)
      mainWindow.hide()
    }
  })

  mainWindow.webContents.on('did-finish-load', async () => {
    mainWindow.webContents.send('ready', 'Client is ready.')
    setTheme()
  })
}
const update = async () => {
  let result = await iTunes.getTrackInfo()
  if (!result) result = { artist: 'Browsing...', title: 'Browsing...', position: null, duration: null, state: null }
  const { artist, title, position, duration, state } = result
  const startTimestamp = () => {
    if (!position) return undefined
    return new Date(Date.now() - position * 1000)
  }
  const endTimestamp = () => {
    if (!duration || !position) return undefined
    return new Date(Date.now() + (duration * 1000 - position * 1000))
  }
  try {
    if (mainWindow) mainWindow.webContents.send('update', { artist, title, position, duration, state, startTimestamp, endTimestamp })
  } catch (e) {

  }

  if (state === 'paused') {
    client.updatePresence({
      state: artist,
      details: `Paused: ${title}`,
      largeImageKey: 'am',
      smallImageKey: 'pause'
    })
    return
  }

  if (startTimestamp()) {
    client.updatePresence({
      state: artist,
      details: title,
      startTimestamp: startTimestamp(),
      largeImageKey: 'am',
      largeImageText: 'Presence by _Adam_#2917'
    })
  } else if (!startTimestamp()) {
    client.updatePresence({
      details: title,
      largeImageKey: 'am',
      largeImageText: 'Presence by _Adam_#2917'
    })
  }
}
// DARK MODE ALL THE THINGS
const setTheme = () => {
  let theme = systemPreferences.isDarkMode()
  if (theme === true) systemPreferences.setAppLevelAppearance('dark')
  if (mainWindow) mainWindow.webContents.send('dark', theme)
}

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setTheme
  )
}

// Electron app events
app.on('ready', ready)
app.on('quit', (e) => {
  quit = true
  e.preventDefault()
  mainWindow.hide()
  app.quit()
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
  else createWindow()
})
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})

// Rejection handling
// TODO: Should probably handle this in a better way then just console.log.
process.on('unhandledRejection', err => {
  console.error(err.stack)
})
