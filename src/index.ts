import { app, Tray, Menu, systemPreferences, dialog } from 'electron'
import log from 'electron-log'
import * as Sentry from '@sentry/electron'
import iTunesHelper from './helper/iTunesHelper'
import MusicHelper from './helper/MusicHelper'
import isOnline from 'is-online'
import RPC from 'discord-rpc'
import path from 'path'
import url from 'url'
import os from 'os'

process.argv.includes('-d')
  ? process.env.NODE_ENV = 'development'
  : process.env.NODE_ENV = 'production'

RPC.register('594174908263694403')
const rpc = new RPC.Client({ transport: 'ipc' })

const Music = new MusicHelper()
const iTunes = new iTunesHelper()

Sentry.init({ dsn: 'https://b253804ef8344b1abf767b7702f13da2@sentry.io/1499784' })

const ready = async (): Promise<void> => {
  try {
    const icon: any = url.format({
      pathname: path.join(__dirname, '..', 'images', 'AMP.png'),
      slashes: true
    })
    if (process.platform === 'darwin' && process.env.NODE_ENV !== 'development') {
      if (!app.isInApplicationsFolder()) {
        dialog.showMessageBox({
          title: 'App must be in applications folder',
          buttons: ['Ok'],
          message: 'Move the application to the applications folder to run the app.',
          icon: icon
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
      await rpc.login({ clientId: '594174908263694403' })
      tray()
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
    Sentry.captureException(error)
    log.error(error)
  }
}

const tray = (): void => {
  const image = url.format({
    pathname: path.join(__dirname, '..', 'images', 'Tray.png'),
    slashes: true
  })
  const tray = new Tray(image)
  tray.setToolTip('Apple Music Presence')
  tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'Reconnect to Discord',
      accelerator: 'Command+R',
      click: async () => {
        rpc.destroy()
        await rpc.login({ clientId: '594174908263694403' }).catch(console.error)
        update()
      }
    },
    { type: 'separator' },
    { label: 'Quit', accelerator: 'Command+Q', role: 'quit' }
  ]))
  return
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
        largeImageText: 'Presence by Adаm#2917',
        smallImageKey: 'pause'
      })
    } else if (startTimestamp) {
      return rpc.setActivity({
        state: artist,
        details: title,
        startTimestamp: startTimestamp,
        largeImageKey: 'am',
        largeImageText: 'Presence by Adаm#2917'
      })
    }
  } catch (error) {
    Sentry.captureException(error)
    log.error(error)
  }
}

const setTheme = (): void => {
  const theme = systemPreferences.isDarkMode()
  if (theme) systemPreferences.setAppLevelAppearance('dark')
  return
}

if (process.platform === 'darwin') {
  systemPreferences.subscribeNotification(
    'AppleInterfaceThemeChangedNotification',
    setTheme
  )
}

app.on('ready', ready)
app.on('quit', (event: Electron.Event) => {
  event.preventDefault()
  app.quit()
})
