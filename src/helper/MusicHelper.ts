import { promisify } from 'util'
import applescript from 'applescript'

const exec = promisify(applescript.execString)

class MusicHelper {
  getTrackInfo () {
    return new Promise((resolve, reject) => {
     return exec(`
        set appName to "Music"
        if application appName is running then
          tell application "Music" to get { artist of current track, name of current track, player position, duration of current track, player state }
        end if
     `)
      .then((results: string|number[]) => {
        return resolve({
          artist: results ? results[0] : undefined,
          title: results ? results[1] : undefined,
          position: results ? results[2] : undefined,
          duration: results ? results[3] : undefined,
          state: results ? results[4] : undefined
        })
      })
      .catch((error: Error) => {
        reject(error)
      })
    })
  }
}
export default MusicHelper
