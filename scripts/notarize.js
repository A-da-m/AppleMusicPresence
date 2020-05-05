require('dotenv').config()

const { notarize } = require('electron-notarize')
const fs = require('fs')
const elapsed = (start) => {
  const now = new Date()
  const ms = Math.abs(now.getTime() - start.getTime())
  const diff = new Date(ms)
  return `${diff.getMinutes()} minutes, ${diff.getSeconds()} seconds`
}

exports.default = async function notarizing (context) {
  const { electronPlatformName } = context
  if (electronPlatformName !== 'darwin') return
  const appName = context.packager.appInfo.productFilename
  const appPath = `${context.appOutDir}/${appName}.app`
  if (!fs.existsSync(appPath)) throw new Error(`Cannot find application for notarization at: ${appPath}`)
  const start = new Date()
  console.log(`  • app found at: ${appPath}`)
  console.log(`  • notarizing ${appName}...`)
  await notarize({
    appBundleId: 'co.atiktech.AMP',
    appPath: appPath,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEID_PASSWORD,
    ascProvider: process.env.APPLEID_SN
  })
  return console.log(`  • done notarizing ${appName}, took ${elapsed(start)}`)
}
