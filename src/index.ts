// Imports
import fixPath from 'fix-path'
fixPath()
import { app, BrowserWindow, Tray, Menu, systemPreferences, dialog, remote } from 'electron'

import * as Sentry from '@sentry/electron'
import path from 'path'
import iTunesHelper from './helper/iTunesHelper'
import MusicHelper from './helper/MusicHelper'
import url from 'url'
import os from 'os'
import isOnline from 'is-online'
// @ts-ignore
import RPC from 'discord-rpc'

RPC.register('594174908263694403')
const rpc = new RPC.Client({ transport: 'ipc' })

const Music = new MusicHelper()
const iTunes = new iTunesHelper()

// Setup sentry for that sweet sweet error handlng
Sentry.init({ dsn: 'https://b253804ef8344b1abf767b7702f13da2@sentry.io/1499784' })

// lets
// let client: any
let mainWindow: BrowserWindow
let tray: Tray
let quit: boolean = false

// Functions
const ready = async (): Promise<void> => {
  try {
    if (process.platform === 'darwin') {
      if (!app.isInApplicationsFolder) {
        dialog.showMessageBox({
          title: 'App must be in applications folder',
          buttons: ['Ok'],
          message: 'Move the application to the applications folder to run the app.'
        })
      }
    }
    app.dock.hide()
    app.setName('Apple Music Presence')
    app.setAboutPanelOptions({
      applicationName: 'Apple Music Presence',
      applicationVersion: app.getVersion()
    })
    const icon: any = url.format({
      pathname: path.join(__dirname, '..', 'images', 'AMP.png'),
      slashes: true
    })
    if (await isOnline()) {
      await rpc.login({ clientId: '594174908263694403' })
        .catch((error: Error) => console.error(error))
      createWindow()
      createTray()
      setInterval(update, 3000)
    } else {
      if (systemPreferences.isDarkMode() === true) systemPreferences.setAppLevelAppearance('dark')
      dialog.showMessageBox({
        title: 'Connection',
        message: 'No interent connection found...',
        type: 'error',
        icon: icon
      })
    }
  } catch (error) {
    dialog.showMessageBox({
      title: 'Error',
      message: error.message,
      type: 'error'
    })
  }
}

const createTray = (): void => {
  const image = url.format({
    pathname: path.join(__dirname, '..', 'images', 'Tray.png'),
    slashes: true
  })
  tray = new Tray(image)
  return configTray(tray)
}

const configTray = (tray: any): void => {
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Reconnect to Discord', accelerator: 'Command+R', click: async () => {
      rpc.destroy()
      await rpc.login({ clientId: '594174908263694403' }).catch(console.error)
      update()
    } },
    {
      label: 'Developer Tools', accelerator: 'Command+D', click: () => {
        mainWindow.show()
        mainWindow.webContents.openDevTools()
        mainWindow.reload()
      },
    },
    {
      label: 'Reload', click: () => {
        mainWindow.reload()
      },
    },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
  ])
  tray.setToolTip('Apple Music Presence')
  tray.setContextMenu(contextMenu)
  return
}

const createWindow = (): BrowserWindow => {
  mainWindow = new BrowserWindow({
    width: 600,
    height: 280,
    resizable: true,
    show: false,
    titleBarStyle: 'hiddenInset',
    title: 'Apple Music Presence',
    webPreferences: {
      plugins: true,
      nodeIntegration: true,
      contextIsolation: false,
      experimentalFeatures: true,
      enableBlinkFeatures: 'OverlayScrollbars',
      webviewTag: true
    },
    icon: url.format({
      pathname: path.join(__dirname, '..', 'images', 'icon.icns'),
      slashes: true
    }),
    darkTheme: true
  })

  mainWindow.loadURL('https://atiktech/amp')
  app.commandLine.appendSwitch('enable-features', 'OverlayScrollbar')
  app.commandLine.appendSwitch('--enable-transparent-visuals')
  app.commandLine.appendSwitch('auto-detect', 'false')
  app.commandLine.appendSwitch('--enable-transparent-visuals')

  mainWindow.setTitle('Apple Music Presence')

  mainWindow.on('closed', (event: Electron.Event) => {
    if (!quit) {
      event.preventDefault()
      configTray(tray)
      mainWindow.hide()
    }
  })

  mainWindow.webContents.on('did-finish-load', async () => {
    setTheme()
  })

  return mainWindow
}

const update = async (): Promise<void> => {
  try {
    let result = null
    if (+os.release().split('.')[0] >= 19) result = await Music.getTrackInfo()
    else result = await iTunes.getTrackInfo()
    if (!result) return rpc.clearActivity()
    const { artist, title, position, state }: any = result
    if (!artist || !title || !state || !position) return rpc.clearActivity()
    const startTimestamp = position ? new Date(Date.now() - position * 1000) : undefined
    if (state === 'paused' || !startTimestamp) {
      return rpc.setActivity({
        state: artist,
        details: `Paused: ${title}`,
        largeImageKey: 'am',
        smallImageKey: 'pause'
      })
    } else if (startTimestamp) {
      return rpc.setActivity({
        state: artist,
        details: title,
        startTimestamp: startTimestamp,
        largeImageKey: 'am',
        largeImageText: 'Presence by _Adam_#2917'
      })
    }
  } catch (e) {
    dialog.showMessageBox({
      title: 'Error',
      message: e.message,
      type: 'error'
    })
  }
}
// DARK MODE ALL THE THINGS
const setTheme = (): void => {
  const theme = systemPreferences.isDarkMode()
  if (theme) systemPreferences.setAppLevelAppearance('dark')
  if (mainWindow) mainWindow.webContents.send('dark', theme)
  return
}

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setTheme
  )
}

// Electron app events
app.on('ready', ready)
app.on('quit', (event: Electron.Event) => {
  quit = true
  event.preventDefault()
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
