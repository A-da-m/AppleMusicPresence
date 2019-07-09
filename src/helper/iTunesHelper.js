const { promisify } = require('util')
const applescript = require('applescript')

class iTunesHelper {
  constructor () {
    this.run = promisify(applescript.execString)
  }
  async getTrackInfo () {
    try {
      let err = false
      const result = await this.run(`tell application "iTunes" to get { artist of current track, name of current track, player position, duration of current track, player state }`).catch(err => { err = true })
      if (err) return undefined
      if (!result) return undefined
      return {
        artist: result[0],
        title: result[1],
        position: result[2],
        duration: result[3],
        state: result[4]
      }
    } catch (err) {
      console.log(err)
      return undefined
    }
  }
}
module.exports = iTunesHelper
