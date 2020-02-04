// Imports
import { app, BrowserWindow, Tray, Menu, systemPreferences, dialog, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'

import * as Sentry from '@sentry/electron'
import path from 'path'
import iTunesHelper from '../helper/iTunesHelper'
import MusicHelper from '../helper/MusicHelper'
import url from 'url'
import os from 'os'
import isOnline from 'is-online'
import RPC from 'discord-rpc'

RPC.register('594174908263694403')
const rpc = new RPC.Client({ transport: 'ipc' })

const Music = new MusicHelper()
const iTunes = new iTunesHelper()

require('dotenv').config()

// Setup sentry for that sweet sweet error handlng
Sentry.init({ dsn: process.env.SENTRY_DSN })

const srcDir = path.resolve(`${process.cwd()}${path.sep}src`)

// lets
// let client: any
let mainWindow: BrowserWindow
let tray: Tray
let quit: boolean = false

// Functions
const ready = async (): Promise<void> => {
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
  if (await isOnline()) {
    autoUpdater.fullChangelog = true
    autoUpdater.allowPrerelease = true
    autoUpdater.checkForUpdatesAndNotify()
    rpc.login({ clientId: '594174908263694403' }).catch(console.error)
    createWindow()
    createTray()
    setInterval(update, 3000)
  } else {
    if (systemPreferences.isDarkMode() === true) systemPreferences.setAppLevelAppearance('dark')
    const icon: any = url.format({
      pathname: path.join(srcDir, 'images', 'AMP.png'),
      slashes: true
    })
    dialog.showMessageBox({
      title: 'Connection',
      message: 'No interent connection found...',
      type: 'error',
      icon: icon
    })
  }
}

const createTray = (): void => {
  const image = url.format({
    pathname: path.join(srcDir, 'images', 'Tray.png'),
    slashes: true
  })
  tray = new Tray(image)
  return configTray(tray)
}

const configTray = (tray: any): void => {
  const contextMenu = Menu.buildFromTemplate([
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
      pathname: path.join(srcDir, 'images', 'icon.icns'),
      slashes: true
    }),
    darkTheme: true
  })

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
    if (!result) {
      rpc.clearActivity()
    }
    const { artist, title, position, duration, state }: any = result
    const startTimestamp = position ? new Date(Date.now() - position * 1000) : undefined
    console.log(result)
    if (state === 'paused' || !startTimestamp) {
      rpc.setActivity({
        state: artist,
        details: `Paused: ${title}`,
        largeImageKey: 'am',
        smallImageKey: 'pause'
      })
      return
    } else if (startTimestamp) {
      rpc.setActivity({
        state: artist,
        details: title,
        startTimestamp: startTimestamp,
        largeImageKey: 'am',
        largeImageText: 'Presence by _Adam_#2917'
      })
    }
  } catch (e) {
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
